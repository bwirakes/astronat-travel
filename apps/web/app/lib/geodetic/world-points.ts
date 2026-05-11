/**
 * Layer 4 — World Points (0° Cardinal Sign Activation).
 *
 * When an outer (or outer-adjacent) planet reaches 0° of a cardinal sign,
 * its influence broadcasts to every geodetic MC/ASC on Earth simultaneously
 * rather than localizing to one longitude. Example: Uranus 0° Aries 2011
 * produced Tōhoku tsunami + Arab Spring in different regions within weeks.
 *
 * This layer contributes a GLOBAL raw severity (location-independent).
 */
import type { ComputedPosition } from "@/lib/astro/transits";

const ORB_MAX = 2.0;
const ORB_SIGMA_SQ_2 = 2.0;

const WORLD_POINT_PLANETS = new Set<string>([
    "uranus", "neptune", "pluto", "saturn", "jupiter", "mars",
]);

const WORLD_POINT_BASE: Record<string, number> = {
    uranus: -22, pluto: -20, neptune: -16, saturn: -14,
    mars: -12, jupiter: +8,
};

const CARDINALS = [
    { lon:   0, name: "0° Aries"     },
    { lon:  90, name: "0° Cancer"    },
    { lon: 180, name: "0° Libra"     },
    { lon: 270, name: "0° Capricorn" },
];

function angularDiff(a: number, b: number): number {
    let d = Math.abs(a - b) % 360;
    if (d > 180) d = 360 - d;
    return d;
}

export interface WorldPointContribution {
    planet: string;
    cardinal: string;
    orb: number;
    severity: number;
    direction: "malefic" | "benefic";
}

export interface WorldPointsResult {
    raw: number;
    contributions: WorldPointContribution[];
}

export function scoreWorldPoints(params: {
    positions: ComputedPosition[];
}): WorldPointsResult {
    const contribs: WorldPointContribution[] = [];
    let raw = 0;

    for (const p of params.positions) {
        const plLower = p.name.toLowerCase();
        if (!WORLD_POINT_PLANETS.has(plLower)) continue;
        const base = WORLD_POINT_BASE[plLower];
        if (base === undefined) continue;

        let bestOrb = 999;
        let bestName = "";
        for (const c of CARDINALS) {
            const d = angularDiff(p.longitude, c.lon);
            if (d < bestOrb) { bestOrb = d; bestName = c.name; }
        }
        if (bestOrb > ORB_MAX) continue;

        const decay = Math.exp(-(bestOrb * bestOrb) / ORB_SIGMA_SQ_2);
        const severity = Math.round(base * decay);
        if (severity === 0) continue;

        raw += severity;
        contribs.push({
            planet: p.name,
            cardinal: bestName,
            orb: Math.round(bestOrb * 100) / 100,
            severity,
            direction: base < 0 ? "malefic" : "benefic",
        });
    }

    contribs.sort((a, b) => Math.abs(b.severity) - Math.abs(a.severity));
    return { raw, contributions: contribs };
}
