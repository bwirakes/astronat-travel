/**
 * Geodetic astrology helpers — MC/ASC zone calculation.
 *
 * Geodetic system (Johndro/Greenwich base):
 *   - 0° Aries at 0° longitude (Greenwich).
 *   - Geodetic MC = geographic longitude east, mod 360.
 *   - Geodetic ASC = the ecliptic longitude of the point rising when the
 *     geographic longitude is treated as the local sidereal time.
 *
 * Uses the canonical spherical-astronomy Ascendant formula (atan2 form)
 * so every quadrant is handled correctly. This is the same formula Swiss
 * Ephemeris uses internally; the previous simplified "dOA" approximation
 * only agreed with this for a narrow band of longitudes and was off by
 * 20° or more elsewhere (confirmed against Johndro's published reference
 * tables: Chicago → Aries 4°, Helsinki → Leo 20°).
 */
import { ZODIAC_SIGNS, OBLIQUITY_RAD } from "./astro-constants";

// ─ Internal: canonical Ascendant from LST (degrees) and latitude (rad) ──
function ascFromLstAndLat(lstDeg: number, latRad: number): number {
    const lstRad = lstDeg * (Math.PI / 180);
    const sinE = Math.sin(OBLIQUITY_RAD);
    const cosE = Math.cos(OBLIQUITY_RAD);
    const y = Math.cos(lstRad);
    const x = -cosE * Math.sin(lstRad) - sinE * Math.tan(latRad);
    let asc = Math.atan2(y, x) * (180 / Math.PI);
    return ((asc % 360) + 360) % 360;
}

/** Geodetic MC sign for a given geographic longitude. */
export function geodeticMCSign(lon: number): string {
    const normalized = ((lon % 360) + 360) % 360;
    return ZODIAC_SIGNS[Math.floor(normalized / 30) % 12];
}

/** Geodetic ASC sign for a given longitude + latitude. */
export function geodeticASCSign(lon: number, lat: number): string {
    const ascLon = geodeticASCLongitude(lon, lat);
    return ZODIAC_SIGNS[Math.floor(ascLon / 30) % 12];
}

/** Geodetic ASC ecliptic longitude (degrees) for a lat/lon pair. */
export function geodeticASCLongitude(lon: number, lat: number): number {
    const lst = ((lon % 360) + 360) % 360;
    return ascFromLstAndLat(lst, lat * (Math.PI / 180));
}

/** Geodetic MC ecliptic longitude (degrees) for a geographic longitude.
 *  Formula: MC_geo = longitude_east mod 360 */
export function geodeticMCLongitude(lon: number): number {
    return ((lon % 360) + 360) % 360;
}

/**
 * @deprecated Name was misleading — this is the GEODETIC ascendant
 * (time-invariant, lat/lon only), not the relocated natal ascendant
 * (which depends on birth time and lives in `lib/astro/relocate.ts`).
 * Kept as an alias of `geodeticASCLongitude` so existing call sites
 * don't break in one commit; migrate them then delete.
 */
export function computeRelocatedAscLon(lat: number, lon: number): number {
    return geodeticASCLongitude(lon || 0, lat || 0);
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

// ─ Geodetic House Wheel ──────────────────────────────────────────────────
// The geodetic frame has its own 12-house wheel anchored on geo-ASC (the
// rising point at the destination's longitude treated as local sidereal
// time). Whole-sign is the v1 default; once we want quadrant-strength
// scoring, bring in the same Placidus helper the relocated chart uses.

/** 12 geodetic house cusps in ecliptic-longitude order (whole-sign).
 *  cusps[i] is the cusp of house (i+1). */
export function geodeticHouseCusps(lat: number, lon: number): number[] {
    const ascLon = geodeticASCLongitude(lon, lat);
    const ascSignStart = Math.floor(ascLon / 30) * 30;
    const cusps: number[] = [];
    for (let i = 0; i < 12; i++) {
        cusps.push((ascSignStart + i * 30) % 360);
    }
    return cusps;
}

/** Geodetic house number (1-12) for a natal planet's ecliptic longitude
 *  at a given destination. Whole-sign convention. */
export function geodeticHouseFromLongitude(
    planetLon: number,
    destLat: number,
    destLon: number,
): number {
    const ascLon = geodeticASCLongitude(destLon, destLat);
    return houseFromLongitude(planetLon, ascLon);
}
