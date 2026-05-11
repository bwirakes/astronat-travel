/**
 * Layer 8 — Configurations.
 *
 * Detects geometric configurations among current planet positions and
 * assigns severity based on configuration type + involved planets.
 *
 *   Stellium    — 3+ planets within 5° arc.
 *                 REGIONAL when cluster mean longitude ≈ destLon ±2°
 *                 (geodetic-longitude stellium activation).
 *   T-square    — A opp B (±6°) + C squares both (±6°).
 *   Grand cross — 4 planets in 2 oppositions + 4 squares.
 *   Grand trine — 3 planets in mutual trines (±5°).
 *   Yod         — 2 planets sextile + both quincunx a third (±3°).
 *
 * T-squares, grand crosses, and yods contribute negatively (tension).
 * Grand trines contribute positively (harmony). Stelliums depend on
 * planet mix and regional alignment.
 */
import type { ComputedPosition } from "@/lib/astro/transits";
import { getPlanetNature, STRONG_MALEFICS } from "@/app/lib/astro-constants";

const STELLIUM_ARC = 5;
const STELLIUM_MIN_PLANETS = 3;
const STELLIUM_REGIONAL_ORB = 2;

const TSQUARE_ORB_OPP = 6;
const TSQUARE_ORB_SQ  = 6;
const TRINE_ORB = 5;
const GRANDCROSS_ORB = 6;
const YOD_ORB = 3;

export type ConfigType =
    | "stellium" | "t-square" | "grand-cross" | "grand-trine" | "yod";

export interface ConfigurationContribution {
    type: ConfigType;
    planets: string[];
    severity: number;
    direction: "malefic" | "benefic" | "neutral";
    regional?: boolean;          // stellium only — true if cluster ≈ destLon
    stelliumLon?: number;        // stellium mean longitude
    note?: string;
}

export interface ConfigurationsResult {
    raw: number;
    contributions: ConfigurationContribution[];
}

function angularDiff(a: number, b: number): number {
    let d = Math.abs(a - b) % 360;
    if (d > 180) d = 360 - d;
    return d;
}

function signedDelta(a: number, b: number): number {
    // shortest signed arc from a → b in (-180, 180]
    let d = ((b - a) % 360 + 540) % 360 - 180;
    return d;
}

function planetNatureSeverity(planets: string[]): number {
    let s = 0;
    for (const p of planets) {
        const n = getPlanetNature(p);
        if (n === "malefic") s -= 2;
        else if (n === "benefic") s += 2;
        else if (n === "luminary") s += 0;
        else s -= 0.5;
    }
    return s;
}

// ── Stellium detection ────────────────────────────────────────────────────

function findStelliums(
    positions: ComputedPosition[]
): Array<{ planets: ComputedPosition[]; meanLon: number }> {
    const sorted = [...positions].sort((a, b) => a.longitude - b.longitude);
    const clusters: Array<ComputedPosition[]> = [];

    // Sweep window; wrap around 360
    const n = sorted.length;
    const used = new Set<string>();
    for (let i = 0; i < n; i++) {
        if (used.has(sorted[i].name)) continue;
        const cluster = [sorted[i]];
        for (let j = 0; j < n; j++) {
            if (i === j) continue;
            if (used.has(sorted[j].name)) continue;
            const d = angularDiff(sorted[i].longitude, sorted[j].longitude);
            if (d <= STELLIUM_ARC) cluster.push(sorted[j]);
        }
        if (cluster.length >= STELLIUM_MIN_PLANETS) {
            clusters.push(cluster);
            for (const p of cluster) used.add(p.name);
        }
    }

    return clusters.map(planets => {
        // Mean longitude via vector average (handles wrap-around)
        let sx = 0, sy = 0;
        for (const p of planets) {
            sx += Math.cos(p.longitude * Math.PI / 180);
            sy += Math.sin(p.longitude * Math.PI / 180);
        }
        const meanLon = ((Math.atan2(sy, sx) * 180 / Math.PI) + 360) % 360;
        return { planets, meanLon };
    });
}

// ── Aspect helpers ────────────────────────────────────────────────────────

function isOpposition(a: number, b: number, orb: number): boolean {
    return Math.abs(angularDiff(a, b) - 180) <= orb;
}
function isSquare(a: number, b: number, orb: number): boolean {
    return Math.abs(angularDiff(a, b) -  90) <= orb;
}
function isTrine(a: number, b: number, orb: number): boolean {
    return Math.abs(angularDiff(a, b) - 120) <= orb;
}
function isSextile(a: number, b: number, orb: number): boolean {
    return Math.abs(angularDiff(a, b) -  60) <= orb;
}
function isQuincunx(a: number, b: number, orb: number): boolean {
    return Math.abs(angularDiff(a, b) - 150) <= orb;
}

// ── T-square detection ────────────────────────────────────────────────────

function findTSquares(positions: ComputedPosition[]): Array<ComputedPosition[]> {
    const results: Array<ComputedPosition[]> = [];
    const seen = new Set<string>();
    for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
            if (!isOpposition(positions[i].longitude, positions[j].longitude, TSQUARE_ORB_OPP)) continue;
            for (let k = 0; k < positions.length; k++) {
                if (k === i || k === j) continue;
                if (isSquare(positions[k].longitude, positions[i].longitude, TSQUARE_ORB_SQ) &&
                    isSquare(positions[k].longitude, positions[j].longitude, TSQUARE_ORB_SQ)) {
                    const key = [positions[i].name, positions[j].name, positions[k].name].sort().join("|");
                    if (!seen.has(key)) {
                        seen.add(key);
                        results.push([positions[i], positions[j], positions[k]]);
                    }
                }
            }
        }
    }
    return results;
}

// ── Grand cross ────────────────────────────────────────────────────────────

function findGrandCrosses(positions: ComputedPosition[]): Array<ComputedPosition[]> {
    const results: Array<ComputedPosition[]> = [];
    const seen = new Set<string>();
    const n = positions.length;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (!isOpposition(positions[i].longitude, positions[j].longitude, GRANDCROSS_ORB)) continue;
            for (let k = j + 1; k < n; k++) {
                for (let l = k + 1; l < n; l++) {
                    if (!isOpposition(positions[k].longitude, positions[l].longitude, GRANDCROSS_ORB)) continue;
                    // Both pairs must be square to the other pair
                    if (isSquare(positions[i].longitude, positions[k].longitude, GRANDCROSS_ORB) &&
                        isSquare(positions[i].longitude, positions[l].longitude, GRANDCROSS_ORB) &&
                        isSquare(positions[j].longitude, positions[k].longitude, GRANDCROSS_ORB) &&
                        isSquare(positions[j].longitude, positions[l].longitude, GRANDCROSS_ORB)) {
                        const group = [positions[i], positions[j], positions[k], positions[l]];
                        const key = group.map(p => p.name).sort().join("|");
                        if (!seen.has(key)) { seen.add(key); results.push(group); }
                    }
                }
            }
        }
    }
    return results;
}

// ── Grand trine ────────────────────────────────────────────────────────────

function findGrandTrines(positions: ComputedPosition[]): Array<ComputedPosition[]> {
    const results: Array<ComputedPosition[]> = [];
    const seen = new Set<string>();
    for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
            if (!isTrine(positions[i].longitude, positions[j].longitude, TRINE_ORB)) continue;
            for (let k = j + 1; k < positions.length; k++) {
                if (isTrine(positions[j].longitude, positions[k].longitude, TRINE_ORB) &&
                    isTrine(positions[i].longitude, positions[k].longitude, TRINE_ORB)) {
                    const group = [positions[i], positions[j], positions[k]];
                    const key = group.map(p => p.name).sort().join("|");
                    if (!seen.has(key)) { seen.add(key); results.push(group); }
                }
            }
        }
    }
    return results;
}

// ── Yod ────────────────────────────────────────────────────────────────────

function findYods(positions: ComputedPosition[]): Array<ComputedPosition[]> {
    const results: Array<ComputedPosition[]> = [];
    const seen = new Set<string>();
    for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
            if (!isSextile(positions[i].longitude, positions[j].longitude, YOD_ORB)) continue;
            for (let k = 0; k < positions.length; k++) {
                if (k === i || k === j) continue;
                if (isQuincunx(positions[k].longitude, positions[i].longitude, YOD_ORB) &&
                    isQuincunx(positions[k].longitude, positions[j].longitude, YOD_ORB)) {
                    const group = [positions[i], positions[j], positions[k]];
                    const key = group.map(p => p.name).sort().join("|");
                    if (!seen.has(key)) { seen.add(key); results.push(group); }
                }
            }
        }
    }
    return results;
}

// ── Scoring ────────────────────────────────────────────────────────────────

export function scoreConfigurations(params: {
    positions: ComputedPosition[];
    destLon: number;
}): ConfigurationsResult {
    const { positions, destLon } = params;
    const contribs: ConfigurationContribution[] = [];
    let raw = 0;

    // Stelliums — regional boost if cluster mean ≈ destLon
    const destGeoMC = ((destLon % 360) + 360) % 360;
    for (const s of findStelliums(positions)) {
        const names = s.planets.map(p => p.name);
        const maleficCount = names.filter(n => STRONG_MALEFICS.includes(n.toLowerCase())).length;
        const natureScore = planetNatureSeverity(names);

        // Base: more planets + more malefic = more severe
        let base = -8 * maleficCount + natureScore;
        if (s.planets.length >= 4) base *= 1.3;

        const regional = angularDiff(destGeoMC, s.meanLon) <= STELLIUM_REGIONAL_ORB;
        if (regional) base *= 1.6;

        const severity = Math.round(base);
        if (severity === 0) continue;

        raw += severity;
        contribs.push({
            type: "stellium",
            planets: names,
            severity,
            direction: severity < 0 ? "malefic" : severity > 0 ? "benefic" : "neutral",
            regional,
            stelliumLon: Math.round(s.meanLon * 100) / 100,
            note: regional
                ? `regional (mean ${s.meanLon.toFixed(1)}° ≈ dest geoMC ${destGeoMC.toFixed(1)}°)`
                : undefined,
        });
    }

    // T-squares
    for (const tsq of findTSquares(positions)) {
        const names = tsq.map(p => p.name);
        const maleficCount = names.filter(n => STRONG_MALEFICS.includes(n.toLowerCase())).length;
        let base = -10 - 6 * maleficCount;
        const severity = Math.round(base);
        raw += severity;
        contribs.push({
            type: "t-square",
            planets: names, severity,
            direction: "malefic",
        });
    }

    // Grand crosses (strongest tension)
    for (const gc of findGrandCrosses(positions)) {
        const names = gc.map(p => p.name);
        const maleficCount = names.filter(n => STRONG_MALEFICS.includes(n.toLowerCase())).length;
        let base = -18 - 4 * maleficCount;
        const severity = Math.round(base);
        raw += severity;
        contribs.push({
            type: "grand-cross",
            planets: names, severity,
            direction: "malefic",
        });
    }

    // Grand trines (benefic stabilizer)
    for (const gt of findGrandTrines(positions)) {
        const names = gt.map(p => p.name);
        const beneficCount = names.filter(n => getPlanetNature(n) === "benefic" || getPlanetNature(n) === "luminary").length;
        let base = 8 + 3 * beneficCount;
        const severity = Math.round(base);
        raw += severity;
        contribs.push({
            type: "grand-trine",
            planets: names, severity,
            direction: "benefic",
        });
    }

    // Yods (focal tension)
    for (const y of findYods(positions)) {
        const names = y.map(p => p.name);
        let base = -8;
        const severity = Math.round(base);
        raw += severity;
        contribs.push({
            type: "yod",
            planets: names, severity,
            direction: "malefic",
        });
    }

    contribs.sort((a, b) => Math.abs(b.severity) - Math.abs(a.severity));
    return { raw, contributions: contribs };
}
