/**
 * Trip scoring algorithm — 70/30 weight split.
 * Personal Astrocartography (70 pts) + Geodetic / World Sky (30 pts).
 *
 * The transit sub-score is now date-aware:
 * 1. If real transit aspects are available from the astro engine, score them directly.
 * 2. If not, use the travel month's window quality from the 12-month patterns.
 * 3. As a last resort, use the AI verdict string.
 */
import {
    BENEFIC_PLANETS,
    NEUTRAL_PLANETS,
    ANGULAR_HOUSES,
    SUCCEDENT_HOUSES,
    OBLIQUITY_RAD,
} from "./astro-constants";

export interface TripScore {
    total: number;
    acg: number;     // Combined personal astrocartography (max 70)
    mundane: number;  // World sky (max 30)
    personal: number; // Transit sub-score detail (for display)
}

export function computeTripScore(
    lines: { distance_km: number; planet: string; angle: string }[],
    mundaneResult: { worldTransits: { isTense: boolean }[] } | null,
    verdict: "excellent" | "caution" | "avoid" | null,
    natalPlanets: { planet: string; dignity?: string; longitude?: number }[],
    destLat: number,
    destLon: number,
    /** Actual transit aspects — used for date-aware scoring */
    transits?: { planets?: string; type?: string; aspect?: string; system?: string; orb?: number }[],
    /** Travel windows — used when transit data is unavailable */
    travelWindows?: { quality: string; month: string }[],
    /** The travel date string — used to find the matching travel window */
    travelDate?: string,
): TripScore {
    let acgBase = 0;
    const closest = lines.length > 0 ? Math.min(...lines.map((l) => l.distance_km)) : 9999;
    const closestLine = lines.find((l) => l.distance_km === closest);

    // ── ACG Lines sub-score (Max 45 pts within the 70 bucket) ──
    // 1. Proximity Base Score (Max 15 pts)
    if (closest <= 100) acgBase += 15;
    else if (closest <= 300) acgBase += 10;
    else if (closest <= 500) acgBase += 5;

    if (closestLine) {
        const planetMatches = (p: { planet: string }) =>
            p.planet.toLowerCase() === closestLine.planet.toLowerCase() ||
            (closestLine.planet.toLowerCase().includes("node") &&
                p.planet.toLowerCase().includes("node"));
        const natalPlanet = natalPlanets.find(planetMatches);

        // 2. Planetary Nature Modifier (Max 10 pts)
        const pName = closestLine.planet.toLowerCase();
        if (BENEFIC_PLANETS.includes(pName)) acgBase += 10;
        else if (NEUTRAL_PLANETS.includes(pName)) acgBase += 5;

        // 3. Natal Dignity Modifier (Max 10 pts)
        if (natalPlanet?.dignity) {
            const dig = natalPlanet.dignity.toLowerCase();
            if (dig.includes("domicile") || dig.includes("exalted") || dig.includes("exaltation"))
                acgBase += 10;
            else if (!dig.includes("detriment") && !dig.includes("fall"))
                acgBase += 5;
        } else {
            acgBase += 5;
        }

        // 4. Relocated House Position (Max 10 pts)
        if (natalPlanet?.longitude !== undefined) {
            const φ = (destLat || 0) * (Math.PI / 180);
            const tanVal = Math.tan(φ) * Math.tan(OBLIQUITY_RAD);
            const dOA = Math.abs(tanVal) <= 1 ? Math.asin(tanVal) * (180 / Math.PI) : 0;
            const mcLonDeg = (((destLon || 0) % 360) + 360) % 360;
            const ascLon = ((mcLonDeg - 90 + dOA + 360) % 360);
            let offset = natalPlanet.longitude - ascLon;
            if (offset < 0) offset += 360;
            const houseNum = Math.floor(offset / 30) + 1;
            if (ANGULAR_HOUSES.includes(houseNum)) acgBase += 10;
            else if (SUCCEDENT_HOUSES.includes(houseNum)) acgBase += 5;
        } else {
            acgBase += 5;
        }
    }
    acgBase = Math.min(45, acgBase);

    // ── Personal Transit sub-score (Max 25 pts within the 70 bucket) ──
    let transitScore = 12; // neutral baseline

    if (transits && transits.length > 0) {
        // Best case: actual transit data from astro engine
        transitScore = scoreTransits(transits);
    } else if (travelWindows && travelWindows.length > 0 && travelDate) {
        // Fallback: derive score from the travel month's window quality
        transitScore = scoreFromTravelWindowQuality(travelWindows, travelDate);
    } else if (verdict === "excellent") {
        transitScore = 22;
    } else if (verdict === "caution") {
        transitScore = 12;
    } else if (verdict === "avoid") {
        transitScore = 3;
    }

    const personalAstro = Math.min(70, acgBase + transitScore);

    // ── World Sky / Geodetic (Max 30 Points) ──
    // Score each mundane transit individually instead of just counting tense ones
    let mundane = scoreMundane(mundaneResult);

    const total = Math.min(100, personalAstro + mundane);
    return { total, acg: personalAstro, mundane, personal: transitScore };
}

/**
 * Score mundane (world sky) transits — more granular than simple tense count.
 * Starts at 22/30 (neutral baseline) and adjusts based on each aspect.
 * Max 30 pts.
 */
function scoreMundane(
    mundaneResult: {
        worldTransits: { isTense: boolean; orb?: number; p1?: string; p2?: string; aspect?: string }[];
        angularPlanets?: { planet: string; angle?: string }[];
    } | null,
): number {
    if (!mundaneResult) return 18; // no data → slightly below neutral

    let score = 20; // Baseline: neutral
    const BENEFIC_NAMES = ["venus", "jupiter", "sun"];
    const MALEFIC_NAMES = ["mars", "saturn", "pluto", "uranus", "neptune"];

    // Track soft gains separately so we can cap them
    let softGains = 0;
    const SOFT_CAP = 6; // Max points from soft aspects

    for (const t of mundaneResult.worldTransits) {
        const orb = t.orb ?? 5;
        const p1 = (t.p1 || "").toLowerCase();
        const p2 = (t.p2 || "").toLowerCase();
        const aspect = (t.aspect || "").toLowerCase();

        const hasBenefic = BENEFIC_NAMES.some(b => p1.includes(b) || p2.includes(b));
        const hasMalefic = MALEFIC_NAMES.some(m => p1.includes(m) || p2.includes(m));
        const isSoft = aspect.includes("trine") || aspect.includes("sextile");
        const isConjunction = aspect.includes("conjunction");

        if (t.isTense) {
            // Tense aspects: exponentially worse at tighter orbs
            if (orb <= 1) {
                score -= hasMalefic ? 8 : 5; // Sub-1° malefic square = devastating
            } else if (orb <= 2) {
                score -= hasMalefic ? 6 : 4;
            } else if (orb <= 5) {
                score -= hasMalefic ? 4 : 2;
            } else {
                score -= 1; // Wide orb, minimal impact
            }
        } else if (isSoft) {
            // Harmonious aspects: capped to prevent drowning out tense aspects
            if (softGains < SOFT_CAP) {
                let gain = 0;
                if (hasBenefic && orb <= 3) gain = 2;
                else if (hasBenefic) gain = 1;
                else if (orb <= 3) gain = 1;
                // else: wide non-benefic soft = no gain
                softGains += gain;
                score += gain;
            }
        } else if (isConjunction) {
            if (hasBenefic && !hasMalefic) {
                if (softGains < SOFT_CAP) {
                    const gain = orb <= 3 ? 2 : 1;
                    softGains += gain;
                    score += gain;
                }
            } else if (hasMalefic) {
                score -= orb <= 3 ? 4 : 2;
            }
        }
    }

    // Angular planets over the destination
    if (mundaneResult.angularPlanets) {
        for (const ap of mundaneResult.angularPlanets) {
            const pName = ap.planet.toLowerCase();
            if (BENEFIC_NAMES.some(b => pName.includes(b))) {
                score += 2; // Benefic angular = good but not overwhelming
            } else if (MALEFIC_NAMES.some(m => pName.includes(m))) {
                score -= 3; // Malefic angular = serious tension
            }
        }
    }

    return Math.max(0, Math.min(30, score));
}

/**
 * Derive transit sub-score from the travel month's window quality.
 * This is used when the astro engine is offline but we have 12-month
 * window patterns that vary by month.
 */
function scoreFromTravelWindowQuality(
    windows: { quality: string; month: string }[],
    travelDate: string,
): number {
    const td = new Date(travelDate + "T12:00:00");
    const travelMonthStr = td.toLocaleDateString("en-GB", { month: "short" }).toLowerCase();
    const travelYear = td.getFullYear().toString();

    // Find the window that matches the travel month+year
    const matchingWindow = windows.find(w => {
        const wLower = w.month.toLowerCase();
        return wLower.includes(travelMonthStr) && wLower.includes(travelYear);
    });

    if (!matchingWindow) {
        // Try just month match
        const monthOnly = windows.find(w => w.month.toLowerCase().includes(travelMonthStr));
        if (monthOnly) {
            return qualityToTransitScore(monthOnly.quality);
        }
        return 12; // neutral
    }

    return qualityToTransitScore(matchingWindow.quality);
}

function qualityToTransitScore(quality: string): number {
    switch (quality) {
        case "excellent": return 22;
        case "good":      return 17;
        case "caution":   return 8;
        case "avoid":     return 3;
        default:          return 12;
    }
}

/**
 * Score actual transit aspects — each aspect contributes positively or negatively.
 * Max 25 pts. This is date-specific because the transits come from the
 * natal transit API for the exact travel date.
 */
function scoreTransits(transits: { planets?: string; type?: string; aspect?: string; system?: string; orb?: number }[]): number {
    let score = 12; // Start at neutral baseline

    const BENEFICS = ["venus", "jupiter"];
    const MALEFICS = ["mars", "saturn", "pluto"];

    for (const t of transits) {
        const raw = (t.planets || "").toLowerCase();
        const aspectStr = (t.aspect || t.type || "").toLowerCase();
        const orb = Math.abs(t.orb || 3);

        const hasBenefic = BENEFICS.some(p => raw.includes(p));
        const hasMalefic = MALEFICS.some(p => raw.includes(p));

        const isHard = ["square", "opposition", "□", "☍"].some(a => aspectStr.includes(a) || raw.includes(a));
        const isSoft = ["trine", "sextile", "△", "⚹"].some(a => aspectStr.includes(a) || raw.includes(a));
        const isConjunction = ["conjunction", "☌"].some(a => aspectStr.includes(a) || raw.includes(a));

        // Tighter orbs have stronger effect
        const orbWeight = orb <= 1 ? 1.5 : orb <= 3 ? 1.0 : 0.6;

        if (isSoft && hasBenefic) {
            score += Math.round(3 * orbWeight);
        } else if (isSoft && !hasMalefic) {
            score += Math.round(2 * orbWeight);
        } else if (isConjunction && hasBenefic && !hasMalefic) {
            score += Math.round(3 * orbWeight);
        } else if (isConjunction && hasMalefic) {
            score -= Math.round(2 * orbWeight);
        } else if (isHard && hasMalefic) {
            score -= Math.round(3 * orbWeight);
        } else if (isHard && hasBenefic) {
            score -= Math.round(1 * orbWeight);
        } else if (isHard) {
            score -= Math.round(2 * orbWeight);
        } else if (isSoft) {
            score += Math.round(1 * orbWeight);
        }
    }

    return Math.max(0, Math.min(25, score));
}

/** Verdict band from a numeric trip score — aligned with 12-month windows. */
export function getVerdict(score: number): "excellent" | "caution" | "avoid" {
    if (score >= 80) return "excellent";
    if (score >= 45) return "caution";
    return "avoid";
}

// ── House Matrix integration ──────────────────────────────────────────────

import type { HouseScore } from "./house-matrix";

/** Compute macro aggregate from an array of 12 HouseScores (equal weight). */
export function macroScoreFromMatrix(houses: HouseScore[]): number {
    if (!houses || houses.length === 0) return 0;
    return Math.round(houses.reduce((sum, h) => sum + h.score, 0) / houses.length);
}
