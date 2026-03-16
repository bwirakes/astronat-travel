/**
 * Country natal chart reference data.
 * Add rows to COUNTRY_CHARTS to support new destinations.
 */

export interface CountryChart {
    country: string;
    founded: string;
    sun: string;
    sunDeg: number;
    moon: string;
    moonDeg: number;
}

export const COUNTRY_CHARTS: Record<string, CountryChart> = {
    uae:       { country: "United Arab Emirates", founded: "2 Dec 1971",  sun: "Sagittarius", sunDeg: 10, moon: "Libra",       moonDeg: 18 },
    usa:       { country: "United States",        founded: "4 Jul 1776",  sun: "Cancer",      sunDeg: 13, moon: "Aquarius",    moonDeg: 27 },
    uk:        { country: "United Kingdom",       founded: "1 May 1707",  sun: "Taurus",      sunDeg: 11, moon: "Capricorn",   moonDeg: 19 },
    france:    { country: "France",               founded: "4 Oct 1958",  sun: "Libra",       sunDeg: 11, moon: "Sagittarius", moonDeg: 3  },
    japan:     { country: "Japan",                founded: "11 Feb 1889", sun: "Aquarius",    sunDeg: 22, moon: "Virgo",       moonDeg: 15 },
    thailand:  { country: "Thailand",             founded: "24 Jun 1932", sun: "Cancer",      sunDeg: 3,  moon: "Gemini",      moonDeg: 22 },
    indonesia: { country: "Indonesia",            founded: "17 Aug 1945", sun: "Leo",         sunDeg: 25, moon: "Taurus",      moonDeg: 19 },
    singapore: { country: "Singapore",            founded: "9 Aug 1965",  sun: "Leo",         sunDeg: 17, moon: "Gemini",      moonDeg: 7  },
};

// Keywords → country key mapping (expandable)
const COUNTRY_KEYWORDS: Record<string, string[]> = {
    uae:       ["dubai", "uae", "abu dhabi", "sharjah"],
    usa:       ["usa", "new york", "los angeles", "chicago", "miami", "san francisco", "boston", "seattle", "united states"],
    uk:        ["london", "uk", "england", "manchester", "united kingdom", "scotland", "edinburgh"],
    france:    ["france", "paris", "lyon", "marseille", "nice"],
    japan:     ["japan", "tokyo", "osaka", "kyoto"],
    thailand:  ["thailand", "bangkok", "phuket", "chiang mai"],
    indonesia: ["indonesia", "bali", "jakarta", "yogyakarta"],
    singapore: ["singapore"],
};

/** Detect country from a freetext destination string. */
export function detectCountry(destination: string): CountryChart | null {
    const dest = destination.toLowerCase();
    for (const [key, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
        if (keywords.some((kw) => dest.includes(kw))) {
            return COUNTRY_CHARTS[key] ?? null;
        }
    }
    return null;
}
