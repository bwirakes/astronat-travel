/**
 * A6 + A8 — harmonic and modality flags for the personal pipeline.
 *
 *   A6 (PDF p.10 — Hawaii floods): natal-midpoint triggers and 45°/135°
 *       (8th-harmonic) aspects. The PDF cites "Chiron + Eris in Aries
 *       strongly connected to Mars/Mercury in Pisces by 45° and triggering
 *       all these midpoints." We surface flags only — no scoring weight in
 *       this pass; downstream narrative consumers can opt in.
 *
 *   A8 (PDF p.9 — Mars-Uranus square at 27° fixed): when a hard outer-
 *       planet aspect lands in late degrees (≥25°) of fixed/cardinal/mutable
 *       signs, the whole modality cohort is "exposed." Surface a label so
 *       narrative can say "anything you have in late fixed signs is
 *       exposed."
 *
 * All output is informational. No bucket weights are touched.
 */
import { STRONG_MALEFICS } from "@/app/lib/astro-constants";

const MIDPOINT_ORB = 1.5;
const HARMONIC_45_ORB = 1.5;
const HARMONIC_135_ORB = 1.5;
const LATE_DEGREE_THRESHOLD = 25;     // ≥25° in sign = "late"
const HARD_ASPECT_TARGETS = [0, 90, 180];
const HARD_ASPECT_ORB = 3;

const FIXED_SIGNS = new Set([1, 4, 7, 10]);       // 0-indexed Tau/Leo/Sco/Aqu
const CARDINAL_SIGNS = new Set([0, 3, 6, 9]);     // Ari/Can/Lib/Cap
const MUTABLE_SIGNS = new Set([2, 5, 8, 11]);     // Gem/Vir/Sag/Pis

function angularDiff(a: number, b: number): number {
    let d = Math.abs(a - b) % 360;
    if (d > 180) d = 360 - d;
    return d;
}

function shortestSignedDiff(a: number, b: number): number {
    let d = ((a - b + 540) % 360) - 180;
    return d;
}

function modalityOf(lon: number): "cardinal" | "fixed" | "mutable" | null {
    const idx = Math.floor((((lon % 360) + 360) % 360) / 30) % 12;
    if (CARDINAL_SIGNS.has(idx)) return "cardinal";
    if (FIXED_SIGNS.has(idx)) return "fixed";
    if (MUTABLE_SIGNS.has(idx)) return "mutable";
    return null;
}

function degreeInSign(lon: number): number {
    return ((lon % 30) + 30) % 30;
}

// ── A6: natal midpoints ─────────────────────────────────────────────────

export interface MidpointTrigger {
    transitPlanet: string;
    transitLon: number;
    natalA: string;
    natalB: string;
    midpointLon: number;
    orb: number;
}

export function computeMidpointTriggers(params: {
    natalPlanets: Array<{ planet?: string; name?: string; longitude: number }>;
    transitPositions: Array<{ name: string; longitude: number }>;
}): MidpointTrigger[] {
    const { natalPlanets, transitPositions } = params;
    const out: MidpointTrigger[] = [];

    // All natal pairs once.
    const pairs: Array<{ a: string; b: string; midLon: number }> = [];
    for (let i = 0; i < natalPlanets.length; i++) {
        for (let j = i + 1; j < natalPlanets.length; j++) {
            const aName = (natalPlanets[i].planet ?? natalPlanets[i].name ?? "").trim();
            const bName = (natalPlanets[j].planet ?? natalPlanets[j].name ?? "").trim();
            if (!aName || !bName) continue;
            const aLon = natalPlanets[i].longitude;
            const bLon = natalPlanets[j].longitude;
            // Closer of the two arc midpoints — pick the one inside the shorter arc.
            const half = shortestSignedDiff(bLon, aLon) / 2;
            const midLon = ((aLon + half) % 360 + 360) % 360;
            pairs.push({ a: aName, b: bName, midLon });
        }
    }

    for (const t of transitPositions) {
        for (const pair of pairs) {
            const orb = angularDiff(t.longitude, pair.midLon);
            if (orb > MIDPOINT_ORB) continue;
            out.push({
                transitPlanet: t.name,
                transitLon: t.longitude,
                natalA: pair.a,
                natalB: pair.b,
                midpointLon: pair.midLon,
                orb: Math.round(orb * 100) / 100,
            });
        }
    }

    out.sort((a, b) => a.orb - b.orb);
    return out;
}

// ── A6: 45°/135° (8th-harmonic) aspects between transits and natal ──────

export interface HarmonicHit {
    transitPlanet: string;
    natalPlanet: string;
    angle: 45 | 135;
    orb: number;
}

export function compute45HarmonicHits(params: {
    natalPlanets: Array<{ planet?: string; name?: string; longitude: number }>;
    transitPositions: Array<{ name: string; longitude: number }>;
}): HarmonicHit[] {
    const { natalPlanets, transitPositions } = params;
    const out: HarmonicHit[] = [];
    for (const t of transitPositions) {
        for (const n of natalPlanets) {
            const npName = (n.planet ?? n.name ?? "").trim();
            if (!npName) continue;
            const dist = angularDiff(t.longitude, n.longitude);
            const orb45 = Math.abs(dist - 45);
            const orb135 = Math.abs(dist - 135);
            if (orb45 <= HARMONIC_45_ORB) {
                out.push({ transitPlanet: t.name, natalPlanet: npName, angle: 45, orb: Math.round(orb45 * 100) / 100 });
            } else if (orb135 <= HARMONIC_135_ORB) {
                out.push({ transitPlanet: t.name, natalPlanet: npName, angle: 135, orb: Math.round(orb135 * 100) / 100 });
            }
        }
    }
    out.sort((a, b) => a.orb - b.orb);
    return out;
}

// ── A8: modality cohort flag ────────────────────────────────────────────

export interface ModalityCohort {
    planetA: string;
    planetB: string;
    aspectAngle: 0 | 90 | 180;
    modality: "cardinal" | "fixed" | "mutable";
    orb: number;
}

/** Detects late-degree (≥25°) HARD aspects between two transiting outer
 *  malefics where both planets sit in the same modality. The "modality
 *  cohort" flag tells the narrative: anyone with natal placements in late
 *  degrees of this modality is exposed by this transit pair. */
export function computeModalityCohorts(params: {
    transitPositions: Array<{ name: string; longitude: number }>;
}): ModalityCohort[] {
    const { transitPositions } = params;
    const out: ModalityCohort[] = [];
    const malefics = transitPositions.filter((p) => STRONG_MALEFICS.includes(p.name.toLowerCase()));
    for (let i = 0; i < malefics.length; i++) {
        for (let j = i + 1; j < malefics.length; j++) {
            const a = malefics[i];
            const b = malefics[j];
            if (degreeInSign(a.longitude) < LATE_DEGREE_THRESHOLD) continue;
            if (degreeInSign(b.longitude) < LATE_DEGREE_THRESHOLD) continue;
            const modA = modalityOf(a.longitude);
            const modB = modalityOf(b.longitude);
            if (!modA || modA !== modB) continue;
            const dist = angularDiff(a.longitude, b.longitude);
            for (const target of HARD_ASPECT_TARGETS) {
                const orb = Math.abs(dist - target);
                if (orb <= HARD_ASPECT_ORB) {
                    out.push({
                        planetA: a.name,
                        planetB: b.name,
                        aspectAngle: target as 0 | 90 | 180,
                        modality: modA,
                        orb: Math.round(orb * 100) / 100,
                    });
                    break;
                }
            }
        }
    }
    out.sort((a, b) => a.orb - b.orb);
    return out;
}
