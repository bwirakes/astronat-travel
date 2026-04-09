/**
 * house-system.ts — Latitude-aware house system selection.
 *
 * Placidus breaks at extreme latitudes (>66°N/S) because the time-based
 * house division produces absurdly unequal houses. Whole Sign is stable
 * everywhere and should be used for high-latitude births.
 *
 * Reference: https://astrobutterfly.com/2025/04/22/placidus-and-whole-sign-houses-how-do-they-work/
 */

/** Latitude threshold: above this, Placidus becomes unreliable */
export const PLACIDUS_LAT_THRESHOLD = 66;

export type HouseSystemType = "placidus" | "whole-sign";

/**
 * Determine which house system to use for a given birth latitude.
 * - |lat| < 66° → Placidus (location-specific, unequal cusps)
 * - |lat| >= 66° → Whole Sign (equal 30° houses, stable everywhere)
 */
export function getHouseSystemForLatitude(birthLat: number): HouseSystemType {
    return Math.abs(birthLat) >= PLACIDUS_LAT_THRESHOLD ? "whole-sign" : "placidus";
}

/**
 * Compute house number (1-12) from a planet longitude using Placidus cusps.
 * Walks through unequal cusp boundaries to find the correct house.
 *
 * @param planetLon - planet ecliptic longitude (0-360)
 * @param cusps     - array of 12 cusp longitudes (0-based: cusps[0] = House 1 cusp)
 */
export function computePlacidusHouse(planetLon: number, cusps: number[]): number {
    if (!cusps || cusps.length < 12) {
        // Fallback to whole-sign if cusps are invalid
        return Math.floor(((planetLon % 360) + 360) % 360 / 30) + 1;
    }

    const lon = ((planetLon % 360) + 360) % 360;

    for (let i = 0; i < 12; i++) {
        const start = ((cusps[i] % 360) + 360) % 360;
        const end = ((cusps[(i + 1) % 12] % 360) + 360) % 360;

        if (start < end) {
            // Normal case: cusp start < cusp end
            if (lon >= start && lon < end) return i + 1;
        } else {
            // Wraps around 360/0 boundary
            if (lon >= start || lon < end) return i + 1;
        }
    }

    // Fallback — shouldn't happen with valid cusps
    return 1;
}

/**
 * Unified house number computation — dispatches to the correct system
 * based on birth latitude.
 *
 * @param planetLon - planet ecliptic longitude (0-360)
 * @param ascLon    - Ascendant longitude (used for whole-sign fallback)
 * @param cusps     - array of 12 Placidus cusp longitudes (can be null for whole-sign)
 * @param birthLat  - latitude of birth location
 */
export function computeHouseNumber(
    planetLon: number,
    ascLon: number,
    cusps: number[] | null,
    birthLat: number,
): number {
    const system = getHouseSystemForLatitude(birthLat);

    if (system === "placidus" && cusps && cusps.length >= 12) {
        return computePlacidusHouse(planetLon, cusps);
    }

    // Whole-sign fallback
    let offset = planetLon - ascLon;
    if (offset < 0) offset += 360;
    return Math.floor(offset / 30) + 1;
}
