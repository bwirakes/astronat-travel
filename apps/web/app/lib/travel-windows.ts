/**
 * travel-windows.ts — Logic for computing the 12-month travel window scores
 * based on the house-matrix scoring engine and mundane astrology.
 */

import { computeMundaneData } from "./mundane-engine";
import { 
    computeHouseMatrix, 
    mapTransitsToMatrix, 
    computeGlobalPenalty,
    type MatrixNatalPlanet,
    type MatrixACGLine,
    type MatrixParan
} from "./house-matrix";
import { type TravelWindow } from "./planet-data";
import { computeRelocatedAscLon } from "./geodetic";
import { determineSect } from "./arabic-parts";

export interface ComputeWindowsParams {
    startDateStr: string;
    lat: number;
    lon: number;
    natalPlanets: MatrixNatalPlanet[];
    acgLines: MatrixACGLine[];
    /** Birth latitude — determines Placidus vs Whole Sign house system */
    birthLat?: number;
    /** Lot of Fortune longitude (pre-computed from natal) */
    lotOfFortuneLon?: number;
    /** Lot of Spirit longitude (pre-computed from natal) */
    lotOfSpiritLon?: number;
}

/**
 * Computes a score for a single month's first day.
 */
async function getScoreForDate(
    date: string,
    lat: number,
    lon: number,
    natalPlanets: MatrixNatalPlanet[],
    acgLines: MatrixACGLine[],
    birthLat?: number,
    lotOfFortuneLon?: number,
    lotOfSpiritLon?: number,
): Promise<TravelWindow> {
    const mundane = await computeMundaneData({ date, time: "12:00", lat, lon });
    
    // Relocated cusps for house-matrix (whole sign, using relocated ASC)
    const ascLon = computeRelocatedAscLon(lat, lon);
    const relocatedCusps = Array.from({ length: 12 }, (_, i) => (ascLon + i * 30) % 360);

    const mappedTransits = mapTransitsToMatrix(mundane.worldTransits, natalPlanets, relocatedCusps, birthLat);
    const globalPenalty = computeGlobalPenalty(mundane.worldTransits);

    // Compute sect from natal Sun vs relocated ASC
    const sunForSect = natalPlanets.find(
        p => (p.planet || (p as any).name || "").toLowerCase() === "sun"
    );
    const sect = sunForSect
        ? determineSect(sunForSect.longitude, relocatedCusps[0] ?? 0)
        : undefined;

    const matrix = computeHouseMatrix({
        natalPlanets,
        relocatedCusps,
        acgLines,
        transits: mappedTransits,
        parans: mundane.parans as MatrixParan[],
        destLat: lat,
        destLon: lon,
        globalPenalty,
        birthLat,
        lotOfFortuneLon,
        lotOfSpiritLon,
        sect,
    });

    const macroScore = matrix.macroScore;

    let quality: TravelWindow["quality"] = "good";
    if (macroScore >= 80) quality = "excellent";
    else if (macroScore < 35) quality = "avoid";
    else if (macroScore < 50) quality = "caution";

    // Aggregate house summary (top 3 houses)
    const sortedHouses = [...matrix.houses].sort((a, b) => b.score - a.score);
    const top3 = sortedHouses.slice(0, 3).map(h => {
        // Simple heuristic: just the first part of the theme
        return h.sphere.split(",")[0].split("&")[0].trim();
    });
    const houseLabel = `Focus: ${top3.join(", ")}`;

    // Reason derivation (from top transit)
    const topTransit = mundane.worldTransits.filter(t => t.isTense).sort((a, b) => (a.orb || 5) - (b.orb || 5))[0];
    const reason = topTransit 
        ? `${topTransit.p1} ${topTransit.aspect} ${topTransit.p2}`
        : "Dynamic planetary support";

    // Format month label
    const d = new Date(date + "T12:00:00");
    const month = d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });

    return {
        month,
        // Basic quality binning based on the normalized V4 macroScore
        quality,
        score: macroScore,
        reason,
        house: houseLabel
    };
}

/**
 * Main entrance point for computing 12 months of scoring.
 */
export async function compute12MonthWindows(params: ComputeWindowsParams): Promise<TravelWindow[]> {
    const { startDateStr, lat, lon, natalPlanets, acgLines, birthLat, lotOfFortuneLon, lotOfSpiritLon } = params;
    
    // Parse start date
    const start = new Date(startDateStr + "T12:00:00");
    const year = start.getFullYear();
    const month = start.getMonth();

    const results: TravelWindow[] = [];

    // Loop through 12 months
    for (let i = 0; i < 12; i++) {
        const d = new Date(year, month + i, 1);
        const dateStr = d.toISOString().split("T")[0];
        
        try {
            const win = await getScoreForDate(dateStr, lat, lon, natalPlanets, acgLines, birthLat, lotOfFortuneLon, lotOfSpiritLon);
            results.push(win);
        } catch (err) {
            console.error(`Error computing window for ${dateStr}:`, err);
            // Push mock/fallback for this month
            results.push({
                month: d.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
                quality: "good",
                score: 50, // Default for 0 transits
                reason: "General baseline window",
                house: "9th House (Travel)"
            });
        }
    }

    return results;
}
