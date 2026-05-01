/**
 * Personal lunations on geodetic-zone (gap-fill from geodetic audit).
 *
 * Mirrors `personal-eclipses.ts`. Two checks per lunation in window
 * (default ±30 days):
 *
 *   1. Geodetic activation — lunation degree within ±3° of the
 *      destination's geo-MC, geo-IC, geo-ASC, or geo-DSC.
 *   2. Personal contact   — lunation degree within ±3° of one of the
 *      user's natal planets.
 *
 * Contribution to bucketTransit fires only when BOTH conditions hold.
 *   - new-moon  → soft positive (beginnings, fresh-start signature)
 *   - full-moon → soft negative (exposure, completion friction)
 *
 * Magnitudes are deliberately small (±5 cap per hit, ±10 cap on aggregate)
 * so lunations inform narrative copy without dominating the transit bucket
 * the way eclipses do.
 */
import { lunationsInWindow, type LunationEvent } from "./geodetic-events";
import { geodeticMCLongitude, geodeticASCLongitude } from "@/app/lib/geodetic";
import { getPlanetNature } from "@/app/lib/astro-constants";

const ZONE_ORB = 3;
const NATAL_ORB = 3;
const NEW_MOON_BASE = 5;     // positive
const FULL_MOON_BASE = -5;   // negative
const SIGMA_SQ_2 = 12.5;

export interface PersonalLunationHit {
    kind: "new-moon" | "full-moon";
    dateUtc: string;
    degree: number;
    sign: string;
    daysFromTarget: number;
    activatedAngle: "geoMC" | "geoIC" | "geoASC" | "geoDSC";
    angleOrb: number;
    natalContact: string;
    natalOrb: number;
    direction: "luminary" | "benefic" | "malefic" | "neutral";
    severity: number;
}

export interface PersonalLunationsResult {
    /** Sum of severities across all hits, capped ±10. */
    aggregate: number;
    hits: PersonalLunationHit[];
}

function angularDiff(a: number, b: number): number {
    let d = Math.abs(a - b) % 360;
    if (d > 180) d = 360 - d;
    return d;
}

export function scorePersonalLunations(params: {
    refDate: Date;
    destLat: number;
    destLon: number;
    natalPlanets: Array<{ planet?: string; name?: string; longitude: number }>;
    /** Window before+after refDate. Default 30 days each side — ordinary
     *  lunations are tighter signals than eclipses (whose 180-day reach
     *  comes from saros-cycle resonance). */
    windowDays?: number;
    lunations?: LunationEvent[];
}): PersonalLunationsResult {
    const { refDate, destLat, destLon, natalPlanets, windowDays = 30, lunations } = params;

    const geoMC = geodeticMCLongitude(destLon);
    const geoIC = (geoMC + 180) % 360;
    const geoASC = geodeticASCLongitude(destLon, destLat);
    const geoDSC = (geoASC + 180) % 360;
    const angles: Array<{ name: PersonalLunationHit["activatedAngle"]; lon: number }> = [
        { name: "geoMC",  lon: geoMC  },
        { name: "geoIC",  lon: geoIC  },
        { name: "geoASC", lon: geoASC },
        { name: "geoDSC", lon: geoDSC },
    ];

    const inWindow = lunationsInWindow(refDate, windowDays, lunations);
    const hits: PersonalLunationHit[] = [];

    for (const l of inWindow) {
        // Tightest activated angle (if any).
        let bestAngle: { name: PersonalLunationHit["activatedAngle"]; orb: number } | null = null;
        for (const a of angles) {
            const orb = angularDiff(l.degree, a.lon);
            if (orb <= ZONE_ORB && (bestAngle === null || orb < bestAngle.orb)) {
                bestAngle = { name: a.name, orb };
            }
        }
        if (!bestAngle) continue;

        // Tightest natal contact (if any).
        let bestNatal: { planet: string; orb: number; direction: PersonalLunationHit["direction"] } | null = null;
        for (const p of natalPlanets) {
            const planetName = (p.planet ?? p.name ?? "").trim();
            if (!planetName) continue;
            const orb = angularDiff(l.degree, p.longitude);
            if (orb <= NATAL_ORB && (bestNatal === null || orb < bestNatal.orb)) {
                bestNatal = { planet: planetName, orb, direction: getPlanetNature(planetName) };
            }
        }
        if (!bestNatal) continue;

        const base = l.kind === "new-moon" ? NEW_MOON_BASE : FULL_MOON_BASE;
        const angleDecay = Math.exp(-(bestAngle.orb * bestAngle.orb) / SIGMA_SQ_2);
        const natalDecay = Math.exp(-(bestNatal.orb * bestNatal.orb) / SIGMA_SQ_2);
        const severity = Math.round(base * angleDecay * natalDecay);
        if (severity === 0) continue;

        hits.push({
            kind: l.kind,
            dateUtc: l.dateUtc,
            degree: l.degree,
            sign: l.sign,
            daysFromTarget: Math.round(l.daysFromTarget),
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
    const aggregate = Math.max(-10, Math.min(10, rawAgg));
    return { aggregate, hits };
}
