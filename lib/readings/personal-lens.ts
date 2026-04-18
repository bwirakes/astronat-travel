/**
 * Personal lens — computes the user-specific view of a geodetic location.
 *
 * Per Geodetic_101.pdf p.3: "chart ruler determines everything." When a
 * user relocates, their rising sign can change — which moves their chart
 * ruler into a different house, which changes the dominant topic of their
 * trip. This module makes that delta first-class data the UI can render
 * without any AI help.
 *
 * Pure computation — no I/O, no AI. Safe to call anywhere.
 */

import {
    computeRelocatedAscLon,
    signFromLongitude,
    houseFromLongitude,
} from "@/app/lib/geodetic";

// ── Types ─────────────────────────────────────────────────────────────────

export interface NatalPlanet {
    name?: string;
    planet?: string;
    longitude: number;
}

export interface PersonalLens {
    /** Relocated Ascendant sign for the destination. */
    relocatedAscSign: string;
    /** Raw relocated Ascendant longitude (degrees). */
    relocatedAscLon: number;
    /** Traditional ruling planet of the relocated Ascendant. */
    chartRulerPlanet: string;
    /** Natal house of the chart ruler (1–12, whole-sign). */
    chartRulerNatalHouse: number;
    /** Relocated house of the chart ruler at destination (1–12, whole-sign). */
    chartRulerRelocatedHouse: number;
    /** Plain-language life-domain for the relocated house. */
    chartRulerRelocatedDomain: string;
    /** Plain-language life-domain for the natal house (for delta comparison). */
    chartRulerNatalDomain: string;
    /**
     * Natal planets that fall within 5° of ANY of the four relocated angles
     * (MC/IC/ASC/DSC). These are the PDF's "most important lines." Sorted
     * by orb ascending (tightest first).
     */
    activeAngleLines: Array<{
        planet: string;
        angle: "ASC" | "DSC" | "MC" | "IC";
        angleLon: number;
        planetLon: number;
        orbDeg: number;
        isChartRuler: boolean;
    }>;
    /**
     * 8th-harmonic world point contacts — natal planets within 2° of a
     * hot zodiac degree (0° cardinal, 15° fixed, 7.5° mutable,
     * 22.5° cardinal). Per PDF p.2: public-visibility signatures.
     */
    worldPointContacts: Array<{
        planet: string;
        planetLon: number;
        pointDeg: number;          // exact world-point degree, 0–360
        pointType: "0° cardinal" | "15° fixed" | "7.5° mutable" | "22.5° cardinal";
        orbDeg: number;
    }>;
}

// ── Traditional rulership table (PDF default) ────────────────────────────

const TRADITIONAL_RULERS: Record<string, string> = {
    Aries: "Mars",
    Taurus: "Venus",
    Gemini: "Mercury",
    Cancer: "Moon",
    Leo: "Sun",
    Virgo: "Mercury",
    Libra: "Venus",
    Scorpio: "Mars",
    Sagittarius: "Jupiter",
    Capricorn: "Saturn",
    Aquarius: "Saturn",
    Pisces: "Jupiter",
};

// ── House → domain (plain English, for chart-ruler line) ──────────────────

const HOUSE_DOMAIN: Record<number, string> = {
    1: "identity, body, self-presentation",
    2: "resources, values, what you earn",
    3: "communication, siblings, short trips",
    4: "home, roots, family, inner ground",
    5: "creativity, romance, play, children",
    6: "work, health, daily rhythm",
    7: "partnerships, contracts, the public",
    8: "shared resources, intimacy, transformation",
    9: "publishing, teaching, foreign ties, belief",
    10: "career, reputation, public standing",
    11: "community, groups, long-term hopes",
    12: "retreat, the unseen, ancestors",
};

// ── World-point degrees (8th harmonic) ───────────────────────────────────

interface WorldPoint {
    deg: number;
    type: PersonalLens["worldPointContacts"][number]["pointType"];
}

/** Absolute zodiac degrees (0–360) of the 8th-harmonic world points. */
function buildWorldPoints(): WorldPoint[] {
    const points: WorldPoint[] = [];
    // 0° cardinals: Aries, Cancer, Libra, Capricorn
    for (const sign of [0, 3, 6, 9]) points.push({ deg: sign * 30, type: "0° cardinal" });
    // 15° fixeds: Taurus, Leo, Scorpio, Aquarius
    for (const sign of [1, 4, 7, 10]) points.push({ deg: sign * 30 + 15, type: "15° fixed" });
    // 7.5° mutables: Gemini, Virgo, Sagittarius, Pisces
    for (const sign of [2, 5, 8, 11]) points.push({ deg: sign * 30 + 7.5, type: "7.5° mutable" });
    // 22.5° cardinals: mid-degree cardinal points
    for (const sign of [0, 3, 6, 9]) points.push({ deg: sign * 30 + 22.5, type: "22.5° cardinal" });
    return points;
}

const WORLD_POINTS = buildWorldPoints();

// ── Orb helper ────────────────────────────────────────────────────────────

function circularOrb(a: number, b: number): number {
    const diff = Math.abs(((a - b) % 360) + 360) % 360;
    return Math.min(diff, 360 - diff);
}

function normalizePlanetName(raw: string): string {
    if (!raw) return "";
    const k = raw.trim();
    return k.charAt(0).toUpperCase() + k.slice(1).toLowerCase();
}

function planetByName(planets: NatalPlanet[], name: string): NatalPlanet | undefined {
    const target = name.toLowerCase();
    return planets.find((p) => (p.name ?? p.planet ?? "").toLowerCase() === target);
}

// ── Main entry ────────────────────────────────────────────────────────────

export interface ComputePersonalLensInput {
    natalPlanets: NatalPlanet[];
    /** Natal Ascendant longitude (required for natal-house math). */
    natalAscLon: number;
    /** Destination city coordinates. */
    destLat: number;
    destLon: number;
}

export function computePersonalLens(
    input: ComputePersonalLensInput,
): PersonalLens | null {
    const { natalPlanets, natalAscLon, destLat, destLon } = input;
    if (!natalPlanets || natalPlanets.length === 0) return null;

    // 1. Relocated ASC
    const relocAscLon = computeRelocatedAscLon(destLat, destLon);
    const relocAscSign = signFromLongitude(relocAscLon);

    // 2. Chart ruler
    const rulerName = TRADITIONAL_RULERS[relocAscSign];
    if (!rulerName) return null;
    const rulerNatal = planetByName(natalPlanets, rulerName);
    if (!rulerNatal) return null;
    const rulerLon = rulerNatal.longitude;

    const natalHouse = houseFromLongitude(rulerLon, natalAscLon);
    const relocatedHouse = houseFromLongitude(rulerLon, relocAscLon);

    // 3. Active angle lines — natal planets within 5° of relocated MC/IC/ASC/DSC
    const relocMcLon = ((destLon % 360) + 360) % 360;
    const relocIcLon = (relocMcLon + 180) % 360;
    const relocDscLon = (relocAscLon + 180) % 360;

    const angles: Array<{ code: "MC" | "IC" | "ASC" | "DSC"; lon: number }> = [
        { code: "MC", lon: relocMcLon },
        { code: "IC", lon: relocIcLon },
        { code: "ASC", lon: relocAscLon },
        { code: "DSC", lon: relocDscLon },
    ];

    const activeAngleLines: PersonalLens["activeAngleLines"] = [];
    for (const planet of natalPlanets) {
        const pName = normalizePlanetName(planet.name ?? planet.planet ?? "");
        if (!pName) continue;
        for (const a of angles) {
            const orb = circularOrb(planet.longitude, a.lon);
            if (orb <= 5) {
                activeAngleLines.push({
                    planet: pName,
                    angle: a.code,
                    angleLon: a.lon,
                    planetLon: planet.longitude,
                    orbDeg: +orb.toFixed(2),
                    isChartRuler: pName === rulerName,
                });
            }
        }
    }
    activeAngleLines.sort((a, b) => a.orbDeg - b.orbDeg);

    // 4. World-point contacts — natal planets within 2° of an 8th-harmonic point
    const worldPointContacts: PersonalLens["worldPointContacts"] = [];
    for (const planet of natalPlanets) {
        const pName = normalizePlanetName(planet.name ?? planet.planet ?? "");
        if (!pName) continue;
        for (const wp of WORLD_POINTS) {
            const orb = circularOrb(planet.longitude, wp.deg);
            if (orb <= 2) {
                worldPointContacts.push({
                    planet: pName,
                    planetLon: planet.longitude,
                    pointDeg: wp.deg,
                    pointType: wp.type,
                    orbDeg: +orb.toFixed(2),
                });
            }
        }
    }
    worldPointContacts.sort((a, b) => a.orbDeg - b.orbDeg);

    return {
        relocatedAscSign: relocAscSign,
        relocatedAscLon: relocAscLon,
        chartRulerPlanet: rulerName,
        chartRulerNatalHouse: natalHouse,
        chartRulerRelocatedHouse: relocatedHouse,
        chartRulerNatalDomain: HOUSE_DOMAIN[natalHouse] ?? "",
        chartRulerRelocatedDomain: HOUSE_DOMAIN[relocatedHouse] ?? "",
        activeAngleLines,
        worldPointContacts,
    };
}

/**
 * Compose the one-sentence "chart-ruler line" the Brief renders.
 * Per PDF p.3: "chart ruler determines everything." This is the single
 * most important line on the reading page.
 *
 * Pure function. No AI. No filler. Deterministic from input.
 */
export function chartRulerLine(lens: PersonalLens, city: string): string {
    const {
        chartRulerPlanet: ruler,
        relocatedAscSign: asc,
        chartRulerNatalHouse: nH,
        chartRulerRelocatedHouse: rH,
        chartRulerRelocatedDomain: rDomain,
    } = lens;

    if (nH === rH) {
        return `In ${city} you are still ${asc} rising; your chart ruler, ${ruler}, stays in your ${ordinal(rH)} — ${rDomain}.`;
    }
    return `In ${city} you become ${asc} rising. Your chart ruler, ${ruler}, moves from your natal ${ordinal(nH)} to your relocated ${ordinal(rH)} — ${rDomain}.`;
}

function ordinal(n: number): string {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export { HOUSE_DOMAIN };
