/**
 * A4 — Personal eclipse-on-geodetic-zone.
 *
 * Geodetic 101 PDF p.4: "Hold off when Saturn, Mars, or an eclipse is
 * activating that zone, especially if it hits a difficult planet in your
 * natal chart."
 *
 * Two checks per eclipse in window (±180d default):
 *   1. Geodetic activation — eclipse degree within ±5° of the destination's
 *      geo-MC or geo-ASC (the longitude band is "lit up").
 *   2. Personal contact   — eclipse degree within ±3° of one of the user's
 *      natal planets.
 *
 * Negative contribution into bucketTransit fires only when BOTH conditions
 * hold (the PDF's "especially if it hits a difficult planet" rule).
 *
 * NOTE: distinct from the existing `geodetic/eclipse-scoring.ts` which
 * scores TRANSITS over eclipse degrees for mundane weather events. This
 * file is the personal/relocation layer.
 */
import { eclipsesInWindow, type EclipseEvent } from "./geodetic-events";
import { geodeticMCLongitude, geodeticASCLongitude } from "@/app/lib/geodetic";
import { getPlanetNature } from "@/app/lib/astro-constants";

const ZONE_ORB = 5;        // ±° from geo-angle to count as "zone activated"
const NATAL_ORB = 3;       // ±° from natal planet to count as "personal contact"
const SOLAR_BASE = -10;    // base severity when both conditions hit (solar)
const LUNAR_BASE = -6;     // base severity when both conditions hit (lunar)
const SIGMA_SQ_2 = 12.5;   // shared with transit Gaussian σ=2.5

export interface PersonalEclipseHit {
    kind: "solar" | "lunar";
    dateUtc: string;
    degree: number;            // ecliptic longitude of the eclipse point
    sign: string;
    /** Days from the reference date — negative = past, positive = future. */
    daysFromTarget: number;
    /** Which destination angle is in the activated zone. */
    activatedAngle: "geoMC" | "geoIC" | "geoASC" | "geoDSC";
    /** Orb from the activated angle (degrees). */
    angleOrb: number;
    /** Natal contact name, when within NATAL_ORB. Always present when this
     *  hit is in the result — entries lacking a personal contact are dropped
     *  upstream so consumers don't need to check. */
    natalContact: string;
    /** Orb from the natal planet (degrees). */
    natalOrb: number;
    /** Direction of the contacted natal planet (informs UI tone). */
    direction: "luminary" | "benefic" | "malefic" | "neutral";
    /** Signed contribution. Always negative — eclipses are caution flags
     *  in this engine. Decays with both orbs. */
    severity: number;
}

export interface PersonalEclipsesResult {
    /** Sum of severities across all hits, capped to keep bucketTransit
     *  inside its 30% budget. */
    aggregate: number;
    hits: PersonalEclipseHit[];
}

function angularDiff(a: number, b: number): number {
    let d = Math.abs(a - b) % 360;
    if (d > 180) d = 360 - d;
    return d;
}

export function scorePersonalEclipses(params: {
    refDate: Date;
    destLat: number;
    destLon: number;
    natalPlanets: Array<{ planet?: string; name?: string; longitude: number }>;
    /** Window before+after refDate. Default 180 days each side, matching
     *  how long an eclipse degree stays meaningfully active. */
    windowDays?: number;
    eclipses?: EclipseEvent[];
}): PersonalEclipsesResult {
    const { refDate, destLat, destLon, natalPlanets, windowDays = 180, eclipses } = params;

    const geoMC = geodeticMCLongitude(destLon);
    const geoIC = (geoMC + 180) % 360;
    const geoASC = geodeticASCLongitude(destLon, destLat);
    const geoDSC = (geoASC + 180) % 360;
    const angles: Array<{ name: PersonalEclipseHit["activatedAngle"]; lon: number }> = [
        { name: "geoMC",  lon: geoMC  },
        { name: "geoIC",  lon: geoIC  },
        { name: "geoASC", lon: geoASC },
        { name: "geoDSC", lon: geoDSC },
    ];

    const inWindow = eclipsesInWindow(refDate, windowDays, eclipses);
    const hits: PersonalEclipseHit[] = [];

    for (const e of inWindow) {
        // Pick the closest activated angle (if any).
        let bestAngle: { name: PersonalEclipseHit["activatedAngle"]; orb: number } | null = null;
        for (const a of angles) {
            const orb = angularDiff(e.degree, a.lon);
            if (orb <= ZONE_ORB && (bestAngle === null || orb < bestAngle.orb)) {
                bestAngle = { name: a.name, orb };
            }
        }
        if (!bestAngle) continue;

        // Pick the tightest natal contact (if any).
        let bestNatal: { planet: string; orb: number; direction: PersonalEclipseHit["direction"] } | null = null;
        for (const p of natalPlanets) {
            const planetName = (p.planet ?? p.name ?? "").trim();
            if (!planetName) continue;
            const orb = angularDiff(e.degree, p.longitude);
            if (orb <= NATAL_ORB && (bestNatal === null || orb < bestNatal.orb)) {
                bestNatal = { planet: planetName, orb, direction: getPlanetNature(planetName) };
            }
        }
        if (!bestNatal) continue;

        const base = e.kind === "solar" ? SOLAR_BASE : LUNAR_BASE;
        const angleDecay = Math.exp(-(bestAngle.orb * bestAngle.orb) / SIGMA_SQ_2);
        const natalDecay = Math.exp(-(bestNatal.orb * bestNatal.orb) / SIGMA_SQ_2);
        const severity = Math.round(base * angleDecay * natalDecay);
        if (severity === 0) continue;

        hits.push({
            kind: e.kind,
            dateUtc: e.dateUtc,
            degree: e.degree,
            sign: e.sign,
            daysFromTarget: Math.round(e.daysFromTarget),
            activatedAngle: bestAngle.name,
            angleOrb: Math.round(bestAngle.orb * 100) / 100,
            natalContact: bestNatal.planet,
            natalOrb: Math.round(bestNatal.orb * 100) / 100,
            direction: bestNatal.direction,
            severity,
        });
    }

    hits.sort((a, b) => Math.abs(b.severity) - Math.abs(a.severity));
    const rawAgg = hits.reduce((s, h) => s + h.severity, 0);
    const aggregate = Math.max(-20, Math.min(20, rawAgg));
    return { aggregate, hits };
}
