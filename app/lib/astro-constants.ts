/**
 * Astrological reference constants — single source of truth.
 * All zodiac, dignity, and classification data lives here.
 */

// ── Zodiac ────────────────────────────────────────────────────────────────
export const ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

// ── Sign → Ruling Planet ──────────────────────────────────────────────────
export const SIGN_RULERS: Record<string, string> = {
    Aries: "Mars",
    Taurus: "Venus",
    Gemini: "Mercury",
    Cancer: "Moon",
    Leo: "Sun",
    Virgo: "Mercury",
    Libra: "Venus",
    Scorpio: "Mars",
    Sagittarius: "Jupiter",
    Capricorn: "Saturn",
    Aquarius: "Saturn",
    Pisces: "Jupiter",
};

// ── Planet classifications (for scoring) ──────────────────────────────────
export const BENEFIC_PLANETS = ["venus", "jupiter", "sun"];
export const NEUTRAL_PLANETS = ["moon", "mercury", "north node", "true node", "mean node"];
export const MALEFIC_PLANETS = ["saturn", "mars", "pluto", "uranus", "neptune", "south node", "chiron"];
export const STRONG_MALEFICS = ["mars", "saturn", "pluto", "uranus"];

// ── House classifications (for scoring) ───────────────────────────────────
export const ANGULAR_HOUSES = [1, 4, 7, 10];
export const SUCCEDENT_HOUSES = [2, 5, 8, 11];
export const CADENT_HOUSES = [3, 6, 9, 12];

// ── Shared astronomical constant ──────────────────────────────────────────
/** Earth's axial tilt in radians (J2000 epoch) */
export const OBLIQUITY_RAD = 23.4393 * (Math.PI / 180);

// ── Essential Dignity table ───────────────────────────────────────────────
/** Planet → signs where it holds domicile, exaltation, detriment, or fall. */
export const ESSENTIAL_DIGNITY: Record<string, { domicile: string[]; exalted: string[]; detriment: string[]; fall: string[] }> = {
    Sun:     { domicile: ["Leo"],                    exalted: ["Aries"],       detriment: ["Aquarius"],              fall: ["Libra"] },
    Moon:    { domicile: ["Cancer"],                 exalted: ["Taurus"],      detriment: ["Capricorn"],             fall: ["Scorpio"] },
    Mercury: { domicile: ["Gemini", "Virgo"],        exalted: ["Virgo"],       detriment: ["Sagittarius", "Pisces"], fall: ["Pisces"] },
    Venus:   { domicile: ["Taurus", "Libra"],        exalted: ["Pisces"],      detriment: ["Aries", "Scorpio"],      fall: ["Virgo"] },
    Mars:    { domicile: ["Aries", "Scorpio"],       exalted: ["Capricorn"],   detriment: ["Taurus", "Libra"],       fall: ["Cancer"] },
    Jupiter: { domicile: ["Sagittarius", "Pisces"],  exalted: ["Cancer"],      detriment: ["Gemini", "Virgo"],       fall: ["Capricorn"] },
    Saturn:  { domicile: ["Capricorn", "Aquarius"],  exalted: ["Libra"],       detriment: ["Cancer", "Leo"],         fall: ["Aries"] },
    Chiron:  { domicile: ["Virgo"],                  exalted: ["Sagittarius"], detriment: ["Pisces"],                fall: ["Gemini"] },
};

// ── Accidental Dignity — house volume multiplier ──────────────────────────
export const HOUSE_VOLUME: Record<number, number> = {
    1: 1.0, 4: 1.0, 7: 1.0, 10: 1.0,       // Angular = 100%
    2: 0.75, 5: 0.75, 8: 0.75, 11: 0.75,    // Succedent = 75%
    3: 0.5, 6: 0.5, 9: 0.5, 12: 0.5,        // Cadent = 50%
};

// ── House themes (sphere of experience) ───────────────────────────────────
export const HOUSE_THEMES: Record<number, string> = {
    1:  "Identity & Vitality",
    2:  "Finances & Resources",
    3:  "Communication & Local Travel",
    4:  "Home & Foundation",
    5:  "Creativity & Pleasure",
    6:  "Health & Daily Routine",
    7:  "Partnerships & Contracts",
    8:  "Shared Resources & Transformation",
    9:  "Travel & Higher Learning",
    10: "Career & Reputation",
    11: "Networks & Community",
    12: "Solitude & Spirituality",
};

