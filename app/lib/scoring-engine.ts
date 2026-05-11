/**
 * scoring-engine.ts — The Mathematical Core for the AstroNat V4 Engine
 * Translates House Volumes + Planet Library modifiers into E_Final Life Event variables.
 *
 * Layered design (post-fused-transit refactor):
 *   1. computePlaceAffinityLayers(matrix, relocatedPlanets)
 *        → { baseVolumes[9], affinityModifiers[9] }
 *      Pure place-fit; depends only on the relocated chart, not the date.
 *   2. computeTransitModifiersAtAnchor(transits, centerISO, goalIds, planetHouseMap)
 *        → number[9]   (signed, capped per row)
 *      Date-specific; ±5d transit window distributed via W_EVENTS into the 9 rows.
 *   3. finalizeEventScoresFromLayers(layers, transitModifiers, skyModifiers, stationModifiers)
 *        → FinalEventScore[9]
 *
 * Universal sky and station-event modifiers remain additive layers in the
 * final synthesis. They are kept separate from place affinity and transit
 * modifiers so the headline can be fused without losing the newer sky/station
 * channels.
 *
 * computeEventScores remains as the legacy entry point and is now a thin
 * wrapper around (1) + zeroed (3). Behaviour is unchanged when no transits
 * are involved.
 */

import { HouseMatrixResult } from "./house-matrix";
import { W_EVENTS, M_AFFINITY, PLANETS, NUM_HOUSES, LIFE_EVENTS } from "./planet-library";
import { EVENT_LABELS, verdictBand } from "./verdict";
import { softCapScore } from "./scoring-flags";
import { computeStationEventModifier } from "./geodetic/station-event-affinity";
import type { StationContribution } from "./geodetic/station-scoring";
import { houseFromLongitude } from "./geodetic";
import type {
    UniversalSkyState,
    DignityTier,
    ElementName,
    ModalityName,
    AspectKind,
} from "./universal-sky";
import type { TransitHit } from "@/lib/astro/transit-solver";
import type { ScoredWindow } from "./window-scoring";

void NUM_HOUSES;

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
    /** Per-event contribution from geodetic station signals — fires when a
     *  planet stations within ±30d of refDate AND within ~3° of one of the
     *  destination's geodetic angles. Driven by `STATION_EVENT_AFFINITY`
     *  in `app/lib/geodetic/station-event-affinity.ts`. Adds the planet's
     *  intrinsic significator weight to each event, on top of the
     *  per-house→W_EVENTS channel that already routes station severity
     *  into bucketGeodetic. Defaults to 0 when stationsResult is not
     *  supplied or has no contributions. */
    stationEventModifier: number;
    /** Signed transit contribution applied to (baseVolume + affinityModifier).
     *  Optional — absent / 0 means the engine ran without transit input. */
    transitModifier?: number;
    finalScore: number;
    verdict: string;
}

export interface PlaceAffinityLayers {
    /** Layer A: 9-vector of base event volumes from W_EVENTS · H_final. */
    baseVolumes: number[];
    /** Layer B: 9-vector of affinity contributions from M_AFFINITY · S_global. */
    affinityModifiers: number[];
}

// ─── Goal targeting (mirrors window-scoring.ts) ───────────────────────────────
//
// Duplicated rather than imported to keep scoring-engine free of direct
// circular deps with window-scoring.ts. Keys & values must stay identical.

export const GOAL_NATAL_TARGETS: Record<string, string[]> = {
    love:       ["venus", "moon"],
    career:     ["sun", "mars", "saturn", "mc"],
    community:  ["mercury", "jupiter"],
    growth:     ["jupiter", "neptune"],
    relocation: ["moon", "ic"],
    timing:     [],
};

function goalTargetSet(goalIds: string[]): Set<string> | null {
    if (!goalIds.length) return null;
    const set = new Set<string>();
    let hadAny = false;
    for (const g of goalIds) {
        const targets = GOAL_NATAL_TARGETS[g];
        if (targets && targets.length) {
            hadAny = true;
            for (const t of targets) set.add(t);
        }
    }
    return hadAny ? set : null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HALF_WIDTH_DAYS = 5;          // ±5d transit window — same as window-scoring
const TRANSIT_ROW_SCALE = 16;       // contribution scale per tightness unit (~14–18)
export const MAX_TRANSIT_MODIFIER = 12; // hard cap on per-row transit modifier
const GOAL_BOOST = 1.6;

// ─── Tensor math ──────────────────────────────────────────────────────────────

class TensorMath {
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
 *  so the universal sky never overwhelms the chart-specific affinity layer.
 *
 *  Cut 4× from the original ±1.5/±2.0 to ±0.4/±0.5. Reason: each aspect was
 *  applied uniformly across all 9 events, so a single trine added +18 total
 *  lift while a single outer-planet retrograde dampener added only ~−5
 *  total drag. The trine overwhelmed the dampener, producing positive sky
 *  modifiers on retrograde-active dates (5 of 17 dates in the v4 audit).
 *  At ±0.4/±0.5, the per-aspect total (4-5 across 9 events) balances the
 *  outer-Rx dampener so retrogrades reliably move scores down — matches
 *  Astro-Nat's "all planets have impacts" stance. */
const SKY_ASPECT_BONUS: Record<AspectKind, number> = {
    conjunction:  0,
    sextile:     +0.4,
    trine:       +0.5,
    square:      -0.5,
    opposition:  -0.4,
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

// ─── Layer 1: place-affinity layers ───────────────────────────────────────────

export function computePlaceAffinityLayers(
    matrixResult: HouseMatrixResult,
    relocatedPlanets: OccupancyPlanet[],
): PlaceAffinityLayers {
    // 1. H_final (1D Vector of size 12)
    const H_final = new Array(12).fill(0);
    for (const hs of matrixResult.houses) {
        if (hs.house >= 1 && hs.house <= 12) {
            H_final[hs.house - 1] = hs.score;
        }
    }

    // 2. Layer A: (W_events x H_final)
    const baseVolumes = TensorMath.dotProduct(W_EVENTS, H_final);

    // 3. S_global (170-vector)
    const S_global = new Array(170).fill(0);
    for (const rp of relocatedPlanets) {
        const pIdx = PLANETS.indexOf(rp.name.toLowerCase());
        if (pIdx === -1) continue;
        if (rp.house >= 1 && rp.house <= 12) {
            S_global[(rp.house - 1) * 10 + pIdx] = 1;
        }
        if (rp.dignityStatus) {
            let stateIdx = -1;
            const dLog = rp.dignityStatus.toLowerCase();
            if (dLog.includes("domicile")) stateIdx = 0;
            else if (dLog.includes("exalted")) stateIdx = 1;
            else if (dLog.includes("detriment")) stateIdx = 2;
            else if (dLog.includes("fall")) stateIdx = 3;
            if (stateIdx !== -1) S_global[120 + (pIdx * 4) + stateIdx] = 1;
        }
        if (rp.hasLine) S_global[160 + pIdx] = 1;
    }

    // 4. Layer B
    const affinityModifiers = TensorMath.dotProduct(M_AFFINITY, S_global);

    return { baseVolumes, affinityModifiers };
}

// ─── Layer 2: transit modifiers at anchor ─────────────────────────────────────

/**
 * Build the per-row transit modifier vector (length 9) for an anchor date.
 *
 * For each transit hit within ±5d of `centerISO`:
 *   tightness = max(0.2, 1 - |orb|/3) × goalMul × retroMul
 *   signed    = tightness × (benefic ? +1 : -1)
 *   rowDelta[r] += signed × W_EVENTS[r][house-1] × TRANSIT_ROW_SCALE
 *
 * `house` is the relocated house of the natal planet that the transit hits
 * (looked up via `natalPlanetHouse`). Each row is then clamped to
 * ±MAX_TRANSIT_MODIFIER.
 */
export function computeTransitModifiersAtAnchor(
    transits: TransitHit[],
    centerISO: string | null,
    goalIds: string[],
    natalPlanetHouse: Map<string, number>,
    halfWidthDays = HALF_WIDTH_DAYS,
): number[] {
    const out = new Array(9).fill(0);
    if (!centerISO || !Array.isArray(transits) || !transits.length) return out;
    const center = new Date(centerISO).getTime();
    if (!isFinite(center)) return out;

    const halfMs = halfWidthDays * 86_400_000;
    const goalTargets = goalTargetSet(goalIds);

    for (const t of transits) {
        const tTime = new Date(t.date).getTime();
        if (!isFinite(tTime)) continue;
        if (Math.abs(tTime - center) > halfMs) continue;

        const natalKey = (t.natal_planet || "").toLowerCase();
        const goalHit = goalTargets ? goalTargets.has(natalKey) : false;
        const goalMul = goalHit ? GOAL_BOOST : 1;
        const retroMul = t.retrograde ? 0.7 : 1;
        const tightness = Math.max(0.2, 1 - (t.orb ?? 3) / 3) * goalMul * retroMul;
        const signed = tightness * (t.benefic ? 1 : -1);

        const house = natalPlanetHouse.get(natalKey);
        if (!house || house < 1 || house > 12) continue;

        for (let r = 0; r < 9; r++) {
            const w = W_EVENTS[r]?.[house - 1] ?? 0;
            if (!w) continue;
            out[r] += signed * w * TRANSIT_ROW_SCALE;
        }
    }

    for (let r = 0; r < 9; r++) {
        if (out[r] > MAX_TRANSIT_MODIFIER) out[r] = MAX_TRANSIT_MODIFIER;
        else if (out[r] < -MAX_TRANSIT_MODIFIER) out[r] = -MAX_TRANSIT_MODIFIER;
    }

    return out;
}

// ─── Layer 3: finalize ────────────────────────────────────────────────────────

export function finalizeEventScoresFromLayers(
    layers: PlaceAffinityLayers,
    transitModifiers?: number[] | null,
    skyModifiers?: number[] | null,
    stationEventModifiers?: number[] | null,
): FinalEventScore[] {
    const out: FinalEventScore[] = [];
    for (let i = 0; i < LIFE_EVENTS.length; i++) {
        const base = layers.baseVolumes[i];
        const aff = layers.affinityModifiers[i];
        const tm = transitModifiers && transitModifiers.length === LIFE_EVENTS.length
            ? transitModifiers[i] : 0;
        const sky = skyModifiers && skyModifiers.length === LIFE_EVENTS.length
            ? skyModifiers[i] : 0;
        const station = stationEventModifiers && stationEventModifiers.length === LIFE_EVENTS.length
            ? stationEventModifiers[i] : 0;
        const raw = base + aff + tm + sky + station;
        const finalScore = softCapScore(raw);
        out.push({
            eventName: LIFE_EVENTS[i],
            baseVolume: Math.round(base),
            affinityModifier: Math.round(aff),
            skyModifier: Math.round(sky),
            stationEventModifier: Math.round(station),
            ...(tm !== 0 ? { transitModifier: Math.round(tm) } : {}),
            finalScore,
            verdict: getEventVerdict(finalScore),
        });
    }
    return out;
}

// ─── Legacy entry point ───────────────────────────────────────────────────────

export function computeEventScores(
    matrixResult: HouseMatrixResult,
    relocatedPlanets: OccupancyPlanet[],
    skyState?: UniversalSkyState,
): FinalEventScore[] {
    const layers = computePlaceAffinityLayers(matrixResult, relocatedPlanets);
    const skyModifiers = skyState
        ? computeSkyModifier(skyState)
        : new Array(LIFE_EVENTS.length).fill(0);
    const stationEventModifiers = computeStationEventModifier(
        matrixResult.stationsResult?.contributions,
    );
    return finalizeEventScoresFromLayers(layers, null, skyModifiers, stationEventModifiers);
}

// ─── Helpers exported for callers ─────────────────────────────────────────────

/**
 * Build a map { natalPlanetName → relocated house (1-12) } from the natal
 * planets array and the relocated cusps (uses cusp[0] as ASC).
 */
export function buildNatalPlanetRelocatedHouseMap(
    natalPlanets: Array<{ planet?: string; name?: string; longitude: number }>,
    relocatedCusps: number[],
): Map<string, number> {
    const ascLon = relocatedCusps[0] ?? 0;
    const out = new Map<string, number>();
    for (const p of natalPlanets) {
        const name = (p.planet ?? p.name ?? "").toLowerCase();
        if (!name) continue;
        if (typeof p.longitude !== "number") continue;
        out.set(name, houseFromLongitude(p.longitude, ascLon));
    }
    return out;
}

/**
 * Build the OccupancyPlanet[] consumed by computePlaceAffinityLayers.
 * Mirrors the inline construction in lib/readings/astrocarto.ts (~294–306):
 * relocates each natal planet and flags hasLine when an ACG line is ≤ 2000 km.
 */
export function buildOccupancyPlanets(
    natalPlanets: Array<any>,
    relocatedCusps: number[],
    acgLines: Array<{ planet?: string; distance_km?: number }>,
): OccupancyPlanet[] {
    const ascLon = relocatedCusps[0] ?? 0;
    const activeLinePlanets = new Set(
        (acgLines ?? [])
            .filter((line) => Number(line?.distance_km ?? Infinity) <= 2000)
            .map((line) => String(line?.planet ?? "").toLowerCase())
            .filter(Boolean),
    );
    return natalPlanets.map((p: any) => ({
        name: p.planet ?? p.name,
        house: houseFromLongitude(p.longitude, ascLon),
        dignityStatus: p.dignityStatus || p.dignity || p.essentialDignity,
        hasLine: activeLinePlanets.has(String(p.planet ?? p.name ?? "").toLowerCase()),
    }));
}

// ─── Headline (fused macro) ───────────────────────────────────────────────────

/**
 * Compute the fused reading headline (0–100 macro-style score) from a
 * 9-element `FinalEventScore[]` row set.
 *
 * Mirrors the macro intent stretch in house-matrix.ts (~1447–1467):
 *   - 1 selected goal       → that row's finalScore
 *   - 2 selected goals      → 0.65*top + 0.35*second   (sorted desc)
 *   - 3+ selected goals     → 0.50*top + 0.30*second + 0.20*third
 *   - 0 selected goals      → mean of all 9 finalScores
 *   then `50 + (raw - 50) * 1.4` and softCapScore.
 */
export function computeFusedReadingHeadline(
    eventScores: FinalEventScore[],
    selectedGoalIndices?: number[] | null,
): number {
    if (!eventScores || eventScores.length === 0) return 50;

    let raw: number;
    if (Array.isArray(selectedGoalIndices) && selectedGoalIndices.length > 0) {
        const picked: number[] = [];
        for (const idx of selectedGoalIndices) {
            const row = eventScores[idx];
            if (row && typeof row.finalScore === "number") picked.push(row.finalScore);
        }
        if (picked.length === 0) {
            raw = mean(eventScores.map((r) => r.finalScore));
        } else {
            picked.sort((a, b) => b - a);
            if (picked.length === 1) raw = picked[0];
            else if (picked.length === 2) raw = 0.65 * picked[0] + 0.35 * picked[1];
            else raw = 0.50 * picked[0] + 0.30 * picked[1] + 0.20 * picked[2];
        }
    } else {
        raw = mean(eventScores.map((r) => r.finalScore));
    }

    // Pre-fusion the macro intent stretched (50 + (raw-50)*1.4) was needed
    // because matrix-only macros under-dispersed once goal weighting picked
    // a single row. Now that every surface scores through the fused engine
    // (place affinity + transits + sky + station all on one path), the
    // stretch creates the very inconsistency the fusion is meant to remove
    // — sidebar windows would score against a non-stretched math while the
    // hero stretched. Drop the stretch; rely on softCapScore for tail
    // compression.
    return softCapScore(raw);
}

function mean(xs: number[]): number {
    if (!xs.length) return 0;
    let s = 0;
    for (const x of xs) s += x;
    return s / xs.length;
}

// ─── Fused reading package ────────────────────────────────────────────────────

export interface FusedReadingPackage {
    eventScores: FinalEventScore[];
    readingScore: number;        // fused headline
    drivers: string[];           // top transit drivers from the anchor window
}

export interface FusedReadingInputs {
    matrixResult: HouseMatrixResult;
    relocatedPlanets: OccupancyPlanet[];
    transits: TransitHit[];
    centerISO: string | null;
    goalIds: string[];
    selectedGoalIndices?: number[] | null;
    natalPlanetHouse: Map<string, number>;
    halfWidthDays?: number;
    skyState?: UniversalSkyState;
}

export function computeFusedReadingPackage(inputs: FusedReadingInputs): FusedReadingPackage {
    const layers = computePlaceAffinityLayers(inputs.matrixResult, inputs.relocatedPlanets);
    const tm = computeTransitModifiersAtAnchor(
        inputs.transits,
        inputs.centerISO,
        inputs.goalIds,
        inputs.natalPlanetHouse,
        inputs.halfWidthDays,
    );
    const skyModifiers = inputs.skyState
        ? computeSkyModifier(inputs.skyState)
        : new Array(LIFE_EVENTS.length).fill(0);
    const stationEventModifiers = computeStationEventModifier(
        inputs.matrixResult.stationsResult?.contributions,
    );
    const eventScores = finalizeEventScoresFromLayers(layers, tm, skyModifiers, stationEventModifiers);
    const readingScore = computeFusedReadingHeadline(eventScores, inputs.selectedGoalIndices);
    const drivers = topDriversAtAnchor(inputs.transits, inputs.centerISO, inputs.goalIds, inputs.halfWidthDays ?? HALF_WIDTH_DAYS);
    return { eventScores, readingScore, drivers };
}

export function topDriversAtAnchor(
    transits: TransitHit[],
    centerISO: string | null,
    goalIds: string[],
    halfWidthDays: number,
): string[] {
    if (!centerISO || !transits.length) return [];
    const center = new Date(centerISO).getTime();
    if (!isFinite(center)) return [];
    const halfMs = halfWidthDays * 86_400_000;
    const goalTargets = goalTargetSet(goalIds);
    const arr: Array<{ note: string; w: number }> = [];
    for (const t of transits) {
        const tTime = new Date(t.date).getTime();
        if (!isFinite(tTime) || Math.abs(tTime - center) > halfMs) continue;
        const natalKey = (t.natal_planet || "").toLowerCase();
        const goalHit = goalTargets ? goalTargets.has(natalKey) : false;
        const goalMul = goalHit ? GOAL_BOOST : 1;
        const retroMul = t.retrograde ? 0.7 : 1;
        const tightness = Math.max(0.2, 1 - (t.orb ?? 3) / 3) * goalMul * retroMul;
        arr.push({
            note: `${t.transit_planet}${t.retrograde ? " ℞" : ""} ${t.aspect} natal ${t.natal_planet}${goalHit ? " ★" : ""}`,
            w: tightness * (t.benefic ? 1 : -1),
        });
    }
    return arr.sort((a, b) => Math.abs(b.w) - Math.abs(a.w)).slice(0, 3).map(d => d.note);
}

// ─── Per-anchor score from pre-computed layers ────────────────────────────────
//
// Performance helper for callers that score many anchors (daily series,
// per-day range candidates, monthly series). Place-affinity layers are
// date-independent; computing them once and reusing across every anchor is
// the only way to avoid a quadratic blowup in the daily/range loops.

export interface ScoreAtAnchorArgs {
    layers: PlaceAffinityLayers;
    transits: TransitHit[];
    centerISO: string | null;
    goalIds: string[];
    selectedGoalIndices?: number[] | null;
    natalPlanetHouse: Map<string, number>;
    halfWidthDays?: number;
    skyState?: UniversalSkyState | null;
    stationContributions?: StationContribution[] | null;
}

export interface ScoreAtAnchorResult {
    score: number;
    drivers: string[];
    eventScores: FinalEventScore[];
}

/** Score a single anchor date against pre-computed place-affinity layers.
 *  Use this in tight loops (daily / monthly / range scans) — caller computes
 *  `layers` once via `computePlaceAffinityLayers` and reuses across every
 *  call. Returns the fused headline score plus the contributing event rows. */
export function scoreAtAnchor(args: ScoreAtAnchorArgs): ScoreAtAnchorResult {
    const tm = computeTransitModifiersAtAnchor(
        args.transits,
        args.centerISO,
        args.goalIds,
        args.natalPlanetHouse,
        args.halfWidthDays,
    );
    const eventScores = finalizeEventScoresFromLayers(
        args.layers,
        tm,
        args.skyState ? computeSkyModifier(args.skyState) : null,
        computeStationEventModifier(args.stationContributions ?? undefined),
    );
    const score = computeFusedReadingHeadline(eventScores, args.selectedGoalIndices);
    const drivers = topDriversAtAnchor(
        args.transits,
        args.centerISO,
        args.goalIds,
        args.halfWidthDays ?? HALF_WIDTH_DAYS,
    );
    return { score, drivers, eventScores };
}

// ─── Fused scored windows ─────────────────────────────────────────────────────

export interface BuildFusedScoredWindowsArgs {
    travelDateISO: string | null;
    matrixResult: HouseMatrixResult;
    relocatedPlanets: OccupancyPlanet[];
    transits: TransitHit[];
    goalIds: string[];
    selectedGoalIndices?: number[] | null;
    natalPlanetHouse: Map<string, number>;
}

const WINDOW_OFFSETS: Array<{ days: number; label: string }> = [
    { days:   0, label: "Your dates" },
    { days: -14, label: "Two weeks earlier" },
    { days:  14, label: "Two weeks later" },
    { days:  28, label: "A month later" },
];

/** Build the hero window + alternates anchored on travelDate using the fused
 *  scoring engine (place affinity + transit modifiers → fused headline). */
export function buildFusedScoredWindows(args: BuildFusedScoredWindowsArgs): ScoredWindow[] {
    if (!args.travelDateISO) return [];
    const center = new Date(args.travelDateISO);
    if (isNaN(center.getTime())) return [];

    // Layers don't depend on the date — compute once.
    const layers = computePlaceAffinityLayers(args.matrixResult, args.relocatedPlanets);

    return WINDOW_OFFSETS.map(({ days, label }) => {
        const c = new Date(center.getTime() + days * 86_400_000);
        const start = new Date(c.getTime() - HALF_WIDTH_DAYS * 86_400_000);
        const end = new Date(c.getTime() + HALF_WIDTH_DAYS * 86_400_000);
        const tm = computeTransitModifiersAtAnchor(
            args.transits,
            c.toISOString(),
            args.goalIds,
            args.natalPlanetHouse,
        );
        const eventScores = finalizeEventScoresFromLayers(layers, tm);
        const score = computeFusedReadingHeadline(eventScores, args.selectedGoalIndices);
        const drivers = topDriversAtAnchor(args.transits, c.toISOString(), args.goalIds, HALF_WIDTH_DAYS);
        return {
            label,
            centerISO: c.toISOString(),
            startISO: start.toISOString(),
            endISO: end.toISOString(),
            score,
            drivers,
        };
    });
}
