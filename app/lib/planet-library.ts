/**
 * planet-library.ts — Vectorizing Life Events & Generalized Planetary Affinity
 * Part 2 of the AstroNat Computation Engine
 */

import { WIDE_SCORING_V1 } from "./scoring-flags";

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
const W_EVENTS_BASE: Matrix2D = [
    // H1    H2    H3    H4    H5    H6    H7    H8    H9   H10   H11   H12
    [ 0.55, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.30, 0.15, 0.00, 0.00 ], // 0: Identity = body/self + direction + visibility
    [ 0.00, 0.45, 0.00, 0.00, 0.00, 0.10, 0.00, 0.25, 0.00, 0.15, 0.05, 0.00 ], // 1: Wealth = resources + shared money + work/career/network
    [ 0.00, 0.10, 0.00, 0.75, 0.00, 0.00, 0.05, 0.00, 0.00, 0.00, 0.00, 0.10 ], // 2: Home = roots + security + close others + privacy
    [ 0.00, 0.00, 0.00, 0.00, 0.50, 0.00, 0.40, 0.00, 0.00, 0.00, 0.10, 0.00 ], // 3: Romance = joy + partnership + social openings
    [ 0.35, 0.00, 0.00, 0.15, 0.00, 0.35, 0.00, 0.00, 0.00, 0.00, 0.00, 0.15 ], // 4: Health = body + routines + rest + home base
    [ 0.00, 0.00, 0.00, 0.00, 0.10, 0.00, 0.70, 0.00, 0.00, 0.00, 0.20, 0.00 ], // 5: Partnerships = others + durable allies + pleasure
    [ 0.10, 0.15, 0.00, 0.00, 0.00, 0.20, 0.00, 0.00, 0.00, 0.45, 0.10, 0.00 ], // 6: Career = public role + work + resources + allies
    [ 0.00, 0.00, 0.25, 0.00, 0.10, 0.00, 0.10, 0.00, 0.00, 0.00, 0.55, 0.00 ], // 7: Friendship = tribe + local contact + invitations
    [ 0.00, 0.00, 0.00, 0.15, 0.00, 0.00, 0.00, 0.15, 0.40, 0.00, 0.00, 0.30 ]  // 8: Spirituality = meaning + retreat + depth + roots
];

// WIDE_SCORING_V1 keeps the same house-first goal semantics as the base matrix.
// The variance widening happens in bucket normalization/weights, not by changing
// what a life goal means.
const W_EVENTS_WIDE_V1: Matrix2D = [
    ...W_EVENTS_BASE,
];

export const W_EVENTS: Matrix2D = WIDE_SCORING_V1 ? W_EVENTS_WIDE_V1 : W_EVENTS_BASE;

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

    // --- 1b. Goal-specific support channels
    // Health is more than the H6 illness house: vitality, regulation,
    // restorative privacy, and sustainable public rhythm should all score.
    applyModifier(4, 'sun', 1, 10);
    applyModifier(4, 'sun', 10, 8);
    applyModifier(4, 'moon', 1, 10);
    applyModifier(4, 'moon', 4, 8);
    applyModifier(4, 'moon', 6, 8);
    applyModifier(4, 'venus', 6, 8);
    applyModifier(4, 'jupiter', 6, 10);
    applyModifier(4, 'saturn', 6, 6);

    // Career needs visibility and networks, not just the formal work axis.
    applyModifier(6, 'sun', 10, 14);
    applyModifier(6, 'jupiter', 10, 12);
    applyModifier(6, 'mercury', 10, 10);
    applyModifier(6, 'mercury', 11, 8);
    applyModifier(6, 'jupiter', 11, 10);
    applyModifier(6, 'sun', 1, 8);
    applyModifier(6, 'mars', 10, 8);
    applyModifier(6, 'saturn', 10, 8);

    // Wealth is not only "money in hand" (H2). Travel readings should also
    // recognize trade, clients, institutional/shared resources, and useful
    // networks when the relocated chart supports them.
    applyModifier(1, 'jupiter', 2, 9);
    applyModifier(1, 'jupiter', 8, 6);
    applyModifier(1, 'jupiter', 10, 6);
    applyModifier(1, 'jupiter', 11, 8);
    applyModifier(1, 'venus', 2, 8);
    applyModifier(1, 'venus', 8, 4);
    applyModifier(1, 'venus', 11, 6);
    applyModifier(1, 'mercury', 2, 6);
    applyModifier(1, 'mercury', 6, 4);
    applyModifier(1, 'mercury', 10, 6);
    applyModifier(1, 'mercury', 11, 6);
    applyModifier(1, 'saturn', 2, 3);
    applyModifier(1, 'saturn', 10, 5);
    applyModifier(1, 'saturn', 11, 3);

    // Home needs a softer path through Moon/Venus/Jupiter and a constructive
    // Saturn path for settling, leases, family duty, and long-term roots.
    applyModifier(2, 'moon', 4, 11);
    applyModifier(2, 'venus', 4, 9);
    applyModifier(2, 'jupiter', 4, 8);
    applyModifier(2, 'sun', 4, 5);
    applyModifier(2, 'saturn', 4, 3);
    applyModifier(2, 'moon', 12, 4);
    applyModifier(2, 'venus', 2, 4);

    // Partnerships need more than Venus romance: Moon for attachment, Jupiter
    // for goodwill, Mercury for negotiation, and Saturn for commitment when
    // it is not otherwise flagged as harsh.
    applyModifier(5, 'venus', 7, 12);
    applyModifier(5, 'jupiter', 7, 8);
    applyModifier(5, 'moon', 7, 6);
    applyModifier(5, 'mercury', 7, 5);
    applyModifier(5, 'saturn', 7, 2);
    applyModifier(5, 'venus', 11, 6);
    applyModifier(5, 'jupiter', 11, 4);

    // Friendship/networking was too dependent on the generic H11 score. Add
    // concrete channels for local rapport, invitations, allies, and benefic
    // social lift.
    applyModifier(7, 'mercury', 3, 8);
    applyModifier(7, 'mercury', 11, 9);
    applyModifier(7, 'jupiter', 3, 6);
    applyModifier(7, 'jupiter', 11, 11);
    applyModifier(7, 'venus', 5, 4);
    applyModifier(7, 'venus', 11, 8);
    applyModifier(7, 'moon', 3, 4);
    applyModifier(7, 'moon', 11, 6);

    // Spirituality should have routes through meaning and pilgrimage, not only
    // dark-house retreat.
    applyModifier(8, 'jupiter', 9, 14);
    applyModifier(8, 'jupiter', 12, 12);
    applyModifier(8, 'moon', 4, 8);
    applyModifier(8, 'moon', 9, 8);
    applyModifier(8, 'moon', 12, 10);
    applyModifier(8, 'neptune', 9, 10);
    applyModifier(8, 'neptune', 12, 12);

    // --- 2. Angular Friction
    // A malefic on an emotional angle is pressure, not an automatic "no."
    // The house matrix already scores dignity, sect, bridge, retrograde, live
    // transits, and stations; keeping these as steep blanket penalties was
    // double-counting the same warning and making ordinary Mars/Saturn angular
    // placements read cursed. Mars = heat/conflict; Saturn = weight/commitment.
    applyModifier(2, 'mars', 4, -10);   // H4 = heat/restlessness at home
    applyModifier(2, 'saturn', 4, -12); // H4 = weight/responsibility at home
    applyModifier(3, 'mars', 7, -14);   // H7 = chemistry plus conflict
    applyModifier(3, 'saturn', 7, -12); // H7 = seriousness, slower warmth
    applyModifier(5, 'mars', 7, -12);   // H7 = friction in partnership
    applyModifier(5, 'saturn', 7, -8);  // H7 = commitment pressure, not hostile by default

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
    applyDignity(3, 'venus', 2, -7);
    applyDignity(3, 'venus', 3, -10);
    applyLine(3, 'venus', 20);       // Venus Line Active -> +20 Romance globally
    applyLine(5, 'venus', 15);       // Venus Line Active -> +15 Partnerships globally

    // Jupiter = Wealth & Growth
    applyDignity(1, 'jupiter', 0, 10); // Jupiter Domicile -> +10 Wealth globally
    applyDignity(1, 'jupiter', 1, 15); // Jupiter Exalted -> +15 Wealth globally
    applyDignity(1, 'jupiter', 2, -6);
    applyDignity(1, 'jupiter', 3, -9);
    applyDignity(1, 'venus', 0, 4);
    applyDignity(1, 'venus', 1, 6);
    applyDignity(1, 'venus', 2, -4);
    applyDignity(1, 'venus', 3, -6);
    applyDignity(1, 'mercury', 0, 4);
    applyDignity(1, 'mercury', 1, 6);
    applyLine(1, 'jupiter', 20);       // Jupiter Line Active -> +20 Wealth globally
    applyLine(1, 'venus', 8);
    applyLine(1, 'mercury', 6);

    // Weak-goal dignity channels.
    applyDignity(2, 'moon', 0, 6);
    applyDignity(2, 'moon', 1, 8);
    applyDignity(2, 'venus', 0, 4);
    applyDignity(2, 'venus', 1, 5);
    applyDignity(2, 'moon', 2, -5);
    applyDignity(2, 'moon', 3, -7);
    applyDignity(5, 'venus', 0, 6);
    applyDignity(5, 'venus', 1, 8);
    applyDignity(5, 'venus', 2, -6);
    applyDignity(5, 'venus', 3, -8);
    applyDignity(5, 'jupiter', 0, 4);
    applyDignity(5, 'jupiter', 1, 5);
    applyDignity(5, 'jupiter', 2, -4);
    applyDignity(5, 'jupiter', 3, -5);
    applyDignity(7, 'mercury', 0, 6);
    applyDignity(7, 'mercury', 1, 8);
    applyDignity(7, 'jupiter', 0, 4);
    applyDignity(7, 'jupiter', 1, 6);
    applyDignity(7, 'jupiter', 2, -4);
    applyDignity(7, 'jupiter', 3, -6);

    // Goal-aware ACG line channels. The scoring engine now feeds this column
    // with distance-weighted line strength, so exact city lines separate from
    // broad 2000km background contacts.
    applyLine(4, 'moon', 12);
    applyLine(4, 'sun', 12);
    applyLine(4, 'venus', 8);
    applyLine(4, 'jupiter', 10);
    applyLine(2, 'moon', 10);
    applyLine(2, 'venus', 8);
    applyLine(2, 'jupiter', 6);
    applyLine(5, 'jupiter', 6);
    applyLine(7, 'mercury', 9);
    applyLine(7, 'jupiter', 11);
    applyLine(7, 'venus', 8);
    applyLine(6, 'sun', 16);
    applyLine(6, 'jupiter', 14);
    applyLine(6, 'mercury', 10);
    applyLine(6, 'saturn', 8);
    applyLine(8, 'moon', 10);
    applyLine(8, 'jupiter', 14);
    applyLine(8, 'neptune', 14);

    // --- 5. Hard-coded Overrides conforming precisely to Part 4 Memo Example ---
    // User Target: Event 4 (Romance). Saturn physically in H5, Mars in H12.
    applyModifier(3, 'saturn', 5, -10); // Saturn H5 slows pleasure; it needn't erase it
    applyModifier(3, 'mars', 12, -6);   // Mars H12 cross-contamination, already caught elsewhere

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
        case "sun":     return isTravelHouse ? 14 : 12;   // Luminary — mildly positive (reduced from 18/15)
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

// ── P0-B: Sect Modulation ──────────────────────────────────────────────────

/** Traditional day-sect planets (perform best in day charts above horizon) */
const DAY_SECT_PLANETS   = ["sun", "jupiter", "saturn"];
/** Traditional night-sect planets (perform best in night charts below horizon) */
const NIGHT_SECT_PLANETS = ["moon", "venus", "mars"];
/** All traditional planets eligible for sect modulation */
const TRADITIONAL_PLANETS = [...DAY_SECT_PLANETS, ...NIGHT_SECT_PLANETS, "mercury"];

/**
 * Applies Hellenistic sect modulation to an occupant modifier.
 *
 * Day chart (Sun above horizon):
 *   In-sect (Sun, Jupiter, Saturn) → +25% to positive modifier / −30% to negative
 *   Out-of-sect malefics (Mars) → +40% penalty amplification = most difficult
 *
 * Night chart (Sun below horizon):
 *   In-sect (Moon, Venus, Mars) → same boost
 *   Out-of-sect malefics (Saturn) → +40% penalty amplification = most difficult
 *
 * Mercury is "sect of the chart light" — neutral, no modulation.
 * Outer planets (Uranus, Neptune, Pluto) are unaffected by sect.
 *
 * @param baseMod   The base occupant modifier from getOccupantModifier()
 * @param planetName  Lowercase planet name
 * @param sect      "day" | "night"
 */
export function applySectModulation(
    baseMod: number,
    planetName: string,
    sect: "day" | "night",
): number {
    const p = planetName.toLowerCase();

    // Only traditional 7 planets are sect-aware
    if (!TRADITIONAL_PLANETS.includes(p)) return baseMod;

    // Mercury takes on the sect of the chart's ruling light — neutral modulation
    if (p === "mercury") return baseMod;

    const inSect = sect === "day"
        ? DAY_SECT_PLANETS.includes(p)
        : NIGHT_SECT_PLANETS.includes(p);

    if (baseMod > 0) {
        // Benefic planet in-sect: +25% boost — at its best
        // Benefic planet out-of-sect: −15% reduction — slightly constrained
        return inSect
            ? Math.round(baseMod * 1.25)
            : Math.round(baseMod * 0.85);
    }

    if (baseMod < 0) {
        // Malefic planet in-sect: −30% reduction — manageable, constructive
        // Malefic planet out-of-sect: +40% amplification — worst case scenario
        return inSect
            ? Math.round(baseMod * 0.70)
            : Math.round(baseMod * 1.40);
    }

    return baseMod; // Zero modifier: no change
}
