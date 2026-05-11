/**
 * aspect-patterns.ts — Detector for multi-planet aspect patterns.
 *
 * Pure detector module. Given a list of natal planets, returns the
 * AspectPattern[] that fit the configured patterns (Grand Trine, T-Square)
 * with their orb tightness scored on a [0, 1] linear taper from tight-orb
 * (full effect) to loose-orb (zero effect).
 *
 * No side effects. No reads of feature flags. Downstream consumers (the
 * house-matrix amplifier, the AI input builder) gate on CLUSTER_SCORING_V1.
 *
 * Plan reference: docs/implementation_plans/cluster-scoring.md §7.
 *
 * Coverage in this module:
 *   - Grand Trine (PR #5a)
 *   - T-Square    (PR #5a)
 *
 * Deferred to a follow-up PR (plan §10 PR #5b):
 *   - Yod, Grand Cross, Kite, Mystic Rectangle.
 */

import { SIGN_ELEMENT } from "./dignity-tables";

// ── Types ────────────────────────────────────────────────────────────────

export type AspectPatternType = "grand-trine" | "t-square";
export type ElementName = "Fire" | "Earth" | "Air" | "Water";

export interface PatternInputPlanet {
    /** Canonical planet name. Case is preserved as-is in the output. */
    name: string;
    longitude: number;  // ecliptic longitude, 0–360
    sign: string;       // capitalized zodiac sign
}

export interface AspectPattern {
    type: AspectPatternType;
    /** Member planet names, alphabetically sorted for stable equality. */
    members: string[];
    /** Populated for grand-trine — the element shared by all three members. */
    element?: ElementName;
    /** Populated for t-square — the planet square to both opposition members. */
    focal?: string;
    /** Aggregate tightness in [0, 1]. 1 = every constituent aspect is exactly
     *  at the ideal angle; 0 = at the loose-orb cutoff. Linear taper. */
    tightness: number;
}

// ── Orb tables (plan §7.2) ───────────────────────────────────────────────

interface OrbWindow {
    tight: number; // full-effect threshold
    loose: number; // zero-effect cutoff
}
const ORB_OPPOSITION: OrbWindow = { tight: 6, loose: 9 };
const ORB_TRINE: OrbWindow      = { tight: 5, loose: 8 };
const ORB_SQUARE: OrbWindow     = { tight: 5, loose: 8 };

// ── Math helpers ─────────────────────────────────────────────────────────

/** Smallest angular distance (degrees) between two ecliptic longitudes. */
function angularDist(a: number, b: number): number {
    let d = Math.abs(a - b) % 360;
    if (d > 180) d = 360 - d;
    return d;
}

/** Check whether `actual` falls inside the orb window for `ideal`. Returns
 *  whether the aspect fits AND a tightness score in [0, 1] that scales
 *  linearly from 1 at tight-orb to 0 at loose-orb. */
function fitsOrb(actual: number, ideal: number, win: OrbWindow): { fits: boolean; tightness: number } {
    const dev = Math.abs(actual - ideal);
    if (dev > win.loose) return { fits: false, tightness: 0 };
    if (dev <= win.tight) return { fits: true, tightness: 1 };
    return { fits: true, tightness: 1 - (dev - win.tight) / (win.loose - win.tight) };
}

// ── Detectors ────────────────────────────────────────────────────────────

/** Grand Trine: 3 planets at ~120° from each other, all in the same element.
 *  We dedupe by sorted member identity so a grand trine isn't reported once
 *  per ordering of its members. */
function detectGrandTrines(planets: PatternInputPlanet[]): AspectPattern[] {
    const seen = new Set<string>();
    const out: AspectPattern[] = [];
    for (let i = 0; i < planets.length; i++) {
        for (let j = i + 1; j < planets.length; j++) {
            for (let k = j + 1; k < planets.length; k++) {
                const a = planets[i], b = planets[j], c = planets[k];
                const el = SIGN_ELEMENT[a.sign];
                if (!el) continue;
                if (SIGN_ELEMENT[b.sign] !== el || SIGN_ELEMENT[c.sign] !== el) continue;
                const ab = fitsOrb(angularDist(a.longitude, b.longitude), 120, ORB_TRINE);
                const bc = fitsOrb(angularDist(b.longitude, c.longitude), 120, ORB_TRINE);
                const ac = fitsOrb(angularDist(a.longitude, c.longitude), 120, ORB_TRINE);
                if (!ab.fits || !bc.fits || !ac.fits) continue;
                const members = [a.name, b.name, c.name].sort();
                const key = members.join("|");
                if (seen.has(key)) continue;
                seen.add(key);
                out.push({
                    type: "grand-trine",
                    members,
                    element: el as ElementName,
                    tightness: Math.min(ab.tightness, bc.tightness, ac.tightness),
                });
            }
        }
    }
    return out;
}

/** T-Square: 2 planets in opposition, with a 3rd squaring both. The 3rd is
 *  the focal — where the tension is felt and channelled. Per the plan we
 *  emit one pattern per (opposition pair × focal candidate); a chart with
 *  multiple focals along the same opposition emits multiple patterns. */
function detectTSquares(planets: PatternInputPlanet[]): AspectPattern[] {
    const seen = new Set<string>();
    const out: AspectPattern[] = [];
    for (let i = 0; i < planets.length; i++) {
        for (let j = i + 1; j < planets.length; j++) {
            const opp = fitsOrb(angularDist(planets[i].longitude, planets[j].longitude), 180, ORB_OPPOSITION);
            if (!opp.fits) continue;
            for (let k = 0; k < planets.length; k++) {
                if (k === i || k === j) continue;
                const sqA = fitsOrb(angularDist(planets[i].longitude, planets[k].longitude), 90, ORB_SQUARE);
                const sqB = fitsOrb(angularDist(planets[j].longitude, planets[k].longitude), 90, ORB_SQUARE);
                if (!sqA.fits || !sqB.fits) continue;
                const members = [planets[i].name, planets[j].name, planets[k].name].sort();
                const key = members.join("|") + ":" + planets[k].name;
                if (seen.has(key)) continue;
                seen.add(key);
                out.push({
                    type: "t-square",
                    members,
                    focal: planets[k].name,
                    tightness: Math.min(opp.tightness, sqA.tightness, sqB.tightness),
                });
            }
        }
    }
    return out;
}

// ── Public entry point ───────────────────────────────────────────────────

export function detectAspectPatterns(planets: PatternInputPlanet[]): AspectPattern[] {
    if (planets.length < 3) return [];
    return [
        ...detectGrandTrines(planets),
        ...detectTSquares(planets),
    ];
}
