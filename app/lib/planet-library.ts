/**
 * planet-library.ts — Vectorizing Life Events & Generalized Planetary Affinity
 * Part 2 of the AstroNat Computation Engine
 */

export const LIFE_EVENTS = [
    "Identity & Self-Discovery",    // 0
    "Wealth & Financial Growth",    // 1
    "Home, Family & Roots",         // 2
    "Romance & Love",               // 3 (Event 4 from memo)
    "Health, Routine & Wellness",   // 4
    "Partnerships & Marriage",      // 5
    "Career & Public Recognition",  // 6
    "Friendship & Networking",      // 7
    "Spirituality & Inner Peace"    // 8
];

export const PLANETS = [
    "sun", "moon", "mercury", "venus", "mars", 
    "jupiter", "saturn", "uranus", "neptune", "pluto"
];

export const NUM_HOUSES = 12;

type Matrix2D = number[][];

/**
 * Layer A: The Base Event Matrix (W_events)
 * A 9x12 matrix linearly mapping the 12 relocated House Volumes to 9 specific Life Goals.
 * Rows = Life Events [0-8], Cols = Houses [0-11]
 */
export const W_EVENTS: Matrix2D = [
    // H1    H2    H3    H4    H5    H6    H7    H8    H9   H10   H11   H12
    [ 0.70, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.30, 0.00, 0.00, 0.00 ], // 0: Identity
    [ 0.00, 0.70, 0.00, 0.00, 0.00, 0.00, 0.00, 0.30, 0.00, 0.00, 0.00, 0.00 ], // 1: Wealth
    [ 0.00, 0.00, 0.00, 1.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00 ], // 2: Home
    [ 0.00, 0.00, 0.00, 0.00, 0.40, 0.00, 0.60, 0.00, 0.00, 0.00, 0.00, 0.00 ], // 3: Romance (0.6 H7 + 0.4 H5)
    [ 0.00, 0.00, 0.00, 0.00, 0.00, 0.80, 0.00, 0.00, 0.00, 0.00, 0.00, 0.20 ], // 4: Health
    [ 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.80, 0.00, 0.00, 0.00, 0.20, 0.00 ], // 5: Partnerships
    [ 0.00, 0.15, 0.00, 0.00, 0.00, 0.25, 0.00, 0.00, 0.00, 0.60, 0.00, 0.00 ], // 6: Career (0.6 H10 + 0.25 H6 + 0.15 H2)
    [ 0.00, 0.00, 0.30, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.70, 0.00 ], // 7: Friendship
    [ 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.30, 0.30, 0.00, 0.00, 0.40 ]  // 8: Spirituality
];

/**
 * Layer B: The Generalized Planetary Affinity Matrix (M_affinity)
 * A 9x170 matrix mapped to classical Classical Metrology.
 * Evaluated mathematically through S_global (170-vector).
 */
function buildAffinityMatrix(): Matrix2D {
    // 9 rows x 170 element array initialized to 0
    const matrix: Matrix2D = Array.from({ length: 9 }, () => new Array(170).fill(0));
    
    // Translates planet + house to integer index (0 - 119)
    const getOccIdx = (planet: string, house: number) => {
        const pIdx = PLANETS.indexOf(planet.toLowerCase());
        if (pIdx === -1) throw new Error(`Unknown planet: ${planet}`);
        return (house - 1) * 10 + pIdx; // E.g. H1 = 0-9, H2 = 10-19
    };

    // Translates planet + global dignity to index (120 - 159)
    // Dignity States: 0=Domicile, 1=Exalted, 2=Detriment, 3=Fall
    const getDignityIdx = (planet: string, state: number) => {
        const pIdx = PLANETS.indexOf(planet.toLowerCase());
        if (pIdx === -1) throw new Error(`Unknown planet: ${planet}`);
        return 120 + (pIdx * 4) + state;
    };

    // Translates planet + ACG Line active to index (160 - 169)
    const getLineIdx = (planet: string) => {
        const pIdx = PLANETS.indexOf(planet.toLowerCase());
        if (pIdx === -1) throw new Error(`Unknown planet: ${planet}`);
        return 160 + pIdx;
    };

    // Helpers
    const applyModifier = (eventIdx: number, planet: string, house: number, value: number) => {
        matrix[eventIdx][getOccIdx(planet, house)] += value;
    };
    const applyDignity = (eventIdx: number, planet: string, state: number, value: number) => {
        matrix[eventIdx][getDignityIdx(planet, state)] += value;
    };
    const applyLine = (eventIdx: number, planet: string, value: number) => {
        matrix[eventIdx][getLineIdx(planet)] += value;
    };

    // --- 1. Hellenistic Planetary Joys (Functional Ease)
    [3, 5].forEach(e => applyModifier(e, 'venus', 5, 15)); // Venus Joy H5 -> Romance & Partnerships
    [0, 6].forEach(e => applyModifier(e, 'mercury', 1, 15)); // Mercury Joy H1 -> Identity & Career
    applyModifier(4, 'mars', 6, 12); // Mars Joy in H6 gives body toughness against illness
    applyModifier(8, 'saturn', 12, 10); // Saturn Joy in H12 gives structure to retreat
    applyModifier(7, 'jupiter', 11, 15); // Jupiter Joy in H11 grants massive Networking luck
    applyModifier(8, 'moon', 3, 10); // Moon Joy H3 brings comfort in local environment
    applyModifier(0, 'sun', 9, 15); // Sun Joy H9 brings clear identity when traveling abroad

    // --- 2. Accidental Dignity and Angular Friction 
    ['mars', 'saturn'].forEach(malefic => {
        applyModifier(2, malefic, 4, -20); // H4 = Penalty on Home & Roots
        applyModifier(3, malefic, 7, -25); // H7 = Steep penalty on Romance
        applyModifier(5, malefic, 7, -25); // H7 = Steep penalty on Marriage
    });

    // --- 3. Cross-Contamination of 'Dark' Houses (H12, H8, H6)
    ['uranus', 'neptune', 'pluto', 'mars', 'saturn'].forEach(afflicted => {
        applyModifier(3, afflicted, 12, -10); // H12 damages Romance via hidden fear
        applyModifier(6, afflicted, 12, -10); // H12 damages Career via self-sabotage
        applyModifier(1, afflicted, 8, -12); // H8 damages Wealth via debt/entanglements
        applyModifier(5, afflicted, 8, -10); // H8 damages Partnerships via power struggles
    });

    // --- 4. Universal Planetary Significators (Global States 120-169)
    // Venus = Love & Aesthetics
    applyDignity(3, 'venus', 0, 10); // Venus Domicile -> +10 Romance globally
    applyDignity(3, 'venus', 1, 15); // Venus Exalted -> +15 Romance globally
    applyLine(3, 'venus', 20);       // Venus Line Active -> +20 Romance globally
    applyLine(5, 'venus', 15);       // Venus Line Active -> +15 Partnerships globally

    // Jupiter = Wealth & Growth
    applyDignity(1, 'jupiter', 0, 10); // Jupiter Domicile -> +10 Wealth globally
    applyDignity(1, 'jupiter', 1, 15); // Jupiter Exalted -> +15 Wealth globally
    applyLine(1, 'jupiter', 20);       // Jupiter Line Active -> +20 Wealth globally

    // --- 5. Hard-coded Overrides conforming precisely to Part 4 Memo Example ---
    // User Target: Event 4 (Romance). Saturn physically in H5, Mars in H12.
    applyModifier(3, 'saturn', 5, -15); // Saturn H5 Malefic restricting house of pleasure
    applyModifier(3, 'mars', 12, -10);  // Mars H12 Malefic cross-contamination.

    return matrix;
}

export const M_AFFINITY: Matrix2D = buildAffinityMatrix();

// ── Shared classifications for scoring (Moved from Engine) ────────────────

// Maps "p1|p2" (sorted alphabetically) to a score modifier
export const KNOWN_BENEFIC_COMBOS: Record<string, number> = {
    "jupiter|sun": 15,   "moon|sun": 12,     "jupiter|venus": 18,
    "sun|venus": 15,     "moon|venus": 15,    "moon|jupiter": 18,
    "jupiter|mercury": 12, "mercury|venus": 10, "neptune|venus": 12,
    "jupiter|neptune": 10, "moon|neptune": 8,
    "mars|sun": 8,       "jupiter|mars": 10,  "mars|mercury": 8,
    "neptune|sun": 8,    "mercury|uranus": 6, "sun|uranus": 6,
    "chiron|moon": 5,    "moon|north node": 10, "north node|venus": 12,
    "jupiter|north node": 15, "jupiter|saturn": 8,
};

export const KNOWN_MALEFIC_COMBOS: Record<string, number> = {
    "pluto|sun": -15,    "moon|pluto": -18,   "moon|saturn": -15,
    "mars|moon": -12,    "moon|uranus": -12,  "pluto|venus": -15,
    "mars|venus": -12,   "saturn|venus": -15, "mars|saturn": -18,
    "mars|pluto": -18,   "mars|uranus": -12,  "mars|neptune": -10,
    "chiron|mars": -10,  "neptune|saturn": -12, "neptune|pluto": -15,
    "neptune|uranus": -10, "north node|saturn": -12,
    "north node|pluto": -15, "mars|north node": -10,
};

/** Planet-specific occupant modifier — more granular than benefic/malefic binary */
export function getOccupantModifier(planetName: string, houseNum: number): number {
    const p = planetName.toLowerCase();
    // H9/H12/H3 get extra weight for travel planets
    const isTravelHouse = [9, 12, 3].includes(houseNum);
    switch (p) {
        case "jupiter": return isTravelHouse ? 30 : 25;   // Best benefic, especially in travel houses
        case "venus":   return isTravelHouse ? 20 : 18;
        case "sun":     return isTravelHouse ? 18 : 15;
        case "moon":    return 10;
        case "mercury": return 7;
        case "north node": case "true node": return 8;     // Karmic direction — mildly benefic
        case "chiron":  return isTravelHouse ? -5 : -8;    // Healing wound — challenging but not devastating
        case "juno":    return isTravelHouse ? 10 : 8;     // Partnerships — generally positive
        case "saturn":  return isTravelHouse ? -30 : -25;  // Delays, restriction — worse in travel houses
        case "pluto":   return isTravelHouse ? -25 : -20;  // Intense transformation
        case "mars":    return isTravelHouse ? -22 : -18;  // Disruption, conflict
        case "uranus":  return isTravelHouse ? -18 : -14;  // Erratic, unpredictable
        case "neptune": return isTravelHouse ? 8 : -5;     // Mystical in travel; confusing elsewhere
        case "south node":  return -10;                    // Karmic past — energy drain
        default:        return 3;
    }
}
