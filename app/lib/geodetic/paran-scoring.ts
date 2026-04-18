/**
 * Layer 2 — Parans at Latitude.
 * Parans affect every longitude at a given latitude band.
 */
import type { MundaneParan } from "@/app/lib/mundane-engine";
import { BENEFIC_PLANETS, STRONG_MALEFICS } from "@/app/lib/astro-constants";

const WEATHER_PARAN_COMBOS: Record<string, number> = {
    "mars|uranus":      -32,
    "neptune|saturn":   -30,
    "jupiter|neptune":  -22,
    "mars|pluto":       -28,
    "pluto|saturn":     -24,
    "mars|saturn":      -18,
    "neptune|pluto":    -20,
    "pluto|uranus":     -25,
    "saturn|uranus":    -18,
    "neptune|uranus":   -15,
    "mars|neptune":     -20,
    "jupiter|mars":      -8,
    "jupiter|venus":    +18,
    "jupiter|moon":     +14,
    "moon|venus":       +15,
    "jupiter|sun":      +12,
    "sun|venus":        +10,
};

export interface ParanContribution {
    p1: string;
    p2: string;
    type: string;
    lat: number;
    latProximity: number;
    severity: number;
    direction: "malefic" | "benefic" | "neutral";
}

export interface ParansResult {
    raw: number;
    contributions: ParanContribution[];
}

function lower(s: string): string { return s.toLowerCase(); }

export function scoreParans(parans: MundaneParan[], destLat: number): ParansResult {
    const contribs: ParanContribution[] = [];
    let raw = 0;

    for (const par of parans) {
        const p1 = lower(par.p1);
        const p2 = lower(par.p2);
        const key = [p1, p2].sort().join("|");

        let base = WEATHER_PARAN_COMBOS[key];
        let direction: "malefic" | "benefic" | "neutral";

        if (base === undefined) {
            const hasBenefic = BENEFIC_PLANETS.some(b => p1 === b || p2 === b);
            const hasMalefic = STRONG_MALEFICS.some(m => p1 === m || p2 === m);
            if (hasMalefic && !hasBenefic)      { base = -15; direction = "malefic"; }
            else if (hasBenefic && !hasMalefic) { base = +10; direction = "benefic"; }
            else if (hasMalefic && hasBenefic)  { base =  -5; direction = "malefic"; }
            else continue;
        } else {
            direction = base < 0 ? "malefic" : base > 0 ? "benefic" : "neutral";
        }

        const latDist = Math.abs(par.lat - destLat);
        let prox = 1.0;
        if (latDist <= 0.3)      prox = 1.3;
        else if (latDist <= 1.0) prox = 1.1;
        else if (latDist <= 2.0) prox = 0.9;
        else                     prox = 0.7;

        const severity = Math.round(base * prox);
        if (severity === 0) continue;

        raw += severity;
        contribs.push({
            p1: par.p1, p2: par.p2, type: par.type, lat: par.lat,
            latProximity: Math.round(latDist * 100) / 100,
            severity, direction,
        });
    }

    contribs.sort((a, b) => Math.abs(b.severity) - Math.abs(a.severity));
    return { raw, contributions: contribs };
}
