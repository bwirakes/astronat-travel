/**
 * degree-theory.ts — "Degree Theory" archetype scoring.
 *
 * Per https://www.lunarxluci.com/degree-theory, the Nth degree within a sign
 * is colored by the Nth sign's archetype:
 *   1° → Aries archetype, 2° → Taurus, … 12° → Pisces, then 13° → Aries again, …
 *   0° is the rebirth / critical-fresh degree (treated as +2 nudge)
 *   29° is the anaretic / crisis degree (treated as -3 nudge)
 *
 * If the degree-sign matches a planet's domicile sign, +2.
 * If the degree-sign matches a planet's detriment sign, -2.
 * Otherwise 0.
 *
 * The scored use is gated by DEGREE_THEORY_ENABLED in scoring-flags.ts.
 */

import { ESSENTIAL_DIGNITY } from "./astro-constants";
import { isDegreeTheoryEnabled } from "./scoring-flags";

const ZODIAC = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

/**
 * Resonance categories for the degree-sign of a planet relative to its own
 * essential nature.  Used for UI/display only — the scored modifier lives
 * in `degreeTheoryModifier` and applies a smaller numeric nudge.
 */
export interface DegreeTheoryLabel {
    degreeSign: string;
    isAnaretic: boolean;
    isZeroDegree: boolean;
    resonance: "harmonious" | "neutral" | "tense";
}

/**
 * Returns the degree-theory archetype label for an ecliptic longitude.
 * The "degree-sign" is the sign whose archetype colors this degree (1°=Aries,
 * 2°=Taurus, …).  The function is planet-agnostic; the resonance field is
 * always "neutral" — pair it with a planet via `degreeTheoryModifier` to
 * get the scored polarity.
 */
export function degreeTheoryLabel(longitude: number): DegreeTheoryLabel {
    const norm = ((longitude % 360) + 360) % 360;
    const degInSign = norm % 30;
    // Floor so 14.x → 14° (Pisces archetype), 0.x → 0° (rebirth).
    const intDeg = Math.floor(degInSign);

    const isZeroDegree = intDeg === 0;
    const isAnaretic = intDeg === 29;

    // Map degree N (1-29) → Nth sign in zodiac (1-indexed). Wrap above 12.
    // 0° gets a sign too (we use Aries as a convenient default for display);
    // the modifier treats 0° specially regardless of the mapped sign.
    let degreeSignIdx: number;
    if (intDeg === 0) {
        degreeSignIdx = 0; // Aries placeholder
    } else {
        degreeSignIdx = (intDeg - 1) % 12;
    }
    const degreeSign = ZODIAC[degreeSignIdx];

    return {
        degreeSign,
        isAnaretic,
        isZeroDegree,
        resonance: "neutral",
    };
}

/**
 * Additive nudge in [-3, +3] for a planet at a given longitude. Returns 0
 * when the DEGREE_THEORY_ENABLED flag is off.
 *
 * Stacking rule: anaretic and zero-degree are evaluated FIRST and
 * short-circuit (they describe the degree itself, not its planet match).
 * Otherwise we check domicile/detriment match. Only one of the four cases
 * fires per call.
 */
export function degreeTheoryModifier(planetName: string, longitude: number): number {
    if (!isDegreeTheoryEnabled()) return 0;

    const norm = ((longitude % 360) + 360) % 360;
    const degInSign = norm % 30;
    const intDeg = Math.floor(degInSign);

    if (intDeg === 29) return -3;
    if (intDeg === 0)  return  2;

    const degreeSignIdx = (intDeg - 1) % 12;
    const degreeSign = ZODIAC[degreeSignIdx];

    // Try several capitalisations of the planet name to be tolerant of
    // upstream casing.
    const lookup =
        ESSENTIAL_DIGNITY[planetName] ??
        ESSENTIAL_DIGNITY[planetName.charAt(0).toUpperCase() + planetName.slice(1).toLowerCase()];
    if (!lookup) return 0;

    if (lookup.domicile.includes(degreeSign))  return  2;
    if (lookup.detriment.includes(degreeSign)) return -2;
    return 0;
}
