/**
 * Layer 1 — Transits to Fixed Geodetic Angles.
 *
 * A location's fixed angles never move:
 *   geoMC  = longitude_east mod 360
 *   geoIC  = geoMC + 180
 *   geoASC = f(longitude, latitude)
 *   geoDSC = geoASC + 180
 *
 * When any transiting planet reaches the longitude of one of these four
 * fixed points (orb ≤ ~3°), the location is "activated". This is the
 * CORE TRIGGER — all other layers modulate or amplify this signal.
 */
import type { ComputedPosition } from "@/lib/astro/transits";
import { getPlanetNature } from "@/app/lib/astro-constants";

export const ORB_MAX = 3;
const SIGMA_SQ_2 = 4.5;

const BASE_INFLUENCE: Record<"benefic" | "luminary" | "malefic" | "neutral", number> = {
    benefic: 28, luminary: 6, malefic: -35, neutral: -4,
};

const ANGLE_STRENGTH: Record<AngleName, number> = {
    ASC: 1.20, MC: 1.10, DSC: 0.95, IC: 0.90,
};

const OUTER_MALEFIC_BUMP: Record<string, number> = {
    uranus: 1.15, pluto: 1.10, saturn: 1.05,
};

export type AngleName = "ASC" | "MC" | "DSC" | "IC";

export interface AngleTransitContribution {
    planet: string;
    angle: AngleName;
    orb: number;
    severity: number;
    direction: "benefic" | "malefic" | "luminary" | "neutral";
}

export interface AngleTransitsResult {
    raw: number;
    contributions: AngleTransitContribution[];
}

function angularDiff(a: number, b: number): number {
    let d = Math.abs(a - b) % 360;
    if (d > 180) d = 360 - d;
    return d;
}

export function scoreAngleTransits(params: {
    positions: ComputedPosition[];
    geoMC: number;
    geoASC: number;
}): AngleTransitsResult {
    const { positions, geoMC, geoASC } = params;
    const geoIC = (geoMC + 180) % 360;
    const geoDSC = (geoASC + 180) % 360;

    const angles: Array<{ name: AngleName; lon: number }> = [
        { name: "ASC", lon: geoASC },
        { name: "MC",  lon: geoMC  },
        { name: "DSC", lon: geoDSC },
        { name: "IC",  lon: geoIC  },
    ];

    const contributions: AngleTransitContribution[] = [];
    let raw = 0;

    for (const p of positions) {
        const direction = getPlanetNature(p.name);
        const base = BASE_INFLUENCE[direction];
        const bump = direction === "malefic"
            ? (OUTER_MALEFIC_BUMP[p.name.toLowerCase()] ?? 1.0)
            : 1.0;

        for (const a of angles) {
            const orb = angularDiff(p.longitude, a.lon);
            if (orb > ORB_MAX) continue;
            const decay = Math.exp(-(orb * orb) / SIGMA_SQ_2);
            const rounded = Math.round(base * bump * ANGLE_STRENGTH[a.name] * decay);
            if (Math.abs(rounded) < 1) continue;
            raw += rounded;
            contributions.push({
                planet: p.name,
                angle: a.name,
                orb: Math.round(orb * 100) / 100,
                severity: rounded,
                direction,
            });
        }
    }

    contributions.sort((a, b) => Math.abs(b.severity) - Math.abs(a.severity));
    return { raw, contributions };
}
