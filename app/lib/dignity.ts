/**
 * dignity.ts — Essential & Accidental Dignity calculators.
 * Pure functions used by the 12-House Matrix scoring engine.
 */
import {
    ESSENTIAL_DIGNITY,
    HOUSE_VOLUME,
    ANGULAR_HOUSES,
    SUCCEDENT_HOUSES,
} from "./astro-constants";

/**
 * Essential Dignity score for a planet in a given zodiac sign.
 * +15 for Domicile or Exaltation, -15 for Detriment or Fall, 0 for Peregrine.
 */
export function essentialDignityScore(planet: string, sign: string): number {
    const table = ESSENTIAL_DIGNITY[planet];
    if (!table) return 0;
    if (table.domicile.includes(sign) || table.exalted.includes(sign)) return 15;
    if (table.detriment.includes(sign) || table.fall.includes(sign)) return -15;
    return 0;
}

/**
 * Essential Dignity label for display.
 */
export function essentialDignityLabel(planet: string, sign: string): string {
    const table = ESSENTIAL_DIGNITY[planet];
    if (!table) return "Peregrine";
    if (table.domicile.includes(sign)) return "Domicile";
    if (table.exalted.includes(sign)) return "Exalted";
    if (table.detriment.includes(sign)) return "Detriment";
    if (table.fall.includes(sign)) return "Fall";
    return "Peregrine";
}

/**
 * Accidental Dignity — volume multiplier based on house position.
 * Angular (1,4,7,10) = 1.0, Succedent (2,5,8,11) = 0.75, Cadent (3,6,9,12) = 0.5
 */
export function accidentalDignityMultiplier(houseNum: number): number {
    return HOUSE_VOLUME[houseNum] ?? 0.5;
}

/**
 * Accidental Dignity label for display.
 */
export function accidentalDignityLabel(houseNum: number): string {
    if (ANGULAR_HOUSES.includes(houseNum)) return "Angular";
    if (SUCCEDENT_HOUSES.includes(houseNum)) return "Succedent";
    return "Cadent";
}
