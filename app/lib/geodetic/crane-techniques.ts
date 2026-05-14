/**
 * Crane Weather Framework integration — T30–T34.
 *
 * Source: Rev. Pam Crane, "Weather Forecasting" (The Adventurous Astrologer).
 * The technique-validation report (May 2026) proposed these as T25–T29; the
 * existing dashboard already uses T25–T28 for other techniques, so the Crane
 * additions are renumbered T30–T34 here. T17 and T18 get sub-criteria added.
 *
 * This module is metadata-only. Each entry exposes the rule, weight, applicable
 * event types, and provenance string the dashboard displays. Wiring these into
 * the scoring pipeline (eclipse / lunation / station scorers) is a separate
 * step — see __tests__/crane-techniques.test.ts for the contract evals.
 */

export type CraneEventType =
    | "heat"
    | "drought"
    | "flood"
    | "cyclone"
    | "cold-snap"
    | "wildfire"
    | "freeze"
    | "compound";

export interface CraneTechniqueRule {
    /** Canonical identifier — primary key. */
    id: string;
    /** Short human label. */
    label: string;
    /** One-paragraph rule statement. */
    rule: string;
    /** Decimal weight added to PSS when the rule fires. */
    weight: number;
    /** Event types this rule scores. */
    appliesTo: CraneEventType[];
    /** Bodies referenced by the rule (for trigger eligibility checks). */
    bodies: string[];
    /** Chart contexts where the rule fires. */
    contexts: Array<"cardinal-ingress" | "lunation" | "civil-chart" | "transit">;
    /** Orb in degrees for angle / aspect contacts. */
    orbDeg?: number;
    /** "tested" | "watch" | "pending" — feeds the dashboard's badge column. */
    status: "tested" | "pending" | "watch";
    /** Crane case studies that motivated the rule. */
    evidence: string[];
    /** Free-form notes — e.g. distinguishing this rule from a same-body negative finding. */
    notes?: string;
}

export const CRANE_TECHNIQUES: CraneTechniqueRule[] = [
    {
        id: "T30a",
        label: "Seasonal Ingress IC sign — temperature / moisture baseline",
        rule: "At the nearest Cardinal Solar Ingress (Aries/Cancer/Libra/Capricorn) preceding the event, read the IC sign of the chart cast for the event city. Apply weight if IC sign matches event type per Zain's sign profiles.",
        weight: 0.05,
        appliesTo: ["heat", "drought", "flood", "cyclone", "cold-snap", "wildfire", "freeze"],
        bodies: [],
        contexts: ["cardinal-ingress"],
        status: "pending",
        evidence: [
            "10 Crane case studies (1091–2012) — IC sign matched event type in all 10.",
            "1962-63 UK winter: Taurus IC (wet) supported flood after thaw.",
            "2003 European heatwave: Cancer Ingress Aries Moon at IC + fire-sign dominance.",
        ],
    },
    {
        id: "T30b",
        label: "Lunation Moon sign — moisture-quality layer",
        rule: "At the New or Full Moon immediately preceding the event, the Moon's sign category (water / fire / air / earth) overlays T19 (lunar phase proximity) with a moisture-quality signal.",
        weight: 0.04,
        appliesTo: ["heat", "drought", "flood", "cyclone", "wildfire", "freeze"],
        bodies: ["Moon"],
        contexts: ["lunation"],
        status: "pending",
        evidence: [
            "Crane: water-sign Moon at lunation = heavy/extreme precipitation signature.",
            "1953 North Sea Flood: Moon in Pisces setting at preceding ingress.",
        ],
        notes: "Additive with T19 — not a replacement. Stacks.",
    },
    {
        id: "T31",
        label: "Ceres angular at ingress / lunation — ecological / weather impact",
        rule: "Ceres within 5° of IC/ASC/MC/DSC at a Cardinal Ingress or lunation chart for the event city. Within 3° in a civil chart on the event day. Indicates weather events with significant agricultural, ecological, or food/water-system impact.",
        weight: 0.06,
        appliesTo: ["heat", "drought", "flood", "cyclone", "cold-snap", "wildfire", "freeze"],
        bodies: ["Ceres"],
        contexts: ["cardinal-ingress", "lunation", "civil-chart"],
        orbDeg: 5,
        status: "pending",
        evidence: [
            "1091 Tornado, 1962-63 freeze, 1976 drought, 1987 storm, 2003 drought, 2006 thunder-snow, 2011-12 winter, 2012 summer split — Ceres angular in all.",
        ],
        notes:
            "Distinct from retired Technique I (Ceres Rx/anaretic → accident, NOT CONFIRMED). " +
            "T31 is angular Ceres in a weather chart; the angularity test is different from " +
            "the retrograde-station test that failed for accidents.",
    },
    {
        id: "T32",
        label: "Jupiter in water sign — precipitation amplifier",
        rule: "Jupiter in Cancer, Scorpio, or Pisces at the nearest lunation or Cardinal Ingress amplifies precipitation probability for flood and cyclone events, independent of Saturn/Neptune configuration. Compound +0.03 if Jupiter is also within 5° of an angle.",
        weight: 0.05,
        appliesTo: ["flood", "cyclone"],
        bodies: ["Jupiter"],
        contexts: ["cardinal-ingress", "lunation"],
        orbDeg: 5,
        status: "pending",
        evidence: [
            "Cyclone Sidr 2007 (Jupiter ♏).",
            "Typhoon Haiyan 2013 (Jupiter ♏).",
            "Ahr Valley 2021 + Pakistan 2022 floods (Jupiter ♓).",
        ],
        notes: "Compound bonus +0.03 when Jupiter is also angular.",
    },
    {
        id: "T33",
        label: "Sedna angular or aspecting Mercury / Pluto — coastal / maritime storm",
        rule: "Sedna within 5° of IC/ASC/MC/DSC at lunation or civil chart, OR Sedna in conjunction / square / opposition (±6°) to Mercury or Pluto. Elevates risk of severe coastal or maritime storm events.",
        weight: 0.04,
        appliesTo: ["cyclone", "flood", "compound"],
        bodies: ["Sedna", "Mercury", "Pluto"],
        contexts: ["lunation", "civil-chart"],
        orbDeg: 5,
        status: "watch",
        evidence: [
            "1953 North Sea Flood: Sedna opposite rising Saturn/Neptune.",
            "1987 Great Storm: Sedna on MC opposite Mercury/Pluto IC at landfall.",
            "1091 London Tornado: Sedna near Dwad ASC.",
        ],
        notes:
            "Watch-only until validated against the 36-cyclone subset. " +
            "Sedna moves ~3.5°/century so its background position is effectively fixed.",
    },
    {
        id: "T34",
        label: "Pluto sustained transit to geodetic IC / MC — extended extreme",
        rule: "Transiting Pluto within 3° of the event city's geodetic IC or MC for ≥ 90 days (retrograde-extended contact) indicates a sustained period of extreme weather — multi-month drought, recurring flood season, persistent cold.",
        weight: 0.07,
        appliesTo: ["heat", "drought", "flood", "cyclone", "cold-snap", "wildfire", "freeze"],
        bodies: ["Pluto"],
        contexts: ["transit"],
        orbDeg: 3,
        status: "pending",
        evidence: [
            "UK 1975–76 drought: Pluto held within orb of UK geodetic Sun for entire period.",
            "UK 2009–2011 winters: Pluto in early Capricorn = Sun conjunction at each Winter Ingress.",
        ],
        notes: "Distinct from T6 (point-in-time Saturn–Pluto). T34 is a duration amplifier on weather events occurring inside the activation window.",
    },
];

export interface CraneSubcriterion {
    id: string;
    parentTechniqueId: string;
    label: string;
    rule: string;
    weight: number;
    appliesTo: CraneEventType[];
    bodies: string[];
    status: "tested" | "pending" | "watch";
    notes?: string;
}

/** Sub-criteria added to existing T17 / T18 by the Crane validation. */
export const CRANE_SUBCRITERIA: CraneSubcriterion[] = [
    {
        id: "T17b",
        parentTechniqueId: "T17",
        label: "South Node angular at Cardinal Ingress",
        rule: "South Node within 4° of IC or ASC at the Cardinal Ingress chart for the event city. Adds a seasonal-scale weather warning, separate from the T17a eclipse-degree contact.",
        weight: 0.05,
        appliesTo: ["heat", "drought", "flood", "cyclone", "cold-snap", "wildfire", "freeze"],
        bodies: ["South Node"],
        status: "pending",
    },
    {
        id: "T18c",
        parentTechniqueId: "T18",
        label: "Ceres ☌ / □ / ☍ Pluto",
        rule: "Ceres in hard aspect (±6°) to Pluto in the transiting sky — food / water / ecosystem destruction.",
        weight: 0.05,
        appliesTo: ["flood", "cyclone", "heat", "drought", "compound"],
        bodies: ["Ceres", "Pluto"],
        status: "pending",
        notes: "Counts under T18 cap (raised to 0.20 by this addition).",
    },
    {
        id: "T18d",
        parentTechniqueId: "T18",
        label: "Ceres ☌ / □ / ☍ Uranus",
        rule: "Ceres in hard aspect (±6°) to Uranus in the transiting sky — sudden disruption of survival systems / infrastructure failure.",
        weight: 0.04,
        appliesTo: ["flood", "compound"],
        bodies: ["Ceres", "Uranus"],
        status: "pending",
        notes: "Counts under T18 cap (raised to 0.20).",
    },
];

/** Crane techniques flagged "do not add" but tracked here for completeness. */
export const CRANE_REJECTED_TECHNIQUES: ReadonlyArray<{ name: string; reason: string }> = [
    {
        name: "1°/day direction from ingress",
        reason: "Timing tool, not a predictive indicator for event occurrence. Useful for narrowing onset within a known season.",
    },
    {
        name: "Dwad positions of ingress charts",
        reason: "Requires full chart-computation infrastructure; current model uses ephemeris positions only.",
    },
    {
        name: "Multi-zodiac (Sidereal / Draconic)",
        reason: "Crane uses it only for ambiguous Tropical readings; insufficient test cases to formalise weights.",
    },
    {
        name: "Mercury sign = temperature",
        reason: "Crane explicitly calls this tentative — not added until systematic test exists.",
    },
    {
        name: "Chiron angular = maverick weather",
        reason: "Recurring in Crane's 10 case studies but Crane states there is 'no guidance' from prior sources.",
    },
    {
        name: "Minor Progression of ingress",
        reason: "Requires chart computation; research phase.",
    },
];

export const CRANE_T18_CAP_RAISED = 0.2;

/** Body / fire-fire-air-water-earth element mapping for T30a / T30b classification. */
export const SIGN_ELEMENTS: Record<string, "fire" | "earth" | "air" | "water"> = {
    Aries: "fire", Leo: "fire", Sagittarius: "fire",
    Taurus: "earth", Virgo: "earth", Capricorn: "earth",
    Gemini: "air", Libra: "air", Aquarius: "air",
    Cancer: "water", Scorpio: "water", Pisces: "water",
};

/**
 * Given an event type, return which IC-sign elements get T30a weight under Crane's framework.
 * Used by the scorer to decide whether to fire the rule.
 */
export function craneT30aElementMatch(eventType: CraneEventType): Array<"fire" | "earth" | "air" | "water"> {
    switch (eventType) {
        case "heat":
        case "drought":
        case "wildfire":
            return ["fire"];
        case "flood":
        case "cyclone":
            return ["water"];
        case "cold-snap":
        case "freeze":
            return ["earth", "water"]; // capricorn-bias + water (cold + wet)
        case "compound":
            return ["water", "fire", "earth", "air"];
    }
}

/**
 * Same idea for the Lunation Moon sign moisture-quality layer (T30b).
 */
export function craneT30bElementMatch(eventType: CraneEventType): Array<"fire" | "earth" | "air" | "water"> {
    switch (eventType) {
        case "flood":
        case "cyclone":
            return ["water"];
        case "heat":
        case "drought":
        case "wildfire":
            return ["fire"];
        case "cold-snap":
        case "freeze":
            return ["earth"];
        case "compound":
            return ["water", "fire", "earth", "air"];
    }
}

export function craneTechniqueById(id: string): CraneTechniqueRule | CraneSubcriterion | undefined {
    return CRANE_TECHNIQUES.find((t) => t.id === id) ?? CRANE_SUBCRITERIA.find((t) => t.id === id);
}
