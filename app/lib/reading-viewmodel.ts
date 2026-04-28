/**
 * reading-viewmodel.ts — Adapter from `reading.details` to the V4 "101" view model.
 *
 * The V4 reading view (app/(frontend)/(app)/reading/[id]/components/v4) is fed
 * by this single function. Backend pipelines (lib/readings/astrocarto.ts) and
 * the demo mocks (lib/astro/mock-readings.ts) write very different shapes into
 * `reading.details` — this adapter is defensive and produces a normalized
 * shape the V4 components can render without further branching.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { houseFromLongitude, signFromLongitude } from "./geodetic";
import { acgLineRawScore } from "./house-matrix";
import { buildScoredWindows, buildDailySeries, type DailyScore } from "./window-scoring";
import { READING_TABS, READING_TAB_IDS, deriveScoreNarrative, type EvidencePoint, type ReadingTabDefinition, type ReadingTabId, type ScoreNarrative } from "./reading-tabs";

// ─── Output shape ─────────────────────────────────────────────────────

export interface V4TravelWindow {
    rank: number;
    flavor: string;       // "Best match" | "Social window" | "Quiet window"
    flavorTitle: string;  // "Home-like, settling" — short
    emoji: string;
    dates: string;        // "May 12 – May 22, 2026"
    nights: string;       // "10 nights"
    score: number;        // 0–100
    note: string;         // plain-English why
    startISO: string;
    endISO: string;
}

export interface V4Vibe {
    icon: string;
    title: string;
    body: string;        // accepts inline <strong> via dangerouslySetInnerHTML
    score?: number;      // 0–100, populated when the vibe is goal-driven
    /** Houses that drove the score, with their per-house scores. Surfaced under
     *  the vibe so the user can see "5th: 78 · 7th: 81" instead of a black box. */
    houseAttribution?: Array<{ house: number; topic: string; score: number }>;
}

export interface V4Angle {
    name: string;        // "Rising (ASC)"
    plain: string;       // "How you come across"
    natal: string;       // "24° Aries" (best-effort)
    relocated: string;   // "11° Cancer"
    delta: string;       // sentence-long plain-English shift
}

export interface V4PlanetHouseRow {
    planet: string;
    glyph: string;
    natalHouse: string;     // "12 · behind the scenes"
    reloHouse: string;      // "10 · public life"
    shift: string;          // plain English
}

export interface V4AspectToAngle {
    planet: string;
    glyph: string;
    toAngle: string;        // "IC"
    aspect: string;         // "conjunct (0°)"
    strength: "exact" | "very strong" | "supportive" | "moderate" | "gentle";
    plain: string;
    wasNatal: string;
}

export interface V4ChartAngle {
    k: "ASC" | "IC" | "DSC" | "MC";
    name: string;
    deg: number;            // ecliptic longitude (0–360)
    plain: string;
}

export interface V4ChartPlanet {
    p: string;
    glyph: string;
    deg: number;
    color: string;
    plain: string;
    sign?: string;
    degree?: string;
    natalHouse?: number;
    relocatedHouse?: number;
}

export interface V4ChartAspect {
    id: string;
    kind: "strongest" | "supportive" | "friction";
    from: { deg: number; p: string; isTransit?: boolean };
    to: { deg: number; p: string; isAngle?: boolean; isNatal?: boolean };
    title: string;
    what: string;
    why: string;
    timing: string;
}

export interface V4ChartMonth {
    key: string;            // "May" / "Jun" / "Jul"
    label: string;          // "May 2026"
    score: number;          // 0–100
    summary: string;
    transits: V4ChartPlanet[];
    aspects: V4ChartAspect[];
}

export interface V4LineRow {
    planet: string;
    glyph: string;
    angle: string;          // "MC" / "IC" / "ASC" / "DSC"
    distKm: number;
    color: string;
    note: string;
    /** Raw signed contribution this line adds to the geodetic bucket of the
     *  house-matrix score. Same math as house-matrix.ts. Positive lifts the
     *  score; negative drags it. The §04 row renders this as a `+N` chip so
     *  the user can trace lines back to the §01 score. */
    contribution: number;
}

export interface V4WeekRow {
    w: number;
    range: string;
    title: string;
    body: string;
}

/** A1: a single transit hit on the destination's geodetic angle. Surfaced
 *  on the Place tab as "this place is currently activated by Jupiter on
 *  the MC" when the engine detects a live geo-angle hit. `personalActivation`
 *  is true when the same transit is also conjunct one of the user's natal
 *  planets within ±3°. */
export interface V4GeoTransit {
    planet: string;                                                 // e.g. "Mars"
    angle: "ASC" | "MC" | "DSC" | "IC";
    house: number;                                                  // 1, 4, 7, or 10
    orb: number;                                                    // ecliptic orb to the angle
    severity: number;                                               // signed contribution
    direction: "benefic" | "malefic" | "luminary" | "neutral";
    personalActivation: boolean;
    natalContact?: string;
    natalOrb?: number;
}

/** A3: chart-ruler relocation snapshot for the Place tab. */
export interface V4ChartRuler {
    relocatedAscSign: string;          // "Libra"
    ruler: string;                     // "Venus"
    rulerNatalHouse?: number;
    rulerRelocatedHouse?: number;
    rulerRelocatedHouseSign?: string;
    rulerAngular: boolean;             // true iff ruler in 1/4/7/10 of relocated chart
}

/** A2: a single natal planet at one of the 8 sensitive degrees. */
export interface V4WorldPointHit {
    planet: string;                    // "Sun"
    point: string;                     // "0° Aries"
    pointLon: number;                  // 0–360
    orb: number;                       // 0–5
    severity: number;
    direction: "luminary" | "benefic" | "malefic" | "neutral";
}

/** A2: top-level world-points summary. `aggregate` is already capped ±12
 *  by the engine — this is the same number applied to H1/H10 inside
 *  computeHouseMatrix, surfaced for transparency. */
export interface V4WorldPointsView {
    aggregate: number;
    hits: V4WorldPointHit[];
}

/** A4: a single eclipse hit at the destination (zone + natal contact). */
export interface V4EclipseHit {
    kind: "solar" | "lunar";
    dateUtc: string;
    degree: number;
    sign: string;
    daysFromTarget: number;
    activatedAngle: "geoMC" | "geoIC" | "geoASC" | "geoDSC";
    angleOrb: number;
    natalContact: string;
    natalOrb: number;
    direction: "luminary" | "benefic" | "malefic" | "neutral";
    severity: number;
}

/** A4: top-level eclipse summary. `aggregate` is already capped by the
 *  engine; surfaced for transparency. Empty `hits` when nothing qualifies. */
export interface V4EclipsesView {
    aggregate: number;
    hits: V4EclipseHit[];
}

/** A5: a single progressed-planet band. */
export interface V4ProgressedBand {
    planet: "Sun" | "Moon";
    longitude: number;
    sign: string;
    longitudeRange: string;
    destinationInBand: boolean;
}

/** A5: secondary-progression bands at the reference date. `aggregate` is
 *  the soft +5/+2 modifier the engine applies to bucketGeodetic. */
export interface V4ProgressionsView {
    progressedDateUtc: string;
    yearsElapsed: number;
    aggregate: number;
    bands: V4ProgressedBand[];
}

export type V4TravelType = "trip" | "relocation";

export interface V4ReadingVM {
    location: { city: string; region: string; lat: number; lon: number };
    generated: string;
    travelDateISO: string | null;
    travelType: V4TravelType;
    goalIds: string[];               // user's picks from /reading/new, in order
    scoreNarrative: ScoreNarrative;
    copy: {
        hasCompleteV4TeacherReading: boolean;
        overviewSource: "teacher" | "deterministic";
        timingSource: "teacher" | "deterministic";
    };
    tabs: {
        definitions: readonly ReadingTabDefinition[];
        editorialSpine?: {
            thesis?: string;
            primaryQuestion?: string;
            throughline?: string;
            transitionOrder?: ReadingTabId[];
        };
        copy: Partial<Record<ReadingTabId, {
            lead?: string;
            plainEnglishSummary?: string;
            evidenceCaption?: string;
            nextTabBridge?: string;
        }>>;
        overview?: {
            scoreExplanation?: string;
            goalExplanation?: string;
            leanInto?: string[];
            watchOut?: string[];
        };
        timing?: {
            activationAdvice?: string[];
            closingVerdict?: string;
        };
    };

    hero: {
        bestWindow: V4TravelWindow;
        explainer: string;     // band-aware lead paragraph
        /** Macro score for the destination — the chart's overall fit for this
         *  city, before any per-day transit modulation. The hero shows this
         *  next to the window score so users can see whether their dates are
         *  above or below the destination's average match. */
        baselineScore: number;
        /** Plain-English context line: "1 point above your average for this place." */
        baselineContext: string;
        /** Verdict band derived deterministically from the score. Drives the
         *  uppercase kicker and tone of the explainer. */
        verdict: { band: "tough" | "mixed" | "solid" | "peak"; label: string };
        /** When a non-anchor window beats the user's dates by >=3 pts, this
         *  surfaces the better alternative inline so the hero can recommend
         *  shifting before the user scrolls. Null when no clearly-better
         *  window exists. */
        betterAlternate: { dates: string; score: number; delta: number } | null;
        /** Shown when there's no better alternate (or for mixed/tough scores)
         *  — practical advice for making locked dates work. Null for solid/peak. */
        maximizeAdvice: string | null;
    };
    travelWindows: V4TravelWindow[];   // length 1–3, hero is index 0
    /** Per-day score series across travelDate − 21d to travelDate + 35d.
     *  Drives Step 2's DayDots strip — visual context for the windows. */
    dailySeries: DailyScore[];

    vibes: V4Vibe[];                    // exactly 3

    chart: {
        angles: V4ChartAngle[];
        natal: V4ChartPlanet[];
        months: V4ChartMonth[];         // 3
    };

    callout: string;                    // small explanation under chart

    /** 3-bucket decomposition of the overall score. Sums to hero.bestWindow.score
     *  (give or take rounding). Drives §01's score pills. */
    scoreBreakdown: { place: number; timing: number; sky: number };

    /** Sepharial geodetic band the destination falls in. Drives §05. */
    geodeticBand: { sign: string; longitudeRange: string } | null;

    /** Visible chrome strings — prompt-emitted when present, fall back to
     *  templated defaults. The page reads these instead of inlining the
     *  hardcoded versions. */
    chrome: {
        step1Breakdown: string;
        step3Intro: string;
        step4Intro: string;
        step4Takeaway: string;
        step4GeodeticNote: string;
        step4GeodeticBridge: string;
        step4GeodeticMethod: string;
        monthChartCallout: string;
        step7Intro: string;
        step7AnglesSub: string;
        step7HousesSub: string;
        step7AspectsSub: string;
    };

    todo: Array<{ title: string; body: string }>;  // 4 items

    astrology: {
        lines: V4LineRow[];
        weeks: V4WeekRow[];             // weekly narrative (may be empty until streamed)
    };

    /** Geodetic band for the destination — Sepharial system. A property of
     *  the *land*, not your chart: every visitor to this longitude lands in
     *  the same band. Distinct from astrocartography (which is personal). */
    geodetic: {
        sign: string;                   // "Cancer"
        longitudeRange: string;         // "90°E–120°E"
        flavor: string;                 // one-line vibe of the sign as a place
        note: string;                   // AI-written or templated body
        /** A1: live transit hits on the destination's four geodetic angles at
         *  the reference date. Already filtered/sorted by Step 5b — sorted by
         *  |severity| desc. Empty array when nothing is in orb. */
        activeTransits: V4GeoTransit[];
    } | null;

    relocated: {
        birth: { place: string; coords: string; date: string };
        travel: { place: string; coords: string; window: string };
        angles: V4Angle[];
        planetsInHouses: V4PlanetHouseRow[];
        aspectsToAngles: V4AspectToAngle[];
        glossary: Array<{ term: string; def: string; href: string }>;
        learnMore: Array<{ label: string; href: string }>;
        natalAnglesDeg: Record<"ASC"|"IC"|"DSC"|"MC", number> | null;
        relocatedAnglesDeg: Record<"ASC"|"IC"|"DSC"|"MC", number> | null;
        natalCuspsDeg: number[];
        relocatedCuspsDeg: number[];
        /** A3: chart-ruler relocation. PDF p.7 — same Venus chart-ruler,
         *  new house at the destination. Null when the relocated ASC
         *  sign or its traditional ruler can't be resolved. */
        chartRuler: V4ChartRuler | null;
    };
    /** A2: natal planets at the 8 sensitive degrees (0° cardinal + 15°
     *  fixed). Public-visibility signal. Always present (may be empty). */
    worldPoints: V4WorldPointsView;
    /** A4: eclipses in window that hit BOTH the destination's geo-angle
     *  AND a natal planet. Always present (may be empty). */
    eclipses: V4EclipsesView;
    /** A5: progressed-Sun / progressed-Moon longitude bands. Null when
     *  birth date isn't available (e.g. cached readings missing it). */
    progressions: V4ProgressionsView | null;
}

// ─── Constants and dictionaries ──────────────────────────────────────

const PLANET_GLYPH: Record<string, string> = {
    sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂",
    jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇",
    chiron: "⚷", "north node": "☊", "true node": "☊",
};

const PLANET_COLOR_VAR: Record<string, string> = {
    sun: "var(--gold)",
    moon: "var(--color-planet-moon)",
    mercury: "var(--color-planet-mercury)",
    venus: "var(--color-planet-venus)",
    mars: "var(--color-planet-mars)",
    jupiter: "var(--color-planet-jupiter)",
    saturn: "var(--color-planet-saturn)",
    uranus: "var(--color-planet-uranus)",
    neptune: "var(--color-planet-neptune)",
    pluto: "var(--color-planet-pluto)",
};

const PLANET_PLAIN: Record<string, string> = {
    sun: "Your core identity.",
    moon: "Your emotional life, what comforts you.",
    mercury: "How you think and talk.",
    venus: "Love, pleasure, beauty, money.",
    mars: "Drive, anger, how you pursue things.",
    jupiter: "Luck, growth, big ideas.",
    saturn: "Discipline, structure, what takes time.",
    uranus: "Sudden changes, freedom, surprise.",
    neptune: "Dreams, spirituality, what dissolves.",
    pluto: "Power, transformation, what's hidden.",
};

const HOUSE_LABEL: Record<number, string> = {
    1: "1 · self",
    2: "2 · resources",
    3: "3 · learning, siblings",
    4: "4 · home, roots",
    5: "5 · creativity, romance",
    6: "6 · daily work",
    7: "7 · partnership",
    8: "8 · shared, depth",
    9: "9 · big ideas, travel",
    10: "10 · public life",
    11: "11 · community",
    12: "12 · behind the scenes",
};

// /reading/new goal ID → relocated house numbers that drive that goal.
// These are the houses computed in matrixResult.houses[]; the V4 vibe card
// surfaces those scores directly so the user can see what's behind the bar.
// "timing" is transit-driven, not house-driven — its score falls back to
// macroScore.
const GOAL_TO_HOUSES: Record<string, number[]> = {
    love:       [5, 7],         // romance + partnerships
    career:     [10, 6, 2],     // status + work + income
    community:  [11, 3],        // networks + neighbours
    growth:     [9, 12],        // expansion + interior
    relocation: [4],            // home, roots
    timing:     [],             // transit-driven
};

// Plain-English label for the house-number badge under each vibe.
const HOUSE_TOPIC: Record<number, string> = {
    1: "self & first impression",
    2: "money & resources",
    3: "neighbours & learning",
    4: "home & roots",
    5: "creativity & romance",
    6: "daily work",
    7: "partnerships",
    8: "shared depth",
    9: "expansion",
    10: "career & status",
    11: "community",
    12: "interior life",
};

const GOAL_VIBE_PRESET: Record<string, { icon: string; title: string }> = {
    love:       { icon: "♡", title: "Love and closeness soften here." },
    career:     { icon: "▲", title: "Your direction sharpens." },
    community:  { icon: "◈", title: "New people enter." },
    timing:     { icon: "✧", title: "The rhythm of this place fits you." },
    growth:     { icon: "✦", title: "Quieter inside, clearer ahead." },
    relocation: { icon: "⌂", title: "It feels like home." },
};

const ANGLE_PLAIN: Record<"ASC"|"IC"|"DSC"|"MC", { name: string; plain: string }> = {
    ASC: { name: "Rising (ASC)",    plain: "How you come across" },
    IC:  { name: "IC · home point", plain: "What feels like home" },
    DSC: { name: "Descendant",      plain: "Who you attract" },
    MC:  { name: "MC · direction",  plain: "Your public calling" },
};

const ANGLE_CHART_PLAIN: Record<"ASC"|"IC"|"DSC"|"MC", string> = {
    ASC: "How you come across to people here. Your \"first impression\" angle.",
    IC:  "What feels like home. The most private, residential angle.",
    DSC: "Who you attract — partners, teachers, close others.",
    MC:  "Your public calling. What you want to be known for.",
};

// Term slugs used by the prompt's `glossaryEntries` to override the static
// definitions below.
const GLOSSARY_TERM_SLUGS: Record<string, "relocated-chart" | "angles" | "houses" | "aspects"> = {
    "Relocated chart": "relocated-chart",
    "Angles (ASC/IC/DSC/MC)": "angles",
    "Houses": "houses",
    "Aspects": "aspects",
};

function deriveGlossary(reading: any): Array<{ term: string; def: string; href: string }> {
    const promptDefs: Record<string, string> = {};
    for (const ge of (reading?.teacherReading?.glossaryEntries || [])) {
        if (ge?.term && ge?.def) promptDefs[ge.term] = ge.def;
    }
    return STATIC_GLOSSARY.map(g => {
        const slug = GLOSSARY_TERM_SLUGS[g.term];
        const promptDef = slug ? promptDefs[slug] : undefined;
        return { ...g, def: promptDef || g.def };
    });
}

const STATIC_GLOSSARY: Array<{ term: string; def: string; href: string }> = [
    { term: "Relocated chart", def: "Your birth chart recalculated as if you had been born in the new location. The planets stay the same; the houses and angles rotate.",
      href: "/learn/natal-chart" },
    { term: "Angles (ASC/IC/DSC/MC)", def: "The four \"corners\" of a chart. They change the fastest when you move — they are the main reason places feel different.",
      href: "/learn/astrocartography" },
    { term: "Houses", def: "Twelve slices of life (self, home, work, relationships, etc). Planets move through different houses when you change location.",
      href: "/learn/houses" },
    { term: "Aspects", def: "Angular relationships between planets and the four corners. Conjunctions (0°) are strongest; sextiles (60°) and trines (120°) are supportive; squares (90°) are friction.",
      href: "/learn/aspects" },
];

const LEARN_MORE_LINKS: Array<{ label: string; href: string }> = [
    { label: "How geodetic relocation works →",     href: "/learn/geodetic-astrology" },
    { label: "Reading your full relocated chart →", href: "/learn/astrocartography" },
    { label: "Browse all guides →",                  href: "/learn" },
];

// ─── Small helpers ────────────────────────────────────────────────────

function glyph(name: string): string {
    return PLANET_GLYPH[name?.toLowerCase()] ?? "★";
}
function planetColor(name: string): string {
    return PLANET_COLOR_VAR[name?.toLowerCase()] ?? "var(--color-y2k-blue)";
}
function planetPlain(name: string): string {
    return PLANET_PLAIN[name?.toLowerCase()] ?? `Your ${name}.`;
}
function fmtSignDeg(lon: number | undefined): string {
    if (typeof lon !== "number" || !isFinite(lon)) return "—";
    const norm = ((lon % 360) + 360) % 360;
    const sign = signFromLongitude(norm);
    const deg = Math.floor(norm % 30);
    return `${deg}° ${sign}`;
}
function shortDate(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtRange(startISO: string, endISO: string): string {
    const s = new Date(startISO);
    const e = new Date(endISO);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return `${startISO} – ${endISO}`;
    const yr = e.getFullYear();
    return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${yr}`;
}
function nightsBetween(startISO: string, endISO: string): string {
    const s = new Date(startISO);
    const e = new Date(endISO);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return "—";
    const days = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86_400_000));
    return `${days} ${days === 1 ? "night" : "nights"}`;
}

// Aspect orb-classification (used for both Step 7 and Step 4 chart)
const ASPECTS = [
    { name: "conjunct",  angle: 0,   plain: "sitting on top of" },
    { name: "sextile",   angle: 60,  plain: "supportively angled to" },
    { name: "square",    angle: 90,  plain: "in friction with" },
    { name: "trine",     angle: 120, plain: "flowing easily into" },
    { name: "opposition",angle: 180, plain: "directly across from" },
];

function angSep(a: number, b: number): number {
    // Smallest angular separation in [0, 180].
    const d = ((a - b) % 360 + 360) % 360;
    return d > 180 ? 360 - d : d;
}

function classifyAspect(planetLon: number, angleLon: number, orbDeg = 8):
    { name: string; angle: number; plain: string; orb: number } | null {
    const sep = angSep(planetLon, angleLon);
    let best: { name: string; angle: number; plain: string; orb: number } | null = null;
    for (const a of ASPECTS) {
        const orb = Math.abs(sep - a.angle);
        if (orb <= orbDeg && (!best || orb < best.orb)) {
            best = { ...a, orb };
        }
    }
    return best;
}

function strengthFromOrb(orb: number, aspectAngle: number): V4AspectToAngle["strength"] {
    if (aspectAngle === 0 && orb < 1.5) return "exact";
    if (aspectAngle === 0 && orb < 4)   return "very strong";
    if (orb < 2)                        return "very strong";
    if (aspectAngle === 90 || aspectAngle === 180) return "moderate";
    return orb < 4 ? "supportive" : "gentle";
}

// ─── travelWindows derivation ─────────────────────────────────────────

const FLAVORS: Array<{ flavor: string; flavorTitle: string; emoji: string }> = [
    { flavor: "Best match",    flavorTitle: "Home-like, settling",  emoji: "✦" },
    { flavor: "Social window", flavorTitle: "Meeting people",       emoji: "✧" },
    { flavor: "Quiet window",  flavorTitle: "Commit to something",  emoji: "✷" },
];

function deriveTravelWindows(reading: any, travelType: V4TravelType, travelDateISO: string | null, goalIdsArg: string[] = []): V4TravelWindow[] {
    const promptWindows: any[] | undefined = Array.isArray(reading?.teacherReading?.windows)
        ? reading.teacherReading.windows
        : undefined;

    // Relocation readings have no 7-night frame to optimize. Single window
    // anchored on the move date.
    if (travelType === "relocation" && travelDateISO) {
        const start = new Date(travelDateISO);
        const end = new Date(start.getTime() + 30 * 86_400_000);
        return [{
            rank: 1,
            flavor: "Move date", flavorTitle: "Your move starts here", emoji: "⌂",
            dates: shortDate(start.toISOString()) + ", " + start.getFullYear(),
            nights: "first month",
            score: reading?.macroScore || 80,
            note: reading?.teacherReading?.hero?.explainer || reading?.teacherReading?.summary?.theRead || "Your relocated chart settles in over the first 30 days. The score is for the place itself, not a window inside it.",
            startISO: start.toISOString(),
            endISO: end.toISOString(),
        }];
    }

    // 1. If a weather forecast is present and has interpretation.travelWindows, use it.
    const wfWindows = reading?.weatherForecast?.interpretation?.travelWindows;
    if (Array.isArray(wfWindows) && wfWindows.length) {
        return wfWindows.slice(0, 3).map((w: any, i: number) => ({
            rank: i + 1,
            flavor: FLAVORS[i]?.flavor ?? "Window",
            flavorTitle: FLAVORS[i]?.flavorTitle ?? "",
            emoji: FLAVORS[i]?.emoji ?? "✦",
            dates: w.label || w.dates || fmtRange(w.startDate ?? w.start ?? "", w.endDate ?? w.end ?? ""),
            nights: w.nights || nightsBetween(w.startDate ?? w.start ?? "", w.endDate ?? w.end ?? ""),
            score: typeof w.score === "number" ? Math.round(w.score) : 80,
            note: w.note || w.rationale || "",
            startISO: w.startDate ?? w.start ?? "",
            endISO: w.endDate ?? w.end ?? "",
        }));
    }

    // 2. Deterministic scoring from real transitWindows. Engine owns scores
    //    and dates; prompt prose (flavorTitle/note) is overlaid by index when
    //    available — the AI never authors a score because it never sees one.
    const tw = reading?.transitWindows;
    if (Array.isArray(tw) && tw.length) {
        const isHitShape = tw[0] && "transit_planet" in tw[0];

        if (isHitShape) {
            const baselineMacro = reading?.macroScore ?? 70;
            const scored = buildScoredWindows(travelDateISO, tw, baselineMacro, goalIdsArg);
            return scored.map((w, i) => {
                const prose = promptWindows?.[i];
                const detNote = w.drivers.length
                    ? w.drivers.join(" · ")
                    : "Quiet week — no major transits nearby. Score reflects the place itself.";
                return {
                    rank: i + 1,
                    flavor: i === 0 ? "Your dates" : "Alternate",
                    flavorTitle: prose?.flavorTitle || w.label,
                    emoji: i === 0 ? "✦" : (i === 1 ? "←" : i === 2 ? "→" : "»"),
                    dates: fmtRange(w.startISO, w.endISO),
                    nights: nightsBetween(w.startISO, w.endISO),
                    score: w.score,
                    note: prose?.note || detNote,
                    startISO: w.startISO,
                    endISO: w.endISO,
                };
            });
        }

        // Mock-ish shape — use the mock's own start/end and a tapered fallback
        // score. Prompt prose still wins for flavorTitle/note when present.
        return tw.slice(0, 3).map((w: any, i: number) => {
            const prose = promptWindows?.[i];
            return {
                rank: i + 1,
                flavor: FLAVORS[i]?.flavor ?? "Window",
                flavorTitle: prose?.flavorTitle || FLAVORS[i]?.flavorTitle || "",
                emoji: FLAVORS[i]?.emoji ?? "✦",
                dates: fmtRange(w.start, w.end),
                nights: nightsBetween(w.start, w.end),
                score: typeof w.score === "number" ? w.score : Math.max(60, 90 - i * 6),
                note: prose?.note || w.recommendation || w.note || w.transit || "",
                startISO: w.start,
                endISO: w.end,
            };
        });
    }

    // 3. Last resort: no transit data. Honor prompt windows if present, even
    //    though their scores are the AI's guess. Better than a single synthetic.
    if (promptWindows && promptWindows.length) {
        return promptWindows.slice(0, 3).map((w: any, i: number) => ({
            rank: i + 1,
            flavor: FLAVORS[i]?.flavor ?? "Window",
            flavorTitle: w.flavorTitle ?? FLAVORS[i]?.flavorTitle ?? "",
            emoji: FLAVORS[i]?.emoji ?? "✦",
            dates: w.dates ?? "",
            nights: w.nights ?? "",
            score: typeof w.score === "number" ? Math.round(w.score) : 80,
            note: w.note ?? "",
            startISO: "",
            endISO: "",
        }));
    }

    // 3. Last resort: synthesize one window from travelDate + macroScore.
    const baseISO = reading?.travelDate || new Date().toISOString().slice(0, 10);
    const start = new Date(baseISO);
    const end = new Date(start.getTime() + 9 * 86_400_000);
    return [{
        rank: 1,
        flavor: "Best match", flavorTitle: "Home-like, settling", emoji: "✦",
        dates: fmtRange(start.toISOString(), end.toISOString()),
        nights: nightsBetween(start.toISOString(), end.toISOString()),
        score: reading?.macroScore || 75,
        note: "Your travel window.",
        startISO: start.toISOString(),
        endISO: end.toISOString(),
    }];
}

// ─── Vibes (Step 3) ───────────────────────────────────────────────────

function deriveVibes(reading: any, goalIds: string[]): V4Vibe[] {
    const houses: Array<{ house: number; score: number }> = reading?.houses || [];
    const houseScoreFor = (n: number): number | undefined =>
        houses.find(h => h.house === n)?.score;

    const teacherLeanInto: string[] = reading?.teacherReading?.summary?.leanInto || [];
    const teacherVibes: any[] = reading?.teacherReading?.vibes || [];
    const macroScore: number | undefined = reading?.macroScore;

    const fallbackBodies = [
        "<strong>The strongest signal</strong> for you here. Pay attention to it first — it'll set the tone for everything else.",
        "<strong>A real, second thread</strong> at this place. Worth planning around.",
        "<strong>A subtler theme</strong>, but real. It tends to show up later in a trip.",
    ];

    function buildHouseAttr(houseNums: number[]): { score?: number; attribution?: V4Vibe["houseAttribution"] } {
        if (!houseNums.length) {
            return macroScore != null ? { score: macroScore } : {};
        }
        const rows = houseNums
            .map(n => {
                const s = houseScoreFor(n);
                return s != null ? { house: n, topic: HOUSE_TOPIC[n] ?? `${n}th house`, score: Math.round(s) } : null;
            })
            .filter((r): r is { house: number; topic: string; score: number } => r !== null);
        if (!rows.length) return macroScore != null ? { score: macroScore } : {};
        // Vibe score = average of the contributing houses (transparent — the
        // user can see the components on the card).
        const score = Math.round(rows.reduce((a, r) => a + r.score, 0) / rows.length);
        return { score, attribution: rows };
    }

    // Goal-driven path — vibes ordered by user's goal IDs, scored by houses.
    if (goalIds.length > 0) {
        return goalIds.slice(0, 3).map((goalId, i) => {
            const preset = GOAL_VIBE_PRESET[goalId] || { icon: "✦", title: goalId };
            const tv = teacherVibes.find(v => v?.goalId === goalId);
            const body = tv?.body || teacherLeanInto[i] || fallbackBodies[i];
            const title = tv?.title || preset.title;
            const icon = tv?.icon || preset.icon;
            const { score, attribution } = buildHouseAttr(GOAL_TO_HOUSES[goalId] || []);
            const vibe: V4Vibe = { icon, title, body };
            if (score != null) vibe.score = score;
            if (attribution) vibe.houseAttribution = attribution;
            return vibe;
        });
    }

    // No goals on file: fall back to the top-3 houses by score (real chart-
    // driven ordering, no event-score black box).
    const topHouses = [...houses].sort((a, b) => b.score - a.score).slice(0, 3);
    if (topHouses.length === 3) {
        return topHouses.map((h, i) => {
            const preset = HOUSE_VIBE_PRESET[h.house] || { icon: "✦", title: HOUSE_TOPIC[h.house] ?? `${h.house}th house` };
            return {
                icon: preset.icon,
                title: preset.title,
                body: teacherLeanInto[i] || fallbackBodies[i],
                score: Math.round(h.score),
                houseAttribution: [{ house: h.house, topic: HOUSE_TOPIC[h.house] ?? "", score: Math.round(h.score) }],
            };
        });
    }

    // Last-resort default — three generic vibes with no scoring.
    const titles = ["It feels like home.", "You'll meet teachers.", "Your direction softens."];
    const icons = ["⌂", "◎", "◈"];
    return titles.map((title, i) => ({
        icon: icons[i],
        title,
        body: teacherLeanInto[i] || fallbackBodies[i],
    }));
}

const HOUSE_VIBE_PRESET: Record<number, { icon: string; title: string }> = {
    1:  { icon: "✦", title: "You'll come into focus." },
    2:  { icon: "✺", title: "Resources line up." },
    4:  { icon: "⌂", title: "It feels like home." },
    5:  { icon: "♡", title: "Soft, romantic weather." },
    6:  { icon: "✚", title: "Your routine settles." },
    7:  { icon: "◎", title: "Close encounters carry weight." },
    9:  { icon: "▲", title: "Your view widens." },
    10: { icon: "▲", title: "Your direction sharpens." },
    11: { icon: "◈", title: "New people enter." },
    12: { icon: "✧", title: "Things get quieter inside." },
};

// ─── Step 4: chart angles + natal + months ───────────────────────────

function getAngleLons(reading: any): { ASC: number; IC: number; DSC: number; MC: number } | null {
    const cusps: number[] | undefined = reading?.relocatedCusps;
    if (!Array.isArray(cusps) || cusps.length < 12) return null;
    // Standard: cusps[0]=ASC, cusps[3]=IC, cusps[6]=DSC, cusps[9]=MC
    return { ASC: cusps[0], IC: cusps[3], DSC: cusps[6], MC: cusps[9] };
}

function deriveChartAngles(reading: any): V4ChartAngle[] {
    const lons = getAngleLons(reading);
    // The wheel uses screen-relative angles where ASC sits on the left (180°),
    // MC on top (90°), DSC on the right (0°), IC on the bottom (270°). When we
    // know real ecliptic longitudes we honor them directly; otherwise fall
    // back to the canonical wheel positions.
    if (!lons) {
        return (["ASC", "IC", "DSC", "MC"] as const).map(k => ({
            k, name: ANGLE_PLAIN[k].name.split(" ")[0],
            deg: { ASC: 180, IC: 270, DSC: 0, MC: 90 }[k],
            plain: ANGLE_CHART_PLAIN[k],
        }));
    }
    return (["ASC", "IC", "DSC", "MC"] as const).map(k => ({
        k,
        name: ANGLE_PLAIN[k].name.split(" ")[0],
        deg: lons[k],
        plain: ANGLE_CHART_PLAIN[k],
    }));
}

function deriveChartNatal(reading: any): V4ChartPlanet[] {
    const planets = reading?.natalPlanets || [];
    const lons = getAngleLons(reading);
    return planets
      .map((p: any) => {
        const name = (p.name || p.planet || "").toString();
        const deg = typeof p.longitude === "number" ? p.longitude : 0;
        const natalHouse = deriveChartPlanetNatalHouse(p, deg, reading);
        const relocatedHouse = houseFromCusps(deg, reading?.relocatedCusps)
            ?? (lons ? houseFromLongitude(deg, lons.ASC) : undefined);
        return {
            p: name,
            glyph: glyph(name),
            deg,
            color: planetColor(name),
            plain: planetPlain(name),
            sign: typeof p.sign === "string" ? p.sign : signFromLongitude(deg),
            degree: `${Math.floor(((deg % 30) + 30) % 30)}°`,
            natalHouse,
            relocatedHouse,
        };
      })
      .filter((p: V4ChartPlanet) => p.p && Number.isFinite(p.deg));
}

function houseFromCusps(planetLon: number, cusps: unknown): number | undefined {
    if (!Array.isArray(cusps) || cusps.length !== 12) return undefined;
    for (let i = 0; i < 12; i++) {
        const cusp = Number(cusps[i]);
        const next = Number(cusps[(i + 1) % 12]);
        if (!Number.isFinite(cusp) || !Number.isFinite(next)) return undefined;
        const span = ((next - cusp) + 360) % 360;
        const dist = ((planetLon - cusp) + 360) % 360;
        if (dist < span || (i === 11 && dist === span)) return i + 1;
    }
    return undefined;
}

function deriveChartPlanetNatalHouse(p: any, deg: number, reading: any): number | undefined {
    if (typeof p.house === "number") return p.house;
    const fromCusps = houseFromCusps(deg, reading?.natalCusps);
    if (fromCusps) return fromCusps;
    if (reading?.natalAngles && typeof deg === "number") return houseFromLongitude(deg, reading.natalAngles.ASC);
    return undefined;
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_KEYS   = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function deriveChartMonths(reading: any, anchorISO: string | null, goalIdsArg: string[] = []): V4ChartMonth[] {
    // Anchor: travelDate's month if available, else now. Build months [-1, 0, +1].
    const anchor = anchorISO ? new Date(anchorISO) : new Date();
    if (isNaN(anchor.getTime())) anchor.setTime(Date.now());

    const months: Array<{ start: Date; end: Date; label: string; key: string }> = [];
    for (let i = -1; i <= 1; i++) {
        const m = new Date(anchor.getFullYear(), anchor.getMonth() + i, 1);
        const next = new Date(m.getFullYear(), m.getMonth() + 1, 1);
        months.push({
            start: m,
            end: next,
            label: `${MONTH_LABELS[m.getMonth()]} ${m.getFullYear()}`,
            key: MONTH_KEYS[m.getMonth()],
        });
    }

    const transitHits: any[] = Array.isArray(reading?.transitWindows) ? reading.transitWindows : [];
    const isHitShape = transitHits[0] && "transit_planet" in transitHits[0];
    const angleLons = getAngleLons(reading);
    const natalPlanetMap = new Map<string, number>();
    for (const p of (reading?.natalPlanets || [])) {
        const n = (p.name || p.planet || "").toString().toLowerCase();
        if (n && typeof p.longitude === "number") natalPlanetMap.set(n, p.longitude);
    }

    const teacherWeather: any[] = reading?.teacherReading?.signals?.weather || [];
    // V4-shaped per-aspect prose, keyed by aspectKey produced in buildAIInput
    // and the matching key derived below.
    const monthAspectsByKey: Record<string, { why?: string; timing?: string }> = {};
    for (const ma of (reading?.teacherReading?.monthAspects || [])) {
        if (ma?.aspectKey) monthAspectsByKey[ma.aspectKey] = { why: ma.why, timing: ma.timing };
    }

    return months.map((m, monthIdx) => {
        const inRange = isHitShape
            ? transitHits.filter((h: any) => {
                const d = new Date(h.date);
                return d >= m.start && d < m.end;
            })
            : [];

        // Build ChartAspect[] from up to 3 hits per month.
        const aspects: V4ChartAspect[] = inRange.slice(0, 3).map((h: any, i: number): V4ChartAspect => {
            const transitPlanet = (h.transit_planet || "").toString();
            const natalPlanet = (h.natal_planet || "").toString();
            const isAngleTarget = ["ASC","IC","DSC","MC"].includes(natalPlanet.toUpperCase());
            const targetDeg = isAngleTarget && angleLons
                ? angleLons[natalPlanet.toUpperCase() as "ASC"|"IC"|"DSC"|"MC"]
                : (natalPlanetMap.get(natalPlanet.toLowerCase()) ?? 0);

            // Use the transiting planet's actual sky longitude on the hit date
            // (persisted on TransitHit since the V4 follow-up). Cached hits
            // written before that field landed fall back to the target degree
            // so the line still renders, just as a "hit" rather than a true
            // geometric position.
            const fromDeg = typeof h.transit_planet_lon === "number" ? h.transit_planet_lon : targetDeg;
            const kind: V4ChartAspect["kind"] = h.benefic ? "supportive" : "friction";
            const aspectName = (h.aspect || "").toString();
            const isStrong = i === 0 && (h.orb ?? 99) < 2;

            const aspectKey = `${m.key}-${i}-${transitPlanet}-${natalPlanet}`;
            const fromPrompt = monthAspectsByKey[aspectKey];
            const tw = teacherWeather[monthIdx * 2 + i];
            const why = fromPrompt?.why
                || tw?.body
                || `${transitPlanet} ${aspectName} your ${natalPlanet}. ${h.benefic ? "Easeful." : "Useful pressure."}`;
            const timing = fromPrompt?.timing
                || tw?.datesRange
                || `${shortDate(h.date)}, orb ${(h.orb ?? 0).toFixed(1)}°`;

            return {
                id: aspectKey,
                kind: isStrong ? "strongest" : kind,
                from: { deg: fromDeg, p: `${transitPlanet} ${glyph(transitPlanet)}`, isTransit: true },
                to: isAngleTarget
                    ? { deg: targetDeg, p: `Your ${natalPlanet}`, isAngle: true }
                    : { deg: targetDeg, p: `Your natal ${natalPlanet} ${glyph(natalPlanet)}`, isNatal: true },
                title: `${transitPlanet} ${aspectName} ${isAngleTarget ? `your ${natalPlanet}` : `your natal ${natalPlanet}`}`,
                what: aspectName,
                why,
                timing,
            };
        });

        // Transits visible on the wheel — one dot per unique transit planet,
        // colored. We don't know the precise sky longitude for the month, so
        // distribute them around the wheel to read as "active for the month".
        const seen = new Set<string>();
        const transits: V4ChartPlanet[] = [];
        for (const h of inRange) {
            const name = (h.transit_planet || "").toString();
            if (!name || seen.has(name)) continue;
            seen.add(name);
            transits.push({
                p: name,
                glyph: glyph(name),
                deg: aspects.find(a => a.from.p.startsWith(name))?.from.deg ?? (transits.length * 60) % 360,
                color: planetColor(name),
                plain: `${name} is active in ${m.label}.`,
            });
            if (transits.length >= 4) break;
        }

        // Goal-weighted month score. Transits hitting a natal target the
        // user actually cares about (love → Venus/Moon, career → Sun/Mars/MC,
        // etc.) count for more than a generic supportive aspect somewhere
        // else. Falls back to a flat count when goalIds is empty.
        const goalTargets = (() => {
            if (!goalIdsArg.length) return null;
            const set = new Set<string>();
            const map: Record<string, string[]> = {
                love:       ["venus", "moon"],
                career:     ["sun", "mars", "saturn", "mc"],
                community:  ["mercury", "jupiter"],
                growth:     ["jupiter", "neptune"],
                relocation: ["moon", "ic"],
                timing:     [],
            };
            let any = false;
            for (const g of goalIdsArg) {
                const ts = map[g];
                if (ts && ts.length) { any = true; for (const t of ts) set.add(t); }
            }
            return any ? set : null;
        })();
        const benWeighted = inRange.reduce((s: number, h: any) => {
            const targetMatch = goalTargets ? goalTargets.has((h.natal_planet || "").toLowerCase()) : false;
            return s + (h.benefic ? (targetMatch ? 1.6 : 1) : 0);
        }, 0);
        const malWeighted = inRange.reduce((s: number, h: any) => {
            const targetMatch = goalTargets ? goalTargets.has((h.natal_planet || "").toLowerCase()) : false;
            return s + (!h.benefic ? (targetMatch ? 1.6 : 1) : 0);
        }, 0);
        const benefics = inRange.filter((h: any) => h.benefic).length;
        const malefics = inRange.filter((h: any) => !h.benefic).length;
        const score = Math.max(40, Math.min(98, Math.round(70 + benWeighted * 8 - malWeighted * 6)));

        const summary = aspects[0]?.title
            ? `${aspects[0].title}. ${benefics} supportive, ${malefics} friction.`
            : `${benefics} supportive, ${malefics} friction this month.`;

        return {
            key: m.key,
            label: m.label,
            score,
            summary,
            transits,
            aspects,
        };
    });
}

// ─── Step 6: lines & weeks ────────────────────────────────────────────

function deriveLines(reading: any): V4LineRow[] {
    // Same length-aware fallback as relocatedAcgLines in the V4 view —
    // an empty userPlanetaryLines/planetaryLines must not shadow a
    // populated downstream source.
    const candidates = [
        reading?.userPlanetaryLines,
        reading?.planetaryLines,
        reading?.acgLines,
    ];
    let lines: any[] = [];
    for (const c of candidates) {
        if (Array.isArray(c) && c.length > 0) { lines = c; break; }
    }
    // Prompt-emitted notes, keyed by `<planet-lowercase>-<angle>`.
    const promptNotes: Record<string, string> = {};
    for (const ln of (reading?.teacherReading?.lineNotes || [])) {
        if (ln?.lineKey && ln?.note) promptNotes[ln.lineKey.toLowerCase()] = ln.note;
    }
    // Surface silent prompt failures: lines exist but the AI emitted no
    // notes ⇒ every row falls through to the placeholder. Only log when
    // teacherReading exists (a missing one just means narrative is still
    // streaming, which is expected).
    if (lines.length > 0
        && Object.keys(promptNotes).length === 0
        && reading?.teacherReading) {
        console.warn(
            "[reading-viewmodel] teacherReading.lineNotes is empty but %d lines are rendered — using placeholder prose.",
            lines.length,
        );
    }
    return lines.slice(0, 6).map((l: any) => {
        const planet = (l.planet || "").toString();
        const angle = (l.line || l.angle || "").toString().toUpperCase();
        const distRaw = l.distance ?? l.distance_km ?? l.dist_km ?? 0;
        const distKm = typeof distRaw === "string"
            ? Number((distRaw.match(/\d+/) || ["0"])[0])
            : Number(distRaw);
        const key = `${planet.toLowerCase()}-${angle}`;
        return {
            planet,
            glyph: glyph(planet),
            angle,
            distKm: isFinite(distKm) ? distKm : 0,
            color: planetColor(planet),
            note: promptNotes[key] || l.note || l.tier || `${planet} ${angle} line near your destination.`,
            contribution: acgLineRawScore({ planet, angle, distance_km: distKm }),
        };
    });
}

function deriveWeeks(reading: any, narrative: any): V4WeekRow[] {
    // Prefer streamed narrative.weeks if present.
    const weeks = narrative?.weeks
        || reading?.teacherReading?.weeks
        || reading?.weatherForecast?.interpretation?.weeks
        || [];
    return weeks.slice(0, 6).map((w: any, i: number) => ({
        w: w.w ?? i + 1,
        range: w.range ?? "",
        title: w.title ?? "",
        body: w.body ?? "",
    }));
}

// ─── Step 7: relocated chart ─────────────────────────────────────────

function deriveRelocatedAngles(reading: any): V4Angle[] {
    const lons = getAngleLons(reading);
    const natalAngles = reading?.natalAngles;
    const getNatal = (k: "ASC"|"IC"|"DSC"|"MC"): string => {
        if (natalAngles && typeof natalAngles[k] === "number") return fmtSignDeg(natalAngles[k]);
        return "—";
    };

    // Prompt-emitted deltas, keyed by angle.
    const promptDeltas: Record<string, string> = {};
    for (const d of (reading?.teacherReading?.angleDeltas || [])) {
        if (d?.angle) promptDeltas[d.angle] = d.delta;
    }

    return (["ASC", "IC", "DSC", "MC"] as const).map(k => ({
        name: ANGLE_PLAIN[k].name,
        plain: ANGLE_PLAIN[k].plain,
        natal: getNatal(k),
        relocated: lons ? fmtSignDeg(lons[k]) : "—",
        delta: promptDeltas[k] || deltaCopy(k),
    }));
}

function deltaCopy(k: "ASC"|"IC"|"DSC"|"MC"): string {
    switch (k) {
        case "ASC": return "Your public-facing self shifts. People meet a slightly different version of you here.";
        case "IC":  return "What feels like home re-codes. The kind of room that settles you here may not be the kind that settles you back home.";
        case "DSC": return "You'll attract a different sort of person here — close encounters carry a different flavor.";
        case "MC":  return "What you want to be known for shifts. A quieter dream can sharpen into a real plan in this place.";
    }
}

function derivePlanetsInHouses(reading: any): V4PlanetHouseRow[] {
    const natalPlanets = reading?.natalPlanets || [];
    const lons = getAngleLons(reading);

    // Prompt-emitted shift copy, keyed by planet name (case-insensitive).
    const promptShifts: Record<string, string> = {};
    for (const ps of (reading?.teacherReading?.planetShifts || [])) {
        if (ps?.planet) promptShifts[ps.planet.toLowerCase()] = ps.shift;
    }

    if (!natalPlanets.length || !lons) {
        return natalPlanets.slice(0, 7).map((p: any) => {
            const name = (p.name || p.planet || "").toString();
            return {
                planet: name,
                glyph: glyph(name),
                natalHouse: HOUSE_LABEL[p.house] ?? "—",
                reloHouse: "—",
                shift: promptShifts[name.toLowerCase()] || "Re-housing data will appear here once the relocated chart finishes computing.",
            };
        });
    }
    const natalAngles = reading?.natalAngles;
    return natalPlanets.slice(0, 7).map((p: any) => {
        const name = (p.name || p.planet || "").toString();
        // Prefer a persisted natal house, else derive it from natalAngles.ASC
        // (the natal Ascendant longitude). Cached readings may have neither —
        // those fall through to undefined and render "—".
        const natalHouseNum: number | undefined =
            typeof p.house === "number"
                ? p.house
                : (typeof p.longitude === "number"
                    ? houseFromCusps(p.longitude, reading?.natalCusps)
                        ?? (natalAngles ? houseFromLongitude(p.longitude, natalAngles.ASC) : undefined)
                    : undefined);
        const reloHouseNum = typeof p.longitude === "number"
            ? houseFromCusps(p.longitude, reading?.relocatedCusps) ?? houseFromLongitude(p.longitude, lons.ASC)
            : 0;
        return {
            planet: name,
            glyph: glyph(name),
            natalHouse: natalHouseNum ? HOUSE_LABEL[natalHouseNum] : "—",
            reloHouse: HOUSE_LABEL[reloHouseNum] ?? `${reloHouseNum}`,
            shift: promptShifts[name.toLowerCase()] || shiftCopy(name, natalHouseNum, reloHouseNum),
        };
    });
}

function shiftCopy(name: string, from: number | undefined, to: number): string {
    const lower = name.toLowerCase();
    const planetWord = PLANET_PLAIN[lower] ? lower : "this planet";
    const toLabel = HOUSE_LABEL[to]?.split(" · ")[1] ?? "a different area of life";
    const verbs: Record<string, string> = {
        sun: "Your core identity moves into",
        moon: "Your emotional life moves into",
        mercury: "Your thinking/talking moves into",
        venus: "Love and pleasure move into",
        mars: "Your drive moves into",
        jupiter: "Your luck and growth move into",
        saturn: "Discipline turns toward",
        uranus: "Disruption shows up in",
        neptune: "Dreams settle into",
        pluto: "Power and change concentrate in",
    };
    const verb = verbs[planetWord] || `Your ${name} moves into`;
    return `${verb} ${toLabel}.${from ? ` (Natally in ${HOUSE_LABEL[from]?.split(" · ")[1] ?? "another house"}.)` : ""}`;
}

function deriveAspectsToAngles(reading: any): V4AspectToAngle[] {
    const natalPlanets = reading?.natalPlanets || [];
    const lons = getAngleLons(reading);
    if (!natalPlanets.length || !lons) return [];

    // Prompt-emitted plain/wasNatal copy, keyed by `${planet.toLowerCase()}-${angle}`.
    const promptAspectKey = (planet: string, angle: string) => `${planet.toLowerCase()}-${angle}`;
    const promptAspects: Record<string, { plain?: string; wasNatal?: string }> = {};
    for (const ap of (reading?.teacherReading?.aspectPlains || [])) {
        if (ap?.planet && ap?.angle) {
            promptAspects[promptAspectKey(ap.planet, ap.angle)] = { plain: ap.plain, wasNatal: ap.wasNatal };
        }
    }

    const out: V4AspectToAngle[] = [];
    for (const p of natalPlanets) {
        const name = (p.name || p.planet || "").toString();
        const lon = p.longitude;
        if (typeof lon !== "number") continue;

        for (const k of ["ASC","IC","DSC","MC"] as const) {
            const cls = classifyAspect(lon, lons[k], 8);
            if (!cls) continue;
            const strength = strengthFromOrb(cls.orb, cls.angle);
            const fromPrompt = promptAspects[promptAspectKey(name, k)];
            out.push({
                planet: name,
                glyph: glyph(name),
                toAngle: k,
                aspect: `${cls.name} (${cls.angle}°, orb ${cls.orb.toFixed(1)}°)`,
                strength,
                plain: fromPrompt?.plain || aspectPlain(name, k, cls.name),
                wasNatal: fromPrompt?.wasNatal || "Natal comparison: orb shifts in this place.",
            });
        }
    }
    return out
        .sort((a, b) => parseFloat(a.aspect.match(/orb ([\d.]+)/)?.[1] || "9") -
                         parseFloat(b.aspect.match(/orb ([\d.]+)/)?.[1] || "9"))
        .slice(0, 5);
}

function aspectPlain(planet: string, angle: "ASC"|"IC"|"DSC"|"MC", aspectName: string): string {
    const angleWord = { ASC: "first impression", IC: "home point", DSC: "close partners", MC: "calling" }[angle];
    const aspectVerb: Record<string, string> = {
        conjunct: "sits directly on",
        sextile: "supportively angles to",
        square: "presses on",
        trine: "flows easily into",
        opposition: "sits across from",
    };
    const verb = aspectVerb[aspectName] || "relates to";
    return `${planet} ${verb} your ${angleWord}.`;
}

// ─── Geodetic band (Sepharial) ───────────────────────────────────────

const GEO_SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];

function geodeticBandForLonVM(lon: number): { sign: string; longitudeRange: string } {
    const norm = ((lon % 360) + 360) % 360;
    const idx = Math.floor(norm / 30) % 12;
    const fromLon = idx * 30;
    const toLon = fromLon + 30;
    const fmt = (l: number) => {
        if (l === 0) return "0°";
        if (l <= 180) return `${l}°E`;
        return `${360 - l}°W`;
    };
    return { sign: GEO_SIGNS[idx], longitudeRange: `${fmt(fromLon)}–${fmt(toLon)}` };
}

// ─── Natal cusps fallback ────────────────────────────────────────────

/** Persisted `natalCusps` is the source of truth (12 Placidus cusps at the
 *  birth lat/lon). When missing — common on readings created before the
 *  natal-cusp persistence migration — synthesize equal-house cusps from
 *  `natalAngles.ASC`. The resulting bi-wheel shows the same conceptual
 *  contrast (different house structures around the same planets) even
 *  without the precise quadrant cusps. */
function deriveNatalCusps(reading: any): number[] {
    const persisted = reading?.natalCusps;
    if (Array.isArray(persisted) && persisted.length === 12 && persisted.every((c: any) => typeof c === "number")) {
        return persisted;
    }
    const asc = reading?.natalAngles?.ASC;
    if (typeof asc === "number" && isFinite(asc)) {
        return Array.from({ length: 12 }, (_, i) => ((asc + i * 30) % 360 + 360) % 360);
    }
    return [];
}

// ─── Score breakdown ─────────────────────────────────────────────────

/** Pull a 3-bucket breakdown that sums to overallScore. Prefers the persisted
 *  value (computed in lib/readings/astrocarto.ts); falls back to a sensible
 *  proportional split for cached or mock readings. */
function deriveBreakdownVM(reading: any, overallScore: number): { place: number; timing: number; sky: number } {
    const persisted = reading?.scoreBreakdown;
    if (persisted &&
        typeof persisted.place === "number" &&
        typeof persisted.timing === "number" &&
        typeof persisted.sky === "number") {
        return {
            place: Math.round(persisted.place),
            timing: Math.round(persisted.timing),
            sky: Math.round(persisted.sky),
        };
    }
    const total = Math.round(overallScore || 0);
    const lines = Array.isArray(reading?.planetaryLines) ? reading.planetaryLines.length : 0;
    const transits = Array.isArray(reading?.transitWindows) ? reading.transitWindows.length : 0;
    // Even when persistence is missing we want a roughly accurate split:
    // place dominates, timing scales with transit count, sky is the residual.
    const placeWeight = 1.4 + Math.min(lines, 6) * 0.1;
    const timingWeight = 0.6 + Math.min(transits, 8) * 0.05;
    const skyWeight = 0.7;
    const wSum = placeWeight + timingWeight + skyWeight;
    const place = Math.round((placeWeight / wSum) * total);
    const sky = Math.round((skyWeight / wSum) * total);
    const timing = Math.max(0, total - place - sky);
    return { place, timing, sky };
}

/** One-line flavor for each geodetic-zodiac sign. The geodetic system maps
 *  longitude → sign deterministically (Sepharial), so every visitor to a
 *  given longitude lands in the same flavor regardless of birth chart. */
const GEODETIC_SIGN_FLAVOR: Record<string, string> = {
    Aries:       "pioneering, fast, identity-forward",
    Taurus:      "grounded, sensual, slow-moving",
    Gemini:      "talkative, mobile, information-dense",
    Cancer:      "homely, memory-rich, emotionally porous",
    Leo:         "performative, bright, attention-loving",
    Virgo:       "exacting, craft-driven, service-flavored",
    Libra:       "relational, aesthetic, balance-seeking",
    Scorpio:     "intense, private, transformation-prone",
    Sagittarius: "expansive, philosophical, travel-loving",
    Capricorn:   "structured, ambitious, mountain-shaped",
    Aquarius:    "future-leaning, networked, eccentric",
    Pisces:      "dreamlike, dissolving, art-flavored",
};

/** Build the geodetic-band view object. Pulls Sepharial sign+range that
 *  astrocarto.ts already computes, layers a deterministic flavor sentence,
 *  and falls back gracefully when the band is missing. */
function deriveGeodetic(reading: any): {
    sign: string; longitudeRange: string; flavor: string; note: string;
    activeTransits: V4GeoTransit[];
} | null {
    const band = reading?.geodeticBand;
    if (!band || !band.sign) return null;
    const sign = String(band.sign);
    const longitudeRange = String(band.longitudeRange ?? "");
    const flavor = GEODETIC_SIGN_FLAVOR[sign] || "distinct";
    const aiNote = reading?.teacherReading?.chrome?.step4GeodeticNote;
    const note = aiNote
        || `Every visitor to this longitude lands in ${sign}-flavored land — ${flavor}. This is a property of the place itself, not your chart.`;
    const activeTransits = normalizeActiveGeoTransits(reading?.activeGeoTransits);
    return { sign, longitudeRange, flavor, note, activeTransits };
}

/** Coerce the persisted activeGeoTransits payload into V4GeoTransit shape.
 *  Tolerates older readings that predate this field by returning []. */
function normalizeActiveGeoTransits(raw: unknown): V4GeoTransit[] {
    if (!Array.isArray(raw)) return [];
    const ANGLES = new Set(["ASC", "MC", "DSC", "IC"] as const);
    const DIRECTIONS = new Set(["benefic", "malefic", "luminary", "neutral"] as const);
    const out: V4GeoTransit[] = [];
    for (const e of raw) {
        if (!e || typeof e !== "object") continue;
        const angle = String((e as any).angle ?? "").toUpperCase();
        const direction = String((e as any).direction ?? "").toLowerCase();
        if (!ANGLES.has(angle as any) || !DIRECTIONS.has(direction as any)) continue;
        const planet = String((e as any).planet ?? "");
        const house = Number((e as any).house);
        const orb = Number((e as any).orb);
        const severity = Number((e as any).severity);
        if (!planet || !Number.isFinite(house) || !Number.isFinite(orb) || !Number.isFinite(severity)) continue;
        const natalContactRaw = (e as any).natalContact;
        const natalOrbRaw = (e as any).natalOrb;
        out.push({
            planet,
            angle: angle as V4GeoTransit["angle"],
            house,
            orb,
            severity,
            direction: direction as V4GeoTransit["direction"],
            personalActivation: Boolean((e as any).personalActivation),
            ...(typeof natalContactRaw === "string" ? { natalContact: natalContactRaw } : {}),
            ...(Number.isFinite(natalOrbRaw) ? { natalOrb: Number(natalOrbRaw) } : {}),
        });
    }
    return out;
}

/** Deterministic §04 takeaway used until the AI fills in `step4Takeaway`.
 *  Names the dominant line (largest |contribution|) and tilts the wording
 *  by sign — supportive lift vs. challenging press. Goal-aware framing is
 *  intentionally gentle; the AI is expected to do the harder synthesis. */
function defaultStep4Takeaway(reading: any, city: string, goalIds: string[]): string {
    const lines: any[] = (() => {
        const candidates = [
            reading?.userPlanetaryLines,
            reading?.planetaryLines,
            reading?.acgLines,
        ];
        for (const c of candidates) {
            if (Array.isArray(c) && c.length > 0) return c;
        }
        return [];
    })();
    if (!lines.length) {
        return `${city} sits in a quiet pocket — no major planetary lines run through it. A clean slate, with little extra pull either way.`;
    }
    let dominant: { planet: string; angle: string; contribution: number } | null = null;
    for (const l of lines) {
        const angle = (l.line || l.angle || "").toString().toUpperCase();
        const km = Number(l.distance_km ?? l.distance ?? 9999);
        const planet = (l.planet || "").toString();
        if (!planet || !angle || !isFinite(km)) continue;
        const contribution = acgLineRawScore({ planet, angle, distance_km: km });
        if (!dominant || Math.abs(contribution) > Math.abs(dominant.contribution)) {
            dominant = { planet, angle, contribution };
        }
    }
    if (!dominant) {
        return `${city} carries a few planetary lines but none stand out as the headline.`;
    }
    const goalHint = goalIds[0] ? ` for ${goalIds[0]}` : "";
    if (dominant.contribution > 4) {
        return `The headline${goalHint}: ${dominant.planet} on your ${dominant.angle} runs near ${city} and lifts the score most. Expect that planet's themes to feel amplified here.`;
    }
    if (dominant.contribution < -4) {
        return `The headline${goalHint}: ${dominant.planet} on your ${dominant.angle} runs near ${city} and presses hardest. Expect that planet's themes to demand attention here.`;
    }
    return `${dominant.planet} on your ${dominant.angle} is the closest line, but its pull is light here — ${city} reads more like a neutral baseline.`;
}

function defaultBreakdownCaption(b: { place: number; timing: number; sky: number }, travelType: V4TravelType): string {
    const max = Math.max(b.place, b.timing, b.sky);
    if (max === b.place) return travelType === "relocation"
        ? "Mostly your chart in this place; dates and world sky add a touch."
        : "Mostly your chart × this place; the dates and world sky tilt the rest.";
    if (max === b.timing) return "Your dates do most of the work here.";
    return "World-sky context lifts this one — the dates and place sit closer to neutral.";
}

// ─── Teacher-reading completeness and deterministic copy ──────────────

function isRecord(value: unknown): value is Record<string, any> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

function hasText(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function hasTextArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.some(hasText);
}

export function hasV4TeacherReading(teacherReading: unknown): boolean {
    if (!isRecord(teacherReading)) return false;

    const hero = teacherReading.hero;
    const tabs = teacherReading.tabs;
    const overview = teacherReading.overview;
    const timing = teacherReading.timing;

    const hasHero = isRecord(hero) && hasText(hero.explainer);
    const hasTabs = isRecord(tabs) && READING_TAB_IDS.every((id) => {
        const tab = tabs[id];
        return isRecord(tab)
            && hasText(tab.lead)
            && hasText(tab.plainEnglishSummary)
            && hasText(tab.evidenceCaption);
    });
    const hasOverview = isRecord(overview)
        && hasTextArray(overview.leanInto)
        && hasTextArray(overview.watchOut);
    const hasTiming = isRecord(timing)
        && (hasTextArray(timing.activationAdvice) || hasText(timing.closingVerdict));

    return hasHero && hasTabs && hasOverview && hasTiming;
}

function evidenceSourceLabel(source: EvidencePoint["source"]): string {
    switch (source) {
        case "event":
            return "event-score driver";
        case "house":
            return "house-score driver";
        case "line":
            return "astrocartography line";
        case "geodetic":
            return "place-field driver";
        case "transit":
            return "timing transit";
        default:
            return "chart driver";
    }
}

function evidenceScoreText(point: EvidencePoint): string {
    return typeof point.score === "number" && Number.isFinite(point.score)
        ? `, ${Math.round(point.score)}/100`
        : "";
}

function deterministicEvidenceCopy(point: EvidencePoint, mode: "lean" | "watch", city: string): string {
    const label = point.label || "This theme";
    const source = evidenceSourceLabel(point.source);
    const score = evidenceScoreText(point);
    if (mode === "lean") {
        return `${label} is where ${city} gives you the most traction (${source}${score}). Build plans around this instead of making the trip carry everything at once.`;
    }
    return `${label} needs more care here (${source}${score}). Keep this part simple, explicit, and lower-pressure instead of assuming the city will do it for you.`;
}

function evidenceFromTheme(theme: ScoreNarrative["themes"][number], mode: "lean" | "watch"): EvidencePoint {
    return {
        label: theme.label,
        score: theme.score,
        source: theme.source,
        body: "",
    };
}

function fallbackEvidence(scoreNarrative: ScoreNarrative, mode: "lean" | "watch"): EvidencePoint[] {
    const direct = mode === "lean" ? scoreNarrative.leanIntoEvidence : scoreNarrative.watchOutEvidence;
    if (direct.length) return direct;
    const themes = mode === "lean" ? scoreNarrative.strongestThemes : scoreNarrative.lessEmphasized;
    return themes.map((theme) => evidenceFromTheme(theme, mode));
}

function listLabels(labels: string[]): string {
    const clean = labels.filter(Boolean);
    if (clean.length <= 1) return clean[0] || "your goals";
    if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
    return `${clean.slice(0, -1).join(", ")}, and ${clean[clean.length - 1]}`;
}

function scoreBand(score: number): string {
    if (score >= 75) return "strong";
    if (score >= 60) return "supportive";
    if (score >= 50) return "workable";
    return "a stretch";
}

function goalScoreSentence(selectedGoals: ScoreNarrative["selectedGoals"]): string {
    if (!selectedGoals.length) return "";
    const scoredGoals = selectedGoals
        .map((goal) => `${goal.label} is ${scoreBand(goal.score)} at ${goal.score}/100`)
        .join("; ");
    return `${scoredGoals}.`;
}

function goalExplanation(selectedGoals: ScoreNarrative["selectedGoals"]): string {
    const primary = selectedGoals[0];
    if (!primary) {
        return "No single goal was selected, so this overview starts with the strongest themes in the chart.";
    }
    if (primary.score < 50) {
        return `For ${primary.label}, this is not a frictionless match. Use it for ${primary.outcome}, but keep the plans intentional: ${primary.action}.`;
    }
    return `For ${primary.label}, this is ${scoreBand(primary.score)} support. ${primary.action}.`;
}

function prioritizeGoalEvidence(
    points: EvidencePoint[],
    selectedGoals: ScoreNarrative["selectedGoals"],
): EvidencePoint[] {
    const goalLabels = new Set(
        selectedGoals.flatMap((goal) => [goal.label, goal.eventName].filter(Boolean).map((value) => String(value).toLowerCase())),
    );
    return [...points].sort((a, b) => {
        const aGoal = goalLabels.has(String(a.label).toLowerCase()) ? 0 : 1;
        const bGoal = goalLabels.has(String(b.label).toLowerCase()) ? 0 : 1;
        return aGoal - bGoal;
    });
}

function deterministicOverviewCopy(
    scoreNarrative: ScoreNarrative,
    heroWindow: V4TravelWindow,
    city: string,
    travelType: V4TravelType,
    baselineScore: number,
): NonNullable<V4ReadingVM["tabs"]["overview"]> {
    const selectedGoals = scoreNarrative.selectedGoals;
    const goalLabels = selectedGoals.map((goal) => goal.label);
    const strongest = listLabels(scoreNarrative.strongestThemes.slice(0, 3).map((theme) => theme.label));
    const goalFrame = selectedGoals.length
        ? `You asked whether ${city} works for ${listLabels(goalLabels)}.`
        : `This is what ${city} most naturally supports in your chart.`;
    const scoreFrame = travelType === "relocation"
        ? `The place fit is ${baselineScore}/100.`
        : `Your dates land at ${heroWindow.score}/100, close to the place fit of ${baselineScore}/100.`;
    const goals = goalScoreSentence(selectedGoals);

    const leanEvidence = prioritizeGoalEvidence(fallbackEvidence(scoreNarrative, "lean"), selectedGoals);
    const watchEvidence = prioritizeGoalEvidence(fallbackEvidence(scoreNarrative, "watch"), selectedGoals);

    return {
        scoreExplanation: `${goalFrame} ${scoreFrame} ${goals} The strongest support is ${strongest}, so read this as a trip with specific strengths rather than a blanket yes.`,
        goalExplanation: goalExplanation(selectedGoals),
        leanInto: leanEvidence.map((point) => deterministicEvidenceCopy(point, "lean", city)),
        watchOut: watchEvidence.map((point) => deterministicEvidenceCopy(point, "watch", city)),
    };
}

function deterministicTimingCopy(heroWindow: V4TravelWindow, travelWindows: V4TravelWindow[]): NonNullable<V4ReadingVM["tabs"]["timing"]> {
    const alternate = travelWindows.find((window) => window.rank !== heroWindow.rank && window.score > heroWindow.score);
    return {
        closingVerdict: alternate
            ? `Your selected window scores ${heroWindow.score}/100; ${alternate.dates} is the stronger alternate at ${alternate.score}/100.`
            : `Your selected window scores ${heroWindow.score}/100. Use the timing chart to see which days inside the window carry more lift or friction.`,
        activationAdvice: [
            `Treat ${heroWindow.dates} as the selected window score, not the whole-place baseline.`,
            alternate
                ? `Compare the alternate window at ${alternate.score}/100 before locking fixed plans.`
                : "If the dates are fixed, put the highest-stakes plans on the strongest days in the strip.",
        ],
    };
}

// ─── Public entry point ──────────────────────────────────────────────

export function toV4ViewModel(reading: any, narrative?: any): V4ReadingVM {
    const travelType: V4TravelType = reading?.travelType === "relocation" ? "relocation" : "trip";
    const goalIds: string[] = Array.isArray(reading?.goalIds) ? reading.goalIds.filter((g: any) => typeof g === "string") : [];

    const travelDateISO = reading?.travelDate
        ? new Date(reading.travelDate).toISOString().slice(0, 10)
        : null;

    const travelWindows = deriveTravelWindows(reading, travelType, travelDateISO, goalIds);

    // Daily series only meaningful for trips and only when we have transit hits.
    const dailySeries: DailyScore[] = (() => {
        if (travelType === "relocation") return [];
        const tw = reading?.transitWindows;
        const isHitShape = Array.isArray(tw) && tw[0] && "transit_planet" in tw[0];
        if (!isHitShape) return [];
        const baseline = typeof reading?.macroScore === "number" ? reading.macroScore : 70;
        return buildDailySeries(travelDateISO, tw, baseline, goalIds);
    })();
    // Pin the hero window's headline score to the persisted `heroWindowScore`
    // (written by app/lib/hero-score.ts at reading-generation time) so the
    // detail page and the readings list always show the same number for the
    // same row. Falls back to the live-derived window score for legacy rows
    // that predate the persisted field. Alternates and drivers continue to
    // flow from the live derivation.
    const persistedHeroScore = typeof reading?.heroWindowScore === "number" && Number.isFinite(reading.heroWindowScore)
        ? Math.round(reading.heroWindowScore)
        : null;
    const heroWindow = (persistedHeroScore !== null && travelWindows[0])
        ? { ...travelWindows[0], score: persistedHeroScore }
        : travelWindows[0];

    const city = (reading?.destination || "—").toString().split(",")[0]?.trim() || "—";
    const region = (reading?.destination || "").toString().split(",").slice(1).join(",").trim();
    const scoreNarrative: ScoreNarrative = reading?.scoreNarrative?.strongestThemes && reading?.scoreNarrative?.themes
        ? reading.scoreNarrative
        : deriveScoreNarrative({
            destination: reading?.destination || city,
            destinationLat: reading?.destinationLat,
            destinationLon: reading?.destinationLon,
            macroScore: reading?.macroScore,
            macroVerdict: reading?.macroVerdict,
            goalIds,
            houses: reading?.houses,
            eventScores: reading?.eventScores,
            natalPlanets: reading?.natalPlanets,
            geodeticBand: reading?.geodeticBand ?? null,
        });
    const hasCompleteV4Copy = hasV4TeacherReading(reading?.teacherReading);
    const trustedTeacherReading = hasCompleteV4Copy && isRecord(reading?.teacherReading)
        ? reading.teacherReading
        : null;
    const tabCopy = isRecord(trustedTeacherReading?.tabs)
        ? trustedTeacherReading.tabs
        : {};
    const baselineScore = typeof reading?.macroScore === "number" ? Math.round(reading.macroScore) : 0;
    const overviewCopy = trustedTeacherReading?.overview
        || deterministicOverviewCopy(scoreNarrative, heroWindow, city, travelType, baselineScore);
    const timingCopy = trustedTeacherReading?.timing
        || deterministicTimingCopy(heroWindow, travelWindows);

    const generated = (() => {
        const ts = reading?.generated || reading?.created_at;
        if (!ts) return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    })();

    return {
        location: {
            city,
            region,
            lat: reading?.destinationLat ?? 0,
            lon: reading?.destinationLon ?? 0,
        },
        generated,
        travelDateISO,
        travelType,
        goalIds,
        scoreNarrative,
        copy: {
            hasCompleteV4TeacherReading: hasCompleteV4Copy,
            overviewSource: trustedTeacherReading?.overview ? "teacher" : "deterministic",
            timingSource: trustedTeacherReading?.timing ? "teacher" : "deterministic",
        },
        tabs: {
            definitions: READING_TABS,
            editorialSpine: trustedTeacherReading?.editorialSpine,
            copy: trustedTeacherReading ? tabCopy : {},
            overview: overviewCopy,
            timing: timingCopy,
        },

        hero: (() => {
            const verdict = heroVerdict(heroWindow?.score ?? 0);
            const betterAlternate = travelType === "trip"
                ? heroBetterAlternate(travelWindows)
                : null;
            // Read the goal-driven vibes ahead of the public vibes wiring
            // so we can name the user's top goal in maximize advice.
            const vibesPreview = deriveVibes(reading, goalIds);
            const topVibeTitle = vibesPreview[0]?.title;
            return {
                bestWindow: heroWindow,
                explainer: trustedTeacherReading?.hero?.explainer
                    || heroExplainer(heroWindow, city, travelType, verdict.band),
                baselineScore: typeof reading?.macroScore === "number" ? Math.round(reading.macroScore) : 0,
                baselineContext: heroBaselineContext(
                    heroWindow?.score ?? 0,
                    typeof reading?.macroScore === "number" ? Math.round(reading.macroScore) : 0,
                    travelType,
                ),
                verdict,
                betterAlternate,
                maximizeAdvice: heroMaximizeAdvice(verdict.band, travelType, topVibeTitle, !!betterAlternate),
            };
        })(),
        travelWindows,
        dailySeries,

        vibes: deriveVibes(reading, goalIds),

        chart: {
            angles: deriveChartAngles(reading),
            natal: deriveChartNatal(reading),
            months: deriveChartMonths(reading, travelDateISO, goalIds),
        },

        callout: reading?.teacherReading?.chrome?.monthChartCallout
            || `The blue lines are supportive angles between the sky this month and your chart. The coral lines are friction. Hover any dot to learn what it is.`,

        scoreBreakdown: deriveBreakdownVM(
            reading,
            (heroWindow?.score ?? (typeof reading?.macroScore === "number" ? reading.macroScore : 0)),
        ),

        geodeticBand: reading?.geodeticBand
            && typeof reading.geodeticBand?.sign === "string"
            && typeof reading.geodeticBand?.longitudeRange === "string"
            ? reading.geodeticBand
            : (typeof reading?.destinationLon === "number"
                ? geodeticBandForLonVM(reading.destinationLon)
                : null),

        chrome: {
            step1Breakdown: reading?.teacherReading?.chrome?.step1Breakdown
                || defaultBreakdownCaption(
                    deriveBreakdownVM(reading, heroWindow?.score ?? reading?.macroScore ?? 0),
                    travelType,
                ),
            step3Intro: reading?.teacherReading?.chrome?.step3Intro
                || `Astrologers read cities like they read people. Based on where planets sat when you were born, some places fit you more than others. ${city} is a match in three specific ways:`,
            step4Intro: reading?.teacherReading?.chrome?.step4Intro
                || `Planets cast invisible "sky-streets" across Earth. Where one passes near your destination, you feel it. Closer means stronger.`,
            step4Takeaway: reading?.teacherReading?.chrome?.step4Takeaway
                || defaultStep4Takeaway(reading, city, goalIds),
            step4GeodeticNote: reading?.teacherReading?.chrome?.step4GeodeticNote || "",
            step4GeodeticBridge: reading?.teacherReading?.chrome?.step4GeodeticBridge || "",
            step4GeodeticMethod: reading?.teacherReading?.chrome?.step4GeodeticMethod
                || "We only check four points in your chart in this view: your career point (MC), home point (IC), self point (ASC), and partner point (DSC). The other eight house points do not get a signal here. A natal planet only counts if it sits within five degrees of one of these four. The closer it sits, the stronger it feels. Gentle planets like Venus and Jupiter feel easy. Rough ones like Mars and Saturn feel heavy. The Sun and Moon make things stand out.",
            monthChartCallout: reading?.teacherReading?.chrome?.monthChartCallout
                || `The blue lines are supportive angles between the sky this month and your chart. The coral lines are friction. Hover any dot to learn what it is.`,
            step7Intro: reading?.teacherReading?.chrome?.step7Intro
                || `When you move (or travel), astrologers recalculate your birth chart as if you had been born in the new place. The planets stay the same — but which areas of life they activate changes. Here's what shifts.`,
            step7AnglesSub: reading?.teacherReading?.chrome?.step7AnglesSub
                || "The four angles change.",
            step7HousesSub: reading?.teacherReading?.chrome?.step7HousesSub
                || "Planets move into new houses.",
            step7AspectsSub: reading?.teacherReading?.chrome?.step7AspectsSub
                || "New aspects to the angles.",
        },

        todo: deriveTodo(heroWindow, city, reading, travelType, goalIds),

        astrology: {
            lines: deriveLines(reading),
            weeks: deriveWeeks(reading, narrative),
        },

        geodetic: deriveGeodetic(reading),

        relocated: {
            birth: deriveBirth(reading),
            travel: {
                place: reading?.destination || "—",
                coords: fmtCoords(reading?.destinationLat, reading?.destinationLon),
                window: heroWindow.dates,
            },
            angles: deriveRelocatedAngles(reading),
            planetsInHouses: derivePlanetsInHouses(reading),
            aspectsToAngles: deriveAspectsToAngles(reading),
            glossary: deriveGlossary(reading),
            learnMore: LEARN_MORE_LINKS,
            natalAnglesDeg: reading?.natalAngles || null,
            relocatedAnglesDeg: getAngleLons(reading),
            natalCuspsDeg: deriveNatalCusps(reading),
            relocatedCuspsDeg: Array.isArray(reading?.relocatedCusps) && reading.relocatedCusps.length === 12 ? reading.relocatedCusps : [],
            chartRuler: deriveChartRuler(reading),
        },
        worldPoints: deriveWorldPoints(reading),
        eclipses: deriveEclipses(reading),
        progressions: deriveProgressions(reading),
    };
}

/** A5: coerce the persisted progressedBands payload into V4ProgressionsView. */
function deriveProgressions(reading: any): V4ProgressionsView | null {
    const raw = reading?.progressedBands;
    if (!raw || typeof raw !== "object") return null;
    const progressedDateUtc = String(raw.progressedDateUtc ?? "");
    const yearsElapsed = Number(raw.yearsElapsed);
    const aggregate = Number(raw.aggregate);
    if (!progressedDateUtc || !Number.isFinite(yearsElapsed) || !Number.isFinite(aggregate)) return null;
    const PLANETS = new Set(["Sun", "Moon"] as const);
    const bands: V4ProgressedBand[] = [];
    if (Array.isArray(raw.bands)) {
        for (const e of raw.bands) {
            if (!e || typeof e !== "object") continue;
            const planet = String((e as any).planet ?? "");
            if (!PLANETS.has(planet as any)) continue;
            const longitude = Number((e as any).longitude);
            const sign = String((e as any).sign ?? "");
            const longitudeRange = String((e as any).longitudeRange ?? "");
            if (!Number.isFinite(longitude) || !sign || !longitudeRange) continue;
            bands.push({
                planet: planet as V4ProgressedBand["planet"],
                longitude, sign, longitudeRange,
                destinationInBand: Boolean((e as any).destinationInBand),
            });
        }
    }
    return { progressedDateUtc, yearsElapsed, aggregate, bands };
}

/** A4: coerce the persisted personalEclipses payload into V4EclipsesView. */
function deriveEclipses(reading: any): V4EclipsesView {
    const raw = reading?.personalEclipses;
    if (!raw || typeof raw !== "object") return { aggregate: 0, hits: [] };
    const aggregate = Number(raw.aggregate);
    const safeAggregate = Number.isFinite(aggregate) ? aggregate : 0;
    if (!Array.isArray(raw.hits)) return { aggregate: safeAggregate, hits: [] };
    const ANGLES = new Set(["geoMC", "geoIC", "geoASC", "geoDSC"] as const);
    const KINDS = new Set(["solar", "lunar"] as const);
    const DIRECTIONS = new Set(["luminary", "benefic", "malefic", "neutral"] as const);
    const hits: V4EclipseHit[] = [];
    for (const e of raw.hits) {
        if (!e || typeof e !== "object") continue;
        const kind = String((e as any).kind ?? "").toLowerCase();
        const angle = String((e as any).activatedAngle ?? "");
        const direction = String((e as any).direction ?? "").toLowerCase();
        if (!KINDS.has(kind as any) || !ANGLES.has(angle as any) || !DIRECTIONS.has(direction as any)) continue;
        const dateUtc = String((e as any).dateUtc ?? "");
        const sign = String((e as any).sign ?? "");
        const natalContact = String((e as any).natalContact ?? "");
        const degree = Number((e as any).degree);
        const daysFromTarget = Number((e as any).daysFromTarget);
        const angleOrb = Number((e as any).angleOrb);
        const natalOrb = Number((e as any).natalOrb);
        const severity = Number((e as any).severity);
        if (!dateUtc || !natalContact || ![degree, daysFromTarget, angleOrb, natalOrb, severity].every(Number.isFinite)) continue;
        hits.push({
            kind: kind as V4EclipseHit["kind"],
            dateUtc, degree, sign, daysFromTarget,
            activatedAngle: angle as V4EclipseHit["activatedAngle"],
            angleOrb, natalContact, natalOrb,
            direction: direction as V4EclipseHit["direction"],
            severity,
        });
    }
    return { aggregate: safeAggregate, hits };
}

/** A3: coerce the persisted chartRuler payload into V4ChartRuler. */
function deriveChartRuler(reading: any): V4ChartRuler | null {
    const raw = reading?.chartRuler;
    if (!raw || typeof raw !== "object") return null;
    const relocatedAscSign = String(raw.relocatedAscSign ?? "");
    const ruler = String(raw.ruler ?? "");
    if (!relocatedAscSign || !ruler) return null;
    const rulerNatalHouse = Number(raw.rulerNatalHouse);
    const rulerRelocatedHouse = Number(raw.rulerRelocatedHouse);
    const rulerRelocatedHouseSign = typeof raw.rulerRelocatedHouseSign === "string"
        ? raw.rulerRelocatedHouseSign : undefined;
    return {
        relocatedAscSign,
        ruler,
        rulerAngular: Boolean(raw.rulerAngular),
        ...(Number.isFinite(rulerNatalHouse) ? { rulerNatalHouse } : {}),
        ...(Number.isFinite(rulerRelocatedHouse) ? { rulerRelocatedHouse } : {}),
        ...(rulerRelocatedHouseSign ? { rulerRelocatedHouseSign } : {}),
    };
}

/** A2: coerce the persisted natalWorldPoints payload into V4WorldPointsView.
 *  Always returns an object — empty `hits` when nothing's in orb. */
function deriveWorldPoints(reading: any): V4WorldPointsView {
    const raw = reading?.natalWorldPoints;
    if (!raw || typeof raw !== "object") return { aggregate: 0, hits: [] };
    const aggregate = Number(raw.aggregate);
    const safeAggregate = Number.isFinite(aggregate) ? aggregate : 0;
    if (!Array.isArray(raw.hits)) return { aggregate: safeAggregate, hits: [] };
    const DIRECTIONS = new Set(["luminary", "benefic", "malefic", "neutral"] as const);
    const hits: V4WorldPointHit[] = [];
    for (const e of raw.hits) {
        if (!e || typeof e !== "object") continue;
        const direction = String((e as any).direction ?? "").toLowerCase();
        if (!DIRECTIONS.has(direction as any)) continue;
        const planet = String((e as any).planet ?? "");
        const point = String((e as any).point ?? "");
        const pointLon = Number((e as any).pointLon);
        const orb = Number((e as any).orb);
        const severity = Number((e as any).severity);
        if (!planet || !point || ![pointLon, orb, severity].every(Number.isFinite)) continue;
        hits.push({
            planet, point, pointLon, orb, severity,
            direction: direction as V4WorldPointHit["direction"],
        });
    }
    return { aggregate: safeAggregate, hits };
}

function heroBaselineContext(windowScore: number, baseline: number, travelType: V4TravelType): string {
    if (travelType === "relocation") return "";
    if (!baseline) return "";
    const delta = windowScore - baseline;
    const bothLow = windowScore < 55 && baseline < 55;
    if (bothLow) {
        if (delta >= 3) return `Your average here is also low (${baseline}/100) — this place runs cool for your chart even on its better days.`;
        if (delta <= -3) return `Your average here is ${baseline}/100 and this window scores below it — this place isn't a strong fit and these dates make it harder.`;
        return `Your average here is also low (${baseline}/100) — this place isn't a strong fit for you.`;
    }
    if (Math.abs(delta) < 2) return `Right at your average for this place (${baseline}/100).`;
    if (delta > 0) return `${delta} ${delta === 1 ? "point" : "points"} above your average for this place (${baseline}/100).`;
    return `${Math.abs(delta)} ${Math.abs(delta) === 1 ? "point" : "points"} below your average for this place (${baseline}/100).`;
}

function heroVerdict(score: number): { band: "tough" | "mixed" | "solid" | "peak"; label: string } {
    if (score < 50) return { band: "tough", label: "Tough match" };
    if (score < 65) return { band: "mixed", label: "Mixed" };
    if (score < 80) return { band: "solid", label: "Solid window" };
    return { band: "peak", label: "Peak alignment" };
}

function heroBetterAlternate(windows: V4TravelWindow[]):
    { dates: string; score: number; delta: number } | null {
    if (windows.length < 2) return null;
    const userScore = windows[0]?.score ?? 0;
    let best: { dates: string; score: number; delta: number } | null = null;
    for (let i = 1; i < windows.length; i++) {
        const w = windows[i];
        const delta = w.score - userScore;
        if (delta >= 3 && (!best || delta > best.delta)) {
            best = { dates: w.dates, score: w.score, delta };
        }
    }
    return best;
}

function heroMaximizeAdvice(
    band: "tough" | "mixed" | "solid" | "peak",
    travelType: V4TravelType,
    topVibeTitle: string | undefined,
    hasBetterAlternate: boolean,
): string | null {
    if (band === "peak" || band === "solid") return null;
    if (hasBetterAlternate) return null; // the alternate callout is the action
    if (travelType === "relocation") {
        if (band === "tough") return "If the move is locked in, treat the first month as fieldwork — the chart settles in over time, not all at once.";
        return "Mixed reads cool down with time. Use the first month to learn the place before any big moves.";
    }
    const goalText = topVibeTitle ? topVibeTitle.replace(/\.$/, "").toLowerCase() : "the parts of the city that match your chart";
    if (band === "tough") return `If the dates are locked, lean into ${goalText} — see "What to do" below for specifics.`;
    return `Some days will fit better than others. Check "Month by month" below to spot the friction days.`;
}

function heroExplainer(
    w: V4TravelWindow | undefined,
    city: string,
    travelType: V4TravelType,
    band: "tough" | "mixed" | "solid" | "peak",
): string {
    if (!w) return "Your reading is being prepared.";
    if (travelType === "relocation") {
        if (band === "tough") return `Your relocated chart kicks in the day you arrive in ${city}. Right now, it's a tough match for your chart — read on for what to lean into.`;
        if (band === "mixed") return `Your relocated chart kicks in the day you arrive in ${city}. It's a mixed match — some areas of life fit, some don't.`;
        return `Your relocated chart kicks in the day you arrive in ${city}. The score below is for the place itself — how well its rotated angles fit your chart, not a window inside it.`;
    }
    if (band === "tough") return `That's the ${w.nights} window you picked. Right now, your chart and ${city} aren't lined up well. The dates section below shows whether shifting helps; if not, "What to do" has what to lean into.`;
    if (band === "mixed") return `That's the ${w.nights} window you picked. It's a mixed match — some days will fit better than others. The dates below show how nearby weeks compare.`;
    return `That's the ${w.nights} window you picked. Below is how well it scores against your chart in ${city}. Keep scrolling to see how nearby weeks compare in case your calendar is flexible.`;
}

const RELOCATION_TODO_BY_GOAL: Record<string, { title: string; body: string }> = {
    love: {
        title: "Plan a slow first month before introducing the relationship.",
        body: "Don't import the relationship dynamics from your old place; let them recalibrate to the new chart first.",
    },
    career: {
        title: "Hold off on big career moves for the first 30 days.",
        body: "Your relocated MC needs a beat to settle. Use the first month to listen, not pitch.",
    },
    community: {
        title: "Say yes to one introduction a week.",
        body: "Friendship signals here arrive through repeated low-stakes encounters, not big events.",
    },
    growth: {
        title: "Set a small daily practice on day one.",
        body: "The growth themes in this place compound. Skip the retreat; build the habit.",
    },
    relocation: {
        title: "Treat the first month as fieldwork.",
        body: "Walk the neighborhoods you'd consider settling in. The chart speaks through specific streets, not maps.",
    },
    timing: {
        title: "Mark the next two transit windows on your calendar.",
        body: "Big decisions land better inside them. Step 4 shows where they are.",
    },
};

const TRIP_TODO_BY_GOAL: Record<string, { title: string; body: string }> = {
    love: {
        title: "Save one evening for an unplanned conversation.",
        body: "Romantic / closeness signals here favor encounters you didn't schedule.",
    },
    career: {
        title: "Pack one work artifact you can show.",
        body: "Career signals tend to land mid-trip — be ready to share, not just absorb.",
    },
    community: {
        title: "Take a class or workshop, even a one-off.",
        body: "The friendship signal here works through small group settings, not solo wandering.",
    },
    growth: {
        title: "Plan a few solo mornings.",
        body: "The quieter signals in your chart need room. Don't fill every hour.",
    },
    relocation: {
        title: "Visit at least two neighborhoods you'd actually live in.",
        body: "If you're scouting, treat this trip as research, not a holiday.",
    },
    timing: {
        title: "Anchor the trip on the dates above.",
        body: "The window is the whole point — moving by even a few days dilutes the signal.",
    },
};

function deriveTodo(
    hero: V4TravelWindow | undefined,
    city: string,
    reading: any,
    travelType: V4TravelType,
    goalIds: string[],
): Array<{ title: string; body: string }> {
    // If the prompt produced V4-shaped todos, prefer them.
    const promptTodos = reading?.teacherReading?.todos;
    if (Array.isArray(promptTodos) && promptTodos.length >= 3) {
        return promptTodos.slice(0, 4).map((t: any) => ({
            title: t.title ?? "",
            body: t.body ?? "",
        }));
    }

    const teacherTodo: string[] = reading?.teacherReading?.summary?.leanInto || [];
    const baseDates = hero?.dates || "your best window";
    const dict = travelType === "relocation" ? RELOCATION_TODO_BY_GOAL : TRIP_TODO_BY_GOAL;

    const headlineTodo = travelType === "relocation"
        ? { title: `Lock the move date.`, body: `Your relocated chart starts the day you arrive in ${city}. Plan the logistics around that, not the other way around.` }
        : { title: `Check your calendar for ${baseDates}.`, body: `That's your best window. ${hero?.nights ?? "Around a week"} is the sweet spot — long enough to settle, short enough to stay open.` };

    const goalTodos = goalIds.slice(0, 3)
        .map(g => dict[g])
        .filter((x): x is { title: string; body: string } => !!x);

    const fallback = [
        { title: "If those dates don't work, look at the other two windows.", body: "Both secondary windows are real — just flavored differently." },
        { title: "Book somewhere that matches the reading.", body: teacherTodo[0] || `Lean into the parts of ${city} that match the dominant vibe above.` },
        { title: "Plan a few solo mornings.", body: teacherTodo[1] || "The quieter signals in your chart need room. Don't fill every hour." },
    ];

    const items = [headlineTodo, ...goalTodos, ...fallback];
    return items.slice(0, 4);
}

function deriveBirth(reading: any): { place: string; coords: string; date: string } {
    // Prefer the persisted `birth` field (post-Fix 3 readings). Fall back to
    // legacy shapes for cached readings.
    const b = reading?.birth || reading?.profile || {};
    const city = b.city || b.birth_city || reading?.birthCity || "—";
    const lat  = typeof b.lat === "number" ? b.lat : b.birth_lat;
    const lon  = typeof b.lon === "number" ? b.lon : b.birth_lon;
    const rawDate = b.date || b.birth_date || reading?.birthDate;
    const rawTime = b.time || b.birth_time || reading?.birthTime;
    // Compose "Mar 14, 1991 · 6:42 AM" when both fields are present, else
    // fall back to whatever we have. "—" only when we have nothing.
    const date = (() => {
        if (!rawDate) return "—";
        try {
            const d = new Date(`${rawDate}T${rawTime || "12:00"}`);
            if (isNaN(d.getTime())) return rawTime ? `${rawDate} · ${rawTime}` : rawDate;
            const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            return rawTime ? `${dateStr} · ${rawTime}` : dateStr;
        } catch {
            return rawTime ? `${rawDate} · ${rawTime}` : rawDate;
        }
    })();
    return {
        place: city,
        coords: typeof lat === "number" && typeof lon === "number" ? fmtCoords(lat, lon) : "—",
        date,
    };
}

function fmtCoords(lat: number | undefined | null, lon: number | undefined | null): string {
    if (typeof lat !== "number" || typeof lon !== "number") return "—";
    const ns = lat >= 0 ? "N" : "S";
    const ew = lon >= 0 ? "E" : "W";
    return `${Math.abs(lat).toFixed(2)}°${ns} ${Math.abs(lon).toFixed(2)}°${ew}`;
}
