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
} from "./astro-constants";
import { KNOWN_BENEFIC_COMBOS, KNOWN_MALEFIC_COMBOS, getOccupantModifier, applySectModulation, W_EVENTS } from "./planet-library";
import { essentialDignityScore, essentialDignityLabel } from "./dignity";
import {
    signFromLongitude,
    houseFromLongitude,
    geodeticMCLongitude,
    geodeticASCLongitude,
} from "./geodetic";
import { computeHouseNumber } from "./house-system";
import { isOuterPlanet, computeOuterPlanetScore } from "./outer-planet-scoring";



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
}

// ── Hoisted Matrix Constants ──────────────────────────────────────────────

// Gap 3: Lilly additive accidental dignity points (Operator Inflation x3)
// H1/H10 = +15, H4/H7 = +12, H11 = +9, H5/H9 = +6, H2/H3/H8 = +3, H6/H12 = -6
const LILLY_ACCIDENTAL: Record<number, number> = {
    1: 15, 10: 15, 4: 12, 7: 12, 11: 9, 5: 6, 9: 6, 2: 3, 3: 3, 8: 3, 6: -6, 12: -6,
};

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

    const houses: HouseScore[] = [];

    for (let h = 1; h <= 12; h++) {
        const cuspLon = relocatedCusps[h - 1] ?? ((ascLon + (h - 1) * 30) % 360);
        const cuspSign = signFromLongitude(cuspLon);
        const ruler = SIGN_RULERS[cuspSign] || "Sun";
        const rulerNatal = natalPlanets.find(
            (p) => (p.planet || (p as any).name || "").toLowerCase() === ruler.toLowerCase(),
        );

        // ── Step 1: Baseline by house type + global timing penalty ────
        const angularHouses  = [1, 4, 7, 10];
        const succedentHouses = [2, 5, 8, 11];
        const baseNatural = angularHouses.includes(h) ? 55 : succedentHouses.includes(h) ? 50 : 45;
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
                    isRetrograde: p.retrograde,
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
        const SIGMA_ACG = 250;
        const SIGMA_SQ_2 = 2 * SIGMA_ACG * SIGMA_ACG;

        for (const line of acgLines) {
            const lineHouse = ANGLE_TO_HOUSE[line.angle];
            if (lineHouse !== h) continue;

            const pName = line.planet.toLowerCase();
            const isBeneficLine  = BENEFIC_PLANETS.includes(pName);
            const isLuminaryLine = LUMINARIES.includes(pName);
            const isMaleficLine  = STRONG_MALEFICS.includes(pName);

            let baseInfluence = 10;
            if (isBeneficLine)  baseInfluence = 30;
            else if (isLuminaryLine) baseInfluence = 18;
            else if (isMaleficLine)  baseInfluence = -25;

            // Gap 6: scale by angle strength
            const angleStr = (line.angle || "").toUpperCase();
            const angleScale = ANGLE_STRENGTH[angleStr] ?? 1.0;

            // Continuous Gaussian decay
            const modifier = baseInfluence * angleScale * Math.exp(-(line.distance_km * line.distance_km) / SIGMA_SQ_2);
            acgLine += modifier;
        }
        acgLine = Math.max(-35, Math.min(35, Math.round(acgLine)));

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
        let retrograde = 0;
        if (rulerNatal?.retrograde) {
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
        const rawNatal     = base + dignity + lotBonus;
        const rawOccupants = occupants + natalBridge + retrograde + transitRx + 50;
        const rawTransit   = transitPts + paranPts + 50;
        const rawGeodetic  = acgLine + geodetic + 50;

        // Min-Max Normalize Per Bucket (Symmetrically bounded around 50)
        // We use tight, real-world observable standard deviation bounds rather than
        // absolute mathematical theoreticals. This forcibly expands individual house scores 
        // outward, giving a true bottoms-up variance stretch without artificial macro multipliers.
        const bucketNatal     = normalizeBucket(rawNatal, 30, 70); // original: 10, 90
        const bucketOccupants = normalizeBucket(rawOccupants, 15, 85); // original: 5, 95
        const bucketTransit   = normalizeBucket(rawTransit, 20, 80); // original: 0, 100
        const bucketGeodetic  = normalizeBucket(rawGeodetic, 15, 85); // original: -10, 110

        const score = Math.round(
            (0.30 * bucketNatal)
          + (0.25 * bucketOccupants)
          + (0.30 * bucketTransit)
          + (0.15 * bucketGeodetic)
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

    // Variance Expander: We apply a tight 1.8x elasticity stretch over the organically
    // widened Angular Dominant bottom-up scores, pushing authentic high scores into 
    // the true 'Peak / Highly Productive' zone (85+) without distorting the math.
    const stretchedMacro = 50 + (rawMacro - 50) * 1.8;
    const macroScore = Math.max(0, Math.min(100, Math.round(stretchedMacro)));

    let macroVerdict: string;
    if (macroScore >= 80) macroVerdict = "Highly Productive";
    else if (macroScore >= 65) macroVerdict = "Productive";
    else if (macroScore >= 50) macroVerdict = "Mixed";
    else if (macroScore >= 35) macroVerdict = "Challenging";
    else macroVerdict = "Hostile";

    const result: HouseMatrixResult = {
        houses, macroScore, macroVerdict,
        houseSystem,
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
 */
export function computeGlobalPenalty(transits: any[]): number {
    let penalty = 0;
    for (const t of transits) {
        const aspectStr = (t.aspect || t.type || "").toLowerCase();
        const isHardTransit = ["square", "opposition", "□", "☍"].some((a) =>
            aspectStr.includes(a)
        );
        if (!isHardTransit) continue;
        
        const applying = t.applying ?? true;
        if (!applying) continue;

        const tPlanet = (
            t.transit_planet ||
            t.p1 ||
            (t.planets ? t.planets.split(" ")[0] : "")
        ).toLowerCase();
        
        const isMalefic = STRONG_MALEFICS.some((m) => tPlanet.includes(m));
        const orb = t.orb ?? 5;

        if (orb <= 1 && isMalefic)      penalty += 14;
        else if (orb <= 2 && isMalefic) penalty += 10;
        else if (orb <= 3 && isMalefic) penalty += 6;
        else if (orb <= 1)              penalty += 8;
        else if (orb <= 3)              penalty += 4;
    }
    return Math.min(25, penalty);
}
