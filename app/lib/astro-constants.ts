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
// NOTE: In Hellenistic astrology, the Sun is a LUMINARY, not a true benefic.
// Venus = lesser benefic, Jupiter = greater benefic. Sun is mildly positive but
// should be treated as sect light, not grouped with the benefics.
export const BENEFIC_PLANETS = ["venus", "jupiter"];
export const LUMINARIES     = ["sun", "moon"];   // Sect lights — classified separately
export const NEUTRAL_PLANETS = ["sun", "moon", "mercury", "north node", "true node", "mean node"];
export const MALEFIC_PLANETS = ["saturn", "mars", "pluto", "uranus", "neptune", "south node", "chiron"];
export const STRONG_MALEFICS = ["mars", "saturn", "pluto", "uranus"];

/**
 * Unified planet nature helper — avoids scattered benefic/malefic checks.
 * Sun and Moon are "luminary" — mildly positive but not true benefics.
 */
export function getPlanetNature(
    name: string,
): "benefic" | "malefic" | "luminary" | "neutral" {
    const p = name.toLowerCase();
    if (BENEFIC_PLANETS.includes(p)) return "benefic";
    if (LUMINARIES.includes(p))      return "luminary";
    if (MALEFIC_PLANETS.includes(p)) return "malefic";
    return "neutral";
}

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
    // ── Traditional 7 planets (Hellenistic) ───────────────────────────────
    Sun:     { domicile: ["Leo"],                    exalted: ["Aries"],         detriment: ["Aquarius"],              fall: ["Libra"]       },
    Moon:    { domicile: ["Cancer"],                 exalted: ["Taurus"],        detriment: ["Capricorn"],             fall: ["Scorpio"]     },
    Mercury: { domicile: ["Gemini", "Virgo"],        exalted: ["Virgo"],         detriment: ["Sagittarius", "Pisces"], fall: ["Pisces"]      },
    Venus:   { domicile: ["Taurus", "Libra"],        exalted: ["Pisces"],        detriment: ["Aries", "Scorpio"],      fall: ["Virgo"]       },
    Mars:    { domicile: ["Aries", "Scorpio"],       exalted: ["Capricorn"],     detriment: ["Taurus", "Libra"],       fall: ["Cancer"]      },
    Jupiter: { domicile: ["Sagittarius", "Pisces"],  exalted: ["Cancer"],        detriment: ["Gemini", "Virgo"],       fall: ["Capricorn"]   },
    Saturn:  { domicile: ["Capricorn", "Aquarius"],  exalted: ["Libra"],         detriment: ["Cancer", "Leo"],         fall: ["Aries"]       },
    // ── Chiron (asteroid, semi-traditional) ──────────────────────────────
    Chiron:  { domicile: ["Virgo"],                  exalted: ["Sagittarius"],   detriment: ["Pisces"],                fall: ["Gemini"]      },
    // ── Outer planets (modern assignments — used ONLY in outer-planet-scoring.ts)
    // These apply exclusively to the angularity-based outer planet scoring path.
    Uranus:  { domicile: ["Aquarius"],               exalted: ["Scorpio"],       detriment: ["Leo"],                   fall: ["Taurus"]      },
    Neptune: { domicile: ["Pisces"],                 exalted: ["Sagittarius"],   detriment: ["Virgo"],                 fall: ["Gemini"]      },
    Pluto:   { domicile: ["Scorpio"],                exalted: ["Leo"],           detriment: ["Taurus"],                fall: ["Aquarius"]    },
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

// Compact one-word labels used where space is tight (wheel captions, chips).
// Same H-number semantics as HOUSE_THEMES — keep these in sync.
export const HOUSE_DOMAIN_SHORT: Record<number, string> = {
    1: "Self",     2: "Money",   3: "Voice",   4: "Home",
    5: "Play",     6: "Work",    7: "Partners", 8: "Depth",
    9: "Travel",   10: "Career", 11: "Friends", 12: "Inner",
};

// ── A3: Chart-ruler relocation tracking ────────────────────────────────────
//
// Geodetic 101 PDF p.7: "You're Taurus rising in Jakarta (Venus chart-ruler
// in 3rd house). In NYC you become Libra rising, still ruled by Venus, but
// it's now in your 9th house. Different chart-ruler house = different
// trip themes." Uses the TRADITIONAL ruler set (no Uranus/Neptune/Pluto)
// because that's what classical relocation analysis assumes.

export interface ChartRulerInfo {
    /** Sign on the relocated ASC. */
    relocatedAscSign: string;
    /** Traditional ruler of that sign — the chart's relocated ruler. */
    ruler: string;
    /** Natal house of the ruler (from the birth chart, if known). */
    rulerNatalHouse?: number;
    /** Relocated house the ruler lands in at the destination. */
    rulerRelocatedHouse?: number;
    /** True iff the ruler lands on a relocated angular house (1/4/7/10). */
    rulerAngular: boolean;
    /** Cusp sign of the ruler's relocated house — useful for narrative
     *  ("Venus runs your trip from a Cancer-flavored 9th"). */
    rulerRelocatedHouseSign?: string;
}

/** Resolve which natal planet rules the relocated chart and where it lands.
 *  Returns null when the relocated ASC sign or its ruler can't be found. */
export function resolveChartRuler(params: {
    relocatedAscLon: number;
    natalPlanets: Array<{ planet?: string; name?: string; longitude: number; house?: number }>;
    /** Resolves a natal planet's relocated house. Provided by the caller
     *  because house systems differ (Placidus vs whole-sign). */
    getRelocatedHouse: (planetLon: number) => number;
    /** Sign on each relocated house cusp 1–12 (0-indexed). Optional. */
    relocatedCuspSigns?: string[];
}): ChartRulerInfo | null {
    const { relocatedAscLon, natalPlanets, getRelocatedHouse, relocatedCuspSigns } = params;
    const normalized = ((relocatedAscLon % 360) + 360) % 360;
    const relocatedAscSign = ZODIAC_SIGNS[Math.floor(normalized / 30) % 12];
    const ruler = SIGN_RULERS[relocatedAscSign];
    if (!ruler) return null;

    const rulerPlanet = natalPlanets.find(
        (p) => (p.planet ?? p.name ?? "").toLowerCase() === ruler.toLowerCase(),
    );
    if (!rulerPlanet) {
        return { relocatedAscSign, ruler, rulerAngular: false };
    }

    const rulerRelocatedHouse = getRelocatedHouse(rulerPlanet.longitude);
    const rulerAngular = ANGULAR_HOUSES.includes(rulerRelocatedHouse);
    const rulerRelocatedHouseSign = relocatedCuspSigns?.[rulerRelocatedHouse - 1];

    return {
        relocatedAscSign,
        ruler,
        rulerNatalHouse: rulerPlanet.house,
        rulerRelocatedHouse,
        rulerAngular,
        ...(rulerRelocatedHouseSign ? { rulerRelocatedHouseSign } : {}),
    };
}

