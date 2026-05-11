/**
 * personal-cycles.ts — life-stage cycle detection for relocation readings.
 *
 * The relocation question — "is this a good chapter for who I'm becoming?" —
 * has a layer above the place: the user's own life-stage. A Saturn return,
 * a midlife band, or a balsamic progressed lunation reframes any relocation
 * regardless of destination quality. The place can support or strain the
 * cycle, but cannot replace it.
 *
 * The matrix engine (app/lib/house-matrix.ts) already folds progressions
 * into bucketGeodetic as a ±15 score modifier (A5). That's enough to move
 * the number, not enough to *reframe the editorial*. This module surfaces
 * those cycles as structured facts the AI can lead with as a banner, and
 * sets a `gateActive` flag the prompt uses to forbid Pollyannaish overviews
 * when life-stage is the dominant variable.
 *
 * Scope (v1):
 *   - Saturn return                  (orb ≤ 5°,  ordinal 1/2/3 by age band)
 *   - Midlife band                   (Uranus opp + Neptune sq + Pluto sq, orb ≤ 3°)
 *   - Progressed lunation phase      (always present; valence per phase)
 *
 * Out of scope (v2 candidates): nodal return/opposition, Jupiter return as
 * uplift, Chiron return, Saturn opening/closing squares to natal Saturn.
 *
 * Trip readings: this module is irrelevant. A 7-day Lisbon trip during
 * Saturn return is just a trip during Saturn return; the cycle doesn't
 * change the trip's verdict. Personal cycles only gate *relocation* prose.
 */

import type { ComputedPosition } from "@/lib/astro/transits";
import type { ProgressionsResult } from "./progressions";
import { signFromLongitude } from "./geodetic";

// ── Types ─────────────────────────────────────────────────────────────────

export type CyclePhase = "approaching" | "exact" | "separating";

export type LunationPhase =
    | "new" | "crescent" | "first-quarter" | "gibbous"
    | "full" | "disseminating" | "last-quarter" | "balsamic";

export type CycleValence = "gate" | "uplift" | "transitional";

export interface SaturnReturnInfo {
    /** 1 = ~age 27-32, 2 = ~age 56-62, 3 = ~age 86-92. */
    ordinal: 1 | 2 | 3;
    phase: CyclePhase;
    /** Current degrees from exact (0 at exact, 5 at outer edge of orb). */
    orb: number;
    natalSaturn: { sign: string; longitude: number };
    valence: "gate";
}

export interface MidlifeAspectHit {
    transit: "uranus" | "neptune" | "pluto";
    aspect: "opposition" | "square";
    orb: number;
    /** Current orb relative to exact. The "phase" axis is muddier for outers
     *  because their stations are slow; we surface orb but not phase here. */
}

export interface MidlifeInfo {
    activeAspects: MidlifeAspectHit[];
    /** 1, 2, or 3 — number of midlife aspects currently in orb.
     *  3 = full midlife band, all generational outers active. */
    weight: 1 | 2 | 3;
    valence: "gate";
}

export interface ProgressedLunationInfo {
    phase: LunationPhase;
    /** Progressed Moon ahead of progressed Sun, 0–360°. */
    elongation: number;
    valence: CycleValence;
}

export interface PersonalCycleContext {
    /** Heavy cycle: structural reckoning. Trip path: omit. */
    saturnReturn?: SaturnReturnInfo;
    /** Heavy cycle: identity reconstruction. Trip path: omit. */
    midlife?: MidlifeInfo;
    /** Always present (lunation is always in some phase). Valence may still
     *  be "transitional," in which case it doesn't trip the gate. */
    progressedLunation: ProgressedLunationInfo;

    /** Aggregate signals — the AI reads these first. */
    dominant:
        | "saturn-return"
        | "midlife"
        | "balsamic-lunation"
        | "lunation-uplift"
        | "none";
    /** True iff any cycle with valence "gate" is active. The prompt's
     *  honesty rule: when gateActive, do not write a clean fresh-start
     *  narrative — name the cycle as the dominant variable. */
    gateActive: boolean;
    /** True iff any cycle with valence "uplift" is active. Used by prompt
     *  to lean the lede slightly more open when no gate is firing. */
    upliftActive: boolean;
    /** One-line banner copy hint. The AI rewrites in voice; the structured
     *  fields above remain authoritative. */
    summary: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

const SATURN_RETURN_ORB = 5; // degrees
const MIDLIFE_ORB = 3;
const SATURN_PERIOD_YEARS = 29.46;

// ── Helpers ───────────────────────────────────────────────────────────────

/** Smallest angular distance (0–180°) between two ecliptic longitudes. */
function angularDiff(a: number, b: number): number {
    let d = Math.abs(((a - b) % 360 + 540) % 360 - 180);
    return d;
}

/** Find a planet by case-insensitive name in either `name` or `planet` field. */
function findByName<T extends { name?: string; planet?: string }>(
    list: readonly T[],
    name: string,
): T | undefined {
    const target = name.toLowerCase();
    return list.find((p) => {
        const n = (p.name ?? p.planet ?? "").toLowerCase();
        return n === target;
    });
}

/** Bucket elongation (prog Moon ahead of prog Sun, 0–360°) into 8 phases. */
function lunationPhaseFromElongation(elongation: number): LunationPhase {
    const e = ((elongation % 360) + 360) % 360;
    if (e < 45)  return "new";
    if (e < 90)  return "crescent";
    if (e < 135) return "first-quarter";
    if (e < 180) return "gibbous";
    if (e < 225) return "full";
    if (e < 270) return "disseminating";
    if (e < 315) return "last-quarter";
    return "balsamic";
}

/** Map lunation phase to valence.
 *  - balsamic / last-quarter: gate (releasing/restructuring; bad for planting)
 *  - new / crescent:           uplift (sowing; supports fresh chapters)
 *  - everything else:          transitional (no banner-level signal) */
function lunationValence(phase: LunationPhase): CycleValence {
    if (phase === "balsamic" || phase === "last-quarter") return "gate";
    if (phase === "new" || phase === "crescent")           return "uplift";
    return "transitional";
}

/** Determine Saturn return ordinal from age in years. Uses period midpoints
 *  rather than exact transits so we can label even when the user is in
 *  the approaching window of the next return. */
function saturnReturnOrdinal(ageYears: number): 1 | 2 | 3 {
    if (ageYears < SATURN_PERIOD_YEARS * 1.5) return 1; // < ~44
    if (ageYears < SATURN_PERIOD_YEARS * 2.5) return 2; // < ~74
    return 3;
}

/** Phase label for an orb-based detection. We treat any hit with orb ≤ 1°
 *  as "exact" (within applying/separating uncertainty for slow planets);
 *  approaching vs separating beyond that is informational only — we don't
 *  surface it because the speed sign of an outer planet flips through
 *  retrograde stations and would mislead the AI. */
function orbPhase(orb: number): CyclePhase {
    if (orb <= 1) return "exact";
    return "approaching"; // approximation; see comment above
}

// ── Cycle detectors ───────────────────────────────────────────────────────

function detectSaturnReturn(
    natalPlanets: ReadonlyArray<{ name?: string; planet?: string; longitude: number }>,
    transitPositions: readonly ComputedPosition[],
    birthDateUtc: Date,
    refDate: Date,
): SaturnReturnInfo | undefined {
    const natalSat = findByName(natalPlanets, "saturn");
    const transitSat = transitPositions.find((p) => p.name.toLowerCase() === "saturn");
    if (!natalSat || !transitSat) return undefined;

    const orb = angularDiff(natalSat.longitude, transitSat.longitude);
    if (orb > SATURN_RETURN_ORB) return undefined;

    const ageYears = (refDate.getTime() - birthDateUtc.getTime())
        / (1000 * 60 * 60 * 24 * 365.25);

    return {
        ordinal: saturnReturnOrdinal(ageYears),
        phase: orbPhase(orb),
        orb: Math.round(orb * 100) / 100,
        natalSaturn: {
            sign: signFromLongitude(natalSat.longitude),
            longitude: natalSat.longitude,
        },
        valence: "gate",
    };
}

function detectMidlife(
    natalPlanets: ReadonlyArray<{ name?: string; planet?: string; longitude: number }>,
    transitPositions: readonly ComputedPosition[],
): MidlifeInfo | undefined {
    const checks: Array<{ planet: "uranus" | "neptune" | "pluto"; aspect: "opposition" | "square"; targetAngle: number }> = [
        { planet: "uranus",  aspect: "opposition", targetAngle: 180 },
        { planet: "neptune", aspect: "square",     targetAngle:  90 },
        { planet: "pluto",   aspect: "square",     targetAngle:  90 },
    ];

    const hits: MidlifeAspectHit[] = [];
    for (const c of checks) {
        const natal = findByName(natalPlanets, c.planet);
        const transit = transitPositions.find((p) => p.name.toLowerCase() === c.planet);
        if (!natal || !transit) continue;

        const sep = angularDiff(natal.longitude, transit.longitude);
        const orb = Math.abs(sep - c.targetAngle);
        if (orb <= MIDLIFE_ORB) {
            hits.push({ transit: c.planet, aspect: c.aspect, orb: Math.round(orb * 100) / 100 });
        }
    }

    if (hits.length === 0) return undefined;
    return {
        activeAspects: hits,
        weight: hits.length as 1 | 2 | 3,
        valence: "gate",
    };
}

function detectProgressedLunation(
    progressedBands: ProgressionsResult | undefined,
): ProgressedLunationInfo | undefined {
    if (!progressedBands) return undefined;
    const sunBand  = progressedBands.bands.find((b) => b.planet === "Sun");
    const moonBand = progressedBands.bands.find((b) => b.planet === "Moon");
    if (!sunBand || !moonBand) return undefined;

    const elongation = ((moonBand.longitude - sunBand.longitude) % 360 + 360) % 360;
    const phase = lunationPhaseFromElongation(elongation);
    return {
        phase,
        elongation: Math.round(elongation * 100) / 100,
        valence: lunationValence(phase),
    };
}

// ── Aggregate ─────────────────────────────────────────────────────────────

function chooseDominant(
    saturnReturn: SaturnReturnInfo | undefined,
    midlife: MidlifeInfo | undefined,
    lunation: ProgressedLunationInfo | undefined,
): PersonalCycleContext["dominant"] {
    // Priority order: structural cycles win over rhythmic ones; gates win
    // over uplift. Saturn return is the most named in user-facing astrology
    // and the most editorially specific.
    if (saturnReturn) return "saturn-return";
    if (midlife)      return "midlife";
    if (lunation?.phase === "balsamic" || lunation?.phase === "last-quarter") return "balsamic-lunation";
    if (lunation?.valence === "uplift") return "lunation-uplift";
    return "none";
}

function buildSummary(
    dominant: PersonalCycleContext["dominant"],
    saturnReturn: SaturnReturnInfo | undefined,
    midlife: MidlifeInfo | undefined,
    lunation: ProgressedLunationInfo | undefined,
): string {
    switch (dominant) {
        case "saturn-return": {
            if (!saturnReturn) return "";
            const ord = saturnReturn.ordinal === 1 ? "first" : saturnReturn.ordinal === 2 ? "second" : "third";
            return `User is in their ${ord} Saturn return (Saturn ${saturnReturn.phase} natal Saturn at ${saturnReturn.orb}° orb in ${saturnReturn.natalSaturn.sign}). Relocations during this window often produce structural reckonings within 18 months.`;
        }
        case "midlife": {
            if (!midlife) return "";
            const what = midlife.weight === 3 ? "full midlife band" : `midlife band (${midlife.weight} of 3 outers active)`;
            return `User is in the ${what}. Identity reconstruction is the dominant variable; relocations here often serve avoidance unless the cycle is metabolized.`;
        }
        case "balsamic-lunation": {
            if (!lunation) return "";
            const phaseLabel = lunation.phase === "balsamic" ? "balsamic" : "last-quarter";
            return `User is in a ${phaseLabel} progressed lunation phase — a release/restructure window. Planting fresh roots is harder; the chapter wants to close, not open.`;
        }
        case "lunation-uplift": {
            if (!lunation) return "";
            return `User is in the ${lunation.phase} progressed lunation phase — a sowing window that supports new chapters.`;
        }
        case "none":
        default:
            return "";
    }
}

// ── Public entry point ────────────────────────────────────────────────────

export function computePersonalCycleContext(args: {
    natalPlanets: ReadonlyArray<{ name?: string; planet?: string; longitude: number; speed?: number }>;
    transitPositions: readonly ComputedPosition[];
    progressedBands?: ProgressionsResult;
    refDate: Date;
    birthDateUtc: Date;
}): PersonalCycleContext {
    const saturnReturn = detectSaturnReturn(args.natalPlanets, args.transitPositions, args.birthDateUtc, args.refDate);
    const midlife      = detectMidlife(args.natalPlanets, args.transitPositions);
    const lunation     = detectProgressedLunation(args.progressedBands);

    // Lunation must always be present; if the helper couldn't compute it
    // (missing progressedBands), fall back to a transitional placeholder.
    // This keeps the field non-optional in the type so prompt rules don't
    // need to handle the undefined case.
    const progressedLunation: ProgressedLunationInfo = lunation ?? {
        phase: "gibbous",
        elongation: 0,
        valence: "transitional",
    };

    const dominant = chooseDominant(saturnReturn, midlife, progressedLunation);
    const gateActive = !!saturnReturn || !!midlife || progressedLunation.valence === "gate";
    const upliftActive = !gateActive && progressedLunation.valence === "uplift";
    const summary = buildSummary(dominant, saturnReturn, midlife, progressedLunation);

    return {
        ...(saturnReturn ? { saturnReturn } : {}),
        ...(midlife ? { midlife } : {}),
        progressedLunation,
        dominant,
        gateActive,
        upliftActive,
        summary,
    };
}
