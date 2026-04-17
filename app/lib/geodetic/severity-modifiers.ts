/**
 * Layer 9 — Severity Tier Modifiers.
 *
 * Modifies the FINAL TIER after blending: +1 tier = one severity step
 * worse. Capped at +2.
 *
 * Conditions:
 *   1. Any OOB malefic within 3° of a fixed geodetic angle
 *   2. OOB Mars + OOB Moon simultaneously (Spain DANA amplifier)
 */
import type { ComputedPosition } from "@/lib/astro/transits";
import { STRONG_MALEFICS } from "@/app/lib/astro-constants";
import { computeDeclination, isOutOfBounds } from "@/lib/astro/declination";
import type { AngleName } from "./angle-transits";

const ANGLE_ORB = 3;
const MAX_TIER_SHIFT = 2;

export interface OOBPlanet {
    name: string;
    declination: number;
    longitude: number;
}

export interface SeverityModifier {
    label: string;
    planets: string[];
    tierShift: number;
    direction: "malefic" | "benefic" | "neutral";
    note?: string;
}

export interface SeverityModifiersResult {
    tierShift: number;
    modifiers: SeverityModifier[];
    oobPlanets: OOBPlanet[];
}

function angularDiff(a: number, b: number): number {
    let d = Math.abs(a - b) % 360;
    if (d > 180) d = 360 - d;
    return d;
}
function lower(s: string): string { return s.toLowerCase(); }

export function scoreSeverityModifiers(params: {
    positions: ComputedPosition[];
    geoMC: number;
    geoASC: number;
}): SeverityModifiersResult {
    const { positions, geoMC, geoASC } = params;
    const geoIC  = (geoMC  + 180) % 360;
    const geoDSC = (geoASC + 180) % 360;
    const angles: Array<{ name: AngleName; lon: number }> = [
        { name: "ASC", lon: geoASC }, { name: "MC", lon: geoMC },
        { name: "DSC", lon: geoDSC }, { name: "IC", lon: geoIC },
    ];

    const modifiers: SeverityModifier[] = [];
    const oobPlanets: OOBPlanet[] = [];

    for (const p of positions) {
        const lat = p.latitude ?? 0;
        const decl = computeDeclination(p.longitude, lat);
        if (isOutOfBounds(decl)) {
            oobPlanets.push({
                name: p.name,
                declination: Math.round(decl * 100) / 100,
                longitude: p.longitude,
            });
        }
    }

    if (oobPlanets.length === 0) {
        return { tierShift: 0, modifiers, oobPlanets };
    }

    let tierShift = 0;

    const oobMaleficsOnAngle: Array<{ planet: string; angle: AngleName; orb: number }> = [];
    for (const oob of oobPlanets) {
        if (!STRONG_MALEFICS.includes(lower(oob.name))) continue;
        let closestAngle: AngleName = "MC";
        let closestOrb = 999;
        for (const a of angles) {
            const d = angularDiff(oob.longitude, a.lon);
            if (d < closestOrb) { closestOrb = d; closestAngle = a.name; }
        }
        if (closestOrb <= ANGLE_ORB) {
            oobMaleficsOnAngle.push({
                planet: oob.name, angle: closestAngle,
                orb: Math.round(closestOrb * 100) / 100,
            });
        }
    }
    if (oobMaleficsOnAngle.length > 0) {
        tierShift += 1;
        modifiers.push({
            label: `OOB malefic on fixed angle (${oobMaleficsOnAngle.map(x => `${x.planet}@${x.angle}`).join(", ")})`,
            planets: oobMaleficsOnAngle.map(x => x.planet),
            tierShift: 1,
            direction: "malefic",
            note: "Malefic operating beyond Sun's declination on a core axis",
        });
    }

    const oobMars = oobPlanets.find(o => lower(o.name) === "mars");
    const oobMoon = oobPlanets.find(o => lower(o.name) === "moon");
    if (oobMars && oobMoon) {
        tierShift += 1;
        modifiers.push({
            label: "OOB Mars + OOB Moon combo",
            planets: ["Mars", "Moon"],
            tierShift: 1,
            direction: "malefic",
            note: "Research-cited amplifier (Spain DANA pattern)",
        });
    }

    return {
        tierShift: Math.min(tierShift, MAX_TIER_SHIFT),
        modifiers,
        oobPlanets,
    };
}
