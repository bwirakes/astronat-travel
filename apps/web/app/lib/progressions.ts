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
 * Output:
 *   - bands: progressed Sun + Moon sign-bands (legacy 30° resolution)
 *     + a `aggregate` modifier that fires when destLon falls in band
 *   - angleHits: per-progressed-planet degree-precise hits to the four
 *     geodetic angles (Sun, Moon, Mercury, Venus, Mars × MC/IC/ASC/DSC,
 *     ±3° orb). This is the framework's "progressed planet on geodetic
 *     angle" signal that the sign-band aggregate washes out.
 */
import { computeRealtimePositions } from "@/lib/astro/transits";
import { signFromLongitude, geodeticMCLongitude, geodeticASCLongitude } from "./geodetic";

const DAY_MS = 86_400_000;
const TROPICAL_YEAR_DAYS = 365.2422;

/** Angle name (matches AngleName from ./geodetic/angle-transits). */
type ProgAngle = "ASC" | "IC" | "DSC" | "MC";

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

/** Per-angle hit: progressed planet within ±3° of a geodetic angle. */
export interface ProgressionAngleHit {
    planet: "Sun" | "Moon" | "Mercury" | "Venus" | "Mars";
    angle: ProgAngle;
    /** Progressed planet's ecliptic longitude. */
    progressedLon: number;
    /** Geodetic angle's ecliptic longitude. */
    angleLon: number;
    /** Orb in degrees (0–3). Tighter = stronger. */
    orb: number;
    /** Severity contribution (signed; mapped to angular house). */
    severity: number;
}

export interface ProgressionsResult {
    /** Progressed-instant timestamp used for the SwissEph call. */
    progressedDateUtc: string;
    /** Years elapsed (used by the day-for-a-year mapping). */
    yearsElapsed: number;
    bands: ProgressedBand[];
    /** Sign-band aggregate (legacy): +5 if destLon in progressed-Sun band,
     *  +2 if Moon band. Applied uniformly across all 12 houses. */
    aggregate: number;
    /** Per-angle degree-precise hits — applied to the angular house the
     *  angle belongs to (ASC→1, IC→4, DSC→7, MC→10). */
    angleHits: ProgressionAngleHit[];
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

function angularDiff(a: number, b: number): number {
    let d = Math.abs(a - b) % 360;
    if (d > 180) d = 360 - d;
    return d;
}

/** Per-planet base for degree-precise progression-on-angle hits.
 *  Mirrors STATION_BASE valences but compressed since progressions are
 *  slow + persistent (1° = ~1 year of activation).
 *
 *  Sun, Moon, Mercury, Venus = positive activations (identity, emotion,
 *  voice, values land at this place). Mars = friction (drive turning
 *  inward toward this longitude band creates tension). */
const PROG_PLANET_BASE: Record<string, number> = {
    sun:     +6,
    moon:    +4,
    mercury: +3,
    venus:   +5,
    mars:    -4,
};

const PROG_ANGLE_STRENGTH: Record<ProgAngle, number> = {
    ASC: 1.20, MC: 1.10, DSC: 0.95, IC: 0.90,
};
const PROG_ORB_MAX = 3;
const PROG_ORB_SIGMA_SQ_2 = 4.5;
const PROG_PLANETS = ["Sun", "Moon", "Mercury", "Venus", "Mars"] as const;

export async function computeProgressedBands(params: {
    birthDateUtc: Date;
    refDate: Date;
    destLon: number;
    /** Optional: latitude lets us also compute degree-precise hits to
     *  geo-ASC. Without it, only MC/IC angle hits are computed. */
    destLat?: number;
}): Promise<ProgressionsResult> {
    const { birthDateUtc, refDate, destLon, destLat } = params;

    const yearsElapsed = (refDate.getTime() - birthDateUtc.getTime()) / DAY_MS / TROPICAL_YEAR_DAYS;
    const progressedMs = birthDateUtc.getTime() + yearsElapsed * DAY_MS;
    const progressedDate = new Date(progressedMs);

    const positions = await computeRealtimePositions(progressedDate);

    // ── Sign-band output (legacy 30° resolution, Sun + Moon only) ────────
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

    // Sign-band aggregate (legacy uniform-across-houses term).
    let aggregate = 0;
    const sunBand = out.find((b) => b.planet === "Sun");
    const moonBand = out.find((b) => b.planet === "Moon");
    if (sunBand?.destinationInBand) aggregate += 5;
    if (moonBand?.destinationInBand) aggregate += 2;

    // ── Per-angle degree-precise hits (the framework's real signal) ─────
    const geoMC  = geodeticMCLongitude(destLon);
    const geoIC  = (geoMC + 180) % 360;
    const angles: Array<{ name: ProgAngle; lon: number }> = [
        { name: "MC", lon: geoMC },
        { name: "IC", lon: geoIC },
    ];
    if (typeof destLat === "number" && Number.isFinite(destLat)) {
        const geoASC = geodeticASCLongitude(destLon, destLat);
        const geoDSC = (geoASC + 180) % 360;
        angles.push({ name: "ASC", lon: geoASC });
        angles.push({ name: "DSC", lon: geoDSC });
    }

    const angleHits: ProgressionAngleHit[] = [];
    for (const planetName of PROG_PLANETS) {
        const p = positions.find((x) => x.name.toLowerCase() === planetName.toLowerCase());
        if (!p) continue;
        const base = PROG_PLANET_BASE[planetName.toLowerCase()];
        if (base === undefined) continue;

        for (const a of angles) {
            const orb = angularDiff(p.longitude, a.lon);
            if (orb > PROG_ORB_MAX) continue;
            const orbFactor = Math.exp(-(orb * orb) / PROG_ORB_SIGMA_SQ_2);
            const angleWt = PROG_ANGLE_STRENGTH[a.name];
            const severity = Math.round(base * orbFactor * angleWt);
            if (severity === 0) continue;
            angleHits.push({
                planet: planetName,
                angle: a.name,
                progressedLon: p.longitude,
                angleLon: a.lon,
                orb: Math.round(orb * 100) / 100,
                severity,
            });
        }
    }
    angleHits.sort((a, b) => Math.abs(b.severity) - Math.abs(a.severity));

    return {
        progressedDateUtc: progressedDate.toISOString(),
        yearsElapsed: Math.round(yearsElapsed * 100) / 100,
        bands: out,
        aggregate,
        angleHits,
    };
}
