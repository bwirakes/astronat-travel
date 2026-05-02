import { geodeticASCLongitude, geodeticMCLongitude } from "./geodetic";
import { LIFE_EVENTS, W_EVENTS } from "./planet-library";
import { BENEFIC_PLANETS, LUMINARIES, STRONG_MALEFICS } from "./astro-constants";

export const READING_TABS = [
    {
        id: "overview",
        label: "Overview",
        question: "What can this place help me get?",
    },
    {
        id: "life-themes",
        label: "Life Themes",
        question: "Which parts of life get louder here?",
    },
    {
        id: "place-field",
        label: "Geography",
        question: "What does the place itself add?",
    },
    {
        id: "what-shifts",
        label: "What Shifts",
        question: "What changes in my chart here?",
    },
    {
        id: "timing",
        label: "Timing",
        question: "When should I use it?",
    },
] as const;

export type ReadingTabId = typeof READING_TABS[number]["id"];
export type ReadingTabDefinition = typeof READING_TABS[number];

export const READING_TAB_IDS = READING_TABS.map((tab) => tab.id) as [
    ReadingTabId,
    ...ReadingTabId[],
];

export const GOAL_DEFINITIONS = {
    love: {
        label: "Love",
        eventIndex: 3,
        outcome: "closer relationships and stronger romantic openings",
        action: "make space for dates, honest conversations, and softer social plans",
    },
    career: {
        label: "Career",
        eventIndex: 6,
        outcome: "more visible work, responsibility, and reputation-building",
        action: "use it for launches, interviews, portfolio work, or asking for a bigger role",
    },
    community: {
        label: "Community",
        eventIndex: 7,
        outcome: "stronger networks, introductions, and local belonging",
        action: "say yes to repeat encounters, small groups, and low-stakes invitations",
    },
    growth: {
        label: "Growth",
        eventIndex: 8,
        outcome: "more perspective, inner clarity, and spiritual room",
        action: "protect study time, rituals, long walks, and quiet reflection",
    },
    relocation: {
        label: "Relocation",
        eventIndex: 2,
        outcome: "a clearer read on home, roots, and emotional steadiness",
        action: "test neighborhoods slowly before making the move feel permanent",
    },
    timing: {
        label: "Timing",
        eventIndex: null,
        outcome: "better dates for using what the place already offers",
        action: "compare windows before locking in the most important plans",
    },
} as const;

export type GoalId = keyof typeof GOAL_DEFINITIONS;

export interface ThemeScore {
    id: string;
    label: string;
    score: number;
    source: "event" | "house";
    goalId?: GoalId;
}

export interface EvidencePoint {
    label: string;
    body: string;
    score?: number;
    source: "event" | "house" | "line" | "geodetic" | "transit";
}

export interface OverallGeodeticEvidence {
    sign: string;
    longitudeRange: string;
}

export type GeodeticPlanetFamily = "gentle" | "rough" | "bright" | "neutral";
export type GeodeticHitCloseness = "very close" | "near";

export interface PersonalGeodeticHit {
    planet: string;
    /** Exact orb in degrees, rounded to 1dp. ≤ 5 by construction. */
    orbDeg: number;
    /** ≤2° → very close; ≤5° → near. Mirrors `nearbyLines.closeness`. */
    closeness: GeodeticHitCloseness;
    /** Pre-classified family for tone shaping in the AI prompt. */
    family: GeodeticPlanetFamily;
}

export interface PersonalGeodeticEvidence {
    house: 1 | 4 | 7 | 10;
    anchor: "ASC" | "IC" | "DSC" | "MC";
    score: number;
    bucketScore: number;
    /** Names only — kept for back-compat with existing PlaceFieldTab render. */
    planets: string[];
    /** Per-planet detail. Populated for the AI prompt and the hover receipt
     *  in the redesigned PlaceFieldTab. Empty array when no planet sits
     *  within 5° (the row exists for background score only). */
    hits: PersonalGeodeticHit[];
}

export interface AcgEvidence {
    planet: string;
    angle: string;
    distanceKm: number;
    contribution: number;
}

export interface AngleShiftEvidence {
    angle: "ASC" | "IC" | "DSC" | "MC";
    natalSign: string;
    relocatedSign: string;
}

export interface HouseShiftEvidence {
    planet: string;
    natalHouse: number;
    relocatedHouse: number;
}

export interface AspectEvidence {
    planet: string;
    angle: "ASC" | "IC" | "DSC" | "MC";
    aspect: string;
    orb: number;
}

export interface WindowEvidence {
    label: string;
    score: number;
    dates: string;
}

export interface TransitEvidence {
    label: string;
    dateRange: string;
    tone: string;
}

export interface ScoreNarrative {
    selectedGoals: Array<{ goalId: GoalId; label: string; score: number; eventName?: string; outcome: string; action: string }>;
    themes: ThemeScore[];
    strongestThemes: ThemeScore[];
    lessEmphasized: ThemeScore[];
    leanIntoEvidence: EvidencePoint[];
    watchOutEvidence: EvidencePoint[];
    geodetic: {
        overall: OverallGeodeticEvidence | null;
        personal: PersonalGeodeticEvidence[];
    };
}

export interface EditorialEvidence {
    tabs: readonly ReadingTabDefinition[];
    selectedGoals: ScoreNarrative["selectedGoals"];
    pageThesis: {
        destination: string;
        primaryGoalLabel: string | null;
        overallScore: number;
        verdict: string;
        topHumanTheme: string;
        cautionHumanTheme: string | null;
    };
    scoreDrivers: {
        themes: ThemeScore[];
        strongestThemes: ThemeScore[];
        lessEmphasized: ThemeScore[];
        leanIntoEvidence: EvidencePoint[];
        watchOutEvidence: EvidencePoint[];
    };
    placeDrivers: {
        overallGeodetic: OverallGeodeticEvidence | null;
        personalGeodetic: PersonalGeodeticEvidence[];
        acgLines: AcgEvidence[];
    };
    shiftDrivers?: {
        relocatedAngles: AngleShiftEvidence[];
        relocatedHouses: HouseShiftEvidence[];
        aspectsToAngles: AspectEvidence[];
    };
    timingDrivers?: {
        windows: WindowEvidence[];
        transits: TransitEvidence[];
    };
}

const ANGLE_BY_HOUSE = {
    1: "ASC",
    4: "IC",
    7: "DSC",
    10: "MC",
} as const;

const ANCHOR_LON_BY_HOUSE = (lat: number, lon: number): Record<1 | 4 | 7 | 10, number> => {
    const geoAsc = geodeticASCLongitude(lon, lat);
    const geoMc = geodeticMCLongitude(lon);
    return {
        1: geoAsc,
        4: (geoMc + 180) % 360,
        7: (geoAsc + 180) % 360,
        10: geoMc,
    };
};

function angularDiff(a: number, b: number): number {
    const d = Math.abs((((a - b) % 360) + 540) % 360 - 180);
    return d;
}

function scoreFromWeights(houses: Array<{ house: number; score: number }>, weights: number[]): number {
    const byHouse = new Map(houses.map((h) => [h.house, h.score]));
    const raw = weights.reduce((sum, weight, idx) => {
        const score = byHouse.get(idx + 1) ?? 0;
        return sum + score * weight;
    }, 0);
    return Math.max(0, Math.min(100, Math.round(raw)));
}

function validGoalId(goalId: string): goalId is GoalId {
    return goalId in GOAL_DEFINITIONS;
}

export function deriveGoalScores(args: {
    goalIds?: string[];
    houses?: Array<{ house: number; score: number }>;
    eventScores?: Array<{ eventName: string; finalScore: number }>;
    macroScore?: number;
}): ScoreNarrative["selectedGoals"] {
    const houses = args.houses ?? [];
    const events = args.eventScores ?? [];
    return (args.goalIds ?? [])
        .filter(validGoalId)
        .map((goalId) => {
            const definition = GOAL_DEFINITIONS[goalId];
            const eventScore = definition.eventIndex != null
                ? events.find((event) => event.eventName === LIFE_EVENTS[definition.eventIndex!])
                : undefined;
            const score = eventScore
                ? Math.round(eventScore.finalScore)
                : definition.eventIndex != null
                    ? scoreFromWeights(houses, W_EVENTS[definition.eventIndex] ?? [])
                    : Math.round(args.macroScore ?? 0);
            return {
                goalId,
                label: definition.label,
                score,
                eventName: definition.eventIndex != null ? LIFE_EVENTS[definition.eventIndex] : undefined,
                outcome: definition.outcome,
                action: definition.action,
            };
        });
}

export function deriveThemeScores(args: {
    eventScores?: Array<{ eventName: string; finalScore: number }>;
    houses?: Array<{ house: number; sphere?: string; score: number }>;
}): ThemeScore[] {
    const eventScores = args.eventScores ?? [];
    if (eventScores.length) {
        return eventScores.map((event, index) => {
            const goalEntry = Object.entries(GOAL_DEFINITIONS).find(([, definition]) => definition.eventIndex === index);
            return {
                id: `event-${index}`,
                label: event.eventName,
                score: Math.round(event.finalScore),
                source: "event",
                goalId: goalEntry?.[0] as GoalId | undefined,
            };
        });
    }

    return (args.houses ?? []).map((house) => ({
        id: `house-${house.house}`,
        label: house.sphere || `House ${house.house}`,
        score: Math.round(house.score),
        source: "house",
    }));
}

export function derivePersonalGeodetic(args: {
    houses?: Array<{ house: number; breakdown?: { geodetic?: number; bucketGeodetic?: number } }>;
    natalPlanets?: Array<{ planet?: string; name?: string; longitude?: number }>;
    destinationLat?: number;
    destinationLon?: number;
}): PersonalGeodeticEvidence[] {
    const lat = args.destinationLat;
    const lon = args.destinationLon;
    if (typeof lat !== "number" || typeof lon !== "number") return [];

    const anchors = ANCHOR_LON_BY_HOUSE(lat, lon);
    return ([1, 4, 7, 10] as const)
        .map((house) => {
            const row = (args.houses ?? []).find((h) => h.house === house);
            const rawScore = Math.round(row?.breakdown?.geodetic ?? 0);
            const bucketScore = Math.round(row?.breakdown?.bucketGeodetic ?? 50);
            const anchorLon = anchors[house];
            const hits: PersonalGeodeticHit[] = (args.natalPlanets ?? [])
                .map((planet): PersonalGeodeticHit | null => {
                    if (typeof planet.longitude !== "number") return null;
                    const orb = angularDiff(planet.longitude, anchorLon);
                    if (orb > 5) return null;
                    return {
                        planet: String(planet.planet || planet.name || "Planet"),
                        orbDeg: Math.round(orb * 10) / 10,
                        closeness: orb <= 2 ? "very close" : "near",
                        family: planetFamily(planet.planet || planet.name),
                    };
                })
                .filter((h): h is PersonalGeodeticHit => h !== null);
            return {
                house,
                anchor: ANGLE_BY_HOUSE[house],
                score: rawScore,
                bucketScore,
                planets: hits.map((h) => h.planet),
                hits,
            };
        })
        .filter((entry) => entry.score !== 0 || entry.hits.length > 0);
}

function planetFamily(name: string | undefined): GeodeticPlanetFamily {
    const n = String(name ?? "").toLowerCase();
    if (BENEFIC_PLANETS.includes(n)) return "gentle";
    if (LUMINARIES.includes(n)) return "bright";
    if (STRONG_MALEFICS.includes(n)) return "rough";
    return "neutral";
}

export function deriveScoreNarrative(args: {
    destination: string;
    destinationLat?: number;
    destinationLon?: number;
    macroScore?: number;
    macroVerdict?: string;
    goalIds?: string[];
    houses?: Array<{ house: number; sphere?: string; score: number; breakdown?: { geodetic?: number; bucketGeodetic?: number } }>;
    eventScores?: Array<{ eventName: string; finalScore: number }>;
    natalPlanets?: Array<{ planet?: string; name?: string; longitude?: number }>;
    geodeticBand?: OverallGeodeticEvidence | null;
}): ScoreNarrative {
    const themes = deriveThemeScores({ eventScores: args.eventScores, houses: args.houses });
    const strongestThemes = [...themes].sort((a, b) => b.score - a.score).slice(0, 3);
    const lessEmphasized = [...themes].sort((a, b) => a.score - b.score).slice(0, 3);
    const selectedGoals = deriveGoalScores({
        goalIds: args.goalIds,
        houses: args.houses,
        eventScores: args.eventScores,
        macroScore: args.macroScore,
    });

    return {
        selectedGoals,
        themes,
        strongestThemes,
        lessEmphasized,
        leanIntoEvidence: strongestThemes.map((theme) => ({
            label: theme.label,
            body: `${theme.label} is one of the clearest outcomes this place supports.`,
            score: theme.score,
            source: theme.source,
        })),
        watchOutEvidence: lessEmphasized.map((theme) => ({
            label: theme.label,
            body: `${theme.label} may need more deliberate effort here.`,
            score: theme.score,
            source: theme.source,
        })),
        geodetic: {
            overall: args.geodeticBand ?? null,
            personal: derivePersonalGeodetic({
                houses: args.houses,
                natalPlanets: args.natalPlanets,
                destinationLat: args.destinationLat,
                destinationLon: args.destinationLon,
            }),
        },
    };
}

export function buildEditorialEvidence(args: {
    destination: string;
    scoreNarrative: ScoreNarrative;
    macroScore?: number;
    macroVerdict?: string;
    acgLines?: AcgEvidence[];
    shiftDrivers?: EditorialEvidence["shiftDrivers"];
    timingDrivers?: EditorialEvidence["timingDrivers"];
}): EditorialEvidence {
    const primaryGoal = args.scoreNarrative.selectedGoals[0];
    return {
        tabs: READING_TABS,
        selectedGoals: args.scoreNarrative.selectedGoals,
        pageThesis: {
            destination: args.destination,
            primaryGoalLabel: primaryGoal?.label ?? null,
            overallScore: Math.round(args.macroScore ?? 0),
            verdict: args.macroVerdict ?? "",
            topHumanTheme: args.scoreNarrative.strongestThemes[0]?.label ?? primaryGoal?.outcome ?? "the best-supported theme",
            cautionHumanTheme: args.scoreNarrative.lessEmphasized[0]?.label ?? null,
        },
        scoreDrivers: {
            themes: args.scoreNarrative.themes,
            strongestThemes: args.scoreNarrative.strongestThemes,
            lessEmphasized: args.scoreNarrative.lessEmphasized,
            leanIntoEvidence: args.scoreNarrative.leanIntoEvidence,
            watchOutEvidence: args.scoreNarrative.watchOutEvidence,
        },
        placeDrivers: {
            overallGeodetic: args.scoreNarrative.geodetic.overall,
            personalGeodetic: args.scoreNarrative.geodetic.personal,
            acgLines: args.acgLines ?? [],
        },
        ...(args.shiftDrivers ? { shiftDrivers: args.shiftDrivers } : {}),
        ...(args.timingDrivers ? { timingDrivers: args.timingDrivers } : {}),
    };
}

