/**
 * scoring-engine.ts — The Mathematical Core for the AstroNat V4 Engine
 * Translates House Volumes + Planet Library modifiers into E_Final Life Event variables.
 *
 * As of the universal-sky extension, also accepts an optional UniversalSkyState
 * representing what the sky is doing for everyone (location-agnostic). This
 * adds a per-event `skyModifier` derived from current retrogrades + their
 * dignity/element/modality conditions, plus small contributions from node
 * aspects, eclipses, and major outer-outer aspects.
 */

import { HouseMatrixResult } from "./house-matrix";
import { W_EVENTS, M_AFFINITY, PLANETS, NUM_HOUSES, LIFE_EVENTS } from "./planet-library";
import { EVENT_LABELS, verdictBand } from "./verdict";
import { softCapScore } from "./scoring-flags";
import type {
    UniversalSkyState,
    DignityTier,
    ElementName,
    ModalityName,
    SkyAspect,
    AspectKind,
} from "./universal-sky";

export interface OccupancyPlanet {
    name: string;
    house: number; // 1-12
    dignityStatus?: "Domicile" | "Exalted" | "Detriment" | "Fall" | string;
    hasLine?: boolean;
}

export interface FinalEventScore {
    eventName: string;
    baseVolume: number;
    affinityModifier: number;
    skyModifier: number;
    finalScore: number;
    verdict: string;
}

/**
 * Custom math class simulating basic NumPy linear algebra mechanics.
 */
class TensorMath {
    /** Matrix-Vector Multiplication: Result = [M] \cdot [V] */
    static dotProduct(matrix: number[][], vector: number[]): number[] {
        if (!matrix.length || matrix[0].length !== vector.length) {
            throw new Error(`Dimension mismatch: Matrix is ${matrix.length}x${matrix[0]?.length}, Target Vector is ${vector.length}`);
        }
        return matrix.map(row => 
            row.reduce((sum, val, idx) => sum + val * vector[idx], 0)
        );
    }
}

function getEventVerdict(score: number): string {
    return EVENT_LABELS[verdictBand(score)];
}

// ── Universal Sky Modifier ─────────────────────────────────────────────────

/** How much each planet "matters" for each life event, on a 0–1 scale.
 *  Used as the second factor when distributing a retrograde dampener
 *  across the 9-element event vector. Hand-calibrated from astrological
 *  convention — Venus weighs heavily on Romance; Saturn on Career; etc.
 *  Rows match the PLANETS array order; columns match LIFE_EVENTS order. */
const PLANET_EVENT_AFFINITY: number[][] = [
    //  Identity Wealth Home Romance Health Partner Career Friend Spirit
    [   0.9,    0.3,   0.2, 0.3,    0.5,   0.3,    0.7,   0.3,   0.2 ], // sun
    [   0.4,    0.2,   0.8, 0.4,    0.5,   0.3,    0.2,   0.3,   0.4 ], // moon
    [   0.6,    0.4,   0.2, 0.2,    0.5,   0.4,    0.7,   0.5,   0.2 ], // mercury
    [   0.4,    0.5,   0.3, 0.9,    0.2,   0.8,    0.4,   0.5,   0.2 ], // venus
    [   0.6,    0.2,   0.2, 0.3,    0.4,   0.3,    0.4,   0.2,   0.1 ], // mars
    [   0.5,    0.8,   0.3, 0.4,    0.3,   0.5,    0.6,   0.6,   0.5 ], // jupiter
    [   0.4,    0.3,   0.4, 0.3,    0.4,   0.4,    0.7,   0.2,   0.4 ], // saturn
    [   0.5,    0.3,   0.2, 0.3,    0.2,   0.3,    0.4,   0.4,   0.3 ], // uranus
    [   0.3,    0.2,   0.2, 0.3,    0.4,   0.3,    0.2,   0.2,   0.7 ], // neptune
    [   0.5,    0.3,   0.3, 0.3,    0.3,   0.4,    0.4,   0.2,   0.4 ], // pluto
];

/** Per-planet baseline retrograde dampener. Larger = bigger negative impact
 *  when this planet is retrograde. Inner planets dampen more (they govern
 *  daily-life functions); outer planets are mild because they're retrograde
 *  ~5 months/year by default. Values are unitless severities — multiplied
 *  by dignity/modality/element factors before being distributed across events. */
const BASE_RX_WEIGHT: Record<string, number> = {
    sun:     8,   // never actually retrograde but kept for completeness
    moon:    6,   // ditto
    mercury: 7,
    venus:   6,
    mars:    6,
    jupiter: 3,
    saturn:  3,
    uranus:  2,
    neptune: 2,
    pluto:   2,
};

/** How much a planet's current dignity scales the retrograde dampener.
 *  Dignified planets handle retrograde gracefully; debilitated planets compound.
 *  Mercury-in-Pisces (detriment AND fall — essentialDignityLabel returns
 *  "Detriment" first) lands here at 1.5×. */
const DIGNITY_MULT: Record<DignityTier, number> = {
    domicile: 0.4,
    exalted:  0.5,
    neutral:  1.0,
    detriment: 1.5,
    fall:     1.7,
};

/** Modality of the planet's current sign. Mutable signs disperse retrograde
 *  energy further (slipperier; harder to localize), fixed signs anchor it
 *  (a single channel of resistance), cardinal is a baseline. */
const MODALITY_MULT: Record<ModalityName, number> = {
    cardinal: 1.0,
    fixed:    0.9,
    mutable:  1.2,
};

/** Each planet's elemental preference. preferred → ×0.85 (well-placed even
 *  when retrograde); clash → ×1.4 (the user's "Mercury worse in Pisces"
 *  case lands here at 1.4× because Pisces is water). */
const PLANET_ELEMENT_AFFINITY: Record<string, { preferred: ElementName; clash: ElementName }> = {
    sun:     { preferred: "fire",  clash: "water" },
    moon:    { preferred: "water", clash: "fire"  },
    mercury: { preferred: "air",   clash: "water" },
    venus:   { preferred: "earth", clash: "fire"  },
    mars:    { preferred: "fire",  clash: "water" },
    jupiter: { preferred: "fire",  clash: "earth" },
    saturn:  { preferred: "earth", clash: "fire"  },
    uranus:  { preferred: "air",   clash: "water" },
    neptune: { preferred: "water", clash: "earth" },
    pluto:   { preferred: "water", clash: "fire"  },
};

const ELEMENT_PREFERRED_MULT = 0.85;
const ELEMENT_CLASH_MULT = 1.4;
const ELEMENT_NEUTRAL_MULT = 1.0;

function elementMultiplier(planet: string, element: ElementName): number {
    const aff = PLANET_ELEMENT_AFFINITY[planet];
    if (!aff) return ELEMENT_NEUTRAL_MULT;
    if (aff.preferred === element) return ELEMENT_PREFERRED_MULT;
    if (aff.clash === element) return ELEMENT_CLASH_MULT;
    return ELEMENT_NEUTRAL_MULT;
}

/** Sky-aspect contribution per type. Trines/sextiles add small positive lift
 *  to all events; squares/oppositions subtract. Conjunctions are context-
 *  dependent — treated as neutral here. Magnitudes are intentionally small
 *  so the universal sky never overwhelms the chart-specific affinity layer. */
const SKY_ASPECT_BONUS: Record<AspectKind, number> = {
    conjunction:  0,
    sextile:     +1.5,
    trine:       +2.0,
    square:      -2.0,
    opposition:  -1.5,
};

const ECLIPSE_WINDOW_DAMPENER = 2;     // applied uniformly per active window
const NODE_MALEFIC_HARD_DAMPENER = 3;  // per malefic conjunction/square to nodes

/**
 * Compute the universal sky's contribution to each life-event score.
 *
 * Returns a 9-element vector aligned with LIFE_EVENTS. Values are signed —
 * typically -10 to +5 per event — and are added directly to E_Final.
 *
 * Decomposition (each contribution is small; total magnitude is bounded by
 * the sum of dampening factors active simultaneously):
 *
 *   (a) Retrograde dampener — primary signal; per-planet, conditional on
 *       dignity × modality × element. This is the "Mercury Rx in Pisces is
 *       worse than Mercury Rx in Virgo" case.
 *   (b) Major sky-aspects (outer-outer) — small +/- uniform across events.
 *   (c) Active eclipse window — small uniform dampener.
 *   (d) Malefic hard aspects to lunar nodes — bias against
 *       Identity (0) and Spirituality (8), since the nodal axis is karmic.
 *
 * Sign-changing ingresses are intentionally NOT scored — they're surfaced
 * narratively in the UI but represent "potential" rather than active force.
 */
export function computeSkyModifier(sky: UniversalSkyState): number[] {
    const mod = new Array(LIFE_EVENTS.length).fill(0);

    // (a) Retrograde dampener
    for (const r of sky.retrogrades) {
        const pIdx = PLANETS.indexOf(r.planet);
        if (pIdx === -1) continue;
        const baseWeight = BASE_RX_WEIGHT[r.planet] ?? 0;
        const severity = baseWeight
            * DIGNITY_MULT[r.dignity]
            * MODALITY_MULT[r.modality]
            * elementMultiplier(r.planet, r.element);
        const affinityRow = PLANET_EVENT_AFFINITY[pIdx];
        for (let e = 0; e < LIFE_EVENTS.length; e++) {
            mod[e] -= severity * affinityRow[e];
        }
    }

    // (b) Major sky-aspects — small uniform contribution
    for (const a of sky.aspects) {
        const bonus = SKY_ASPECT_BONUS[a.type];
        if (bonus === 0) continue;
        // Tighter orbs carry more weight (linear taper from 0 → 6° orb)
        const orbFactor = Math.max(0, 1 - a.orb / 6);
        const adjusted = bonus * orbFactor;
        for (let e = 0; e < LIFE_EVENTS.length; e++) {
            mod[e] += adjusted;
        }
    }

    // (c) Active eclipse window
    if (sky.eclipses.inSolarWindow) {
        for (let e = 0; e < LIFE_EVENTS.length; e++) mod[e] -= ECLIPSE_WINDOW_DAMPENER;
    }
    if (sky.eclipses.inLunarWindow) {
        for (let e = 0; e < LIFE_EVENTS.length; e++) mod[e] -= ECLIPSE_WINDOW_DAMPENER * 0.6;
    }

    // (d) Malefic hard aspects to lunar nodes — bias against Identity & Spirituality
    const IDENTITY_IDX = 0;
    const SPIRITUALITY_IDX = 8;
    for (const na of sky.nodeAspects) {
        if (!na.isMalefic) continue;
        const orbFactor = Math.max(0, 1 - na.orb / 3);
        const hit = NODE_MALEFIC_HARD_DAMPENER * orbFactor;
        mod[IDENTITY_IDX] -= hit;
        mod[SPIRITUALITY_IDX] -= hit;
    }

    return mod;
}

/**
 * Calculates the Continuous Vector-Space Model Event Scores.
 * Mathematical Formula: E_Final = (W_events * H_final) + (M_affinity * S_global) + skyModifier
 *
 * @param matrixResult The aggregated 12-house calculated scores
 * @param relocatedPlanets The planets and their global states
 * @param skyState Optional universal sky state — adds a global sky modifier
 *                 derived from current retrogrades, aspects, eclipses, nodes.
 *                 Omit for backward-compatible behavior (skyModifier = 0).
 */
export function computeEventScores(
    matrixResult: HouseMatrixResult,
    relocatedPlanets: OccupancyPlanet[],
    skyState?: UniversalSkyState,
): FinalEventScore[] {
    
    // 1. Array Construction: H_final (1D Vector of size 12)
    const H_final = new Array(12).fill(0);
    for (const hs of matrixResult.houses) {
        if (hs.house >= 1 && hs.house <= 12) {
            H_final[hs.house - 1] = hs.score; // Map 1-based to 0-based
        }
    }

    // 2. Layer A Execution: (W_events x H_final)
    const baseEventVolumes = TensorMath.dotProduct(W_EVENTS, H_final);

    // 3. Array Construction: S_global (State Vector of size 170)
    const S_global = new Array(170).fill(0);
    for (const rp of relocatedPlanets) {
        const pIdx = PLANETS.indexOf(rp.name.toLowerCase());
        if (pIdx !== -1) {
            // Index 0-119: Physical House Occupancy
            if (rp.house >= 1 && rp.house <= 12) {
                const flatIdx = (rp.house - 1) * 10 + pIdx;
                S_global[flatIdx] = 1;
            }
            
            // Index 120-159: Essential Dignity Archetypes
            if (rp.dignityStatus) {
                let stateIdx = -1;
                const dLog = rp.dignityStatus.toLowerCase();
                if (dLog.includes("domicile")) stateIdx = 0;
                else if (dLog.includes("exalted")) stateIdx = 1;
                else if (dLog.includes("detriment")) stateIdx = 2;
                else if (dLog.includes("fall")) stateIdx = 3;
                
                if (stateIdx !== -1) {
                    S_global[120 + (pIdx * 4) + stateIdx] = 1;
                }
            }
            
            // Index 160-169: Active ACG Line Modifier
            if (rp.hasLine) {
                S_global[160 + pIdx] = 1;
            }
        }
    }

    // 4. Layer B Execution: Contextual Affinity Product (M_affinity x S_global)
    const affinityModifiers = TensorMath.dotProduct(M_AFFINITY, S_global);

    // 4b. Layer C Execution: Universal Sky Modifier (location-agnostic)
    const skyModifiers = skyState
        ? computeSkyModifier(skyState)
        : new Array(LIFE_EVENTS.length).fill(0);

    // 5. Final Synthesis Matrix Loop
    const results: FinalEventScore[] = [];
    for (let i = 0; i < LIFE_EVENTS.length; i++) {
        const baseVolume = baseEventVolumes[i];
        const affinityModifier = affinityModifiers[i];
        const skyModifier = skyModifiers[i];

        // E_Final = Base Volume + Affinity Modifiers + Sky Modifier
        const rawScore = baseVolume + affinityModifier + skyModifier;
        const finalScore = softCapScore(rawScore);

        results.push({
            eventName: LIFE_EVENTS[i],
            baseVolume: Math.round(baseVolume),
            affinityModifier: Math.round(affinityModifier),
            skyModifier: Math.round(skyModifier),
            finalScore,
            verdict: getEventVerdict(finalScore)
        });
    }

    return results;
}
