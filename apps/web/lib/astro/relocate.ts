/**
 * Relocation helper — computes the user's relocated natal chart cusps at
 * a destination by running Swiss Ephemeris at their natal instant with
 * the destination's lat/lon. This is the PDF's "relocated chart" — NOT
 * the geodetic ASC (which is time-invariant).
 *
 * Returns the 12 house cusps in ecliptic longitude degrees. cusps[0] is
 * the Ascendant, cusps[9] is the Midheaven (MC).
 */
import { SwissEphSingleton } from "@/lib/astro/transits";

export async function relocatedCuspsAt(
    natalDtUtc: Date,
    targetLat: number,
    targetLon: number,
): Promise<number[]> {
    const swe = await SwissEphSingleton.getInstance();
    const jd = swe.julday(
        natalDtUtc.getUTCFullYear(),
        natalDtUtc.getUTCMonth() + 1,
        natalDtUtc.getUTCDate(),
        natalDtUtc.getUTCHours()
            + natalDtUtc.getUTCMinutes() / 60.0
            + natalDtUtc.getUTCSeconds() / 3600.0,
    );
    const sys = Math.abs(targetLat) >= 66 ? "W" : "P";
    const h = swe.houses(jd, targetLat, targetLon, sys) as any;
    const cusps: number[] = [];
    for (let i = 1; i <= 12; i++) cusps.push(h.cusps[i.toString()]);
    return cusps;
}

/**
 * Convenience: return just the relocated Ascendant and Midheaven ecliptic
 * longitudes. Both are needed to detect planets on the four angles.
 */
export async function relocatedAngles(
    natalDtUtc: Date,
    targetLat: number,
    targetLon: number,
): Promise<{ ascLon: number; mcLon: number; icLon: number; dscLon: number }> {
    const cusps = await relocatedCuspsAt(natalDtUtc, targetLat, targetLon);
    const ascLon = cusps[0];
    const mcLon = cusps[9];
    return {
        ascLon,
        mcLon,
        icLon: (mcLon + 180) % 360,
        dscLon: (ascLon + 180) % 360,
    };
}
