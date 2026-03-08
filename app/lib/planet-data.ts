// Astrological glyphs — Unicode astronomy symbols
export const PLANET_GLYPHS: Record<string, string> = {
    Sun: "☉",
    Moon: "☽",
    Mercury: "☿",
    Venus: "♀",
    Mars: "♂",
    Jupiter: "♃",
    Saturn: "♄",
    Uranus: "♅",
    Neptune: "♆",
    Pluto: "♇",
};

// Planetary emoji for visual display
export const PLANET_EMOJI: Record<string, string> = {
    Sun: "☀️",
    Moon: "🌙",
    Mercury: "💨",
    Venus: "💚",
    Mars: "🔴",
    Jupiter: "🟠",
    Saturn: "🪐",
    Uranus: "🔵",
    Neptune: "🌊",
    Pluto: "⚫",
};

export const SIGN_GLYPHS: Record<string, string> = {
    Aries: "♈",
    Taurus: "♉",
    Gemini: "♊",
    Cancer: "♋",
    Leo: "♌",
    Virgo: "♍",
    Libra: "♎",
    Scorpio: "♏",
    Sagittarius: "♐",
    Capricorn: "♑",
    Aquarius: "♒",
    Pisces: "♓",
};

// Mock data for planet line interpretations
export const PLANET_MEANINGS: Record<string, Record<string, { badge: string }>> = {
    Sun: {
        MC: { badge: "Spotlight & Visibility" },
        IC: { badge: "Inner Identity" },
        ASC: { badge: "Self-Expression" },
        DSC: { badge: "Partnerships Shine" },
    },
    Moon: {
        MC: { badge: "Emotional Fulfillment" },
        IC: { badge: "Home & Comfort" },
        ASC: { badge: "Emotional Magnetism" },
        DSC: { badge: "Deep Connections" },
    },
    Venus: {
        MC: { badge: "Love & Social Magic" },
        IC: { badge: "Domestic Beauty" },
        ASC: { badge: "Beauty & Attraction" },
        DSC: { badge: "Romantic Encounters" },
    },
    Mars: {
        MC: { badge: "Drive & Ambition" },
        IC: { badge: "Inner Fire" },
        ASC: { badge: "Energy & Action" },
        DSC: { badge: "Passionate Bonds" },
    },
    Jupiter: {
        MC: { badge: "Expansion & Success" },
        IC: { badge: "Inner Growth" },
        ASC: { badge: "Luck & Opportunity" },
        DSC: { badge: "Generous Connections" },
    },
    Saturn: {
        MC: { badge: "Hard Work Pays Off" },
        IC: { badge: "Deep Foundations" },
        ASC: { badge: "Growth Through Challenge" },
        DSC: { badge: "Serious Commitments" },
    },
    Mercury: {
        MC: { badge: "Communication Wins" },
        IC: { badge: "Inner Dialogue" },
        ASC: { badge: "Quick Connections" },
        DSC: { badge: "Intellectual Bonds" },
    },
    Uranus: {
        MC: { badge: "Breakthroughs" },
        IC: { badge: "Inner Revolution" },
        ASC: { badge: "Electrifying Presence" },
        DSC: { badge: "Unexpected Meetings" },
    },
    Neptune: {
        MC: { badge: "Creativity & Dreams" },
        IC: { badge: "Spiritual Depth" },
        ASC: { badge: "Mystical Aura" },
        DSC: { badge: "Soul Connections" },
    },
    Pluto: {
        MC: { badge: "Transformation" },
        IC: { badge: "Deep Rebirth" },
        ASC: { badge: "Power & Intensity" },
        DSC: { badge: "Transformative Bonds" },
    },
};

export const PLANET_COLORS: Record<string, string> = {
    Sun: "#f5c542",
    Moon: "#c4c9d4",
    Mercury: "#7ecbf5",
    Venus: "#f5a0c8",
    Mars: "#e85d4a",
    Jupiter: "#f5a623",
    Saturn: "#8b8fa3",
    Uranus: "#42d4c8",
    Neptune: "#6b7cff",
    Pluto: "#9b6bff",
};

// Zodiac sign from birth date (simplified — no ephemeris needed for sun sign)
const SIGNS = [
    { name: "Capricorn", emoji: "♑", start: [1, 1], end: [1, 19] },
    { name: "Aquarius", emoji: "♒", start: [1, 20], end: [2, 18] },
    { name: "Pisces", emoji: "♓", start: [2, 19], end: [3, 20] },
    { name: "Aries", emoji: "♈", start: [3, 21], end: [4, 19] },
    { name: "Taurus", emoji: "♉", start: [4, 20], end: [5, 20] },
    { name: "Gemini", emoji: "♊", start: [5, 21], end: [6, 20] },
    { name: "Cancer", emoji: "♋", start: [6, 21], end: [7, 22] },
    { name: "Leo", emoji: "♌", start: [7, 23], end: [8, 22] },
    { name: "Virgo", emoji: "♍", start: [8, 23], end: [9, 22] },
    { name: "Libra", emoji: "♎", start: [9, 23], end: [10, 22] },
    { name: "Scorpio", emoji: "♏", start: [10, 23], end: [11, 21] },
    { name: "Sagittarius", emoji: "♐", start: [11, 22], end: [12, 21] },
    { name: "Capricorn", emoji: "♑", start: [12, 22], end: [12, 31] },
];

export function getSunSign(month: number, day: number): { name: string; emoji: string } | null {
    for (const sign of SIGNS) {
        const [sm, sd] = sign.start;
        const [em, ed] = sign.end;
        if (
            (month === sm && day >= sd) ||
            (month === em && day <= ed)
        ) {
            return { name: sign.name, emoji: sign.emoji };
        }
    }
    return null;
}

// Mock data for results page
export const MOCK_PLANET_LINES = [
    { planet: "Venus", angle: "MC", distance_km: 142, meaning: PLANET_MEANINGS.Venus.MC },
    { planet: "Jupiter", angle: "ASC", distance_km: 387, meaning: PLANET_MEANINGS.Jupiter.ASC },
    { planet: "Sun", angle: "MC", distance_km: 521, meaning: PLANET_MEANINGS.Sun.MC },
    { planet: "Moon", angle: "IC", distance_km: 789, meaning: PLANET_MEANINGS.Moon.IC },
    { planet: "Saturn", angle: "DSC", distance_km: 1204, meaning: PLANET_MEANINGS.Saturn.DSC },
];

export const MOCK_TRANSITS = [
    { planets: "Venus △ natal Jupiter", type: "Trine", aspect: "trine" },
    { planets: "Mars □ natal Saturn", type: "Square", aspect: "square" },
    { planets: "Sun ☌ natal Mercury", type: "Conjunction", aspect: "conjunction" },
    { planets: "Moon ⚹ natal Venus", type: "Sextile", aspect: "sextile" },
];

export const MOCK_HOROSCOPE = `Your **Venus MC line** runs 142km from this destination — close enough to feel it. Venus on the Midheaven means this is a place where you're seen, appreciated, and where social connections happen naturally. Good city for creative work and meeting people.

**Jupiter on your Ascendant** adds genuine expansion energy. This isn't just luck — it's your chart saying this location amplifies your sense of possibility. Opportunities here feel organic, not forced.

**One thing to watch**: Mars squaring your natal Saturn at the time of travel means energy can run hot then cold. Don't overschedule the first few days. Leave room for unstructured time — that's where this trip delivers.

Arrival day has Moon sextile natal Venus — emotionally you'll feel settled quickly. Trust your instincts about neighborhoods and people. Your read on this city will be sharp from day one.

**Summary**: Venus-Jupiter signature. Strong for relationships, aesthetics, and anything involving being visible. Saturn square asks for pacing. Plan accordingly.`;

export interface TravelWindow {
    month: string;
    quality: "excellent" | "good" | "caution";
    reason: string;
    house: string;
}

// Pattern that cycles through 12 months of transit quality & reasons
const WINDOW_PATTERNS: Array<Omit<TravelWindow, "month">> = [
    { quality: "excellent", reason: "Venus trine natal Jupiter — social expansion", house: "9th House (Travel)" },
    { quality: "good", reason: "Sun sextile natal Venus — pleasant, low-friction", house: "9th House (Travel)" },
    { quality: "caution", reason: "Mars square natal Saturn — low energy, delays", house: "6th House (Health)" },
    { quality: "good", reason: "Mercury trine natal Mercury — clear communication", house: "3rd House (Learning)" },
    { quality: "excellent", reason: "Jupiter conjunct natal MC — career visibility abroad", house: "10th House (Career)" },
    { quality: "good", reason: "Venus sextile natal Moon — emotional ease", house: "4th House (Home)" },
    { quality: "caution", reason: "Saturn opposite natal Sun — heavy, restrictive", house: "7th House (Relationships)" },
    { quality: "good", reason: "Sun trine natal Jupiter — expansive mood", house: "9th House (Travel)" },
    { quality: "excellent", reason: "Venus conjunct natal Venus return — peak harmony", house: "5th House (Pleasure)" },
    { quality: "good", reason: "Mercury sextile natal Sun — mental clarity", house: "3rd House (Learning)" },
    { quality: "caution", reason: "Mars opposition natal Moon — emotional friction", house: "1st House (Self)" },
    { quality: "excellent", reason: "Jupiter trine natal Sun — best window of the year", house: "9th House (Travel)" },
];

/**
 * Generate 12 travel windows starting from any given date string (YYYY-MM-DD).
 * Defaults to today if no date given.
 */
export function generateTravelWindows(startDateStr?: string): TravelWindow[] {
    const start = startDateStr ? new Date(startDateStr + "T00:00:00") : new Date();
    const base = new Date(start.getFullYear(), start.getMonth(), 1);
    return WINDOW_PATTERNS.map((pattern, i) => {
        const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
        const month = d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
        return { month, ...pattern };
    });
}

// Static default — used as fallback when no date is available
export const MOCK_12_MONTH_WINDOWS: TravelWindow[] = generateTravelWindows();
