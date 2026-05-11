/**
 * Shared types + label/tier helpers for the Geodetic Weather frontend.
 * Mirrors the engine response shape documented in
 * docs/geodetic-research/FRONTEND_PROMPT.md.
 */

export type Tier = "Calm" | "Unsettled" | "Turbulent" | "Severe" | "Extreme";

export type EventLayer =
    | "angle-transit"
    | "paran"
    | "station"
    | "world-point"
    | "eclipse"
    | "late-degree"
    | "configuration"
    | "severity-modifier"
    | "ingress";

export interface GWEvent {
    layer: EventLayer | string;
    label: string;
    planets: string[];
    severity: number; // signed
    direction?: "benefic" | "malefic" | "neutral";
    orb?: number;
    note?: string;
}

export interface GWBreakdown {
    bucketAngle: number;
    bucketParan: number;
    bucketStation: number;
    bucketIngress: number;
    bucketEclipse: number;
    bucketLate: number;
    bucketConfig: number;
    tierShift: number;
    [k: string]: number;
}

export interface GWSeverityModifier {
    label: string;
    tierShift: number;
    direction: "benefic" | "malefic" | "neutral";
}

export interface GWOobPlanet {
    name: string;
    declination: number;
    longitude: number;
}

export interface GWFixedAngles {
    mc: number;
    ic: number;
    asc: number;
    dsc: number;
}

export interface GeodeticWeatherResult {
    dateUtc: string;
    location: { lat: number; lon: number };
    fixedAngles: GWFixedAngles;
    score: number; // 0–100, high = calm
    severity: Tier;
    severityPreShift: Tier;
    events: GWEvent[];
    breakdown: GWBreakdown;
    severityModifiers: GWSeverityModifier[];
    oobPlanets: GWOobPlanet[];
    phasesActive: number[];
}

export interface GWCityForecast {
    label: string;
    lat: number;
    lon: number;
    fixedAngles: GWFixedAngles;
    days: GeodeticWeatherResult[];
}

export interface GWKeyMoment {
    title: string;
    driver: string;
    dates: string;
    body: string;
    impact: "challenging" | "supportive" | "neutral";
}

export interface GWTravelWindow {
    rank: string;          // "Best overall" | "Meeting people" | "Quiet retreat" | author-generated
    dates: string;         // "May 12 – May 22, 2026"
    nights: number;
    score: number;         // 0–100
    note: string;          // one-sentence rationale
}

export interface GWInterpretation {
    /** One lowercase word rendered in script next to the city name. */
    titleFlourish?: string;
    /** Plain-English one-liner for the brief, 8–15 words. */
    verdict: string;
    /** Short editorial lede — 2–3 sentences. */
    hook: string;
    /** Single sentence summarising the top planetary drivers. */
    dropLine: string;
    /** Strict-chain sentence naming the chart-ruler relocation. */
    rulerJourneyChain?: string;
    /** 3 actionable date-range recommendations. */
    travelWindows: GWTravelWindow[];
    keyMoments: GWKeyMoment[];
    advice: { bestWindow: string; watchWindow: string };
}

export interface GWPersonalLens {
    relocatedAscSign: string;
    relocatedAscLon: number;
    chartRulerPlanet: string;
    chartRulerNatalHouse: number;
    chartRulerRelocatedHouse: number;
    chartRulerNatalDomain: string;
    chartRulerRelocatedDomain: string;
    activeAngleLines: Array<{
        planet: string;
        angle: "ASC" | "DSC" | "MC" | "IC";
        angleLon: number;
        planetLon: number;
        orbDeg: number;
        isChartRuler: boolean;
    }>;
    worldPointContacts: Array<{
        planet: string;
        planetLon: number;
        pointDeg: number;
        pointType: string;
        orbDeg: number;
    }>;
    /** Geodetic MC longitude of the destination — pure city fact. */
    cityGeodeticMcLon?: number;
    /** Geodetic ASC longitude of the destination — pure city fact. */
    cityGeodeticAscLon?: number;
    /** Per-planet earth-longitude landings (PDF principle 3). */
    natalPlanetGeography?: Array<{
        planet: string;
        planetLon: number;
        geographicLon: number;
        geographicLabel: string;
        angularMatch: boolean;
    }>;
}

export interface GeodeticWeatherReading {
    category: "geodetic-weather";
    windowDays: 7 | 30 | 90;
    startDate: string; // ISO date (YYYY-MM-DD)
    endDate: string;
    goalFilter: string | null;
    cities: GWCityForecast[];
    macroScore?: number;
    interpretation?: GWInterpretation;
    summary?: {
        worstTier: Tier;
        severeCount: number;
        datesToWatch: string[];
        windowDays: number;
    };
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Plain-English layer glossary (see FRONTEND_PROMPT.md).                  */
/* ──────────────────────────────────────────────────────────────────────── */

export const LAYER_LABEL: Record<string, string> = {
    "angle-transit": "SKY ON THE AXIS",
    paran: "LATITUDE CROSSINGS",
    station: "STALLED ENERGY",
    "world-point": "GLOBAL BROADCAST",
    eclipse: "DETONATOR",
    "late-degree": "FINAL DEGREE PRESSURE",
    configuration: "GEOMETRIC PATTERN",
    "severity-modifier": "BOUNDARY OVERRIDE",
    ingress: "SEASONAL FIELD",
};

export const LAYER_BODY: Record<string, string> = {
    "angle-transit":
        "A planet aligning with this location's permanent horizon or meridian — the sky is touching one of the four fixed lines that anchor this city.",
    paran:
        "Two planets cross the horizon or meridian together at this latitude band — a doubled signature only this strip of earth sees.",
    station:
        "A planet is parking, losing momentum on a retrograde station close to a fixed angle — pressure builds where movement has stopped.",
    "world-point":
        "An outer planet is sitting at 0° of a cardinal sign — this is planetary in scope, flavoring the whole month underneath it.",
    eclipse:
        "A recent or imminent eclipse is seeding this longitude — the ground keeps ringing at the frequency that was struck.",
    "late-degree":
        "A planet is grinding through the 26–29° anaretic zone, possibly compounded by a fixed star — a forced finish.",
    configuration:
        "The current sky has formed a stellium, T-square, grand cross/trine, or yod — geometry that the location is catching.",
    "severity-modifier":
        "Out-of-bounds planets or nodal imbalance — escalators rather than triggers. They don't fire on their own, they amplify whatever already is.",
    ingress:
        "A slower-moving body has crossed into a new sign recently — the seasonal field shifts, and this location feels the new register.",
};

/* ──────────────────────────────────────────────────────────────────────── */
/*  Tier palette — used by every tier-colored surface in the UI.            */
/* ──────────────────────────────────────────────────────────────────────── */

export interface TierPalette {
    bg: string;
    text: string;
    accent: string;
    /** Mono stat pill color (always readable on page bg). */
    chip: string;
}

export const TIER_PALETTE: Record<Tier, TierPalette> = {
    Calm: {
        bg: "var(--color-eggshell)",
        text: "var(--color-charcoal)",
        accent: "var(--sage)",
        chip: "var(--sage)",
    },
    Unsettled: {
        bg: "var(--color-acqua)",
        text: "var(--color-charcoal)",
        accent: "var(--color-y2k-blue)",
        chip: "var(--color-y2k-blue)",
    },
    Turbulent: {
        bg: "var(--color-cream)",
        text: "var(--color-charcoal)",
        accent: "var(--gold)",
        chip: "var(--gold)",
    },
    Severe: {
        bg: "var(--color-spiced-life)",
        text: "var(--color-charcoal)",
        accent: "var(--color-black)",
        chip: "var(--color-black)",
    },
    Extreme: {
        bg: "var(--color-black)",
        text: "var(--color-eggshell)",
        accent: "var(--color-spiced-life)",
        chip: "var(--color-spiced-life)",
    },
};

export const TIER_ORDER: Tier[] = ["Calm", "Unsettled", "Turbulent", "Severe", "Extreme"];

/* ──────────────────────────────────────────────────────────────────────── */
/*  Plain-English bucket — collapse the 5 tiers into 3 readable buckets.    */
/*  This is the vocabulary the UI uses. Astrology tier names stay internal. */
/* ──────────────────────────────────────────────────────────────────────── */

export type Bucket = "good" | "mixed" | "rough";

export function tierToBucket(t: Tier): Bucket {
    if (t === "Calm" || t === "Unsettled") return "good";
    if (t === "Turbulent") return "mixed";
    return "rough"; // Severe, Extreme
}

export const BUCKET_COPY: Record<Bucket, { label: string; short: string; bg: string; text: string; accent: string; dot: string }> = {
    good: {
        label: "Good day",
        short: "Good",
        bg: "rgba(0, 253, 0, 0.12)",
        text: "var(--text-primary)",
        accent: "var(--sage)",
        dot: "var(--sage)",
    },
    mixed: {
        label: "Mixed day",
        short: "Mixed",
        bg: "rgba(201, 169, 110, 0.18)",
        text: "var(--text-primary)",
        accent: "var(--gold)",
        dot: "var(--gold)",
    },
    rough: {
        label: "Rough day",
        short: "Rough",
        bg: "rgba(230, 122, 122, 0.18)",
        text: "var(--text-primary)",
        accent: "var(--color-spiced-life)",
        dot: "var(--color-spiced-life)",
    },
};

/**
 * One-line plain-English reason for why a day is good/mixed/rough.
 * No astrology jargon — written for someone who doesn't know what a transit is.
 */
export function dayReasonPlain(day: { severity: Tier; events: GWEvent[] }): string {
    const bucket = tierToBucket(day.severity);
    if (bucket === "good") {
        return "A calm stretch for this place. No major planetary pressure — plans should hold.";
    }
    if (bucket === "mixed") {
        return "Some background pressure in the sky. Things should hold, but stay flexible and build in buffer.";
    }
    // rough
    const hasEclipse = day.events.some((e) => e.layer === "eclipse");
    const hasStation = day.events.some((e) => e.layer === "station");
    if (hasEclipse) return "Heavy pressure — a recent eclipse is still echoing at this longitude. Pick a different day if you can.";
    if (hasStation) return "A slow-moving planet is parking right over this place. Things tend to stall or get tense. Consider shifting.";
    return "Concentrated planetary stress over this location. Watch for delays, tension, or disruption. A different day is usually easier.";
}

/** Pretty the tier label using the simpler bucket vocabulary. */
export function tierLabel(t: Tier): string {
    return BUCKET_COPY[tierToBucket(t)].short;
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Driver + impact — the "technical driver" and the "human impact" tiers   */
/*  surfaced per date card. Driver is astrology-speak; impact is practical. */
/* ──────────────────────────────────────────────────────────────────────── */

/**
 * The astrological driver for a day's top event, in conventional syntax
 * a reader familiar with transits would recognize.
 */
export function eventDriverText(e: GWEvent): string {
    // The engine label is already close to canonical syntax (e.g.
    // "Neptune on fixed MC (orb 1.6°)", "Mars station direct in 21d near IC").
    // Light touch: strip the stray "[Earth]" tags and normalize casing.
    return e.label.replace(/\s*\[[^\]]+\]/g, "").trim();
}

/**
 * Practical one-sentence translation — what the event means for a human
 * planning their week. Keyed by layer (most specific first), then planet.
 */
export function humanImpactFromEvent(e: GWEvent): string {
    // Layer-level overrides — these dominate regardless of planet.
    if (e.layer === "station")
        return "A planet is parking here. Expect reversals, delays, or second thoughts on last week's decisions.";
    if (e.layer === "eclipse")
        return "A reset point. Observe more than you act — don't lock in big decisions today.";
    if (e.layer === "late-degree")
        return "Something is ending for this place. Let the thing you've been gripping slip loose.";
    if (e.layer === "world-point")
        return "A collective moment. The news cycle may eclipse personal plans.";
    if (e.layer === "configuration")
        return "The sky is wound tight. Expect a crescendo, not a detour.";

    const p = (e.planets[0] ?? "").toLowerCase();
    const malefic = e.direction === "malefic";

    switch (p) {
        case "mars":
            return malefic
                ? "Friction and short fuses. Skip negotiations that need patience."
                : "Bias to action — momentum is on your side.";
        case "saturn":
            return "Slow, serious, structured. Great for depth work; wrong for launches.";
        case "uranus":
            return "Plans get disrupted. Keep your schedule loose today.";
        case "neptune":
            return "Things feel foggy. Double-check contracts, logistics, and anything signed.";
        case "pluto":
            return "Intense pressure. Don't provoke a power struggle you can't afford to lose.";
        case "jupiter":
            return malefic
                ? "Overpromising is the trap — right-size your asks."
                : "Doors open. A good day to ask for more.";
        case "venus":
            return malefic
                ? "Values get negotiated. Don't force a compromise that feels off."
                : "Relationships flow. Lean into connection, aesthetics, and deals.";
        case "mercury":
            return malefic
                ? "Communications get slippery. Back up files, reconfirm plans, and re-read."
                : "Signals clear up — good day for paperwork and conversations.";
        case "moon":
            return "Moods shift fast. Don't read tone too literally today.";
        case "sun":
            return "A focal, public day — good for visibility, tough for hiding out.";
    }

    return malefic
        ? "Some planetary friction over this place. Stay flexible."
        : "A supportive day if you need one.";
}

/**
 * Full per-day copy for the shortlist card: { driver, impact }.
 * Good days with no events fall back to a generic calm line.
 */
export function dayCardCopy(day: { severity: Tier; events: GWEvent[] }): {
    driver: string;
    impact: string;
} {
    const bucket = tierToBucket(day.severity);
    const top = day.events[0];

    if (!top) {
        return {
            driver: bucket === "good" ? "No major transits" : "Quiet sky",
            impact: dayReasonPlain(day),
        };
    }

    return {
        driver: eventDriverText(top),
        impact: humanImpactFromEvent(top),
    };
}

export function tierRank(t: Tier): number {
    return TIER_ORDER.indexOf(t);
}

export function worstTier(days: Pick<GeodeticWeatherResult, "severity">[]): Tier {
    let worst: Tier = "Calm";
    for (const d of days) if (tierRank(d.severity) > tierRank(worst)) worst = d.severity;
    return worst;
}

export function tierCounts(days: Pick<GeodeticWeatherResult, "severity">[]): Record<Tier, number> {
    const out: Record<Tier, number> = { Calm: 0, Unsettled: 0, Turbulent: 0, Severe: 0, Extreme: 0 };
    for (const d of days) out[d.severity]++;
    return out;
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Degree → sign string helpers.                                           */
/* ──────────────────────────────────────────────────────────────────────── */

const SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

export function degreeToSign(longitude: number): { sign: string; deg: number } {
    const norm = ((longitude % 360) + 360) % 360;
    const sign = SIGNS[Math.floor(norm / 30) % 12];
    const deg = norm - Math.floor(norm / 30) * 30;
    return { sign, deg };
}

export function formatAngle(longitude: number): string {
    const { sign, deg } = degreeToSign(longitude);
    return `${Math.round(deg)}° ${sign.toUpperCase()}`;
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Planet glyph table.                                                     */
/* ──────────────────────────────────────────────────────────────────────── */

export const PLANET_GLYPH: Record<string, string> = {
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
    NorthNode: "☊",
    SouthNode: "☋",
    Chiron: "⚷",
};

export function planetGlyph(name: string): string {
    const key = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    return PLANET_GLYPH[key] ?? "✦";
}

export function planetTailwindBg(name: string): string {
    const k = name.toLowerCase();
    const supported = [
        "sun", "moon", "mercury", "venus", "mars",
        "jupiter", "saturn", "uranus", "neptune", "pluto",
    ];
    return supported.includes(k) ? `bg-planet-${k}` : "bg-[var(--color-y2k-blue)]";
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Weather-native goals — drive event filtering on the forecast page.      */
/* ──────────────────────────────────────────────────────────────────────── */

export const WEATHER_GOALS: Array<{
    id: string;
    label: string;
    sub: string;
    /** Which layers/planet signatures this goal elevates. */
    match: (e: GWEvent) => boolean;
}> = [
    {
        id: "floods",
        label: "Floods & storms",
        sub: "Water-resonant · Saturn/Neptune, Jupiter/Neptune, 29° water",
        match: (e) =>
            /neptune|jupiter|saturn/i.test(e.label) ||
            e.planets.includes("Neptune") || e.planets.includes("Jupiter") || e.planets.includes("Saturn"),
    },
    {
        id: "fires",
        label: "Fires & heat",
        sub: "Fire-resonant · Mars/Uranus, 29° fire, OOB",
        match: (e) =>
            e.planets.includes("Mars") || e.planets.includes("Uranus") || /oob/i.test(e.label),
    },
    {
        id: "quakes",
        label: "Earthquakes & structural",
        sub: "Earth-resonant · Saturn stations, Mars/Pluto midpoint",
        match: (e) =>
            (e.layer === "station" && e.planets.includes("Saturn")) ||
            (e.planets.includes("Mars") && e.planets.includes("Pluto")) ||
            e.planets.includes("Pluto"),
    },
    {
        id: "atmospheric",
        label: "Atmospheric disruption",
        sub: "Air-resonant · Mercury retrograde, Uranus",
        match: (e) =>
            e.planets.includes("Uranus") || e.planets.includes("Mercury"),
    },
    {
        id: "civil",
        label: "Public / civil tension",
        sub: "World points, configurations, Mars angles",
        match: (e) =>
            e.layer === "world-point" || e.layer === "configuration" ||
            (e.layer === "angle-transit" && e.planets.includes("Mars")),
    },
    {
        id: "all",
        label: "Just show everything",
        sub: "No filter · surface every layer that fires",
        match: () => true,
    },
];
