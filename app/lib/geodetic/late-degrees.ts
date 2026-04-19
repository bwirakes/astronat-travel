/**
 * Layer 7 — Late Degrees (Anaretic / Terminal Intensification).
 *
 * The 29th degree of any sign carries the compressed energy of everything
 * the sign has produced. Paired with sign element to predict event type
 * and compounded when conjunct a named fixed star. GLOBAL layer.
 */
import type { ComputedPosition } from "@/lib/astro/transits";
import { signFromLongitude } from "@/app/lib/geodetic";
import { findNearestStar, type FixedStar } from "./fixed-stars";

const ANARETIC_FROM = 28.0;
const APPROACH_FROM = 26.0;

const ANARETIC_BASE: Record<string, number> = {
    mars:    -14,
    saturn:  -14,
    uranus:  -16,
    pluto:   -16,
    neptune: -18,
    jupiter:  +5,
    mercury:  -5,
    venus:    +3,
    sun:      -4,
    moon:     -6,
};

const SIGN_ELEMENT: Record<string, "Fire" | "Earth" | "Air" | "Water"> = {
    Aries: "Fire",  Leo: "Fire",    Sagittarius: "Fire",
    Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
    Gemini: "Air",   Libra: "Air",   Aquarius: "Air",
    Cancer: "Water", Scorpio: "Water", Pisces: "Water",
};

const RESONANT_ELEMENT: Record<string, "Fire" | "Earth" | "Air" | "Water"> = {
    mars: "Fire",
    neptune: "Water",
    saturn: "Earth",
    pluto: "Earth",
    uranus: "Air",
    moon: "Water",
};

export interface LateDegreeContribution {
    planet: string;
    sign: string;
    degreeInSign: number;
    element: "Fire" | "Earth" | "Air" | "Water";
    fixedStar?: string;
    fixedStarOrb?: number;
    severity: number;
    direction: "malefic" | "benefic" | "neutral";
    note?: string;
}

export interface LateDegreesResult {
    raw: number;
    contributions: LateDegreeContribution[];
}

export function scoreLateDegrees(params: {
    positions: ComputedPosition[];
}): LateDegreesResult {
    const contribs: LateDegreeContribution[] = [];
    let raw = 0;

    for (const p of params.positions) {
        const plLower = p.name.toLowerCase();
        const degInSign = ((p.longitude % 30) + 30) % 30;
        if (degInSign < APPROACH_FROM) continue;

        const base = ANARETIC_BASE[plLower];
        if (base === undefined) continue;

        const sign = signFromLongitude(p.longitude);
        const element = SIGN_ELEMENT[sign] ?? "Fire";

        const inAnaretic = degInSign >= ANARETIC_FROM;
        let severity = inAnaretic ? base : Math.round(base * 0.4);

        if (base < 0 && RESONANT_ELEMENT[plLower] === element) {
            severity = Math.round(severity * 1.4);
        }

        const hit = findNearestStar(p.longitude, 1.5);
        let starName: string | undefined;
        let starOrb: number | undefined;
        let note: string | undefined;
        if (hit) {
            starName = hit.star.name;
            starOrb = Math.round(hit.orb * 100) / 100;
            const match = elementMatch(hit.star, plLower, element);
            if (hit.star.nature === "malefic" && base < 0) {
                severity += -10 * match;
                note = `compounded by ${hit.star.name} (${hit.star.flavor})`;
            } else if (hit.star.nature === "benefic" && base > 0) {
                severity += +6 * match;
                note = `supported by ${hit.star.name}`;
            } else if (hit.star.nature === "malefic" && base > 0) {
                severity += -4 * match;
                note = `tension with ${hit.star.name}`;
            }
        }

        const rounded = Math.round(severity);
        if (rounded === 0) continue;

        raw += rounded;
        contribs.push({
            planet: p.name,
            sign,
            degreeInSign: Math.round(degInSign * 100) / 100,
            element,
            fixedStar: starName,
            fixedStarOrb: starOrb,
            severity: rounded,
            direction: rounded < 0 ? "malefic" : rounded > 0 ? "benefic" : "neutral",
            note,
        });
    }

    contribs.sort((a, b) => Math.abs(b.severity) - Math.abs(a.severity));
    return { raw, contributions: contribs };
}

function elementMatch(
    star: FixedStar,
    planetLower: string,
    element: "Fire" | "Earth" | "Air" | "Water",
): number {
    const resonantByFlavor: Record<FixedStar["flavor"], Array<"Fire"|"Earth"|"Air"|"Water">> = {
        violence:   ["Fire", "Earth"],
        flood:      ["Water"],
        fire:       ["Fire"],
        volatility: ["Fire", "Air"],
        water:      ["Water"],
        royal:      [],
        fortune:    [],
        heat:       ["Fire"],
        wind:       ["Air"],
    };
    if (resonantByFlavor[star.flavor].includes(element)) return 1.4;

    if (star.name === "Scheat" && planetLower === "neptune") return 1.4;
    if (star.name === "Antares" && planetLower === "mars") return 1.4;
    if (star.name === "Algol"  && ["mars", "saturn", "pluto"].includes(planetLower)) return 1.3;
    if (star.name === "Aldebaran" && planetLower === "mars") return 1.3;
    return 1.0;
}
