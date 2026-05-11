/**
 * A2 — Natal World Points (8th-harmonic / world axis).
 *
 * Geodetic 101 PDF p.2: eight sensitive degrees act as "world angles."
 * NATAL planets within orb of these degrees indicate the chart's points
 * of public visibility / "action in the world."
 *
 *   Cardinal (0°):  0° Aries, 0° Cancer, 0° Libra, 0° Capricorn
 *                   (ecliptic 0, 90, 180, 270)
 *   Fixed   (15°):  15° Taurus, 15° Leo, 15° Scorpio, 15° Aquarius
 *                   (ecliptic 45, 135, 225, 315)
 *
 * NOTE: distinct from the existing `geodetic/world-points.ts` which
 * scores TRANSITING outer planets at 0° cardinal for mundane events.
 * This file is the personal/natal layer.
 *
 * Output: an aggregate score + a list of contributing hits. The aggregate
 * is meant to bias the angular-house bucket (H1/H10) inside
 * computeHouseMatrix, capped to keep the 30% bucketNatal budget intact.
 */
import { getPlanetNature } from "@/app/lib/astro-constants";

export const TIGHT_ORB = 2;
export const WIDE_ORB = 5;
const SIGMA_SQ_2 = 8; // matches a soft Gaussian within ±5°

interface WorldPointDef { lon: number; name: string; modality: "cardinal" | "fixed"; }

export const NATAL_WORLD_POINTS: WorldPointDef[] = [
    { lon:   0, name: "0° Aries",      modality: "cardinal" },
    { lon:  90, name: "0° Cancer",     modality: "cardinal" },
    { lon: 180, name: "0° Libra",      modality: "cardinal" },
    { lon: 270, name: "0° Capricorn",  modality: "cardinal" },
    { lon:  45, name: "15° Taurus",    modality: "fixed" },
    { lon: 135, name: "15° Leo",       modality: "fixed" },
    { lon: 225, name: "15° Scorpio",   modality: "fixed" },
    { lon: 315, name: "15° Aquarius",  modality: "fixed" },
];

const BASE_BY_NATURE: Record<"luminary" | "benefic" | "malefic" | "neutral", number> = {
    luminary: 12,   // Sun/Moon at a world point = signature visibility
    benefic:   8,   // Venus/Jupiter — ease in public expression
    malefic:  -6,   // Saturn/Mars/etc. — public friction
    neutral:   3,
};

export interface NatalWorldPointHit {
    planet: string;
    point: string;             // "0° Aries" etc.
    pointLon: number;
    orb: number;               // degrees from the point (0–WIDE_ORB)
    severity: number;          // signed contribution after orb decay
    direction: "luminary" | "benefic" | "malefic" | "neutral";
}

export interface NatalWorldPointsResult {
    /** Sum of severities, capped ±12 so bucketNatal stays within budget. */
    aggregate: number;
    hits: NatalWorldPointHit[];
}

function angularDiff(a: number, b: number): number {
    let d = Math.abs(a - b) % 360;
    if (d > 180) d = 360 - d;
    return d;
}

export function scoreNatalWorldPoints(
    natalPlanets: Array<{ planet?: string; name?: string; longitude: number }>,
): NatalWorldPointsResult {
    const hits: NatalWorldPointHit[] = [];
    let aggregate = 0;

    for (const p of natalPlanets) {
        const planetName = (p.planet ?? p.name ?? "").trim();
        if (!planetName) continue;
        const direction = getPlanetNature(planetName);
        const base = BASE_BY_NATURE[direction];

        let bestOrb = 999;
        let bestPoint: WorldPointDef | null = null;
        for (const wp of NATAL_WORLD_POINTS) {
            const d = angularDiff(p.longitude, wp.lon);
            if (d < bestOrb) { bestOrb = d; bestPoint = wp; }
        }
        if (!bestPoint || bestOrb > WIDE_ORB) continue;

        const decay = Math.exp(-(bestOrb * bestOrb) / SIGMA_SQ_2);
        const severity = Math.round(base * decay);
        if (severity === 0) continue;

        aggregate += severity;
        hits.push({
            planet: planetName,
            point: bestPoint.name,
            pointLon: bestPoint.lon,
            orb: Math.round(bestOrb * 100) / 100,
            severity,
            direction,
        });
    }

    hits.sort((a, b) => Math.abs(b.severity) - Math.abs(a.severity));
    aggregate = Math.max(-12, Math.min(12, aggregate));
    return { aggregate, hits };
}
