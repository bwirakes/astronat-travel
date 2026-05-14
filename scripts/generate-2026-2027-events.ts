/**
 * generate-2026-2027-events.ts
 *
 * Regenerates `app/lib/geodetic/events-2026-2027.generated.ts` from Swiss
 * Ephemeris. Output is the canonical event table the /geodetic-test page
 * reads at request time.
 *
 *   bun run scripts/generate-2026-2027-events.ts
 *
 * Window: 2026-01-01T00:00Z → 2028-01-01T00:00Z (exclusive).
 *
 * Emits, all derived from swisseph-wasm:
 *   • retrogradeWindows[]   — preShadowStart / Rx station / direct station / postShadowEnd
 *   • signIngresses[]       — every body's sign-boundary crossing
 *   • eclipses[]            — solar + lunar with kind (total/annular/partial/penumbral)
 *   • stelliums[]           — 3+ STELLIUM_BODIES within 5° contiguous spans
 *
 * The same parity is enforced by `__tests__/canonical-events-2026-2027.test.ts` —
 * if the generated file drifts from SWE, the test fails.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { computeRetrogradeShadowWindows, type RetrogradeShadowWindow } from "@/lib/astro/retrograde-shadows";
import { getSwe } from "@/lib/astro/geodetic-pattern-compute";
import { BODIES, STELLIUM_BODIES, STELLIUM_MIN, STELLIUM_ORB_DEG, getSign } from "@/lib/astro/geodetic-patterns";

const SEFLG_MOSEPH = 4;
const SEFLG_SWIEPH = 2;
const SEFLG_SPEED = 256;

const ASTEROID_BODIES = new Set(["Chiron", "Ceres", "Pallas", "Juno", "Vesta"]);
const flagsFor = (name: string) =>
    (ASTEROID_BODIES.has(name) ? SEFLG_SWIEPH : SEFLG_MOSEPH) | SEFLG_SPEED;

const WINDOW_START_UTC = "2026-01-01T00:00:00Z";
const WINDOW_END_UTC = "2028-01-01T00:00:00Z";

// Eclipse classification uses gamma — the perpendicular distance from Earth's
// center to the Sun–Moon shadow axis, expressed in Earth equatorial radii.
// gamma = (Moon ecliptic latitude in radians) × (Moon distance) / R_earth
//       = (lat in degrees) / (Moon parallax pi_M = asin(R_earth / d_moon))
//
// Solar eclipse bands (per NASA Five-Millennium Canon):
//   |gamma| < 0.9972            → central (total OR annular by Moon apparent radius vs Sun)
//   0.9972 ≤ |gamma| < 1.5379   → partial
//   |gamma| ≥ 1.5379            → no eclipse
//
// Lunar eclipse bands (umbra/penumbra geometry at Moon's distance, ≈):
//   |gamma| < ~0.41             → total
//   ~0.41 ≤ |gamma| < ~0.99     → partial (umbral)
//   ~0.99 ≤ |gamma| < ~1.57     → penumbral
const SOLAR_CENTRAL_GAMMA = 0.9972;
const SOLAR_PARTIAL_GAMMA = 1.5379;
const LUNAR_TOTAL_GAMMA = 0.41;
const LUNAR_PARTIAL_GAMMA = 0.99;
const LUNAR_PENUMBRAL_GAMMA = 1.57;
const EARTH_EQUATORIAL_RADIUS_KM = 6378.137;

interface SweCalcFull {
    longitude: number;
    latitude: number;
    distance: number;
    longitudeSpeed: number;
    latitudeSpeed: number;
    distanceSpeed: number;
}
interface SweCalc { longitude: number; longitudeSpeed: number }
interface SweRev { year: number; month: number; day: number; hour: number }
type Swe = {
    julday: (y: number, m: number, d: number, h: number) => number;
    revjul: (jd: number, cal: number) => SweRev;
    calc: (jd: number, ipl: number, flags: number) => SweCalcFull;
};

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

function bisectIngress(swe: Swe, pid: number, flags: number, jdBefore: number, jdAfter: number, fromSign: string): number {
    let lo = jdBefore;
    let hi = jdAfter;
    for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        const midSign = getSign(swe.calc(mid, pid, flags).longitude);
        if (midSign === fromSign) lo = mid;
        else hi = mid;
    }
    return hi;
}

function bisectLunation(swe: Swe, jdBefore: number, jdAfter: number, target: 0 | 180): number {
    const elong = (jd: number) => {
        const sun = swe.calc(jd, BODIES.Sun, SEFLG_MOSEPH).longitude;
        const moon = swe.calc(jd, BODIES.Moon, SEFLG_MOSEPH).longitude;
        let d = ((moon - sun + 540) % 360) - 180;
        if (target === 180) d = d >= 0 ? d - 180 : d + 180;
        return d;
    };
    let lo = jdBefore;
    let hi = jdAfter;
    const sLo = elong(lo);
    for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        const sMid = elong(mid);
        if ((sLo < 0) === (sMid < 0)) lo = mid;
        else hi = mid;
    }
    return hi;
}

/** Moon's geocentric parallax in degrees from its Earth distance (AU). */
function moonParallaxDeg(distanceAU: number): number {
    const distanceKm = distanceAU * AU_KM;
    return Math.asin(EARTH_EQUATORIAL_RADIUS_KM / distanceKm) * (180 / Math.PI);
}

/** gamma in Earth equatorial radii from Moon ecliptic latitude (deg) and Moon distance (AU). */
function eclipseGamma(moonLatDeg: number, moonDistanceAU: number): number {
    return moonLatDeg / moonParallaxDeg(moonDistanceAU);
}

function classifySolarEclipse(gammaAbs: number, sunApparentRadius: number, moonApparentRadius: number): string {
    if (gammaAbs > SOLAR_PARTIAL_GAMMA) return "none";
    if (gammaAbs > SOLAR_CENTRAL_GAMMA) return "partial";
    return moonApparentRadius >= sunApparentRadius ? "total" : "annular";
}

function classifyLunarEclipse(gammaAbs: number): string {
    if (gammaAbs > LUNAR_PENUMBRAL_GAMMA) return "none";
    if (gammaAbs > LUNAR_PARTIAL_GAMMA) return "penumbral";
    if (gammaAbs > LUNAR_TOTAL_GAMMA) return "partial";
    return "total";
}

const SUN_RADIUS_KM = 695700;
const MOON_RADIUS_KM = 1737.4;
const AU_KM = 149597870.7;
function apparentRadiusDeg(bodyRadiusKm: number, distanceAU: number): number {
    const distanceKm = distanceAU * AU_KM;
    return Math.atan(bodyRadiusKm / distanceKm) * (180 / Math.PI);
}

interface GeneratedIngress {
    utc: string;
    jd: number;
    body: string;
    fromSign: string;
    toSign: string;
    longitude: number;
    retrograde: boolean;
}

interface GeneratedEclipse {
    utc: string;
    jd: number;
    kind: "solar" | "lunar";
    eclipseType: string;
    longitude: number;
    sign: string;
}

interface GeneratedStellium {
    startUtc: string;
    endUtc: string;
    durationDays: number;
    members: string[];
    /** Mean longitude of members at start. */
    centerLongitudeStart: number;
    centerSignStart: string;
}

// ─── Ingress detection ────────────────────────────────────────────────────

function detectAllIngresses(swe: Swe, jdStart: number, jdEnd: number): GeneratedIngress[] {
    const out: GeneratedIngress[] = [];
    const STEP = 0.5; // higher resolution; Moon moves ~13°/day
    const prev: Record<string, { sign: string }> = {};

    for (let jd = jdStart; jd <= jdEnd; jd += STEP) {
        for (const [name, pid] of Object.entries(BODIES)) {
            // Skip Moon — sign changes every ~2.5 days, too much noise for this dataset.
            if (name === "Moon") continue;
            const flags = flagsFor(name);
            let res: SweCalc;
            try { res = swe.calc(jd, pid, flags); } catch { continue; }
            const sign = getSign(res.longitude);
            const p = prev[name];

            if (p && p.sign !== sign) {
                const exactJd = bisectIngress(swe, pid, flags, jd - STEP, jd, p.sign);
                const exact = swe.calc(exactJd, pid, flags);
                out.push({
                    utc: jdToIso(swe, exactJd),
                    jd: Number(exactJd.toFixed(6)),
                    body: name,
                    fromSign: p.sign,
                    toSign: sign,
                    longitude: Number(exact.longitude.toFixed(6)),
                    retrograde: exact.longitudeSpeed < 0,
                });
            }
            prev[name] = { sign };
        }
    }
    return out.sort((a, b) => a.jd - b.jd);
}

// ─── Eclipse detection ────────────────────────────────────────────────────

/**
 * Eclipses are computed from lunations + Moon's ecliptic latitude at lunation
 * peak. The swisseph-wasm binding does not consistently expose
 * swe_sol_eclipse_when_glob, so we fall back to the underlying physics:
 *  - Solar eclipse  ⇔ New Moon AND |Moon ecliptic latitude| < ~1.55°
 *  - Lunar eclipse  ⇔ Full Moon AND |Moon ecliptic latitude| < ~1.05°
 * Sub-classification uses the standard latitude bands plus apparent-radius
 * comparison for total vs annular solar.
 */
function detectEclipses(swe: Swe, jdStart: number, jdEnd: number): GeneratedEclipse[] {
    const STEP = 0.5;
    const out: GeneratedEclipse[] = [];

    const sunLonAt = (jd: number) => swe.calc(jd, BODIES.Sun, SEFLG_MOSEPH).longitude;
    const moonLonAt = (jd: number) => swe.calc(jd, BODIES.Moon, SEFLG_MOSEPH).longitude;
    let prevDiff = ((moonLonAt(jdStart) - sunLonAt(jdStart) + 540) % 360) - 180;
    let prevHalf = (((moonLonAt(jdStart) - sunLonAt(jdStart)) % 360) + 360) % 360;

    for (let jd = jdStart + STEP; jd <= jdEnd; jd += STEP) {
        const sun = swe.calc(jd, BODIES.Sun, SEFLG_MOSEPH).longitude;
        const moon = swe.calc(jd, BODIES.Moon, SEFLG_MOSEPH).longitude;
        const diff = ((moon - sun + 540) % 360) - 180;
        const half = (((moon - sun) % 360) + 360) % 360;

        // New moon: diff crosses 0
        if ((prevDiff < 0) !== (diff < 0) && Math.abs(prevDiff - diff) < 30) {
            const exactJd = bisectLunation(swe, jd - STEP, jd, 0);
            const moonSample = swe.calc(exactJd, BODIES.Moon, SEFLG_MOSEPH | SEFLG_SPEED);
            const sunSample = swe.calc(exactJd, BODIES.Sun, SEFLG_MOSEPH | SEFLG_SPEED);
            const gamma = Math.abs(eclipseGamma(moonSample.latitude, moonSample.distance));
            if (gamma < SOLAR_PARTIAL_GAMMA) {
                const sunRad = apparentRadiusDeg(SUN_RADIUS_KM, sunSample.distance);
                const moonRad = apparentRadiusDeg(MOON_RADIUS_KM, moonSample.distance);
                out.push({
                    utc: jdToIso(swe, exactJd),
                    jd: Number(exactJd.toFixed(6)),
                    kind: "solar",
                    eclipseType: classifySolarEclipse(gamma, sunRad, moonRad),
                    longitude: Number(sunSample.longitude.toFixed(6)),
                    sign: getSign(sunSample.longitude),
                });
            }
        }

        // Full moon: half crosses 180
        if ((prevHalf < 180) !== (half < 180) && Math.abs(prevHalf - half) < 30) {
            const exactJd = bisectLunation(swe, jd - STEP, jd, 180);
            const moonSample = swe.calc(exactJd, BODIES.Moon, SEFLG_MOSEPH | SEFLG_SPEED);
            const gamma = Math.abs(eclipseGamma(moonSample.latitude, moonSample.distance));
            if (gamma < LUNAR_PENUMBRAL_GAMMA) {
                out.push({
                    utc: jdToIso(swe, exactJd),
                    jd: Number(exactJd.toFixed(6)),
                    kind: "lunar",
                    eclipseType: classifyLunarEclipse(gamma),
                    longitude: Number(moonSample.longitude.toFixed(6)),
                    sign: getSign(moonSample.longitude),
                });
            }
        }

        prevDiff = diff;
        prevHalf = half;
    }

    return out.sort((a, b) => a.jd - b.jd);
}

// ─── Stellium detection ────────────────────────────────────────────────────

/**
 * Smallest arc that contains all `lons` modulo 360.
 * Returns NaN if the bodies don't fit within 360°.
 */
function smallestArc(lons: number[]): { width: number; center: number } {
    if (lons.length === 0) return { width: 0, center: 0 };
    const sorted = lons.map((l) => ((l % 360) + 360) % 360).sort((a, b) => a - b);
    let bestWidth = Infinity;
    let bestStart = 0;
    for (let i = 0; i < sorted.length; i++) {
        // Smallest arc starting at sorted[i] containing every other point.
        const last = sorted[(i + sorted.length - 1) % sorted.length];
        const width = ((last - sorted[i] + 360) % 360);
        if (width < bestWidth) {
            bestWidth = width;
            bestStart = sorted[i];
        }
    }
    const center = (bestStart + bestWidth / 2) % 360;
    return { width: bestWidth, center };
}

function detectStelliums(swe: Swe, jdStart: number, jdEnd: number): GeneratedStellium[] {
    const STEP = 1.0;
    interface Open { startJd: number; lastJd: number; members: string[]; centerLonStart: number }
    const open = new Map<string, Open>();
    const closed: GeneratedStellium[] = [];

    const findClusters = (jd: number) => {
        const positions: Array<{ name: string; lon: number }> = [];
        for (const name of STELLIUM_BODIES) {
            try {
                const lon = swe.calc(jd, BODIES[name], flagsFor(name)).longitude;
                positions.push({ name, lon });
            } catch { /* skip */ }
        }
        const clusters: Array<{ members: string[]; centerLon: number }> = [];
        // Enumerate all subsets of size >= STELLIUM_MIN where smallestArc <= STELLIUM_ORB_DEG.
        // Bodies are few enough (<= 9) to allow a simple incremental sweep along the sorted longitudes.
        positions.sort((a, b) => a.lon - b.lon);
        const n = positions.length;
        const seen = new Set<string>();
        const tryStarting = (startIdx: number) => {
            const members: typeof positions = [positions[startIdx]];
            for (let off = 1; off < n; off++) {
                const idx = (startIdx + off) % n;
                const candidate = positions[idx];
                const tentative = [...members, candidate];
                const arc = smallestArc(tentative.map((p) => p.lon));
                if (arc.width <= STELLIUM_ORB_DEG) members.push(candidate);
            }
            if (members.length >= STELLIUM_MIN) {
                const key = members.map((m) => m.name).sort().join("/");
                if (!seen.has(key)) {
                    seen.add(key);
                    const arc = smallestArc(members.map((m) => m.lon));
                    clusters.push({ members: members.map((m) => m.name).sort(), centerLon: arc.center });
                }
            }
        };
        for (let i = 0; i < n; i++) tryStarting(i);
        return clusters;
    };

    for (let jd = jdStart; jd <= jdEnd; jd += STEP) {
        const clusters = findClusters(jd);
        const presentKeys = new Set(clusters.map((c) => c.members.join("/")));
        for (const c of clusters) {
            const key = c.members.join("/");
            const existing = open.get(key);
            if (existing) {
                existing.lastJd = jd;
            } else {
                open.set(key, { startJd: jd, lastJd: jd, members: c.members, centerLonStart: c.centerLon });
            }
        }
        for (const [key, span] of [...open.entries()]) {
            if (!presentKeys.has(key)) {
                const startIso = jdToIso(swe, span.startJd);
                const endIso = jdToIso(swe, span.lastJd);
                closed.push({
                    startUtc: startIso,
                    endUtc: endIso,
                    durationDays: Number((span.lastJd - span.startJd).toFixed(2)),
                    members: span.members,
                    centerLongitudeStart: Number(span.centerLonStart.toFixed(4)),
                    centerSignStart: getSign(span.centerLonStart),
                });
                open.delete(key);
            }
        }
    }
    for (const span of open.values()) {
        const startIso = jdToIso(swe, span.startJd);
        const endIso = jdToIso(swe, span.lastJd);
        closed.push({
            startUtc: startIso,
            endUtc: endIso,
            durationDays: Number((span.lastJd - span.startJd).toFixed(2)),
            members: span.members,
            centerLongitudeStart: Number(span.centerLonStart.toFixed(4)),
            centerSignStart: getSign(span.centerLonStart),
        });
    }

    return closed
        .filter((s) => s.durationDays >= 1)
        .sort((a, b) => a.startUtc.localeCompare(b.startUtc));
}

// ─── File emission ────────────────────────────────────────────────────────

function serializeTs(
    retrogradeWindows: RetrogradeShadowWindow[],
    signIngresses: GeneratedIngress[],
    eclipses: GeneratedEclipse[],
    stelliums: GeneratedStellium[],
): string {
    const header = `/**
 * AUTO-GENERATED — do not hand-edit.
 *
 * Source: scripts/generate-2026-2027-events.ts
 * Window: ${WINDOW_START_UTC} → ${WINDOW_END_UTC}
 * Generated: ${new Date().toISOString()}
 *
 * To regenerate:
 *   bun run scripts/generate-2026-2027-events.ts
 *
 * The Vitest/bun:test eval __tests__/canonical-events-2026-2027.test.ts re-runs
 * Swiss Ephemeris and diffs against this file. If it drifts, regenerate.
 */

export interface RetrogradeShadowWindowRow {
    body: string;
    preShadowStart:    { utc: string; jd: number; longitude: number; sign: string };
    retrogradeStation: { utc: string; jd: number; longitude: number; sign: string };
    directStation:     { utc: string; jd: number; longitude: number; sign: string };
    postShadowEnd:     { utc: string; jd: number; longitude: number; sign: string };
    durationDays: number;
}

export interface SignIngressRow {
    utc: string;
    jd: number;
    body: string;
    fromSign: string;
    toSign: string;
    longitude: number;
    retrograde: boolean;
}

export interface EclipseRow {
    utc: string;
    jd: number;
    kind: "solar" | "lunar";
    eclipseType: string;
    longitude: number;
    sign: string;
}

export interface StelliumRow {
    startUtc: string;
    endUtc: string;
    durationDays: number;
    members: string[];
    centerLongitudeStart: number;
    centerSignStart: string;
}

export const EVENTS_WINDOW = {
    startUtc: ${JSON.stringify(WINDOW_START_UTC)},
    endUtc:   ${JSON.stringify(WINDOW_END_UTC)},
} as const;

`;

    const body =
        `export const RETROGRADE_SHADOW_WINDOWS: RetrogradeShadowWindowRow[] = ${JSON.stringify(retrogradeWindows, null, 4)};\n\n` +
        `export const SIGN_INGRESSES: SignIngressRow[] = ${JSON.stringify(signIngresses, null, 4)};\n\n` +
        `export const ECLIPSES_2026_2027: EclipseRow[] = ${JSON.stringify(eclipses, null, 4)};\n\n` +
        `export const STELLIUMS_2026_2027: StelliumRow[] = ${JSON.stringify(stelliums, null, 4)};\n`;

    return header + body;
}

async function main() {
    console.log(`Generating canonical 2026–2027 events from Swiss Ephemeris…`);
    const swe = (await getSwe()) as unknown as Swe;
    const jdStart = isoToJd(swe, WINDOW_START_UTC);
    const jdEnd = isoToJd(swe, WINDOW_END_UTC);

    console.log(`  • Retrograde shadow windows…`);
    const retrogradeWindows = await computeRetrogradeShadowWindows({
        startUtc: WINDOW_START_UTC,
        endUtc: WINDOW_END_UTC,
    });
    console.log(`    → ${retrogradeWindows.length} windows`);

    console.log(`  • Sign ingresses…`);
    const signIngresses = detectAllIngresses(swe, jdStart, jdEnd);
    console.log(`    → ${signIngresses.length} ingresses`);

    console.log(`  • Eclipses…`);
    const eclipses = detectEclipses(swe, jdStart, jdEnd);
    console.log(`    → ${eclipses.length} eclipses (${eclipses.filter((e) => e.kind === "solar").length} solar, ${eclipses.filter((e) => e.kind === "lunar").length} lunar)`);

    console.log(`  • Stelliums…`);
    const stelliums = detectStelliums(swe, jdStart, jdEnd);
    console.log(`    → ${stelliums.length} stellium spans`);

    const outPath = resolve(process.cwd(), "app/lib/geodetic/events-2026-2027.generated.ts");
    writeFileSync(outPath, serializeTs(retrogradeWindows, signIngresses, eclipses, stelliums));
    console.log(`✓ Wrote ${outPath}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
