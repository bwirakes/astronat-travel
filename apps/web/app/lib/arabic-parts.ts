/**
 * arabic-parts.ts — Lot of Fortune & Lot of Spirit computation.
 *
 * The Arabic Parts (Lots) are sensitive points derived from the Ascendant,
 * Sun, and Moon positions. They flip based on sect (day/night birth).
 *
 * Day:   Fortune = Asc + Moon - Sun   |  Spirit = Asc + Sun - Moon
 * Night: Fortune = Asc + Sun - Moon   |  Spirit = Asc + Moon - Sun
 */

import { ZODIAC_SIGNS } from "./astro-constants";

/**
 * Determine sect: day or night birth.
 * Day = Sun above horizon (houses 7-12 in whole sign, or Sun lon > ASC lon
 *        measured in zodiacal order through the upper hemisphere).
 * Simplified: if Sun is in upper half of chart (above ASC-DSC axis).
 */
export function determineSect(
    sunLon: number,
    ascLon: number,
): "day" | "night" {
    // Sun is above horizon if its offset from ASC is 180-360° (houses 7-12)
    let offset = sunLon - ascLon;
    if (offset < 0) offset += 360;
    // Houses 7-12 = offset 180° to 360° (upper hemisphere)
    return offset >= 180 ? "day" : "night";
}

/** Normalize longitude to 0–360 range */
function normalize(lon: number): number {
    return ((lon % 360) + 360) % 360;
}

/**
 * Compute the Lot of Fortune.
 * Day:   Asc + Moon - Sun
 * Night: Asc + Sun - Moon
 */
export function computeLotOfFortune(
    ascLon: number,
    sunLon: number,
    moonLon: number,
    sect?: "day" | "night",
): number {
    const s = sect ?? determineSect(sunLon, ascLon);
    if (s === "day") {
        return normalize(ascLon + moonLon - sunLon);
    }
    return normalize(ascLon + sunLon - moonLon);
}

/**
 * Compute the Lot of Spirit.
 * Day:   Asc + Sun - Moon
 * Night: Asc + Moon - Sun
 */
export function computeLotOfSpirit(
    ascLon: number,
    sunLon: number,
    moonLon: number,
    sect?: "day" | "night",
): number {
    const s = sect ?? determineSect(sunLon, ascLon);
    if (s === "day") {
        return normalize(ascLon + sunLon - moonLon);
    }
    return normalize(ascLon + moonLon - sunLon);
}

/** Convert absolute longitude to sign + degree */
export function longitudeToSignDegree(lon: number): { sign: string; degree: number } {
    const norm = normalize(lon);
    const signIdx = Math.floor(norm / 30) % 12;
    return {
        sign: ZODIAC_SIGNS[signIdx],
        degree: Math.round((norm % 30) * 10) / 10,
    };
}
