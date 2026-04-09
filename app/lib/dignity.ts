/**
 * dignity.ts — Essential & Accidental Dignity calculators.
 *
 * V4 — 5-Tier Lilly Point System (P0-A remediation)
 *
 * Replaces the old binary ±15 system with William Lilly's granular scoring:
 *   +15 Ruler/Domicile, +12 Exaltation, +9 Triplicity, +6 Term, +3 Face
 *   −15 Detriment, −12 Fall, −15 Peregrine (no dignity at all)
 *
 * A planet can hold MULTIPLE dignities simultaneously (e.g., ruler + own term = +7).
 * A planet with ZERO positive dignities is Peregrine (−5).
 *
 * References:
 *   - Skyscript "Understanding Planetary Dignity" Part 5 (Lilly's Table)
 *   - Ptolemy's Table of Essential Dignities
 *   - Chris Brennan "Hellenistic Astrology" (Dorothean triplicities)
 */

import {
    ESSENTIAL_DIGNITY,
    ANGULAR_HOUSES,
    SUCCEDENT_HOUSES,
} from "./astro-constants";

import {
    DIGNITY_SCORES,
    TRIPLICITY_LORDS,
    SIGN_ELEMENT,
    EGYPTIAN_TERMS,
    CHALDEAN_FACES,
} from "./dignity-tables";

// ── Essential Dignity Score ───────────────────────────────────────────────

/**
 * Compute the TOTAL essential dignity score for a planet at a specific
 * sign + optional degree, using Lilly's 5-tier point system.
 *
 * Backward compatible: if `degree` and `sect` are omitted, only Ruler and
 * Exaltation/Detriment/Fall are evaluated (same scope as the old binary system,
 * but now with correct relative magnitudes).
 *
 * @param planet  Planet name (e.g. "Mars", "Venus") — case-sensitive
 * @param sign    Zodiac sign the planet is in (e.g. "Aries")
 * @param degree  Degree within the sign [0–29.99] — enables Term and Face scoring
 * @param sect    "day" | "night" — enables Triplicity scoring
 */
export function essentialDignityScore(
    planet: string,
    sign: string,
    degree?: number,
    sect?: "day" | "night",
): number {
    const table = ESSENTIAL_DIGNITY[planet];
    let score = 0;
    let hasPositiveDignity = false;

    // 1. Ruler / Domicile → +5 | Detriment → −5
    if (table?.domicile.includes(sign)) {
        score += DIGNITY_SCORES.RULER;
        hasPositiveDignity = true;
    } else if (table?.detriment.includes(sign)) {
        score += DIGNITY_SCORES.DETRIMENT;
    }

    // 2. Exaltation → +4 | Fall → −4
    if (table?.exalted.includes(sign)) {
        score += DIGNITY_SCORES.EXALTATION;
        hasPositiveDignity = true;
    } else if (table?.fall.includes(sign)) {
        score += DIGNITY_SCORES.FALL;
    }

    // 3. Triplicity → +3 (requires sect)
    if (sect) {
        const element = SIGN_ELEMENT[sign];
        if (element) {
            const lords = TRIPLICITY_LORDS[element];
            if (lords) {
                // Sect-appropriate lord: full +3
                const isSectLord =
                    sect === "day" ? lords.day === planet : lords.night === planet;
                // Participating lord: +1 (reduced — always relevant regardless of sect)
                const isParticipating = lords.participating === planet;

                if (isSectLord) {
                    score += DIGNITY_SCORES.TRIPLICITY;
                    hasPositiveDignity = true;
                } else if (isParticipating && !isSectLord) {
                    score += 1; // Reduced credit for participating lord
                    hasPositiveDignity = true;
                }
            }
        }
    }

    // 4. Egyptian Term → +2 (requires degree)
    if (degree !== undefined) {
        const terms = EGYPTIAN_TERMS[sign];
        if (terms) {
            for (const [endDeg, ruler] of terms) {
                if (degree < endDeg) {
                    if (ruler === planet) {
                        score += DIGNITY_SCORES.TERM;
                        hasPositiveDignity = true;
                    }
                    break;
                }
            }
        }
    }

    // 5. Chaldean Face/Decan → +1 (requires degree)
    if (degree !== undefined) {
        const faces = CHALDEAN_FACES[sign];
        if (faces) {
            const faceIdx = Math.min(2, Math.floor(degree / 10));
            if (faces[faceIdx] === planet) {
                score += DIGNITY_SCORES.FACE;
                hasPositiveDignity = true;
            }
        }
    }

    // 6. Peregrine → −5 (no positive dignity of any kind)
    //    Only apply peregrine if the planet is not already debilitated
    //    (a planet in detriment/fall is worse than peregrine, not additionally penalized)
    if (!hasPositiveDignity && score === 0) {
        score = DIGNITY_SCORES.PEREGRINE;
    }

    return score;
}

// ── Essential Dignity Label ───────────────────────────────────────────────

/**
 * Returns a human-readable label for the highest dignity or worst debility.
 * Used for display in the UI; uses the same underlying table.
 */
export function essentialDignityLabel(
    planet: string,
    sign: string,
    degree?: number,
    sect?: "day" | "night",
): string {
    const table = ESSENTIAL_DIGNITY[planet];
    if (!table) return "Peregrine";

    if (table.domicile.includes(sign)) return "Domicile";
    if (table.exalted.includes(sign))  return "Exalted";
    if (table.detriment.includes(sign)) return "Detriment";
    if (table.fall.includes(sign))      return "Fall";

    // Check triplicity
    if (sect) {
        const element = SIGN_ELEMENT[sign];
        if (element) {
            const lords = TRIPLICITY_LORDS[element];
            if (lords) {
                const isSectLord = sect === "day" ? lords.day === planet : lords.night === planet;
                if (isSectLord) return "Triplicity";
                if (lords.participating === planet) return "Participating";
            }
        }
    }

    // Check term
    if (degree !== undefined) {
        const terms = EGYPTIAN_TERMS[sign];
        if (terms) {
            for (const [endDeg, ruler] of terms) {
                if (degree < endDeg) {
                    if (ruler === planet) return "Term";
                    break;
                }
            }
        }
        // Check face
        const faces = CHALDEAN_FACES[sign];
        if (faces) {
            const faceIdx = Math.min(2, Math.floor(degree / 10));
            if (faces[faceIdx] === planet) return "Face";
        }
    }

    return "Peregrine";
}
