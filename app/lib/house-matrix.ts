/**
 * house-matrix.ts — 12-House Matrix Scoring Engine v3.
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
    MALEFIC_PLANETS,
    HOUSE_THEMES,
    STRONG_MALEFICS,
} from "./astro-constants";
import { KNOWN_BENEFIC_COMBOS, KNOWN_MALEFIC_COMBOS, getOccupantModifier } from "./planet-library";
import { essentialDignityScore, essentialDignityLabel, accidentalDignityMultiplier } from "./dignity";
import {
    signFromLongitude,
    houseFromLongitude,
    geodeticMCLongitude,
    geodeticASCLongitude,
} from "./geodetic";
import { computeHouseNumber } from "./house-system";



// ── Input types ───────────────────────────────────────────────────────────

export interface MatrixNatalPlanet {
    planet?: string;       // name of the planet (e.g. "Sun")
    name?: string;         // alias for planet (used by some Swisseph hooks)
    sign: string;
    longitude: number;
    retrograde: boolean;
    house?: number;        // natal house (from birth chart)
    dignity?: string;
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
    natalBridge: number;   // NEW: natal→relocated house bridge
    lotBonus: number;      // NEW: Lot of Fortune/Spirit placement
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
    personalScore: number;   // 0–70 (personal/identity houses, weighted)
    collectiveScore: number; // 0–30 (travel/collective houses, weighted)
    houseSystem: string;     // NEW: "placidus" | "whole-sign"
    lotOfFortune?: { longitude: number; house: number; sign: string };
    lotOfSpirit?: { longitude: number; house: number; sign: string };
}

// ── House weight partitions ───────────────────────────────────────────────

/**
 * Personal bucket — houses governing identity, career, relationships,
 * creativity, and material resources. Contributes 0-70 pts.
 * Weights sum to 1.0.
 */
const PERSONAL_WEIGHTS: Record<number, number> = {
    1:  0.20,  // Identity & Vitality — who you are abroad
    10: 0.20,  // Career & Reputation — public visibility
    7:  0.15,  // Partnerships — meetings, social capital
    4:  0.15,  // Home & Foundation — comfort, accommodation
    11: 0.15,  // Networks & Community — connections
    5:  0.10,  // Creativity & Pleasure — leisure
    2:  0.05,  // Resources & Budget
};

/**
 * Collective/travel bucket — houses governing foreign travel,
 * long-distance journeys, and collective environment. Contributes 0-30 pts.
 * Travel-context weights: H9=40%, H12=30%, H3=15%, H8=10%, H6=5%.
 */
const COLLECTIVE_WEIGHTS: Record<number, number> = {
    9:  0.40,  // Long journeys, international travel, foreign culture (PRIMARY)
    12: 0.30,  // Foreign lands, long-term stays, emigration
    3:  0.15,  // Short trips, communication, short-distance travel
    8:  0.10,  // Shared resources, transformation abroad
    6:  0.05,  // Health, daily routine while traveling
};

// ── Helpers ───────────────────────────────────────────────────────────────

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

        // ── Step 2: Ruler Dignity × Volume ────────────────────────────
        const rulerSign = rulerNatal?.sign || cuspSign;
        const dignityPts = essentialDignityScore(ruler, rulerSign);
        const volume = accidentalDignityMultiplier(h);
        const dignity = Math.round(dignityPts * volume);
        const rulerCondition = essentialDignityLabel(ruler, rulerSign);

        // ── Step 3: Occupant Planets (granular per-planet modifier) ───
        let occupants = 0;
        for (const p of natalPlanets) {
            const pH = getHouseNum(p.longitude);
            if (pH === h) {
                occupants += getOccupantModifier((p.planet || (p as any).name || ""), h);
            }
        }
        // Cap occupants to reasonable range
        occupants = Math.max(-40, Math.min(40, occupants));

        // ── Step 4: ACG Line Proximity (benefic boost / malefic penalty)
        let acgLine = 0;
        const SIGMA_ACG = 250;
        const SIGMA_SQ_2 = 2 * SIGMA_ACG * SIGMA_ACG;

        for (const line of acgLines) {
            const lineHouse = ANGLE_TO_HOUSE[line.angle];
            if (lineHouse !== h) continue;
            
            const pName = line.planet.toLowerCase();
            const isBeneficLine = BENEFIC_PLANETS.includes(pName);
            const isMaleficLine = STRONG_MALEFICS.includes(pName);

            let baseInfluence = 12;
            if (isBeneficLine) baseInfluence = 30;
            else if (isMaleficLine) baseInfluence = -25;

            // Continuous Gaussian decay: influence * e^(-d^2 / 2*sigma^2)
            const modifier = baseInfluence * Math.exp(-(line.distance_km * line.distance_km) / SIGMA_SQ_2);
            acgLine += modifier;
        }
        acgLine = Math.max(-35, Math.min(35, Math.round(acgLine)));

        // ── Step 5: Geodetic Grid (Earth's permanent baseline) ────────
        let geodetic = 0;
        for (const ga of geoAngles) {
            if (ga.house !== h) continue;
            for (const p of natalPlanets) {
                const diff = angularDiff(p.longitude, ga.lon);
                const pName = (p.planet || (p as any).name || "").toLowerCase();
                if (diff <= 2) {
                    if (BENEFIC_PLANETS.includes(pName)) geodetic += 18;
                    else if (MALEFIC_PLANETS.includes(pName)) geodetic -= 18;
                    else geodetic += 7;
                } else if (diff <= 5) {
                    if (BENEFIC_PLANETS.includes(pName)) geodetic += 8;
                    else if (MALEFIC_PLANETS.includes(pName)) geodetic -= 8;
                    else geodetic += 3;
                }
            }
        }

        // ── Step 6: Transits & Astrodynes (Gaussian Decay & R_rx) ─────
        let transitPts = 0;
        for (const t of transits) {
            if (t.targetHouse !== h) continue;
            const applying = t.applying !== false;
            const orb = Math.abs(t.orb ?? 3);
            
            // Hermetic Astrodynes: Gaussian Decay w(orb) = e^(-orb^2 / 2σ^2)
            // sigma = 2.5 for general transits -> 2*sigma^2 = 12.5
            const orbMult = Math.exp(-(orb * orb) / 12.5);
            
            // Separating aspects decay faster overall
            const applyingMult = applying ? 1.0 : 0.4; 

            // Base unmasked volume. We scale the base up slightly because Gaussian drops smoothly.
            let pts = t.benefic 
                ? (35 * orbMult * applyingMult)
                : (-38 * orbMult * applyingMult);

            // Retrograde Velocity Mask (R_rx): dampens externalization by checking Swisseph v < 0
            if (t.transitRx) {
                pts *= 0.75;
            }
            
            transitPts += Math.round(pts);
        }
        transitPts = Math.max(-45, Math.min(40, transitPts));

        // ── Step 7: Natal Rx ──────────────────────────────────────────
        let retrograde = 0;
        if (rulerNatal?.retrograde) {
            retrograde = -8; // Ruler Rx = internalized, less outward expression
        }

        // ── Step 8: Transit Ruler Rx (Sky Velocity) ───────────────────
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

        // ── Step 12: Unified Mathematical Definition (H_final) ────────
        const h_hel = base + dignity + lotBonus;
        const h_ast = occupants + natalBridge + retrograde + transitRx + 50;
        const h_geo = acgLine + geodetic + paranPts + transitPts + 50;
        const raw = (0.40 * h_hel) + (0.40 * h_ast) + (0.20 * h_geo);
        const score = Math.max(0, Math.min(100, Math.round(raw)));

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
            },
        });
    }

    // ── Step 13: Weighted decomposition into personalScore + collectiveScore
    let personalRaw = 0;
    for (const [hStr, weight] of Object.entries(PERSONAL_WEIGHTS)) {
        const houseScore = houses.find(hs => hs.house === Number(hStr));
        if (houseScore) personalRaw += houseScore.score * weight;
    }

    let collectiveRaw = 0;
    for (const [hStr, weight] of Object.entries(COLLECTIVE_WEIGHTS)) {
        const houseScore = houses.find(hs => hs.house === Number(hStr));
        if (houseScore) collectiveRaw += houseScore.score * weight;
    }

    const personalScore  = Math.round((personalRaw / 100) * 70);
    const collectiveScore = Math.round((collectiveRaw / 100) * 30);
    const macroScore = Math.min(100, personalScore + collectiveScore);

    let macroVerdict: string;
    if (macroScore >= 80) macroVerdict = "Highly Productive";
    else if (macroScore >= 65) macroVerdict = "Productive";
    else if (macroScore >= 50) macroVerdict = "Mixed";
    else if (macroScore >= 35) macroVerdict = "Challenging";
    else macroVerdict = "Hostile";

    const result: HouseMatrixResult = {
        houses, macroScore, macroVerdict, personalScore, collectiveScore,
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
