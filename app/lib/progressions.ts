/**
 * A5 — Secondary progressions for the geodetic engine.
 *
 * Geodetic 101 PDF p.5: "Progressed Sun changing signs shifts which
 * longitude band feels most aligned with your identity. Progressed Moon
 * cycles all signs over ~28 years, meaning your emotional 'home zone' on
 * the globe shifts roughly every 2.5 years."
 *
 * Day-for-a-year: 1 day after birth = 1 year of life. So the progressed
 * positions at refDate are the actual planet positions at
 * birthDate + (refDate − birthDate) / 365.25 days. We reuse Swiss
 * Ephemeris via `computeRealtimePositions` for accuracy.
 *
 * Output: progressed Sun + Moon longitudes, plus the geodetic longitude
 * BAND each one corresponds to ([signLow, signHigh] = [signIdx*30,
 * signIdx*30+30]). The band tells the UI "your emotional home zone on
 * the globe is currently this 30° slice."
 */
import { computeRealtimePositions } from "@/lib/astro/transits";
import { signFromLongitude } from "./geodetic";

const DAY_MS = 86_400_000;
const TROPICAL_YEAR_DAYS = 365.2422;

export interface ProgressedBand {
    planet: "Sun" | "Moon";
    /** Progressed ecliptic longitude in degrees. */
    longitude: number;
    /** Sign currently occupied (e.g. "Cancer"). */
    sign: string;
    /** Geodetic longitude band corresponding to that sign. */
    longitudeRangeDeg: { fromLon: number; toLon: number };
    /** Human-friendly label e.g. "90°E–120°E". */
    longitudeRange: string;
    /** True iff the destination longitude falls inside this band. */
    destinationInBand: boolean;
}

export interface ProgressionsResult {
    /** Progressed-instant timestamp used for the SwissEph call. */
    progressedDateUtc: string;
    /** Years elapsed (used by the day-for-a-year mapping). */
    yearsElapsed: number;
    bands: ProgressedBand[];
    /** Soft +5 / 0 modifier for bucketGeodetic — fires only when the
     *  destination longitude lies in the progressed-Sun band. */
    aggregate: number;
}

function bandForSignIndex(signIdx: number): { fromLon: number; toLon: number; label: string } {
    const fromLon = signIdx * 30;
    const toLon = fromLon + 30;
    const label = `${fmtLonLabel(fromLon)}–${fmtLonLabel(toLon)}`;
    return { fromLon, toLon, label };
}

function fmtLonLabel(deg: number): string {
    // Geodetic Johndro: 0° Aries = 0°E (Greenwich); each sign = 30° east.
    // Express as 0°–180° E or 180°–0° W for readability.
    const d = ((deg % 360) + 360) % 360;
    if (d <= 180) return `${Math.round(d)}°E`;
    return `${Math.round(360 - d)}°W`;
}

function destinationInBand(destLon: number, fromLon: number, toLon: number): boolean {
    const d = ((destLon % 360) + 360) % 360;
    return d >= fromLon && d < toLon;
}

export async function computeProgressedBands(params: {
    birthDateUtc: Date;
    refDate: Date;
    destLon: number;
}): Promise<ProgressionsResult> {
    const { birthDateUtc, refDate, destLon } = params;

    const yearsElapsed = (refDate.getTime() - birthDateUtc.getTime()) / DAY_MS / TROPICAL_YEAR_DAYS;
    const progressedMs = birthDateUtc.getTime() + yearsElapsed * DAY_MS;
    const progressedDate = new Date(progressedMs);

    const positions = await computeRealtimePositions(progressedDate);
    const out: ProgressedBand[] = [];

    for (const planetName of ["Sun", "Moon"] as const) {
        const p = positions.find((x) => x.name.toLowerCase() === planetName.toLowerCase());
        if (!p) continue;
        const signIdx = Math.floor((((p.longitude % 360) + 360) % 360) / 30) % 12;
        const band = bandForSignIndex(signIdx);
        const inBand = destinationInBand(destLon, band.fromLon, band.toLon);
        out.push({
            planet: planetName,
            longitude: p.longitude,
            sign: signFromLongitude(p.longitude),
            longitudeRangeDeg: { fromLon: band.fromLon, toLon: band.toLon },
            longitudeRange: band.label,
            destinationInBand: inBand,
        });
    }

    // Aggregate: progressed-Sun band match = strongest signal (identity
    // alignment), progressed-Moon match = mild emotional resonance.
    let aggregate = 0;
    const sunBand = out.find((b) => b.planet === "Sun");
    const moonBand = out.find((b) => b.planet === "Moon");
    if (sunBand?.destinationInBand) aggregate += 5;
    if (moonBand?.destinationInBand) aggregate += 2;

    return {
        progressedDateUtc: progressedDate.toISOString(),
        yearsElapsed: Math.round(yearsElapsed * 100) / 100,
        bands: out,
        aggregate,
    };
}
