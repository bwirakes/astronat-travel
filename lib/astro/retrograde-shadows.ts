/**
 * Retrograde shadow-period detection backed by Swiss Ephemeris.
 *
 * For each retrograde cycle we expose four boundary moments:
 *   preShadowStart  — body moving direct first reaches the direct-station longitude
 *   retrogradeStation — body's longitude speed crosses zero (direct → retrograde)
 *   directStation    — body's longitude speed crosses zero (retrograde → direct)
 *   postShadowEnd    — body moving direct returns to the retrograde-station longitude
 *
 * The four-date envelope is the period during which the body is traversing the
 * "shadow" degrees triggered by the retrograde, i.e. the Rx degree range is hit
 * three times: direct (pre-shadow), retrograde, direct again (post-shadow).
 *
 * Runs server-side only — imports swisseph-wasm.
 */

import { BODIES, STATIONING_BODIES, getSign } from "@/lib/astro/geodetic-patterns";
import { getSwe } from "@/lib/astro/geodetic-pattern-compute";

const SEFLG_MOSEPH = 4;
const SEFLG_SWIEPH = 2;
const SEFLG_SPEED = 256;

const ASTEROID_BODIES = new Set(["Chiron", "Ceres", "Pallas", "Juno", "Vesta"]);
const flagsFor = (name: string) =>
    (ASTEROID_BODIES.has(name) ? SEFLG_SWIEPH : SEFLG_MOSEPH) | SEFLG_SPEED;

const STEP_DAYS = 1.0;
const BISECT_ITERATIONS = 40;

interface SweCalc { longitude: number; longitudeSpeed: number }
interface SweRev { year: number; month: number; day: number; hour: number }
type Swe = {
    julday: (y: number, m: number, d: number, h: number) => number;
    revjul: (jd: number, cal: number) => SweRev;
    calc: (jd: number, ipl: number, flags: number) => SweCalc;
};

export interface ShadowBoundary {
    /** ISO 8601 UTC */
    utc: string;
    /** Julian day (UT) */
    jd: number;
    /** Ecliptic longitude at this moment, degrees 0–360. */
    longitude: number;
    /** Tropical sign at this longitude. */
    sign: string;
}

export interface RetrogradeShadowWindow {
    body: string;
    /** Body crosses the direct-station longitude moving direct. */
    preShadowStart: ShadowBoundary;
    /** Speed crosses zero direct→retrograde. */
    retrogradeStation: ShadowBoundary;
    /** Speed crosses zero retrograde→direct. */
    directStation: ShadowBoundary;
    /** Body re-crosses the retrograde-station longitude moving direct. */
    postShadowEnd: ShadowBoundary;
    /** Days from preShadowStart → postShadowEnd. */
    durationDays: number;
}

function jdToIso(swe: Swe, jd: number): string {
    const r = swe.revjul(jd, 1);
    const h = Math.floor(r.hour);
    const mFloat = (r.hour - h) * 60;
    const m = Math.floor(mFloat);
    const s = Math.round((mFloat - m) * 60);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${r.year}-${pad(r.month)}-${pad(r.day)}T${pad(h)}:${pad(m)}:${pad(s)}Z`;
}

function isoToJd(swe: Swe, iso: string): number {
    const d = new Date(iso);
    const hour = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
    return swe.julday(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), hour);
}

/** Wrap longitude difference into (-180, 180]. */
function wrapDelta(delta: number): number {
    let d = delta % 360;
    if (d > 180) d -= 360;
    else if (d <= -180) d += 360;
    return d;
}

/** Bisect for the JD where (longitude - target) — measured with shortest-arc wrap — crosses zero. */
function bisectLongitude(
    swe: Swe,
    bodyId: number,
    flags: number,
    targetLon: number,
    jdLo: number,
    jdHi: number,
): number {
    const f = (jd: number) => wrapDelta(swe.calc(jd, bodyId, flags).longitude - targetLon);
    let lo = jdLo;
    let hi = jdHi;
    const fLo = f(lo);
    for (let i = 0; i < BISECT_ITERATIONS; i++) {
        const mid = (lo + hi) / 2;
        const fm = f(mid);
        if ((fLo < 0) === (fm < 0)) lo = mid;
        else hi = mid;
    }
    return hi;
}

function bisectStation(
    swe: Swe,
    bodyId: number,
    flags: number,
    jdLo: number,
    jdHi: number,
): number {
    const f = (jd: number) => swe.calc(jd, bodyId, flags).longitudeSpeed;
    let lo = jdLo;
    let hi = jdHi;
    const fLo = f(lo);
    for (let i = 0; i < BISECT_ITERATIONS; i++) {
        const mid = (lo + hi) / 2;
        const fm = f(mid);
        if ((fLo < 0) === (fm < 0)) lo = mid;
        else hi = mid;
    }
    return hi;
}

function makeBoundary(swe: Swe, bodyId: number, flags: number, jd: number): ShadowBoundary {
    const result = swe.calc(jd, bodyId, flags);
    return {
        utc: jdToIso(swe, jd),
        jd: Number(jd.toFixed(6)),
        longitude: Number(result.longitude.toFixed(6)),
        sign: getSign(result.longitude),
    };
}

/**
 * Walk back from `stationRxJd` looking for the moment the body — moving direct —
 * first crosses `targetLon`. Returns the JD of that crossing. The body was direct
 * the entire interval from this crossing through stationRxJd.
 */
function findPreShadowCrossing(
    swe: Swe,
    bodyId: number,
    flags: number,
    stationRxJd: number,
    targetLon: number,
    maxLookbackDays: number,
): number {
    let prevJd = stationRxJd;
    let prevDelta = wrapDelta(swe.calc(prevJd, bodyId, flags).longitude - targetLon);
    const minJd = stationRxJd - maxLookbackDays;

    for (let jd = stationRxJd - STEP_DAYS; jd >= minJd; jd -= STEP_DAYS) {
        const sample = swe.calc(jd, bodyId, flags);
        const delta = wrapDelta(sample.longitude - targetLon);

        // We want the sign of `delta` to flip between jd and prevJd while body is direct.
        // The body is direct for the entire span preShadowStart → stationRx, so
        // we additionally require speed > 0 at our sample to filter out earlier Rx loops.
        if (sample.longitudeSpeed > 0 && (delta < 0) !== (prevDelta < 0) && Math.abs(delta - prevDelta) < 60) {
            return bisectLongitude(swe, bodyId, flags, targetLon, jd, prevJd);
        }
        prevJd = jd;
        prevDelta = delta;
    }
    throw new Error(
        `findPreShadowCrossing: no crossing of ${targetLon.toFixed(4)} found within ${maxLookbackDays}d before JD ${stationRxJd}`,
    );
}

/**
 * Walk forward from `stationDirectJd` looking for the moment the body — moving direct —
 * first crosses `targetLon`. Returns the JD of that crossing.
 */
function findPostShadowCrossing(
    swe: Swe,
    bodyId: number,
    flags: number,
    stationDirectJd: number,
    targetLon: number,
    maxLookForwardDays: number,
): number {
    let prevJd = stationDirectJd;
    let prevDelta = wrapDelta(swe.calc(prevJd, bodyId, flags).longitude - targetLon);
    const maxJd = stationDirectJd + maxLookForwardDays;

    for (let jd = stationDirectJd + STEP_DAYS; jd <= maxJd; jd += STEP_DAYS) {
        const sample = swe.calc(jd, bodyId, flags);
        const delta = wrapDelta(sample.longitude - targetLon);

        if (sample.longitudeSpeed > 0 && (delta < 0) !== (prevDelta < 0) && Math.abs(delta - prevDelta) < 60) {
            return bisectLongitude(swe, bodyId, flags, targetLon, prevJd, jd);
        }
        prevJd = jd;
        prevDelta = delta;
    }
    throw new Error(
        `findPostShadowCrossing: no crossing of ${targetLon.toFixed(4)} found within ${maxLookForwardDays}d after JD ${stationDirectJd}`,
    );
}

/** Maximum reasonable shadow lookback/lookforward by body (days). */
const SHADOW_HORIZON_DAYS: Record<string, number> = {
    Mercury: 30,
    Venus: 90,
    Mars: 150,
    Jupiter: 180,
    Saturn: 200,
    Uranus: 240,
    Neptune: 260,
    Pluto: 280,
    Chiron: 240,
    Ceres: 150,
    Pallas: 150,
    Juno: 150,
    Vesta: 150,
};

/**
 * Detect every retrograde shadow window (pre, Rx, direct, post) for the given body
 * whose envelope INTERSECTS [jdStart, jdEnd] — i.e. any of the four boundary
 * timestamps falls inside the window. This is broader than "Rx station inside
 * the window": it captures cycles whose Rx happened in the prior year but whose
 * direct station / post-shadow falls inside the window.
 */
function computeShadowWindowsForBody(
    swe: Swe,
    bodyName: string,
    jdStart: number,
    jdEnd: number,
): RetrogradeShadowWindow[] {
    const bodyId = BODIES[bodyName];
    if (bodyId === undefined) throw new Error(`Unknown body: ${bodyName}`);
    const flags = flagsFor(bodyName);
    const horizon = SHADOW_HORIZON_DAYS[bodyName] ?? 200;

    // Search horizon must extend past jdEnd so we can pair stationDirect to a stationRx
    // that opened before jdEnd. Also extend before jdStart so we can detect Rx stations
    // from the prior year whose envelope reaches into our window.
    const searchStart = jdStart - 2 * horizon;
    const searchEnd = jdEnd + 2 * horizon;

    interface RawStation { jd: number; direction: "direct" | "retrograde"; lon: number }
    const stations: RawStation[] = [];

    let prevSpeed = swe.calc(searchStart, bodyId, flags).longitudeSpeed;
    for (let jd = searchStart + STEP_DAYS; jd <= searchEnd; jd += STEP_DAYS) {
        const sample = swe.calc(jd, bodyId, flags);
        if ((prevSpeed < 0) !== (sample.longitudeSpeed < 0)) {
            const exactJd = bisectStation(swe, bodyId, flags, jd - STEP_DAYS, jd);
            const exact = swe.calc(exactJd, bodyId, flags);
            stations.push({
                jd: exactJd,
                direction: sample.longitudeSpeed >= 0 ? "direct" : "retrograde",
                lon: exact.longitude,
            });
        }
        prevSpeed = sample.longitudeSpeed;
    }

    const windows: RetrogradeShadowWindow[] = [];
    for (let i = 0; i < stations.length - 1; i++) {
        const start = stations[i];
        const end = stations[i + 1];
        if (start.direction !== "retrograde" || end.direction !== "direct") continue;

        const preJd = findPreShadowCrossing(swe, bodyId, flags, start.jd, end.lon, horizon);
        const postJd = findPostShadowCrossing(swe, bodyId, flags, end.jd, start.lon, horizon);

        // Include the cycle iff its envelope intersects [jdStart, jdEnd] —
        // i.e. ANY of the four boundary moments falls inside the window.
        const envelopeIntersects =
            (preJd >= jdStart && preJd <= jdEnd) ||
            (start.jd >= jdStart && start.jd <= jdEnd) ||
            (end.jd >= jdStart && end.jd <= jdEnd) ||
            (postJd >= jdStart && postJd <= jdEnd);
        if (!envelopeIntersects) continue;

        windows.push({
            body: bodyName,
            preShadowStart: makeBoundary(swe, bodyId, flags, preJd),
            retrogradeStation: makeBoundary(swe, bodyId, flags, start.jd),
            directStation: makeBoundary(swe, bodyId, flags, end.jd),
            postShadowEnd: makeBoundary(swe, bodyId, flags, postJd),
            durationDays: Number((postJd - preJd).toFixed(2)),
        });
    }

    return windows;
}

export interface ShadowWindowOptions {
    /** Bodies to include. Default: all standard stationing bodies. */
    bodies?: ReadonlyArray<string>;
    /** UTC ISO timestamp inclusive. */
    startUtc: string;
    /** UTC ISO timestamp exclusive. */
    endUtc: string;
}

/**
 * Compute every retrograde-shadow window whose RETROGRADE STATION falls in
 * [startUtc, endUtc). Bodies default to STATIONING_BODIES.
 *
 * Server-only — imports swisseph-wasm.
 */
export async function computeRetrogradeShadowWindows(
    opts: ShadowWindowOptions,
): Promise<RetrogradeShadowWindow[]> {
    const swe = (await getSwe()) as unknown as Swe;
    const jdStart = isoToJd(swe, opts.startUtc);
    const jdEnd = isoToJd(swe, opts.endUtc);
    const bodies = opts.bodies ?? STATIONING_BODIES;

    const all: RetrogradeShadowWindow[] = [];
    for (const body of bodies) {
        const windows = computeShadowWindowsForBody(swe, body, jdStart, jdEnd);
        all.push(...windows);
    }

    return all.sort((a, b) => a.retrogradeStation.jd - b.retrogradeStation.jd);
}
