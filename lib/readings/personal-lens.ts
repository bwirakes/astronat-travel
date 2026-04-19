/**
 * Personal lens — computes the user-specific view of a geodetic location.
 *
 * Per Geodetic_101.pdf p.3: "chart ruler determines everything." When a
 * user relocates, their rising sign can change — which moves their chart
 * ruler into a different house, which changes the dominant topic of their
 * trip.
 *
 * IMPORTANT: the Ascendant used here is the **relocated natal ASC** —
 * Swiss Ephemeris at the user's natal instant, with the destination's
 * lat/lon. This is NOT the geodetic ASC of the city (which is
 * time-invariant). The two are often confused; the PDF's Brandon example
 * ("Taurus rising in Jakarta, Libra rising in NYC") is strictly about
 * the relocated natal chart.
 */

import {
    signFromLongitude,
    houseFromLongitude,
} from "@/app/lib/geodetic";
import { relocatedAngles } from "@/lib/astro/relocate";

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
    /** Relocated Midheaven longitude (degrees). */
    relocatedMcLon: number;
    /** Traditional ruling planet of the relocated Ascendant. */
    chartRulerPlanet: string;
    /** Natal house of the chart ruler (1–12, whole-sign from natal ASC). */
    chartRulerNatalHouse: number;
    /** Relocated house of the chart ruler at destination (1–12, whole-sign). */
    chartRulerRelocatedHouse: number;
    /** Plain-language life-domain for the relocated house. */
    chartRulerRelocatedDomain: string;
    /** Plain-language life-domain for the natal house (for delta comparison). */
    chartRulerNatalDomain: string;
    /**
     * Natal planets within 5° of a relocated angle (MC/IC/ASC/DSC).
     * Sorted tightest-first. These are the PDF's "most important lines."
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
     * 8th-harmonic world point contacts. Public-visibility signatures.
     */
    worldPointContacts: Array<{
        planet: string;
        planetLon: number;
        pointDeg: number;
        pointType: "0° cardinal" | "15° fixed" | "7.5° mutable" | "22.5° cardinal";
        orbDeg: number;
    }>;
}

// ── Traditional rulership (PDF default) ───────────────────────────────────

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

interface WorldPoint {
    deg: number;
    type: PersonalLens["worldPointContacts"][number]["pointType"];
}

function buildWorldPoints(): WorldPoint[] {
    const points: WorldPoint[] = [];
    for (const sign of [0, 3, 6, 9]) points.push({ deg: sign * 30, type: "0° cardinal" });
    for (const sign of [1, 4, 7, 10]) points.push({ deg: sign * 30 + 15, type: "15° fixed" });
    for (const sign of [2, 5, 8, 11]) points.push({ deg: sign * 30 + 7.5, type: "7.5° mutable" });
    for (const sign of [0, 3, 6, 9]) points.push({ deg: sign * 30 + 22.5, type: "22.5° cardinal" });
    return points;
}

const WORLD_POINTS = buildWorldPoints();

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
    /** Natal Ascendant longitude (for the user's natal-house placement). */
    natalAscLon: number;
    /** User's birth instant in UTC. Required for the relocated ASC compute. */
    natalDtUtc: Date;
    /** Destination city coordinates. */
    destLat: number;
    destLon: number;
}

/**
 * Async because the relocated Ascendant requires a Swiss Ephemeris call.
 * Returns null if inputs are incomplete.
 */
export async function computePersonalLens(
    input: ComputePersonalLensInput,
): Promise<PersonalLens | null> {
    const { natalPlanets, natalAscLon, natalDtUtc, destLat, destLon } = input;
    if (!natalPlanets || natalPlanets.length === 0) return null;
    if (!natalDtUtc || Number.isNaN(natalDtUtc.getTime())) return null;

    // 1. Relocated ASC/MC via Swiss Ephemeris at natal instant + destination lat/lon
    const angles = await relocatedAngles(natalDtUtc, destLat, destLon);
    const relocAscLon = angles.ascLon;
    const relocMcLon = angles.mcLon;
    const relocIcLon = angles.icLon;
    const relocDscLon = angles.dscLon;
    const relocAscSign = signFromLongitude(relocAscLon);

    // 2. Chart ruler
    const rulerName = TRADITIONAL_RULERS[relocAscSign];
    if (!rulerName) return null;
    const rulerNatal = planetByName(natalPlanets, rulerName);
    if (!rulerNatal) return null;
    const rulerLon = rulerNatal.longitude;

    const natalHouse = houseFromLongitude(rulerLon, natalAscLon);
    const relocatedHouse = houseFromLongitude(rulerLon, relocAscLon);

    // 3. Active angle lines — natal planets within 5° of relocated angles.
    const angleList: Array<{ code: "MC" | "IC" | "ASC" | "DSC"; lon: number }> = [
        { code: "MC", lon: relocMcLon },
        { code: "IC", lon: relocIcLon },
        { code: "ASC", lon: relocAscLon },
        { code: "DSC", lon: relocDscLon },
    ];

    const activeAngleLines: PersonalLens["activeAngleLines"] = [];
    for (const planet of natalPlanets) {
        const pName = normalizePlanetName(planet.name ?? planet.planet ?? "");
        if (!pName) continue;
        for (const a of angleList) {
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

    // 4. World-point contacts — natal planets within 2° of an 8th-harmonic point.
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
        relocatedMcLon: relocMcLon,
        chartRulerPlanet: rulerName,
        chartRulerNatalHouse: natalHouse,
        chartRulerRelocatedHouse: relocatedHouse,
        chartRulerNatalDomain: HOUSE_DOMAIN[natalHouse] ?? "",
        chartRulerRelocatedDomain: HOUSE_DOMAIN[relocatedHouse] ?? "",
        activeAngleLines,
        worldPointContacts,
    };
}

export { HOUSE_DOMAIN };
