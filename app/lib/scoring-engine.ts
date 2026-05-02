/**
 * scoring-engine.ts — The Mathematical Core for the AstroNat V4 Engine
 * Translates House Volumes + Planet Library modifiers into E_Final Life Event variables.
 */

import { HouseMatrixResult } from "./house-matrix";
import { W_EVENTS, M_AFFINITY, PLANETS, NUM_HOUSES, LIFE_EVENTS } from "./planet-library";
import { EVENT_LABELS, verdictBand } from "./verdict";

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

/**
 * Calculates the Continuous Vector-Space Model Event Scores.
 * Mathematical Formula: E_Final = (W_events * H_final) + (M_affinity * S_global)
 * 
 * @param matrixResult The aggregated 12-house calculated scores
 * @param relocatedPlanets The planets and their global states
 */
export function computeEventScores(
    matrixResult: HouseMatrixResult,
    relocatedPlanets: OccupancyPlanet[]
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

    // 5. Final Synthesis Matrix Loop
    const results: FinalEventScore[] = [];
    for (let i = 0; i < LIFE_EVENTS.length; i++) {
        const baseVolume = baseEventVolumes[i];
        const affinityModifier = affinityModifiers[i];
        
        // E_Final = Base Volume + Affinity Modifiers
        const rawScore = baseVolume + affinityModifier;
        const finalScore = Math.max(0, Math.min(100, Math.round(rawScore))); // Floor/Ceil clamp

        results.push({
            eventName: LIFE_EVENTS[i],
            baseVolume: Math.round(baseVolume),
            affinityModifier: Math.round(affinityModifier),
            finalScore,
            verdict: getEventVerdict(finalScore)
        });
    }

    return results;
}
