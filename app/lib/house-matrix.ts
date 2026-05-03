/**
 * house-matrix.ts — 12-House Matrix Scoring Engine v4.
 * V4 adds: 5-tier Lilly dignities, sect modulation, inner/outer planet split,
 * Planetary Joys in house loop, Combustion/Cazimi, Hayz, Lilly accidental
 * dignity points, and angle-strength weighting (ASC > MC > DSC > IC).
 *
 * Computes a per-house score (0–100) for every astrological house
 * based on relocated cusps, ruler dignity, occupant planets,
 * ACG line proximity (benefic boost / malefic penalty), geodetic
 * grid alignment, transits, retrogrades, parans (nuanced), Arabic
 * Parts, natal-relocated bridge, and a global avoid-window penalty.
 *
 * v3 additions:
 *   - Latitude-aware house system (Placidus vs Whole Sign)
 *   - Nuanced paran scoring with aspect, dignity, and angular position
 *   - Lot of Fortune / Spirit house placement bonus
 *   - Natal → Relocated house bridge modifier
 *
 * The macroScore decomposes cleanly into:
 *   personalScore  (0–70) — weighted avg of identity/personal houses
 *   collectiveScore (0–30) — weighted avg of travel/collective houses
 *   macroScore = personalScore + collectiveScore  ← always holds
 *
 * Travel-context weighting for collective bucket:
 *   H9  40% — long journeys, international travel, foreign culture
 *   H12 30% — foreign lands, long stays, emigration
 *   H3  15% — short trips, short-distance travel
 *   H8  10% — shared resources, transformation abroad
 *   H6   5% — health, daily routine
 */

import {
    SIGN_RULERS,
    BENEFIC_PLANETS,
    LUMINARIES,
    HOUSE_THEMES,
    STRONG_MALEFICS,
    resolveChartRuler,
    type ChartRulerInfo,
} from "./astro-constants";
import { KNOWN_BENEFIC_COMBOS, KNOWN_MALEFIC_COMBOS, getOccupantModifier, applySectModulation, W_EVENTS } from "./planet-library";
import { essentialDignityScore, essentialDignityLabel } from "./dignity";
import {
    signFromLongitude,
    houseFromLongitude,
    geodeticMCLongitude,
    geodeticASCLongitude,
    geodeticHouseCusps,
    geodeticHouseFromLongitude,
} from "./geodetic";
import { computeHouseNumber } from "./house-system";
import { isOuterPlanet, computeOuterPlanetScore } from "./outer-planet-scoring";
import { scoreAngleTransits, type AngleName, type AngleTransitContribution } from "./geodetic/angle-transits";
import { scoreNatalWorldPoints, type NatalWorldPointsResult } from "./geodetic/natal-world-points";
import { scorePersonalEclipses, type PersonalEclipsesResult, type PersonalEclipseHit } from "./geodetic/personal-eclipses";
import { scorePersonalLunations, type PersonalLunationsResult, type PersonalLunationHit } from "./geodetic/personal-lunations";
import {
    computeMidpointTriggers,
    compute45HarmonicHits,
    computeModalityCohorts,
    type MidpointTrigger,
    type HarmonicHit,
    type ModalityCohort,
} from "./geodetic/harmonic-triggers";
import type { ProgressionsResult } from "./progressions";
import type { ComputedPosition } from "@/lib/astro/transits";
import { WIDE_SCORING_V1 } from "./scoring-flags";



// ── Input types ───────────────────────────────────────────────────────────

export interface MatrixNatalPlanet {
    planet?: string;       // name of the planet (e.g. "Sun")
    name?: string;         // alias for planet (used by some Swisseph hooks)
    sign: string;
    longitude: number;
    retrograde: boolean;
    house?: number;        // natal house (from birth chart)
    dignity?: string;
    /** Daily speed in degrees/day — enables outer planet speed bonus */
    speed?: number;
}

export interface MatrixACGLine {
    planet: string;
    angle: string;         // MC | IC | ASC | DSC
    distance_km: number;
}

export interface MatrixTransit {
    targetHouse?: number;
    transitPlanet?: string;
    natalPlanet?: string;
    aspect?: string;
    orb?: number;
    applying?: boolean;
    benefic?: boolean;
    /** Is the transiting planet currently retrograde? */
    transitRx?: boolean;
    /** Which house does this transiting planet rule in the relocated chart? */
    rulerOf?: number;
}

export interface MatrixParan {
    p1: string;
    p2: string;
    lat: number;
    type?: string;         // e.g., "ASC/DSC" — angular positions
    aspect?: string;       // aspect between the two planets (if available)
    p1Dignity?: string;    // essential dignity of p1 in natal chart
    p2Dignity?: string;    // essential dignity of p2 in natal chart
}

// ── Output types ──────────────────────────────────────────────────────────

export interface HouseBreakdown {
    base: number;
    globalPenalty: number;
    dignity: number;
    occupants: number;
    acgLine: number;
    geodetic: number;
    /** A1: live transit on the destination's geodetic angle (MC/IC/ASC/DSC).
     *  Routed to H10/H4/H1/H7 respectively. Doubled when the same transit
     *  longitude also conjuncts a natal planet (the PDF "personal activation"
     *  case). Capped ±20 to keep bucketGeodetic inside its 15% budget. */
    geodeticTransit: number;
    /** A2: per-house share of the natal world-points aggregate. Non-zero
     *  only on H1 and H10 (identity / career angles). Capped ±12. */
    worldPoints: number;
    /** A3: chart-ruler relocation bias. Applied only at the relocated
     *  house the ruler lands in: +10 if ruler is angular (1/4/7/10),
     *  −5 otherwise (reflects the PDF's claim that an angular relocated
     *  ruler is what makes a place "feel" personally lit up). */
    chartRuler: number;
    /** A4: personal-eclipse-on-geodetic-zone penalty. Negative-only;
     *  fires only when an eclipse degree both lights up the destination's
     *  geo-angle AND conjuncts a natal planet within ±3°. Routed to the
     *  matching angular house. Per-house cap −10. */
    eclipsePenalty: number;
    /** A9: ordinary-lunation-on-geodetic-zone modifier. Bidirectional —
     *  new moons add (+), full moons subtract (−). Same gating as A4
     *  (zone + natal contact both required). Per-house cap ±6. */
    lunation: number;
    /** A5: secondary-progressions soft alignment. +5 when the destination
     *  longitude falls in the progressed-Sun band, +2 when it also falls
     *  in the progressed-Moon band. Identical across all 12 houses (the
     *  signal is a global background field, not per-house). */
    progression: number;
    transits: number;
    retrograde: number;
    transitRx: number;
    paran: number;
    natalBridge: number;
    lotBonus: number;
    // P1-B: 4-bucket decomposition for debugging/transparency
    bucketNatal: number;
    bucketOccupants: number;
    bucketTransit: number;
    bucketGeodetic: number;
}

/** A1: one row per (transit planet × geodetic angle) hit. Surfaced at the
 *  top level of HouseMatrixResult so the UI can render "this place is lit
 *  up right now by Jupiter on the MC" without re-running the math. */
export interface GeoTransitActivation {
    planet: string;
    angle: AngleName;
    house: number;          // 1, 4, 7, or 10
    orb: number;
    severity: number;       // signed contribution (post personal-activation doubling)
    direction: "benefic" | "malefic" | "luminary" | "neutral";
    /** True iff transit longitude is also within ±3° of a natal planet —
     *  the PDF "particularly ripe" case. */
    personalActivation: boolean;
    /** Name of the natal planet the transit conjuncts, when personalActivation. */
    natalContact?: string;
    /** Tightest natal orb (degrees), when personalActivation. */
    natalOrb?: number;
}

export interface HouseScore {
    house: number;
    sphere: string;
    relocatedSign: string;
    rulerPlanet: string;
    rulerCondition: string;   // "Domicile" | "Exalted" | "Peregrine" | "Detriment" | "Fall"
    score: number;
    status: string;           // "Peak Flow" | "Highly Favorable" | "Favorable" | "Neutral" | "Challenging" | "Severe Friction"
    breakdown: HouseBreakdown;
}

export interface HouseMatrixResult {
    houses: HouseScore[];
    macroScore: number;
    macroVerdict: string;
    houseSystem: string;     // NEW: "placidus" | "whole-sign"
    lotOfFortune?: { longitude: number; house: number; sign: string };
    lotOfSpirit?: { longitude: number; house: number; sign: string };
    /** A1: live geodetic-angle transit hits at the destination, sorted by
     *  |severity| desc. Empty array when no transits are within orb. */
    activeGeoTransits?: GeoTransitActivation[];
    /** A2: aggregate score + per-planet hits for natal planets within ±5°
     *  of one of the 8 sensitive degrees (0° cardinal / 15° fixed). */
    natalWorldPoints?: NatalWorldPointsResult;
    /** A3: relocated chart-ruler info. Surfaced even when the ruler isn't
     *  found among natal planets (e.g. partner readings without the
     *  full set), so the UI can still render the ASC sign. */
    chartRuler?: ChartRulerInfo;
    /** A4: eclipses in [refDate ± 180d] that both light up the destination's
     *  geo-angle AND conjunct a natal planet. Empty `hits` when nothing
     *  qualifies; aggregate 0 in that case. */
    personalEclipses?: PersonalEclipsesResult;
    /** A5: progressed-Sun / progressed-Moon longitude bands at the
     *  reference date. Surfaced verbatim from the helper. */
    progressedBands?: ProgressionsResult;
    /** A6: transits within ±1.5° of a natal-planet midpoint. Informational
     *  only — no bucket weight applied yet. */
    midpointTriggers?: MidpointTrigger[];
    /** A6: transits forming 45° or 135° harmonics to natal planets.
     *  Informational only. */
    harmonic45Hits?: HarmonicHit[];
    /** A8: pairs of late-degree malefic transits in the same modality —
     *  flag for "anything in late {modality} signs is exposed." */
    modalityCohorts?: ModalityCohort[];
    /** A9: ordinary lunations (new/full moons in ±30d) that hit the
     *  destination's geo-angle AND a natal planet. Mirrors A4 eclipses
     *  but with smaller magnitudes — aggregate capped ±10. Empty when
     *  refDate is not provided. */
    personalLunations?: PersonalLunationsResult;
    /** A10: per-natal-planet whole-sign geodetic house assignment for the
     *  destination. Surfaces "natal Mercury falls in geodetic H10 here" so
     *  the UI can build a geodetic house wheel. Cusps are also exposed. */
    geodeticHouseFrame?: {
        cusps: number[]; // 12 cusps in ecliptic-longitude order
        natalAssignments: Array<{ planet: string; longitude: number; house: number }>;
    };
    /** A11: deduped paran lines that cross within a meaningful band of the
     *  destination's latitude, with each paran's aspect/dignity-aware score.
     *  Sorted by |contribution| desc. Same scoring lives in the per-house
     *  loop; this exposes the underlying rows for the UI without changing
     *  the score. Empty array when no parans were passed in. */
    parans?: ParanRow[];
}

/** Public row used by the Place Field tab to render a paran list + map.
 *  `latOffset = par.lat - destLat` (positive = paran is north of you). */
export interface ParanRow {
    p1: string;
    p2: string;
    lat: number;
    type?: string;
    aspect?: string;
    latOffset: number;
    contribution: number;
}

// ── Hoisted Matrix Constants ──────────────────────────────────────────────

// Gap 3: Lilly additive accidental dignity points (Operator Inflation x3)
// H1/H10 = +15, H4/H7 = +12, H11 = +9, H5/H9 = +6, H2/H3/H8 = +3, H6/H12 = -6
// WIDE_SCORING_V1: H6/H12 malus reduced to -2 to lift the cadent floor that was
// making Health (anchored on H6) and Spirituality (anchored on H12) unreachable.
const LILLY_ACCIDENTAL: Record<number, number> = WIDE_SCORING_V1
    ? { 1: 15, 10: 15, 4: 12, 7: 12, 11: 9, 5: 6, 9: 6, 2: 3, 3: 3, 8: 3, 6: -2, 12: -2 }
    : { 1: 15, 10: 15, 4: 12, 7: 12, 11: 9, 5: 6, 9: 6, 2: 3, 3: 3, 8: 3, 6: -6, 12: -6 };

// Hellenistic Planetary Joys
const PLANETARY_JOYS: Record<string, number> = {
    mercury: 1, moon: 3, venus: 5, mars: 6, sun: 9, jupiter: 11, saturn: 12,
};

// Signs by gender (masculine = positive/yang; feminine = negative/yin)
const MASCULINE_SIGNS = ["Aries","Gemini","Leo","Libra","Sagittarius","Aquarius"];

// Sect planets for Hayz
const DAY_SECT_PLANDS  = ["sun", "jupiter", "saturn"];
const NIGHT_SECT_PLANDS = ["moon", "venus", "mars"];

// Gap 6: Angle-strength weighting for ACG Lines
const ANGLE_STRENGTH: Record<string, number> = {
    ASC: 1.20,  // Strongest: planet on the horizon, direct expression
    MC:  1.10,  // Second: planet culminating, visible/public
    DSC: 0.95,  // Slightly reduced: reactive, partner-projected
    IC:  0.90,  // Least angular for public scoring: private/roots
};

// ACG line raw-contribution constants — same values used inside Step 4 of
// computeHouseMatrix below. Hoisted so per-line scoring is exact, not
// approximate.
const ACG_SIGMA_KM = 250;
const ACG_SIGMA_SQ_2 = 2 * ACG_SIGMA_KM * ACG_SIGMA_KM;

/**
 * Per-line raw contribution to the geodetic bucket — the same math the
 * house matrix runs internally for each line, exposed so the V4 view can
 * render a `+N` chip per row that traces back to the §01 score.
 *
 * Sign convention: positive lifts the bucket (benefics, luminaries),
 * negative drops it (strong malefics). Magnitude decays with distance²
 * (Gaussian, σ = 250 km) and scales by angle strength (ASC > MC > DSC > IC).
 */
export function acgLineRawScore(line: { planet: string; angle: string; distance_km: number }): number {
    const pName = (line.planet || "").toLowerCase();
    const angleKey = (line.angle || "").toUpperCase();
    let baseInfluence = 10;
    if (BENEFIC_PLANETS.includes(pName))      baseInfluence = 30;
    else if (LUMINARIES.includes(pName))       baseInfluence = 18;
    else if (STRONG_MALEFICS.includes(pName))  baseInfluence = -25;
    const angleScale = ANGLE_STRENGTH[angleKey] ?? 1.0;
    const km = Number(line.distance_km);
    if (!isFinite(km) || km < 0) return 0;
    return Math.round(
        baseInfluence * angleScale * Math.exp(-(km * km) / ACG_SIGMA_SQ_2),
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Min-Max Normalization Helper
 * Normalizes a bucket score linearly between its theoretical Min and Max bounds,
 * returning a scaled value strictly [0, 100].
 */
function normalizeBucket(raw: number, minBound: number, maxBound: number): number {
    const clamped = Math.max(minBound, Math.min(maxBound, raw));
    return ((clamped - minBound) / (maxBound - minBound)) * 100;
}

/** Angular diff (always 0–180) */
function angularDiff(a: number, b: number): number {
    let d = Math.abs(a - b) % 360;
    if (d > 180) d = 360 - d;
    return d;
}

/** Status label from score */
function statusFromScore(score: number): string {
    if (score >= 85) return "Peak Flow";
    if (score >= 70) return "Highly Favorable";
    if (score >= 55) return "Favorable";
    if (score >= 40) return "Neutral";
    if (score >= 25) return "Challenging";
    return "Severe Friction";
}

/** Map angle name to its natural house */
const ANGLE_TO_HOUSE: Record<string, number> = { MC: 10, IC: 4, ASC: 1, DSC: 7 };

/**
 * Natal→Relocated bridge modifier.
 * When a planet occupies different houses natally vs relocated, the natal theme
 * "channels through" the relocated house. Compatible combos boost, clashing reduce.
 */
function natalBridgeModifier(natalHouse: number, relocatedHouse: number, planetName: string): number {
    if (natalHouse === relocatedHouse) return 0; // No shift, no bridge

    const p = planetName.toLowerCase();
    const isBeneficPlanet = BENEFIC_PLANETS.includes(p);
    const isMaleficPlanet = STRONG_MALEFICS.some(m => p.includes(m));

    // Travel-relevant house pairings get extra weight
    const travelHouses = [3, 9, 12];
    const careerHouses = [2, 6, 10];
    const relationshipHouses = [5, 7, 11];

    const natalInTravel = travelHouses.includes(natalHouse);
    const relocInTravel = travelHouses.includes(relocatedHouse);
    const natalInCareer = careerHouses.includes(natalHouse);
    const relocInCareer = careerHouses.includes(relocatedHouse);
    const natalInRelation = relationshipHouses.includes(natalHouse);
    const relocInRelation = relationshipHouses.includes(relocatedHouse);

    // Synergistic bridge: natal theme aligns with relocated context
    const synergy = (natalInTravel && relocInTravel) ||
                    (natalInCareer && relocInCareer) ||
                    (natalInRelation && relocInRelation);

    if (synergy && isBeneficPlanet) return 8;
    if (synergy && !isMaleficPlanet) return 5;
    if (synergy && isMaleficPlanet) return -3; // Malefic synergy still challenging

    // Cross-context: natal theme enters different life area — mild modifier
    if (isBeneficPlanet) return 3;
    if (isMaleficPlanet) return -2;
    return 1;
}

/**
 * Nuanced paran scorer — uses aspect type, planet dignity, known combination
 * ratings, and angular position to determine paran influence.
 */
function scoreParanNuanced(
    par: MatrixParan,
    destLat: number,
    natalPlanets: MatrixNatalPlanet[],
): number {
    if (Math.abs(par.lat - destLat) > 1) return 0; // Out of range

    const p1 = par.p1.toLowerCase();
    const p2 = par.p2.toLowerCase();

    // 1. Check known combination ratings first
    const comboKey = [p1, p2].sort().join("|");
    const knownBenefic = KNOWN_BENEFIC_COMBOS[comboKey];
    const knownMalefic = KNOWN_MALEFIC_COMBOS[comboKey];

    if (knownBenefic !== undefined || knownMalefic !== undefined) {
        let base = knownBenefic ?? knownMalefic ?? 0;

        // Modify by natal dignity if available
        const p1Dignity = par.p1Dignity ?? findNatalDignity(p1, natalPlanets);
        const p2Dignity = par.p2Dignity ?? findNatalDignity(p2, natalPlanets);

        if (base > 0) {
            // Benefic combo boosted by dignity
            if (isDignified(p1Dignity) && isDignified(p2Dignity)) base = Math.round(base * 1.3);
            else if (isAfflicted(p1Dignity) || isAfflicted(p2Dignity)) base = Math.round(base * 0.6);
        } else {
            // Malefic combo softened if malefic planet is dignified (Saturn exception)
            const maleficPlanet = STRONG_MALEFICS.some(m => p1.includes(m)) ? p1 : p2;
            const maleficDignity = maleficPlanet === p1 ? p1Dignity : p2Dignity;
            if (isDignified(maleficDignity)) base = Math.round(base * 0.4); // Significantly softened
        }

        // Tighter latitude = stronger effect
        const latProximity = Math.abs(par.lat - destLat);
        if (latProximity <= 0.3) base = Math.round(base * 1.2);

        return Math.max(-25, Math.min(22, base));
    }

    // 2. Generic scoring when combo isn't in lookup tables
    const hasBenefic = BENEFIC_PLANETS.some(b => p1.includes(b) || p2.includes(b));
    const hasMalefic = STRONG_MALEFICS.some(m => p1.includes(m) || p2.includes(m));

    // Check if aspect info is available
    const aspect = (par.aspect || "").toLowerCase();
    const isHarmonious = aspect.includes("trine") || aspect.includes("sextile");
    const isChallenging = aspect.includes("square") || aspect.includes("opposition");

    // Check dignity
    const p1Dignity = par.p1Dignity ?? findNatalDignity(p1, natalPlanets);
    const p2Dignity = par.p2Dignity ?? findNatalDignity(p2, natalPlanets);

    if (hasBenefic && !hasMalefic) {
        let score = 15;
        if (isHarmonious) score += 5;
        if (isDignified(p1Dignity) || isDignified(p2Dignity)) score += 3;
        return Math.min(22, score);
    }

    if (hasMalefic && !hasBenefic) {
        let score = -18;
        // Saturn exception: well-dignified Saturn is neutral/mildly positive
        if ((p1.includes("saturn") || p2.includes("saturn")) &&
            !p1.includes("pluto") && !p2.includes("pluto")) {
            const satDignity = p1.includes("saturn") ? p1Dignity : p2Dignity;
            if (isDignified(satDignity)) return 5; // Dignified Saturn = stability
        }
        if (isChallenging) score -= 5;
        if (isAfflicted(p1Dignity) || isAfflicted(p2Dignity)) score -= 3;
        return Math.max(-25, score);
    }

    // Mixed benefic + malefic
    if (hasBenefic && hasMalefic) {
        if (isHarmonious) return 5;
        if (isChallenging) return -8;
        return -3;
    }

    return 0; // Neutral planets
}

/** Look up a planet's dignity from natal data */
function findNatalDignity(planetName: string, natalPlanets: MatrixNatalPlanet[]): string {
    const np = natalPlanets.find(p => (p.planet || (p as any).name || "").toLowerCase() === planetName);
    return np?.dignity || "peregrine";
}

function isDignified(dignity: string): boolean {
    const d = (dignity || "").toLowerCase();
    return d.includes("domicile") || d.includes("exalted") || d.includes("exaltation");
}

function isAfflicted(dignity: string): boolean {
    const d = (dignity || "").toLowerCase();
    return d.includes("detriment") || d.includes("fall");
}

// ── Core Engine ───────────────────────────────────────────────────────────

export function computeHouseMatrix(params: {
    natalPlanets: MatrixNatalPlanet[];
    relocatedCusps: number[];
    acgLines: MatrixACGLine[];
    transits: MatrixTransit[];
    parans: MatrixParan[];
    destLat: number;
    destLon: number;
    /** Global timing penalty (0–25) applied to all house base scores.
     *  Derived from tense applying hard transits (Mars sq Uranus, etc.) */
    globalPenalty?: number;
    /** Birth latitude — determines Placidus vs Whole Sign house system */
    birthLat?: number;
    /** Lot of Fortune ecliptic longitude (pre-computed) */
    lotOfFortuneLon?: number;
    /** Lot of Spirit ecliptic longitude (pre-computed) */
    lotOfSpiritLon?: number;
    /**
     * P0-B: Day/night sect of the natal chart.
     * Computed via determineSect(sunLon, ascLon) from arabic-parts.ts.
     * Enables sect-aware occupant scoring (in-sect vs out-of-sect modulation).
     */
    sect?: "day" | "night";
    /** Optional array of selected goal indexes to simulate Intent-Driven Mode */
    selectedGoals?: number[];
    /** A1: raw transiting-planet positions at the reference date. Powers
     *  Step 5b (transit-on-geodetic-angle activation). When omitted, Step
     *  5b contributes 0 and `activeGeoTransits` is an empty array. */
    transitPositions?: ComputedPosition[];
    /** A4: reference date for the eclipse-window scan. Typically the
     *  travel date. When omitted, A4 contributes 0 and `personalEclipses`
     *  is undefined. */
    refDate?: Date;
    /** A5: precomputed secondary-progression bands. Async by nature, so
     *  the caller resolves them and hands them to the sync engine. */
    progressedBands?: ProgressionsResult;
}): HouseMatrixResult {
    const {
        natalPlanets,
        relocatedCusps,
        acgLines,
        transits,
        parans,
        destLat,
        destLon,
        globalPenalty = 0,
        birthLat,
        lotOfFortuneLon,
        lotOfSpiritLon,
        sect,
        selectedGoals,
        transitPositions,
        refDate,
        progressedBands,
    } = params;

    // Determine house system
    const usesBirthLat = birthLat !== undefined;
    const houseSystem = usesBirthLat
        ? (Math.abs(birthLat) >= 66 ? "whole-sign" : "placidus")
        : "whole-sign"; // Default to whole-sign if no birth lat

    // Relocated ASC longitude (cusp 1)
    const ascLon = relocatedCusps.length >= 1 ? relocatedCusps[0] : 0;

    // Resolve house number for a planet using the appropriate system
    const getHouseNum = (planetLon: number): number => {
        if (houseSystem === "placidus" && relocatedCusps.length >= 12) {
            return computeHouseNumber(planetLon, ascLon, relocatedCusps, birthLat!);
        }
        return houseFromLongitude(planetLon, ascLon);
    };

    // Compute Lot of Fortune / Spirit house placements
    let lotFortuneHouse: number | undefined;
    let lotSpiritHouse: number | undefined;
    if (lotOfFortuneLon !== undefined) {
        lotFortuneHouse = getHouseNum(lotOfFortuneLon);
    }
    if (lotOfSpiritLon !== undefined) {
        lotSpiritHouse = getHouseNum(lotOfSpiritLon);
    }

    // Fixed geodetic angles at destination
    const geoMC  = geodeticMCLongitude(destLon);
    const geoASC = geodeticASCLongitude(destLon, destLat);
    const geoAngles = [
        { lon: geoMC,                    house: 10 },
        { lon: (geoMC + 180) % 360,     house: 4 },
        { lon: geoASC,                   house: 1 },
        { lon: (geoASC + 180) % 360,    house: 7 },
    ];

    // ── A1 precompute: live transit hits on the four geodetic angles ──
    // PDF p.5–6: "When transiting Jupiter is at 15° Capricorn it lights up
    // the 75°–90°W band — eastern North America. If your natal Sun also sits
    // at 15° Capricorn, that region is particularly ripe."
    //
    // We reuse the mundane scorer for the angle-transit math, then layer a
    // PERSONAL ACTIVATION check (transit lon ≈ any natal planet ±3°) and
    // double the contribution when that condition holds. Hits are routed to
    // the house ruled by their angle: ASC→1, IC→4, DSC→7, MC→10.
    const ANGLE_TO_HOUSE_GEO: Record<AngleName, number> = {
        ASC: 1, IC: 4, DSC: 7, MC: 10,
    };
    const PERSONAL_ACTIVATION_ORB = 3;
    const PER_HOUSE_GEO_TRANSIT_CAP = 20;

    const geoTransitByHouse = new Map<number, number>();
    const activeGeoTransits: GeoTransitActivation[] = [];

    if (transitPositions && transitPositions.length > 0) {
        const angleHits = scoreAngleTransits({
            positions: transitPositions,
            geoMC,
            geoASC,
        });

        for (const c of angleHits.contributions) {
            // Personal activation: any natal planet within ±3° of this transit's
            // ecliptic longitude? Use the tightest match.
            const transitLon = transitPositions.find(
                (p) => p.name.toLowerCase() === c.planet.toLowerCase(),
            )?.longitude;

            let natalContact: string | undefined;
            let natalOrb: number | undefined;
            if (transitLon !== undefined) {
                for (const np of natalPlanets) {
                    const npName = (np.planet || (np as any).name || "");
                    if (!npName) continue;
                    const d = angularDiff(transitLon, np.longitude);
                    if (d <= PERSONAL_ACTIVATION_ORB && (natalOrb === undefined || d < natalOrb)) {
                        natalContact = npName;
                        natalOrb = Math.round(d * 100) / 100;
                    }
                }
            }
            const personalActivation = natalContact !== undefined;

            const severity = personalActivation ? c.severity * 2 : c.severity;
            const targetHouse = ANGLE_TO_HOUSE_GEO[c.angle];

            geoTransitByHouse.set(
                targetHouse,
                (geoTransitByHouse.get(targetHouse) ?? 0) + severity,
            );
            activeGeoTransits.push({
                planet: c.planet,
                angle: c.angle,
                house: targetHouse,
                orb: c.orb,
                severity,
                direction: c.direction,
                personalActivation,
                natalContact,
                natalOrb,
            });
        }
        activeGeoTransits.sort((a, b) => Math.abs(b.severity) - Math.abs(a.severity));
    }

    // ── A2 precompute: natal planets at the 8 sensitive degrees ─────────
    // PDF p.2: cardinal 0° + fixed 15° = "world axis." Natal planets within
    // orb of these get a public-visibility boost, applied to H1 (identity)
    // and H10 (career) only — the angles where this trait expresses.
    const natalWorldPoints = scoreNatalWorldPoints(natalPlanets);
    const WORLD_POINTS_HOUSES = new Set([1, 10]);

    // ── A3 precompute: chart-ruler relocation ────────────────────────────
    // PDF p.7 (Brandon Jakarta→NYC example): same Venus chart-ruler, new
    // relocated house = different trip flavor. Bias the relocated ruler's
    // house only — angular = +10, otherwise −5.
    const relocatedCuspSigns = relocatedCusps.map((c) => signFromLongitude(c));
    const chartRuler = resolveChartRuler({
        relocatedAscLon: ascLon,
        natalPlanets,
        getRelocatedHouse: getHouseNum,
        relocatedCuspSigns,
    }) ?? undefined;
    const chartRulerHouse = chartRuler?.rulerRelocatedHouse;
    // Chart ruler is the strongest place-driven natal signal. The bias is
    // applied to the house holding the ruler (full strength), to its two
    // adjacent houses (half strength via chartRulerNeighborBias inside the
    // per-house loop), and as a smaller global lift on every house. Together
    // these widen the angular-vs-cadent macro gap from ~4 pts to ~12-15 pts.
    const chartRulerBias = chartRuler?.rulerAngular ? 18 : -8;
    // Always-on global lift (was previously gated on WIDE_SCORING_V1). Acts
    // as the "this whole place feels lit up" baseline shift.
    const chartRulerGlobalLift = chartRuler ? (chartRuler.rulerAngular ? 8 : -4) : 0;
    const chartRulerNeighborStrength = chartRuler?.rulerAngular ? 9 : -4; // ~half of bias

    // ── A4 precompute: personal eclipse hits at the destination ──────────
    // PDF p.4: "Hold off when ... an eclipse is activating that zone,
    // ESPECIALLY if it hits a difficult planet in your natal chart." The
    // helper enforces that conjunction — only hits with both a geo-angle
    // activation AND a natal contact survive. Per-house penalty cap −10.
    const ECLIPSE_ANGLE_TO_HOUSE: Record<PersonalEclipseHit["activatedAngle"], number> = {
        geoMC: 10, geoIC: 4, geoASC: 1, geoDSC: 7,
    };
    const PER_HOUSE_ECLIPSE_CAP = -10;
    const personalEclipses = refDate
        ? scorePersonalEclipses({ refDate, destLat, destLon, natalPlanets })
        : { aggregate: 0, hits: [] as PersonalEclipseHit[] };
    const eclipsePenaltyByHouse = new Map<number, number>();
    for (const hit of personalEclipses.hits) {
        const targetHouse = ECLIPSE_ANGLE_TO_HOUSE[hit.activatedAngle];
        eclipsePenaltyByHouse.set(
            targetHouse,
            (eclipsePenaltyByHouse.get(targetHouse) ?? 0) + hit.severity,
        );
    }

    // ── A5: global progression bias ──────────────────────────────────────
    // PDF p.5: progressed Sun/Moon entering a new sign shifts the
    // personally-activated longitude band. Already aggregated by the helper
    // (+5 Sun match, +2 Moon match). Audit fix: cap raised ±7 → ±15 so
    // progressions can actually shift narrative weight; was rendering as
    // ~1% of total score, too quiet to register.
    const progressionAggregate = Math.max(-15, Math.min(15, progressedBands?.aggregate ?? 0));

    // ── A9: personal lunations (gap-fill from geodetic audit) ────────────
    // Same gating as eclipses (geo-angle + natal contact both required) but
    // smaller magnitudes (±5 per hit, ±10 aggregate). Routed to the same
    // angle→house mapping. Surfaced top-level for narrative consumers.
    const LUNATION_ANGLE_TO_HOUSE: Record<PersonalLunationHit["activatedAngle"], number> = {
        geoMC: 10, geoIC: 4, geoASC: 1, geoDSC: 7,
    };
    const PER_HOUSE_LUNATION_CAP = 6;
    const personalLunations = refDate
        ? scorePersonalLunations({ refDate, destLat, destLon, natalPlanets })
        : { aggregate: 0, hits: [] as PersonalLunationHit[] };
    const lunationByHouse = new Map<number, number>();
    for (const hit of personalLunations.hits) {
        const targetHouse = LUNATION_ANGLE_TO_HOUSE[hit.activatedAngle];
        lunationByHouse.set(
            targetHouse,
            (lunationByHouse.get(targetHouse) ?? 0) + hit.severity,
        );
    }

    // ── A10: geodetic house wheel for the destination ───────────────────
    // Per-planet whole-sign assignment so consumers can render "natal
    // Saturn falls in geodetic H10 here." Distinct from the relocated
    // chart's house assignments (which use the relocated ASC, not geo-ASC).
    const geodeticCusps = geodeticHouseCusps(destLat, destLon);
    const geodeticAssignments = natalPlanets
        .map((p) => {
            const name = (p.planet ?? (p as any).name ?? "").trim();
            if (!name) return null;
            return {
                planet: name,
                longitude: p.longitude,
                house: geodeticHouseFromLongitude(p.longitude, destLat, destLon),
            };
        })
        .filter((x): x is { planet: string; longitude: number; house: number } => x !== null);

    // ── A6 + A8: harmonic / midpoint / modality flags (informational) ────
    // No scoring weight in this pass — surfaced for narrative consumers.
    const harmonicSafeTransits = transitPositions ?? [];
    const midpointTriggers = harmonicSafeTransits.length > 0
        ? computeMidpointTriggers({ natalPlanets, transitPositions: harmonicSafeTransits })
        : [];
    const harmonic45Hits = harmonicSafeTransits.length > 0
        ? compute45HarmonicHits({ natalPlanets, transitPositions: harmonicSafeTransits })
        : [];
    const modalityCohorts = harmonicSafeTransits.length > 0
        ? computeModalityCohorts({ transitPositions: harmonicSafeTransits })
        : [];

    const houses: HouseScore[] = [];

    for (let h = 1; h <= 12; h++) {
        const cuspLon = relocatedCusps[h - 1] ?? ((ascLon + (h - 1) * 30) % 360);
        const cuspSign = signFromLongitude(cuspLon);
        const ruler = SIGN_RULERS[cuspSign] || "Sun";
        const rulerNatal = natalPlanets.find(
            (p) => (p.planet || (p as any).name || "").toLowerCase() === ruler.toLowerCase(),
        );

        // ── Step 1: Baseline by house type + global timing penalty ────
        // Lifted +3 across the board (was 55/50/45) so the cadent floor
        // sits above the "Severe Friction" band even with max penalty
        // applied. Pairs with the lowered penalty cap (12 not 25) so the
        // typical reading no longer starts ~25 pts in the hole.
        const angularHouses  = [1, 4, 7, 10];
        const succedentHouses = [2, 5, 8, 11];
        const baseNatural = angularHouses.includes(h) ? 58 : succedentHouses.includes(h) ? 52 : 48;
        const base = Math.max(10, baseNatural - globalPenalty);

        // ── Step 2: Ruler Dignity × Lilly Accidental Points (Gap 3+P0-A) ────
        const rulerSign = rulerNatal?.sign || cuspSign;
        // Extract within-sign degree for Term/Face scoring
        const rulerDegree = rulerNatal?.longitude !== undefined
            ? ((rulerNatal.longitude % 360) + 360) % 360 % 30
            : undefined;
        const dignityPts = essentialDignityScore(ruler, rulerSign, rulerDegree, sect);
        // Gap 3: Lilly additive accidental dignity points (replaces multiplier)
        // H1/H10 = +5, H4/H7 = +4, H11 = +3, H5/H9 = +2, H2/H3/H8 = +1, H6/H12 = -2
        const accidentalPts = LILLY_ACCIDENTAL[h] ?? 0;
        const dignity = dignityPts + accidentalPts;
        const rulerCondition = essentialDignityLabel(ruler, rulerSign, rulerDegree, sect);

        // ── Step 3: Occupant Planets (sect + joys + combustion/cazimi + hayz) ──
        //
        // Gap 2:  Planetary Joys — planet in joy house gets a direct bonus
        // Gap 4:  Combustion (within 8° of Sun) = ×0.3; Cazimi (within 0.28°) = ×2.5
        // Gap 5:  Hayz — in-sect + correct hemisphere + matching sign gender = +12

        // Find Sun longitude for combustion/cazimi checks
        const sunPlanet = natalPlanets.find(
            p => (p.planet || (p as any).name || "").toLowerCase() === "sun"
        );
        const sunLon = sunPlanet?.longitude;

        let occupants = 0;
        for (const p of natalPlanets) {
            const pH = getHouseNum(p.longitude);
            if (pH !== h) continue;

            const pName = (p.planet || (p as any).name || "");
            const pNameLower = pName.toLowerCase();

            if (isOuterPlanet(pName)) {
                // P1-A: Outer planets — angularity-based path
                occupants += computeOuterPlanetScore({
                    planetName:   pName,
                    sign:         signFromLongitude(p.longitude),
                    houseNum:     h,
                    longitude:    p.longitude,
                    // Same dual-field read as Step 7 — tolerate snake_case
                    // is_retrograde from the SwissEph helper output.
                    isRetrograde: p.retrograde ?? (p as any).is_retrograde,
                    natalPlanets,
                    speed:        p.speed,
                });
            } else {
                // Traditional planets: base mod → sect → combustion/cazimi → joy → hayz
                let mod = getOccupantModifier(pName, h);

                // Sect modulation (P0-B)
                if (sect) mod = applySectModulation(mod, pNameLower, sect);

                // Gap 4: Combustion / Cazimi (solar proximity)
                if (sunLon !== undefined && pNameLower !== "sun") {
                    let solarDiff = Math.abs(p.longitude - sunLon) % 360;
                    if (solarDiff > 180) solarDiff = 360 - solarDiff;
                    if (solarDiff <= 0.28) {
                        mod = Math.round(mod * 2.5);  // Cazimi: in heart of Sun = very powerful
                    } else if (solarDiff <= 8) {
                        mod = Math.round(mod * 0.30); // Combust: overwhelmed by solar light
                    }
                }

                // Gap 2: Planetary Joy bonus (+30 if planet is in its joy house)
                if (PLANETARY_JOYS[pNameLower] === h) {
                    mod += 30;
                }

                // Gap 5: Hayz — in-sect AND in correct hemisphere AND matching sign gender
                if (sect) {
                    const pSign = signFromLongitude(p.longitude);
                    const inMasculineSign = MASCULINE_SIGNS.includes(pSign);
                    // Planets above horizon = H7-H12 in asc-based counting (traditional reckoning)
                    const aboveHorizon = h >= 7 && h <= 12;
                    const isDaySectPlanet  = DAY_SECT_PLANDS.includes(pNameLower);
                    const isNightSectPlanet = NIGHT_SECT_PLANDS.includes(pNameLower);

                    let inHayz = false;
                    if (sect === "day" && isDaySectPlanet) {
                        // Day chart: day-sect planet above horizon in masculine sign
                        inHayz = aboveHorizon && inMasculineSign;
                    } else if (sect === "night" && isNightSectPlanet) {
                        // Night chart: night-sect planet below horizon in feminine sign
                        inHayz = !aboveHorizon && !inMasculineSign;
                    }
                    if (inHayz) mod += 36; // Hayz bonus: maximum contextual strength
                }

                occupants += mod;
            }
        }
        // Cap occupants to reasonable range (widened for inflation)
        occupants = Math.max(-100, Math.min(100, occupants));

        // ── Step 4: ACG Line Proximity (Gap 6: angle-strength weighting) ──
        //
        // Gap 6: ASC lines carry more weight than MC > DSC > IC.
        // In astrocartography, the ASC is where the planet literally rises on the
        // horizon — the most direct expression of the planet's energy on you.

        let acgLine = 0;
        for (const line of acgLines) {
            const lineHouse = ANGLE_TO_HOUSE[line.angle];
            if (lineHouse !== h) continue;
            acgLine += acgLineRawScore(line);
        }
        // WIDE_SCORING_V1: lift the per-house line cap so a planet directly on
        // the horizon can move the bucket the way astrology says it should.
        const acgCap = WIDE_SCORING_V1 ? 55 : 35;
        acgLine = Math.max(-acgCap, Math.min(acgCap, acgLine));

        // ── Step 5: Geodetic Grid (P2-A: Sun as luminary) ───────────────────
        let geodetic = 0;
        for (const ga of geoAngles) {
            if (ga.house !== h) continue;
            for (const p of natalPlanets) {
                const diff = angularDiff(p.longitude, ga.lon);
                const pName = (p.planet || (p as any).name || "").toLowerCase();
                const isBenefic  = BENEFIC_PLANETS.includes(pName);
                const isLuminary = LUMINARIES.includes(pName);
                const isMalefic  = STRONG_MALEFICS.includes(pName);
                if (diff <= 2) {
                    if (isBenefic)       geodetic += 18;
                    else if (isLuminary) geodetic += 10; // Luminary at geodetic angle — positive
                    else if (isMalefic)  geodetic -= 18;
                    else                 geodetic += 7;
                } else if (diff <= 5) {
                    if (isBenefic)       geodetic += 8;
                    else if (isLuminary) geodetic += 5;
                    else if (isMalefic)  geodetic -= 8;
                    else                 geodetic += 3;
                }
            }
        }

        // ── Step 5b: Live transit on geodetic angle (A1) ─────────────────────
        // Pull this house's share of the precomputed geo-transit hits and cap
        // it at ±20 so a single Mars-on-MC hit can't blow past the 15%
        // bucketGeodetic budget.
        const rawGeoTransit = geoTransitByHouse.get(h) ?? 0;
        const geodeticTransit = Math.max(
            -PER_HOUSE_GEO_TRANSIT_CAP,
            Math.min(PER_HOUSE_GEO_TRANSIT_CAP, Math.round(rawGeoTransit)),
        );

        // ── Step 5c: World points (A2) — only on H1 and H10 ──────────────────
        const worldPoints = WORLD_POINTS_HOUSES.has(h) ? natalWorldPoints.aggregate : 0;

        // ── Step 5d: Chart-ruler relocation bias (A3) ────────────────────────
        // Full bias on the ruler's own house, half-strength bias on its two
        // adjacent houses (h±1, with 12↔1 wrap). Adjacent-house bleed is what
        // lifts the macro signal even when the ruler lands outside the four
        // angular houses (which already drive 80% of the macro weight).
        let chartRulerContribution = 0;
        if (chartRulerHouse !== undefined) {
            const houseDelta = Math.min(
                Math.abs(h - chartRulerHouse),
                12 - Math.abs(h - chartRulerHouse),
            );
            if (houseDelta === 0) chartRulerContribution = chartRulerBias;
            else if (houseDelta === 1) chartRulerContribution = chartRulerNeighborStrength;
        }

        // ── Step 5e: Personal eclipse penalty (A4) ───────────────────────────
        const rawEclipsePenalty = eclipsePenaltyByHouse.get(h) ?? 0;
        const eclipsePenalty = Math.max(PER_HOUSE_ECLIPSE_CAP, Math.min(0, Math.round(rawEclipsePenalty)));

        // ── Step 5e2: Personal lunation modifier (A9) ────────────────────────
        // Same routing as eclipse, but bidirectional (new = positive,
        // full = negative) and tighter cap. Folded into bucketTransit
        // alongside eclipsePenalty so the transit bucket carries the
        // "what's stirring this season" signal.
        const rawLunation = lunationByHouse.get(h) ?? 0;
        const lunationContribution = Math.max(-PER_HOUSE_LUNATION_CAP, Math.min(PER_HOUSE_LUNATION_CAP, Math.round(rawLunation)));

        // ── Step 5f: Progression bias (A5) ────────────────────────────────────
        // Identical for every house — it's a global background field, not
        // angle-specific. Applied to bucketGeodetic.
        const progression = progressionAggregate;

        // ── Step 6: Transits & Astrodynes (P3-A: Aspect-specific weights) ────
        let transitPts = 0;
        for (const t of transits) {
            if (t.targetHouse !== h) continue;
            const applying = t.applying !== false;
            const orb      = Math.abs(t.orb ?? 3);

            // Hermetic Astrodynes: Gaussian Decay w(orb) = e^(-orb^2 / 2σ^2)
            // sigma = 2.5 for general transits -> 2*sigma^2 = 12.5
            const orbMult = Math.exp(-(orb * orb) / 12.5);

            // Separating aspects decay faster overall
            const applyingMult = applying ? 1.0 : 0.4;

            // P3-A: Aspect-type weighting (conjunction strongest, sextile softest)
            const aspectStr = (t.aspect || "").toLowerCase();
            let aspectMult = 1.0;
            if      (aspectStr.includes("conjunction")) aspectMult = 1.3;
            else if (aspectStr.includes("opposition"))  aspectMult = 1.1;
            else if (aspectStr.includes("square"))      aspectMult = 1.0;
            else if (aspectStr.includes("trine"))       aspectMult = 0.8;
            else if (aspectStr.includes("sextile"))     aspectMult = 0.6;

            // Base unmasked volume with aspect-type weighting applied
            let pts = t.benefic
                ? (35 * orbMult * applyingMult * aspectMult)
                : (-38 * orbMult * applyingMult * aspectMult);

            // Retrograde Velocity Mask (R_rx): dampens externalization
            if (t.transitRx) pts *= 0.75;

            transitPts += Math.round(pts);
        }
        transitPts = Math.max(-45, Math.min(40, transitPts));

        // ── Step 7: Natal Rx (P1-A: inner vs outer retrograde logic) ─────────
        // Tolerate both `retrograde` (matrix contract) and `is_retrograde`
        // (the field name returned by computeRealtimePositions). Without this
        // dual read the modifier never fires, since the route flow stores
        // planets with `is_retrograde` only.
        let retrograde = 0;
        const rulerIsRx = rulerNatal?.retrograde ?? (rulerNatal as any)?.is_retrograde;
        if (rulerIsRx) {
            const rulerNameLower = ruler.toLowerCase();
            if (isOuterPlanet(rulerNameLower)) {
                // Outer planet Rx = closer to Earth = STRONGER ("Full" in spec)
                retrograde = 5;
            } else {
                // Inner planet Rx = internalized, less outward expression
                retrograde = -8;
            }
        }

        // ── Step 8: Transit Ruler Rx (Sky Velocity) ─────────────────────────────
        let transitRx = 0;
        for (const t of transits) {
            if (t.transitRx && t.rulerOf === h) {
                transitRx = -20;
                break;
            }
        }

        // ── Step 9: Parans (Nuanced — aspect, dignity, angular position) ──
        let paranPts = 0;
        for (const par of parans) {
            paranPts += scoreParanNuanced(par, destLat, natalPlanets);
        }
        paranPts = Math.max(-30, Math.min(25, paranPts));

        // ── Step 10: Natal → Relocated House Bridge ───────────────────
        let natalBridge = 0;
        for (const p of natalPlanets) {
            const relocH = getHouseNum(p.longitude);
            if (relocH !== h) continue;
            const natalH = p.house; // natal house from birth chart
            if (natalH !== undefined && natalH !== relocH) {
                natalBridge += natalBridgeModifier(natalH, relocH, (p.planet || (p as any).name || ""));
            }
        }
        natalBridge = Math.max(-15, Math.min(15, natalBridge));

        // ── Step 11: Lot of Fortune / Spirit placement bonus ──────────
        let lotBonus = 0;
        if (lotFortuneHouse === h) lotBonus += 12;
        if (lotSpiritHouse === h)  lotBonus += 8;

        // ── Step 12: Unified Formula (P1-B: 4-bucket decomposition) ──────────
        //
        // Buckets align with model spec:
        //   Natal (static chart quality)    30%
        //   Occupants (relocated planets)   25%
        //   Transits (dynamic, time-dep)    30%   ⇒ natal+transits = 55%+30% = 85%
        //   Geodetic (background field)     15%   ⇒ background = 15%
        //
        const rawNatal     = base + dignity + lotBonus + worldPoints + chartRulerContribution + chartRulerGlobalLift;
        const rawOccupants = occupants + natalBridge + retrograde + transitRx + 50;
        const rawTransit   = transitPts + paranPts + eclipsePenalty + lunationContribution + 50;
        const rawGeodetic  = acgLine + geodetic + geodeticTransit + progression + 50;

        // Min-Max Normalize Per Bucket (Symmetrically bounded around 50)
        // We use tight, real-world observable standard deviation bounds rather than
        // absolute mathematical theoreticals. This forcibly expands individual house scores 
        // outward, giving a true bottoms-up variance stretch without artificial macro multipliers.
        const bucketNatal     = normalizeBucket(rawNatal, 30, 70); // original: 10, 90
        const bucketOccupants = normalizeBucket(rawOccupants, 15, 85); // original: 5, 95
        // Widened from 20-80 → 10-90 so the transit bucket has more upward
        // headroom. Combined with the lower penalty cap, this lifts the
        // bucketTransit mean from ~37 toward 50 (the neutral midline).
        const bucketTransit   = normalizeBucket(rawTransit, 10, 90); // original: 0, 100
        const bucketGeodetic  = normalizeBucket(rawGeodetic, 15, 85); // original: -10, 110

        // WIDE_SCORING_V1: lift geodetic bucket weight 15% -> 22% so place
        // (ACG lines, geodetic angles) carries more signal. Pull from natal/
        // transit proportionally to keep total = 1.0.
        const wNatal     = WIDE_SCORING_V1 ? 0.27 : 0.30;
        const wOccupants = 0.25;
        const wTransit   = WIDE_SCORING_V1 ? 0.26 : 0.30;
        const wGeodetic  = WIDE_SCORING_V1 ? 0.22 : 0.15;

        const score = Math.round(
            (wNatal * bucketNatal)
          + (wOccupants * bucketOccupants)
          + (wTransit * bucketTransit)
          + (wGeodetic * bucketGeodetic)
        );

        houses.push({
            house: h,
            sphere: HOUSE_THEMES[h] || `House ${h}`,
            relocatedSign: cuspSign,
            rulerPlanet: ruler,
            rulerCondition,
            score,
            status: statusFromScore(score),
            breakdown: {
                base, globalPenalty, dignity, occupants, acgLine, geodetic,
                geodeticTransit,
                worldPoints,
                chartRuler: chartRulerContribution,
                eclipsePenalty,
                lunation: lunationContribution,
                progression,
                transits: transitPts, retrograde, transitRx, paran: paranPts,
                natalBridge, lotBonus,
                bucketNatal:     Math.round(bucketNatal),
                bucketOccupants: Math.round(bucketOccupants),
                bucketTransit:   Math.round(bucketTransit),
                bucketGeodetic:  Math.round(bucketGeodetic),
            },
        });
    }

    // ── Step 13: Unified Macro Score ────────────────────────────────────────
    // Replaced Central Limit Theorem average with Angular Dominance & Intent-Driven Peak-Weighting
    const hScores = houses.map(h => h.score); // 0-indexed: hScores[0] = H1, hScores[3] = H4, etc.
    const scoreH1 = hScores[0] || 0;
    const scoreH4 = hScores[3] || 0;
    const scoreH7 = hScores[6] || 0;
    const scoreH10 = hScores[9] || 0;

    let rawMacro = 0;

    if (!selectedGoals || selectedGoals.length === 0) {
        // Scenario A: Default "Browse" Mode (Angular Dominance)
        rawMacro = (0.40 * scoreH1) + (0.40 * scoreH10) + (0.10 * scoreH7) + (0.10 * scoreH4);
    } else {
        // Scenario B: Intent-Driven Mode (Peak-Weighting)
        // Helper to score a goal based on 12 house scores and W_EVENTS matrix
        const getGoalScore = (goalIndex: number): number => {
            const weights = W_EVENTS[goalIndex];
            if (!weights) return 0;
            let sum = 0;
            for (let i = 0; i < 12; i++) {
                sum += hScores[i] * weights[i];
            }
            return sum;
        };

        const goalScores = selectedGoals.map(getGoalScore);
        // Sort selected goals from highest score to lowest
        goalScores.sort((a, b) => b - a);

        let intentScore = 0;
        if (goalScores.length === 1) {
            intentScore = goalScores[0];
        } else if (goalScores.length === 2) {
            intentScore = (0.65 * goalScores[0]) + (0.35 * goalScores[1]);
        } else {
            intentScore = (0.50 * goalScores[0]) + (0.30 * goalScores[1]) + (0.20 * goalScores[2]);
        }

        // Blend intent with Core Ascendant (Vitality anchor)
        rawMacro = (0.70 * intentScore) + (0.30 * scoreH1);
    }

    // Variance Expander: 1.4× elasticity stretch (was 1.8×, pre-Pass-2). The
    // Pass-2 base lift + lower penalty cap raised raw macros enough that 1.8×
    // was clipping anything above raw 78 to the 100 ceiling — 2.7% of readings
    // were tying at exactly 100 in the 2400-reading sweep. 1.4× keeps the
    // target mean near 55 while preserving upper-tail resolution so a 97
    // genuinely means "extraordinary" rather than "happens 1 in 35 times."
    const stretchedMacro = 50 + (rawMacro - 50) * 1.4;
    const macroScore = Math.max(0, Math.min(100, Math.round(stretchedMacro)));

    let macroVerdict: string;
    if (macroScore >= 80) macroVerdict = "Highly Productive";
    else if (macroScore >= 65) macroVerdict = "Productive";
    else if (macroScore >= 50) macroVerdict = "Mixed";
    else if (macroScore >= 35) macroVerdict = "Challenging";
    else macroVerdict = "Hostile";

    // Build deduped paran rows for UI surfacing. Same `scoreParanNuanced`
    // call the per-house loop uses, so the score the user sees is the per-
    // paran contribution (not summed across houses). Dedupe by sorted
    // [p1,p2]+aspect — parans are latitude-bound, not house-bound.
    const paranSeen = new Set<string>();
    const paranRows: ParanRow[] = [];
    for (const par of parans) {
        const key = [par.p1.toLowerCase(), par.p2.toLowerCase()].sort().join("|") +
            "|" + (par.aspect ?? "").toLowerCase();
        if (paranSeen.has(key)) continue;
        paranSeen.add(key);
        paranRows.push({
            p1: par.p1,
            p2: par.p2,
            lat: par.lat,
            type: par.type,
            aspect: par.aspect,
            latOffset: par.lat - destLat,
            contribution: scoreParanNuanced(par, destLat, natalPlanets),
        });
    }
    paranRows.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

    const result: HouseMatrixResult = {
        houses, macroScore, macroVerdict,
        houseSystem,
        activeGeoTransits,
        natalWorldPoints,
        ...(chartRuler ? { chartRuler } : {}),
        personalEclipses,
        personalLunations,
        ...(progressedBands ? { progressedBands } : {}),
        midpointTriggers,
        harmonic45Hits,
        modalityCohorts,
        geodeticHouseFrame: {
            cusps: geodeticCusps,
            natalAssignments: geodeticAssignments,
        },
        parans: paranRows,
    };

    // Add Lot positions to result if computed
    if (lotOfFortuneLon !== undefined && lotFortuneHouse !== undefined) {
        result.lotOfFortune = {
            longitude: lotOfFortuneLon,
            house: lotFortuneHouse,
            sign: signFromLongitude(lotOfFortuneLon),
        };
    }
    if (lotOfSpiritLon !== undefined && lotSpiritHouse !== undefined) {
        result.lotOfSpirit = {
            longitude: lotOfSpiritLon,
            house: lotSpiritHouse,
            sign: signFromLongitude(lotOfSpiritLon),
        };
    }

    return result;
}

/**
 * Maps raw transit objects (from api/mundane or api/transits) into the format
 * required by the computeHouseMatrix engine.
 */
export function mapTransitsToMatrix(
    transits: any[],
    natalPlanets: MatrixNatalPlanet[],
    relocatedCusps: number[],
    birthLat?: number,
): MatrixTransit[] {
    const ascLon = relocatedCusps[0] ?? 0;

    const getHouseNum = (planetLon: number): number => {
        if (birthLat !== undefined && Math.abs(birthLat) < 66 && relocatedCusps.length >= 12) {
            return computeHouseNumber(planetLon, ascLon, relocatedCusps, birthLat);
        }
        return houseFromLongitude(planetLon, ascLon);
    };

    return transits.map((t) => {
        const transitPlanetName = (
            t.transit_planet ||
            t.p1 ||
            (t.planets ? t.planets.split(" ")[0] : "")
        ).toLowerCase();
        
        const natalPlanetName = (
            t.natal_planet ||
            t.p2 ||
            (t.planets && t.planets.includes("natal")
                ? t.planets.split("natal ")[1]
                : "")
        ).toLowerCase();

        // Find which relocated house the natal planet aspect targets
        const natalP = natalPlanets.find(
            (p) => (p.planet || (p as any).name || "").toLowerCase() === natalPlanetName
        );
        const targetHouse = natalP
            ? getHouseNum(natalP.longitude)
            : undefined;

        const aspectStr = (t.aspect || t.type || "").toLowerCase();
        const isSoft = ["trine", "sextile", "△", "⚹"].some((a) =>
            aspectStr.includes(a)
        );
        const isConj = ["conjunction", "☌"].some((a) =>
            aspectStr.includes(a)
        );

        const isBeneficPlanet = BENEFIC_PLANETS.includes(transitPlanetName);
        let benefic = false;
        // Simplified benefic logic: soft aspect with benefic planet OR just soft aspect
        if (isSoft || (isConj && isBeneficPlanet)) {
            benefic = true;
        }

        // Determine if the transit planet rules any relocated house
        let rulerOf: number | undefined;
        for (let h = 0; h < 12; h++) {
            const cSign = signFromLongitude(relocatedCusps[h] ?? 0);
            const cRuler = SIGN_RULERS[cSign] || "";
            if (cRuler.toLowerCase() === transitPlanetName) {
                rulerOf = h + 1;
                break;
            }
        }

        return {
            targetHouse,
            transitPlanet: transitPlanetName,
            natalPlanet: natalPlanetName,
            aspect: aspectStr,
            orb: t.orb,
            applying: t.applying ?? true,
            benefic,
            transitRx: t.retrograde ?? t.transitRx ?? false,
            rulerOf,
        };
    });
}

/**
 * Computes a global timing penalty based on tense applying hard transits.
 * WIDE_SCORING_V1: also subtracts a "global lift" from applying soft transits
 * with benefic planets, so benefic days lift the chart instead of only malefic
 * days dragging it down. Net result is symmetric around 0; cap ±12.
 */
export function computeGlobalPenalty(transits: any[]): number {
    let penalty = 0;
    let lift = 0;
    for (const t of transits) {
        const aspectStr = (t.aspect || t.type || "").toLowerCase();
        const isHardTransit = ["square", "opposition", "□", "☍"].some((a) =>
            aspectStr.includes(a)
        );
        const isSoftTransit = ["trine", "sextile", "△", "⚹"].some((a) =>
            aspectStr.includes(a)
        );

        const applying = t.applying ?? true;
        if (!applying) continue;

        const tPlanet = (
            t.transit_planet ||
            t.p1 ||
            (t.planets ? t.planets.split(" ")[0] : "")
        ).toLowerCase();

        const isMalefic = STRONG_MALEFICS.some((m) => tPlanet.includes(m));
        const isBenefic = BENEFIC_PLANETS.includes(tPlanet);
        const orb = t.orb ?? 5;

        if (isHardTransit) {
            // Halved weights — the previous values saturated the cap on
            // every reading because a 12-month transit window almost always
            // contains a few malefic hard hits. After halving, the typical
            // reading lands ~6-9 instead of pinned at the 12 cap.
            if (orb <= 1 && isMalefic)      penalty += 7;
            else if (orb <= 2 && isMalefic) penalty += 5;
            else if (orb <= 3 && isMalefic) penalty += 3;
            else if (orb <= 1)              penalty += 4;
            else if (orb <= 3)              penalty += 2;
        } else if (WIDE_SCORING_V1 && isSoftTransit && isBenefic) {
            // Benefic soft transits lift the chart globally
            if (orb <= 1)      lift += 10;
            else if (orb <= 2) lift += 7;
            else if (orb <= 3) lift += 4;
        }
    }
    if (WIDE_SCORING_V1) {
        const net = penalty - lift;
        return Math.max(-12, Math.min(12, net));
    }
    // Cap lowered from 25 → 12. The old cap was a permanent baseline drag
    // (saturated in 100% of simulated readings). At 12 the penalty actually
    // discriminates between calm and tense weather.
    return Math.min(12, penalty);
}
