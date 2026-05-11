/**
 * Layer 6 — Eclipses as Activation Detonators.
 *
 * Solar eclipses seed a geodetic longitude for ~6 months; each subsequent
 * planet transit over the eclipse degree within that window is a secondary
 * trigger. Lunar eclipses operate ~1 month and carry the public/emotional
 * manifestation.
 */
import { eclipsesInWindow, type EclipseEvent } from "./geodetic-events";
import type { AngleName } from "./angle-transits";
import type { ComputedPosition } from "@/lib/astro/transits";

const SOLAR_WINDOW_BEFORE = 14;
const LUNAR_WINDOW_BEFORE = 7;
const SOLAR_WINDOW_AFTER = 180;
const LUNAR_WINDOW_AFTER = 30;

const ORB_MAX = 3.5;
const ORB_SIGMA_SQ_2 = 4.5;

const SOLAR_BASE = -45;
const LUNAR_BASE = -22;

const ASPECT_WEIGHT: Record<"conjunction" | "square" | "opposition", number> = {
    conjunction: 1.0, opposition: 0.8, square: 0.6,
};

const ANGLE_STRENGTH: Record<AngleName, number> = {
    ASC: 1.20, MC: 1.10, DSC: 0.95, IC: 0.90,
};

const SECONDARY_TRIGGER_MULT = 1.35;
const SECONDARY_TRIGGER_ORB = 2.5;

export interface EclipseContribution {
    kind: "solar" | "lunar";
    eclipseDateUtc: string;
    daysFromTarget: number;
    eclipseDegree: number;
    aspectToAngle: "conjunction" | "square" | "opposition";
    closestAngle: AngleName;
    angleOrb: number;
    secondaryTriggerPlanet?: string;
    secondaryTriggerOrb?: number;
    severity: number;
    direction: "malefic";
}

export interface EclipseResult {
    raw: number;
    contributions: EclipseContribution[];
}

function angularDiff(a: number, b: number): number {
    let d = Math.abs(a - b) % 360;
    if (d > 180) d = 360 - d;
    return d;
}

function classifyAspect(diff: number): { aspect: "conjunction" | "square" | "opposition"; orb: number } | null {
    if (diff <= ORB_MAX)                 return { aspect: "conjunction", orb: diff };
    if (Math.abs(diff -  90) <= ORB_MAX) return { aspect: "square",      orb: Math.abs(diff - 90) };
    if (Math.abs(diff - 180) <= ORB_MAX) return { aspect: "opposition",  orb: Math.abs(diff - 180) };
    return null;
}

export function scoreEclipses(params: {
    dateUtc: Date;
    geoMC: number;
    geoASC: number;
    positions?: ComputedPosition[];
    eclipses?: EclipseEvent[];
}): EclipseResult {
    const { dateUtc, geoMC, geoASC, positions } = params;
    const geoIC  = (geoMC  + 180) % 360;
    const geoDSC = (geoASC + 180) % 360;
    const angles: Array<{ name: AngleName; lon: number }> = [
        { name: "ASC", lon: geoASC }, { name: "MC", lon: geoMC },
        { name: "DSC", lon: geoDSC }, { name: "IC", lon: geoIC },
    ];

    const candidates = params.eclipses
        ? params.eclipses.map(e => ({
              ...e,
              daysFromTarget: (new Date(e.dateUtc).getTime() - dateUtc.getTime()) / 86400000,
          }))
        : eclipsesInWindow(dateUtc, Math.max(SOLAR_WINDOW_AFTER, SOLAR_WINDOW_BEFORE));

    const contribs: EclipseContribution[] = [];
    let raw = 0;

    for (const e of candidates) {
        const isSolar = e.kind === "solar";
        const windowBefore = isSolar ? SOLAR_WINDOW_BEFORE : LUNAR_WINDOW_BEFORE;
        const windowAfter  = isSolar ? SOLAR_WINDOW_AFTER  : LUNAR_WINDOW_AFTER;
        const d = e.daysFromTarget;
        if (d > windowBefore || d < -windowAfter) continue;

        const sigmaDays = isSolar ? 60 : 12;
        const timeFactor = Math.exp(-(d * d) / (2 * sigmaDays * sigmaDays));

        let best: { aspect: "conjunction" | "square" | "opposition"; orb: number } | null = null;
        let bestAngle: AngleName = "MC";
        for (const a of angles) {
            const diff = angularDiff(e.degree, a.lon);
            const asp = classifyAspect(diff);
            if (asp && (!best || asp.orb < best.orb)) { best = asp; bestAngle = a.name; }
        }
        if (!best) continue;

        const orbFactor = Math.exp(-(best.orb * best.orb) / ORB_SIGMA_SQ_2);
        const base = isSolar ? SOLAR_BASE : LUNAR_BASE;
        let severity = base * ASPECT_WEIGHT[best.aspect] * ANGLE_STRENGTH[bestAngle]
                      * orbFactor * timeFactor;

        let secondaryPlanet: string | undefined;
        let secondaryOrb: number | undefined;
        if (positions) {
            for (const p of positions) {
                const pd = angularDiff(p.longitude, e.degree);
                if (pd <= SECONDARY_TRIGGER_ORB && (secondaryOrb === undefined || pd < secondaryOrb)) {
                    secondaryPlanet = p.name;
                    secondaryOrb = pd;
                }
            }
            if (secondaryPlanet) severity *= SECONDARY_TRIGGER_MULT;
        }

        const rounded = Math.round(severity);
        if (rounded === 0) continue;

        raw += rounded;
        contribs.push({
            kind: e.kind,
            eclipseDateUtc: e.dateUtc,
            daysFromTarget: Math.round(d * 10) / 10,
            eclipseDegree: e.degree,
            aspectToAngle: best.aspect,
            closestAngle: bestAngle,
            angleOrb: Math.round(best.orb * 100) / 100,
            secondaryTriggerPlanet: secondaryPlanet,
            secondaryTriggerOrb: secondaryOrb === undefined ? undefined : Math.round(secondaryOrb * 100) / 100,
            severity: rounded,
            direction: "malefic",
        });
    }

    contribs.sort((a, b) => Math.abs(b.severity) - Math.abs(a.severity));
    return { raw, contributions: contribs };
}
