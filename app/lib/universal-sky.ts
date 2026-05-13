/**
 * universal-sky.ts — What the sky is doing for everyone, right now.
 *
 * Pure data module. Given a reference date, returns the universal (location-
 * agnostic) state of the sky: which planets are retrograde, what dignity
 * conditions they're in, upcoming stations and ingresses within 30 days,
 * major transit-to-transit aspects, lunar node positions, hard aspects
 * to the nodes, and current eclipse-window status.
 *
 * Used by:
 *   - scoring-engine.ts → universal sky modifier on E_Final scores
 *   - window-scoring.ts → solveUniversalSkySpans (Gantt rows)
 *   - PlaceFieldTab     → "Sky weather right now" section
 */
import {
    ZODIAC_SIGNS,
    type ComputedPosition,
} from "@/lib/astro/transits";
import { getComputedSkyForDate, getComputedSkyForDateRange, UNIVERSAL_SKY_BODIES } from "@/lib/astro/ephemeris-cache";
import { essentialDignityLabel } from "./dignity";
import { SIGN_ELEMENT } from "./dignity-tables";
import { eclipsesInWindow } from "./geodetic/geodetic-events";

// ── Types ──────────────────────────────────────────────────────────────────

export type DignityTier = "domicile" | "exalted" | "neutral" | "detriment" | "fall";
export type ElementName = "fire" | "earth" | "air" | "water";
export type ModalityName = "cardinal" | "fixed" | "mutable";
export type AspectKind = "conjunction" | "sextile" | "square" | "trine" | "opposition";

export interface SkyRetrograde {
    planet: string;             // lowercase canonical (matches PLANETS array)
    sign: string;               // capitalized
    element: ElementName;
    modality: ModalityName;
    dignity: DignityTier;
    longitude: number;
    speed: number;              // negative when retrograde
}

export interface SkyStation {
    planet: string;             // lowercase
    direction: "retrograde" | "direct";
    dateISO: string;            // YYYY-MM-DD
    sign: string;
    longitude: number;
}

export interface SkyRetrogradeWindow {
    planet: string;             // lowercase
    sign: string;               // sign at the Rx station (entry)
    entryISO: string;           // date of station-retrograde
    midISO: string;             // midpoint between entry and exit
    exitISO: string;            // date of station-direct
    dignity: DignityTier;       // dignity of the planet at the entry sign
    isOngoingAtRef: boolean;    // refDate falls inside [entryISO, exitISO]
}

export interface SkyIngress {
    planet: string;             // lowercase
    fromSign: string;
    toSign: string;
    dateISO: string;            // YYYY-MM-DD (estimated)
    direction: "forward" | "backward"; // backward = retrograde re-entry into prior sign
}

export interface SkyAspect {
    p1: string;                 // lowercase
    p2: string;                 // lowercase
    type: AspectKind;
    orb: number;
}

export interface SkyNodeAspect {
    planet: string;             // lowercase
    node: "north" | "south";
    type: "conjunction" | "square" | "opposition";
    orb: number;
    isMalefic: boolean;         // mars / saturn / pluto
}

export interface SkyEclipse {
    kind: "solar" | "lunar";
    dateISO: string;
    sign: string;
    daysFromTarget: number;     // negative = past, positive = future
}

export interface UniversalSkyState {
    refDateISO: string;
    retrogrades: SkyRetrograde[];
    /** Stations within the next 30 days (refDate → refDate+30). For the
     *  PlaceFieldTab "Coming up" panel. Detected by daily ephemeris scan,
     *  not from a curated table. */
    stations: SkyStation[];
    /** All retrograde windows overlapping [refDate−30, refDate+365] —
     *  ongoing AND upcoming. For the TimingTab Gantt. Includes a
     *  computed dignity at the Rx-station sign so callers can size the row
     *  prominence. */
    retrogradeWindows: SkyRetrogradeWindow[];
    ingresses: SkyIngress[];
    aspects: SkyAspect[];
    nodes: {
        trueNodeSign: string;
        trueNodeLon: number;
        southNodeSign: string;
        southNodeLon: number;
    };
    nodeAspects: SkyNodeAspect[];
    eclipses: {
        inSolarWindow: boolean;
        inLunarWindow: boolean;
        nextEvents: SkyEclipse[];
    };
}

// ── Constants ──────────────────────────────────────────────────────────────

const MAIN_PLANETS_CAP = [
    "Sun", "Moon", "Mercury", "Venus", "Mars",
    "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
] as const;

const MALEFIC_PLANETS = new Set(["mars", "saturn", "pluto"]);

const CARDINAL_SIGN_IDX = new Set([0, 3, 6, 9]);   // Aries, Cancer, Libra, Capricorn
const FIXED_SIGN_IDX    = new Set([1, 4, 7, 10]);  // Taurus, Leo, Scorpio, Aquarius
// Mutable inferred as the complement.

const ASPECT_DEGREE_MAP: Record<AspectKind, number> = {
    conjunction: 0,
    sextile: 60,
    square: 90,
    trine: 120,
    opposition: 180,
};

const ASPECT_ORB: Record<AspectKind, number> = {
    conjunction: 6,
    sextile: 4,
    square: 5,
    trine: 5,
    opposition: 6,
};

const NODE_CONJUNCTION_ORB = 3;
const NODE_HARD_ORB = 3;
const MS_DAY = 86_400_000;

// Pairs eligible for "big sky aspect" reporting — outers + Mars/Jupiter.
// Excludes Sun/Moon/Mercury/Venus to avoid clutter (they aspect everything).
const SKY_ASPECT_PARTICIPANTS = [
    "mars", "jupiter", "saturn", "uranus", "neptune", "pluto",
] as const;

// ── Helpers ────────────────────────────────────────────────────────────────

function modalityOfLongitude(lon: number): ModalityName {
    const idx = Math.floor((((lon % 360) + 360) % 360) / 30) % 12;
    if (CARDINAL_SIGN_IDX.has(idx)) return "cardinal";
    if (FIXED_SIGN_IDX.has(idx)) return "fixed";
    return "mutable";
}

function elementOfSign(sign: string): ElementName {
    const e = SIGN_ELEMENT[sign];
    return ((e?.toLowerCase() as ElementName) ?? "earth");
}

function dignityTier(planetCap: string, sign: string): DignityTier {
    const label = essentialDignityLabel(planetCap, sign);
    if (label === "Domicile")  return "domicile";
    if (label === "Exalted")   return "exalted";
    if (label === "Detriment") return "detriment";
    if (label === "Fall")      return "fall";
    return "neutral";
}

function angularDistance(a: number, b: number): number {
    const d = Math.abs(a - b) % 360;
    return Math.min(d, 360 - d);
}

function classifyAspect(lonA: number, lonB: number): { type: AspectKind; orb: number } | null {
    const d = angularDistance(lonA, lonB);
    let best: { type: AspectKind; orb: number } | null = null;
    (Object.keys(ASPECT_DEGREE_MAP) as AspectKind[]).forEach(type => {
        const orb = Math.abs(d - ASPECT_DEGREE_MAP[type]);
        if (orb <= ASPECT_ORB[type] && (!best || orb < best.orb)) {
            best = { type, orb: Number(orb.toFixed(2)) };
        }
    });
    return best;
}

function signOfLongitude(lon: number): string {
    const wrapped = ((lon % 360) + 360) % 360;
    return ZODIAC_SIGNS[Math.floor(wrapped / 30) % 12];
}

/**
 * Scan the ephemeris daily over [refDate − lookbackDays, refDate + lookaheadDays]
 * to find every station (speed sign-flip) for Mercury through Pluto, and pair
 * Rx-stations with their following direct-stations into retrograde windows.
 *
 * Cost: roughly (lookbackDays + lookaheadDays) Postgres cache reads. The
 * database currently holds daily ephemeris rows for 1900-2049, so this scan
 * should usually avoid live SwissEph computation entirely.
 *
 * Why this and not the curated `STATIONS` table: the curated table is hand-
 * maintained and intentionally incomplete (only outers + a few inner stations).
 * Mercury Rx three-times-a-year, Venus Rx every 18 months, Mars Rx every 2
 * years — none of these are in the curated table for 2026, so the user's
 * Mercury Rx (Jun 29 → Jul 23 2026 in Cancer→Leo) was invisible. This scan
 * is the source of truth.
 */
async function scanStationsAndRetrogradeWindows(
    refDate: Date,
    lookbackDays: number,
    lookaheadDays: number,
): Promise<{ stations: SkyStation[]; retrogradeWindows: SkyRetrogradeWindow[] }> {
    const refTime = refDate.getTime();
    const startTime = refTime - lookbackDays * MS_DAY;
    const totalDays = lookbackDays + lookaheadDays;

    // Per-planet daily samples. Sun and Moon never go geocentrically retrograde,
    // so we skip them. True Node has its own dynamics and isn't in MAIN_PLANETS_CAP.
    const samplesByPlanet = new Map<string, Array<{ time: number; speed: number; longitude: number }>>();
    for (const cap of MAIN_PLANETS_CAP) {
        if (cap === "Sun" || cap === "Moon") continue;
        samplesByPlanet.set(cap.toLowerCase(), []);
    }

    const positionsByDate = await getComputedSkyForDateRange(new Date(startTime), totalDays + 1, {
        bodies: UNIVERSAL_SKY_BODIES,
    });

    for (let d = 0; d <= totalDays; d++) {
        const t = startTime + d * MS_DAY;
        const dateISO = new Date(t).toISOString().slice(0, 10);
        const positions = positionsByDate.get(dateISO) ?? [];
        for (const p of positions) {
            const arr = samplesByPlanet.get(p.name.toLowerCase());
            if (!arr) continue;
            arr.push({ time: t, speed: p.speed, longitude: p.longitude });
        }
    }

    // Detect stations from speed sign-flips, linearly interpolating the
    // exact crossing time.
    const stations: SkyStation[] = [];
    for (const [planet, samples] of samplesByPlanet) {
        for (let i = 1; i < samples.length; i++) {
            const prev = samples[i - 1];
            const cur = samples[i];
            const direction =
                prev.speed >= 0 && cur.speed < 0 ? "retrograde" :
                prev.speed < 0 && cur.speed >= 0 ? "direct" :
                null;
            if (!direction) continue;
            // Speed = 0 lies between the samples — linear interpolation gets
            // the station date to ~1-day precision, plenty for our use case.
            const denom = prev.speed - cur.speed;
            const frac = denom === 0 ? 0.5 : prev.speed / denom;
            const stationTime = prev.time + frac * (cur.time - prev.time);
            const stationLon = prev.longitude + frac * (cur.longitude - prev.longitude);
            stations.push({
                planet,
                direction,
                dateISO: new Date(stationTime).toISOString().slice(0, 10),
                sign: signOfLongitude(stationLon),
                longitude: stationLon,
            });
        }
    }
    stations.sort((a, b) => a.dateISO.localeCompare(b.dateISO));

    // Pair each Rx-station with the next direct-station for the same planet.
    // An Rx whose direct-station falls beyond `lookaheadDays` will be
    // dropped (we won't have its closing date). Acceptable — that planet is
    // still going Rx on the horizon edge.
    const refDateISO = refDate.toISOString().slice(0, 10);
    const retrogradeWindows: SkyRetrogradeWindow[] = [];
    for (let i = 0; i < stations.length; i++) {
        const start = stations[i];
        if (start.direction !== "retrograde") continue;
        let end: SkyStation | null = null;
        for (let j = i + 1; j < stations.length; j++) {
            if (stations[j].planet === start.planet && stations[j].direction === "direct") {
                end = stations[j];
                break;
            }
        }
        if (!end) continue;
        const startMs = new Date(start.dateISO).getTime();
        const endMs = new Date(end.dateISO).getTime();
        const midMs = (startMs + endMs) / 2;
        const planetCap = start.planet[0].toUpperCase() + start.planet.slice(1);
        retrogradeWindows.push({
            planet: start.planet,
            sign: start.sign,
            entryISO: start.dateISO,
            midISO: new Date(midMs).toISOString().slice(0, 10),
            exitISO: end.dateISO,
            dignity: dignityTier(planetCap, start.sign),
            isOngoingAtRef: start.dateISO <= refDateISO && refDateISO <= end.dateISO,
        });
    }

    return { stations, retrogradeWindows };
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Compute the universal sky state at `refDate`.
 *
 * Pure async function. Reads `ephemeris_daily` first via the Postgres-backed
 * cache and falls back to SwissEph only on cache misses. It also reads the
 * curated `ECLIPSES` table. Performs a daily ephemeris scan
 * across [refDate − 30, refDate + 365] to detect stations + retrograde
 * windows for Mercury–Pluto (no curated-table dependency for stations).
 *
 * @param refDate The reference date (UTC) to anchor the snapshot at.
 * @param scanLookaheadDays How far forward the station/retrograde-window
 *   scan reaches. Default 365 covers both trip readings (90d) and
 *   relocation readings (365d). Caller-overridable for tests.
 */
export async function computeUniversalSky(
    refDate: Date,
    scanLookaheadDays: number = 365,
): Promise<UniversalSkyState> {
    const positions = await getComputedSkyForDate(refDate, { bodies: UNIVERSAL_SKY_BODIES });
    const refDateISO = refDate.toISOString().slice(0, 10);

    // Index by lowercase planet name (PLANETS-array convention).
    const byPlanet = new Map<string, ComputedPosition>();
    for (const p of positions) byPlanet.set(p.name.toLowerCase(), p);

    // 1. Retrogrades — current state at refDate.
    const retrogrades: SkyRetrograde[] = [];
    for (const cap of MAIN_PLANETS_CAP) {
        const p = byPlanet.get(cap.toLowerCase());
        if (!p || !p.is_retrograde) continue;
        retrogrades.push({
            planet: cap.toLowerCase(),
            sign: p.sign,
            element: elementOfSign(p.sign),
            modality: modalityOfLongitude(p.longitude),
            dignity: dignityTier(cap, p.sign),
            longitude: p.longitude,
            speed: p.speed,
        });
    }

    // 2. Stations + retrograde windows — daily ephemeris scan.
    //    Lookback 30d so that an Rx already in progress at refDate (e.g.
    //    Pluto Rx that started 2 months ago) shows up with its real entry
    //    date rather than being dropped. Lookahead per param.
    const { stations: allStations, retrogradeWindows } =
        await scanStationsAndRetrogradeWindows(refDate, 30, scanLookaheadDays);

    // Symmetric ±30 day window. Past stations are kept because (a) the
    // geodetic scoring path needs them — a station that just fired is more
    // active than one coming up, and the Gaussian time-decay in
    // `scoreStations` (σ varies by planet, 5–25 days) handles the falloff,
    // and (b) the UI's "Coming up" panel can filter forward on the consumer
    // side. The full set spanning [refDate − 30, refDate + scanLookaheadDays]
    // is surfaced via retrogradeWindows for the Gantt.
    const refTime = refDate.getTime();
    const stationsWindowStart = refTime - 30 * MS_DAY;
    const stationsWindowEnd = refTime + 30 * MS_DAY;
    const stations: SkyStation[] = allStations.filter(s => {
        const t = new Date(s.dateISO).getTime();
        return t >= stationsWindowStart && t <= stationsWindowEnd;
    });

    // 3. Ingresses within 30 days — analytic from current speed.
    //    Skip the Moon (changes sign every ~2.5 days; pure noise on a 30-day
    //    horizon). For everyone else, compute days-to-next-cusp at current
    //    speed; if ≤ 30, surface it.
    const ingresses: SkyIngress[] = [];
    for (const cap of MAIN_PLANETS_CAP) {
        if (cap === "Moon") continue;
        const p = byPlanet.get(cap.toLowerCase());
        if (!p) continue;
        const speed = p.speed;
        if (Math.abs(speed) < 1e-6) continue;
        const degInSign = ((p.longitude % 30) + 30) % 30;
        const currentSignIdx = Math.floor(p.longitude / 30) % 12;
        let daysToIngress: number;
        let toSignIdx: number;
        if (speed > 0) {
            daysToIngress = (30 - degInSign) / speed;
            toSignIdx = (currentSignIdx + 1) % 12;
        } else {
            daysToIngress = degInSign / Math.abs(speed);
            toSignIdx = (currentSignIdx + 11) % 12; // -1 mod 12
        }
        if (daysToIngress > 0 && daysToIngress <= 30) {
            const ingressDate = new Date(refDate.getTime() + daysToIngress * MS_DAY);
            ingresses.push({
                planet: cap.toLowerCase(),
                fromSign: p.sign,
                toSign: ZODIAC_SIGNS[toSignIdx],
                dateISO: ingressDate.toISOString().slice(0, 10),
                direction: speed > 0 ? "forward" : "backward",
            });
        }
    }

    // 4. Major transit-to-transit aspects — outers + Mars/Jupiter only.
    const aspects: SkyAspect[] = [];
    for (let i = 0; i < SKY_ASPECT_PARTICIPANTS.length; i++) {
        for (let j = i + 1; j < SKY_ASPECT_PARTICIPANTS.length; j++) {
            const a = byPlanet.get(SKY_ASPECT_PARTICIPANTS[i]);
            const b = byPlanet.get(SKY_ASPECT_PARTICIPANTS[j]);
            if (!a || !b) continue;
            const r = classifyAspect(a.longitude, b.longitude);
            if (r) {
                aspects.push({
                    p1: SKY_ASPECT_PARTICIPANTS[i],
                    p2: SKY_ASPECT_PARTICIPANTS[j],
                    type: r.type,
                    orb: r.orb,
                });
            }
        }
    }

    // 5. Lunar nodes.
    const trueNode = byPlanet.get("true node");
    const trueNodeLon = trueNode?.longitude ?? 0;
    const southNodeLon = (trueNodeLon + 180) % 360;
    const trueNodeSign = ZODIAC_SIGNS[Math.floor(trueNodeLon / 30) % 12];
    const southNodeSign = ZODIAC_SIGNS[Math.floor(southNodeLon / 30) % 12];

    // 6. Node aspects — conjunction (north or south) and squares to the nodal axis.
    //    Square to north node = square to south node (axis is shared), so
    //    we compute it once against the north node and label it "north".
    const nodeAspects: SkyNodeAspect[] = [];
    if (trueNode) {
        for (const cap of MAIN_PLANETS_CAP) {
            const p = byPlanet.get(cap.toLowerCase());
            if (!p) continue;
            const planetLc = cap.toLowerCase();
            const isMalefic = MALEFIC_PLANETS.has(planetLc);
            const distNorth = angularDistance(p.longitude, trueNodeLon);
            const distSouth = angularDistance(p.longitude, southNodeLon);

            if (distNorth <= NODE_CONJUNCTION_ORB) {
                nodeAspects.push({
                    planet: planetLc, node: "north", type: "conjunction",
                    orb: Number(distNorth.toFixed(2)), isMalefic,
                });
            } else if (distSouth <= NODE_CONJUNCTION_ORB) {
                nodeAspects.push({
                    planet: planetLc, node: "south", type: "conjunction",
                    orb: Number(distSouth.toFixed(2)), isMalefic,
                });
            }

            const squareOrb = Math.abs(distNorth - 90);
            if (squareOrb <= NODE_HARD_ORB) {
                nodeAspects.push({
                    planet: planetLc, node: "north", type: "square",
                    orb: Number(squareOrb.toFixed(2)), isMalefic,
                });
            }
        }
    }

    // 7. Eclipses — current windows + next events.
    const eclipsesRaw = eclipsesInWindow(refDate, 180);
    const inSolarWindow = eclipsesRaw.some(e =>
        e.kind === "solar" && e.daysFromTarget >= -180 && e.daysFromTarget <= 14
    );
    const inLunarWindow = eclipsesRaw.some(e =>
        e.kind === "lunar" && e.daysFromTarget >= -30 && e.daysFromTarget <= 7
    );
    const nextEvents: SkyEclipse[] = eclipsesRaw
        .filter(e => e.daysFromTarget >= -7)
        .sort((a, b) => a.daysFromTarget - b.daysFromTarget)
        .slice(0, 3)
        .map(e => ({
            kind: e.kind,
            dateISO: e.dateUtc.slice(0, 10),
            sign: e.sign,
            daysFromTarget: Math.round(e.daysFromTarget),
        }));

    return {
        refDateISO,
        retrogrades,
        stations,
        retrogradeWindows,
        ingresses,
        aspects,
        nodes: { trueNodeSign, trueNodeLon, southNodeSign, southNodeLon },
        nodeAspects,
        eclipses: { inSolarWindow, inLunarWindow, nextEvents },
    };
}
