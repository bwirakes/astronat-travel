/**
 * temporal-tensor.ts — 12-to-24 Month Temporal Projection (The Time-Series Tensor)
 * Part 3 of the AstroNat Computation Engine
 */

import { HouseMatrixResult } from "./house-matrix";
import { OccupancyPlanet, FinalEventScore, computeEventScores } from "./scoring-engine";

export interface TemporalSnapshot {
    dateIso: string; // The week block date
    transitsForWeek: any[]; // The dynamic transits pushing geometric aspect to relocated angles
}

export interface TensorPoint {
    dateIso: string;
    eventScores: FinalEventScore[];
}

export interface OptimalPeak {
    eventName: string;
    peakDateIso: string;
    peakScore: number;
    initialScore: number;
}

/**
 * Projects continuous transits into a Time-Series Tensor tracking future peaks.
 * Corresponds to scipy.signal.find_peaks logic scaling over T increments.
 * 
 * @param baseMatrix Static starting properties
 * @param relocatedPlanets Planetary positions matching baseline snapshot 
 * @param snapshots Total chunks defined linearly over timeline (Usually 104 -> 2 years)
 * @param computeHouseFn Method evaluating transit geometries
 */
export function projectTemporalTensor(
    baseMatrix: HouseMatrixResult,
    relocatedPlanets: OccupancyPlanet[],
    snapshots: TemporalSnapshot[], 
    computeHouseFn: (base: HouseMatrixResult, dynamicTransits: any[]) => HouseMatrixResult
): {
    tensorCurve: TensorPoint[];
    peaks: OptimalPeak[];
} {
    const tensorCurve: TensorPoint[] = [];
    const peakMap = new Map<string, OptimalPeak>();

    // t0 Baseline Setup
    const baseEventScores = computeEventScores(baseMatrix, relocatedPlanets);

    baseEventScores.forEach(e => {
        peakMap.set(e.eventName, {
            eventName: e.eventName,
            peakDateIso: 'TODAY',
            peakScore: e.finalScore,
            initialScore: e.finalScore
        });
    });

    // Sub-looping Time Projection over temporal map
    for (const snap of snapshots) {
        
        // 1. Recalculate H_geo(t) modifier using the active window
        const temporalBaseline = computeHouseFn(baseMatrix, snap.transitsForWeek);

        // 2. Synthesize unified numeric score sequence for t_x
        const eFinalT = computeEventScores(temporalBaseline, relocatedPlanets);

        tensorCurve.push({
            dateIso: snap.dateIso,
            eventScores: eFinalT
        });

        // 3. Peak Finding Math - Capture ascending max probabilities 
        for (const evt of eFinalT) {
            const currentPeak = peakMap.get(evt.eventName);
            if (currentPeak && evt.finalScore > currentPeak.peakScore) {
                currentPeak.peakScore = evt.finalScore;
                currentPeak.peakDateIso = snap.dateIso;
            }
        }
    }

    return {
        tensorCurve,
        peaks: Array.from(peakMap.values())
    };
}
