/**
 * Geodetic astrology helpers — MC/ASC zone calculation and
 * relocated Ascendant computation.
 */
import { ZODIAC_SIGNS, OBLIQUITY_RAD } from "./astro-constants";

/** Geodetic MC sign for a given geographic longitude. */
export function geodeticMCSign(lon: number): string {
    const normalized = ((lon % 360) + 360) % 360;
    return ZODIAC_SIGNS[Math.floor(normalized / 30) % 12];
}

/** Geodetic ASC sign for a given longitude + latitude. */
export function geodeticASCSign(lon: number, lat: number): string {
    const φ = lat * (Math.PI / 180);
    const tanVal = Math.tan(φ) * Math.tan(OBLIQUITY_RAD);
    const dOA = Math.abs(tanVal) <= 1 ? Math.asin(tanVal) * (180 / Math.PI) : 0;
    const mcLonDeg = ((lon % 360) + 360) % 360;
    const ascLon = ((mcLonDeg - 90 + dOA + 360) % 360);
    return ZODIAC_SIGNS[Math.floor(ascLon / 30) % 12];
}

/** Raw relocated ASC longitude (degrees) for a lat/lon pair. */
export function computeRelocatedAscLon(lat: number, lon: number): number {
    const φ = (lat || 0) * (Math.PI / 180);
    const tanVal = Math.tan(φ) * Math.tan(OBLIQUITY_RAD);
    const dOA = Math.abs(tanVal) <= 1 ? Math.asin(tanVal) * (180 / Math.PI) : 0;
    const mcLonDeg = (((lon || 0) % 360) + 360) % 360;
    return ((mcLonDeg - 90 + dOA + 360) % 360);
}

/** Sign name from a raw ecliptic longitude. */
export function signFromLongitude(lon: number): string {
    return ZODIAC_SIGNS[Math.floor(((lon % 360) + 360) % 360 / 30) % 12];
}

/** Whole-sign house number (1-12) for a planet longitude given an ASC longitude. */
export function houseFromLongitude(planetLon: number, ascLon: number): number {
    let offset = planetLon - ascLon;
    if (offset < 0) offset += 360;
    return Math.floor(offset / 30) + 1;
}

/** Geodetic MC ecliptic longitude (degrees) for a geographic longitude.
 *  Formula: MC_geo = longitude_east mod 360 */
export function geodeticMCLongitude(lon: number): number {
    return ((lon % 360) + 360) % 360;
}

/** Geodetic ASC ecliptic longitude (degrees) for a lat/lon pair. */
export function geodeticASCLongitude(lon: number, lat: number): number {
    const φ = lat * (Math.PI / 180);
    const tanVal = Math.tan(φ) * Math.tan(OBLIQUITY_RAD);
    const dOA = Math.abs(tanVal) <= 1 ? Math.asin(tanVal) * (180 / Math.PI) : 0;
    const mcLonDeg = ((lon % 360) + 360) % 360;
    return ((mcLonDeg - 90 + dOA + 360) % 360);
}

