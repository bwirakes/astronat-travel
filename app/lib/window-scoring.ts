/**
 * window-scoring.ts — score date windows for the V4 reading view.
 *
 * The model is consultative, not prescriptive: the user picked a date in
 * /reading/new, so the hero scores **that** date. Step 2 scores nearby
 * alternates (T−14, T+14, T+28) so the user can decide whether to shift.
 * Both anchor on the user's travelDate; neither tries to "find a better
 * answer for them."
 *
 * The score for a date is:
 *   baseline (macroScore for the destination)
 *   + transit boost  (sum of benefic transit strengths active on that date,
 *                     weighted by whether the transit hits a goal-relevant
 *                     natal target — see GOAL_NATAL_TARGETS)
 *   - transit drag   (sum of malefic transit strengths, same weighting)
 *
 * Only the transit term varies day to day — the relocated chart angles + ACG
 * lines are fixed for the destination. So two dates close together at the
 * same destination only differ by which transits land in their ±5 day
 * window AND which of those touch the user's goals.
 */
import type { TransitHit } from "@/lib/astro/transit-solver";
import {
    STATIONS,
    ECLIPSES,
    type StationEvent,
} from "./geodetic/geodetic-events";
import type { UniversalSkyState } from "./universal-sky";
import { essentialDignityLabel } from "./dignity";
import {
    computePlaceAffinityLayers,
    scoreAtAnchor,
    type OccupancyPlanet,
    type PlaceAffinityLayers,
} from "./scoring-engine";
import type { HouseMatrixResult } from "./house-matrix";

/** Single input bundle threaded through every window/day/month scoring helper.
 *  All call sites compose this once per reading and pass it into all helpers
 *  so every surface scores through the same fused engine. */
export interface FusedWindowInputs {
    matrixResult: HouseMatrixResult;
    relocatedPlanets: OccupancyPlanet[];
    transits: TransitHit[];
    goalIds: string[];
    selectedGoalIndices?: number[] | null;
    natalPlanetHouse: Map<string, number>;
    skyState?: UniversalSkyState | null;
}

/** Internal: dedupe transits by (transit_planet × natal_planet × aspect),
 *  keeping the tightest-orb sample. Used by monthly aggregations so weekly
 *  samples of the same slow transit don't multi-count. */
function dedupTightestByCombo(transits: TransitHit[]): TransitHit[] {
    const tightestByCombo = new Map<string, TransitHit>();
    for (const t of transits) {
        const key = `${t.transit_planet}|${t.natal_planet}|${t.aspect}`;
        const existing = tightestByCombo.get(key);
        if (!existing || (t.orb ?? 99) < (existing.orb ?? 99)) {
            tightestByCombo.set(key, t);
        }
    }
    return [...tightestByCombo.values()];
}

/** Internal: derive the contributions list once. */
function stationContribs(inputs: FusedWindowInputs) {
    return inputs.matrixResult.stationsResult?.contributions ?? null;
}

const HALF_WIDTH_DAYS = 5;          // window is centred ± this many days

// /reading/new goal IDs → natal planets that act as the "target" for that
// goal's transits. A user picking `love` cares more about transits hitting
// natal Venus + Moon than transits hitting Saturn or Pluto. We use planet
// names (lowercase) to match TransitHit.natal_planet.
export const GOAL_NATAL_TARGETS: Record<string, string[]> = {
    identity:   ["sun", "mars", "asc", "jupiter"],
    wealth:     ["venus", "jupiter", "saturn"],
    home:       ["moon", "ic"],
    romance:    ["venus", "moon", "mars"],
    health:     ["moon", "mercury", "mars", "saturn"],
    partnerships: ["venus", "moon", "dsc"],
    friendship: ["mercury", "jupiter"],
    spirituality: ["jupiter", "neptune", "moon"],
    love:       ["venus", "moon"],
    career:     ["sun", "mars", "saturn", "mc"],
    community:  ["mercury", "jupiter"],
    growth:     ["jupiter", "neptune"],
    relocation: ["moon", "ic"],
    timing:     [],   // no goal-specific weighting; raw transit signal
};

export interface ScoredWindow {
    label: string;                  // "Your dates" | "−2 weeks" | "+2 weeks" | "+1 month"
    centerISO: string;              // anchor day
    startISO: string;               // centerISO − HALF_WIDTH_DAYS
    endISO: string;                 // centerISO + HALF_WIDTH_DAYS
    score: number;                  // 0–100, real
    drivers: string[];              // top transits explaining the score
}

/** Build the hero window + alternates anchored on travelDate. Every offset
 *  scores through the fused engine — same path as the macro/hero — so the
 *  sidebar windows can never disagree with the headline. */
export function buildScoredWindows(
    travelDateISO: string | null,
    inputs: FusedWindowInputs,
): ScoredWindow[] {
    if (!travelDateISO) return [];
    const center = new Date(travelDateISO);
    if (isNaN(center.getTime())) return [];

    const offsets: Array<{ days: number; label: string }> = [
        { days:   0, label: "Your dates" },
        { days: -14, label: "Two weeks earlier" },
        { days:  14, label: "Two weeks later" },
        { days:  28, label: "A month later" },
    ];

    // Place affinity layers don't depend on the date — compute once.
    const layers = computePlaceAffinityLayers(inputs.matrixResult, inputs.relocatedPlanets);
    const stations = stationContribs(inputs);

    return offsets.map(({ days, label }) => {
        const c = new Date(center.getTime() + days * 86_400_000);
        const start = new Date(c.getTime() - HALF_WIDTH_DAYS * 86_400_000);
        const end = new Date(c.getTime() + HALF_WIDTH_DAYS * 86_400_000);
        const { score, drivers } = scoreAtAnchor({
            layers,
            transits: inputs.transits,
            centerISO: c.toISOString(),
            goalIds: inputs.goalIds,
            selectedGoalIndices: inputs.selectedGoalIndices ?? null,
            natalPlanetHouse: inputs.natalPlanetHouse,
            halfWidthDays: HALF_WIDTH_DAYS,
            skyState: inputs.skyState ?? null,
            stationContributions: stations,
        });
        return {
            label,
            centerISO: c.toISOString(),
            startISO: start.toISOString(),
            endISO: end.toISOString(),
            score,
            drivers,
        };
    });
}

/** Build a per-day score series across [travelDate − before, travelDate + after].
 *  Used by Step 2's DayDots strip to visualise where the strong/weak days are
 *  around the user's chosen window. */
export interface DailyScore {
    iso: string;       // YYYY-MM-DD
    score: number;     // 0–100
    isAnchor: boolean; // true on travelDate itself
}

export function buildDailySeries(
    travelDateISO: string | null,
    inputs: FusedWindowInputs,
    daysBefore = 21,
    daysAfter = 79,
): DailyScore[] {
    if (!travelDateISO) return [];
    const anchor = new Date(travelDateISO);
    if (isNaN(anchor.getTime())) return [];
    const anchorDay = anchor.toISOString().slice(0, 10);

    // Layers + stations are date-independent; compute once and reuse for every
    // day. Only computeTransitModifiersAtAnchor + finalize + headline run per
    // day. Daily halfWidth = 2 to keep the day-to-day signal tight.
    const layers = computePlaceAffinityLayers(inputs.matrixResult, inputs.relocatedPlanets);
    const stations = stationContribs(inputs);

    const out: DailyScore[] = [];
    for (let d = -daysBefore; d <= daysAfter; d++) {
        const day = new Date(anchor.getTime() + d * 86_400_000);
        const iso = day.toISOString().slice(0, 10);
        const { score } = scoreAtAnchor({
            layers,
            transits: inputs.transits,
            centerISO: day.toISOString(),
            goalIds: inputs.goalIds,
            selectedGoalIndices: inputs.selectedGoalIndices ?? null,
            natalPlanetHouse: inputs.natalPlanetHouse,
            halfWidthDays: 2,
            skyState: inputs.skyState ?? null,
            stationContributions: stations,
        });
        out.push({ iso, score, isAnchor: iso === anchorDay });
    }
    return out;
}

// ─── Range highlights ─────────────────────────────────────────────────────────

export interface RangeWindow {
    label: string;          // "① Jun 12–17" etc. — caller assigns ordinals
    startISO: string;
    endISO: string;
    centerISO: string;
    score: number;
    topHits: TransitHit[];  // up to 2, sorted by |weight| desc — for transitFeeling()
}

export interface RangeHighlights {
    good: RangeWindow[];    // up to 2
    bad:  RangeWindow[];    // up to 2
}

/**
 * Scans the 90-day daily series and returns the 2 best + 2 worst non-overlapping
 * 5-day windows. Minimum separation between windows: 10 days.
 */
export function buildRangeHighlights(
    travelDateISO: string | null,
    inputs: FusedWindowInputs,
    windowDays = 90,
    spanDays = 5,
    minGapDays = 10,
): RangeHighlights {
    if (!travelDateISO) return { good: [], bad: [] };
    const anchor = new Date(travelDateISO);
    if (isNaN(anchor.getTime())) return { good: [], bad: [] };

    const MS_DAY = 86_400_000;
    const halfSpan = Math.floor(spanDays / 2);

    // Layers + stations + goal target set are date-independent; compute once.
    const layers = computePlaceAffinityLayers(inputs.matrixResult, inputs.relocatedPlanets);
    const stations = stationContribs(inputs);
    const goalTargets = new Set(inputs.goalIds.flatMap(g => GOAL_NATAL_TARGETS[g] ?? []));

    // Build a candidate window for every center-day in [D0, D{windowDays}]
    const candidates: Array<{ centerDay: number; centerISO: string; startISO: string; endISO: string; score: number; topHits: TransitHit[] }> = [];

    for (let d = 0; d <= windowDays; d++) {
        const center = new Date(anchor.getTime() + d * MS_DAY);
        const start  = new Date(center.getTime() - halfSpan * MS_DAY);
        const end    = new Date(center.getTime() + halfSpan * MS_DAY);
        const cISO   = center.toISOString();
        const { score } = scoreAtAnchor({
            layers,
            transits: inputs.transits,
            centerISO: cISO,
            goalIds: inputs.goalIds,
            selectedGoalIndices: inputs.selectedGoalIndices ?? null,
            natalPlanetHouse: inputs.natalPlanetHouse,
            halfWidthDays: HALF_WIDTH_DAYS,
            skyState: inputs.skyState ?? null,
            stationContributions: stations,
        });

        // Collect the TransitHit objects whose date falls in [start, end] for
        // the topHits surface (used by WindowsList to render driver pills).
        const hitMap = new Map<string, { hit: TransitHit; weight: number }>();
        const startT = start.getTime();
        const endT   = end.getTime();
        for (const t of inputs.transits) {
            const tT = new Date(t.date).getTime();
            if (!isFinite(tT) || tT < startT || tT > endT) continue;
            const key = `${t.transit_planet}|${t.natal_planet}|${t.aspect}`;
            if (!hitMap.has(key)) {
                const natalKey = (t.natal_planet ?? "").toLowerCase();
                const goalHit = goalTargets.has(natalKey);
                const tightness = Math.max(0.2, 1 - (t.orb ?? 3) / 3) * (goalHit ? 1.6 : 1);
                hitMap.set(key, { hit: t, weight: tightness * (t.benefic ? 1 : -1) });
            }
        }
        const topHits = [...hitMap.values()]
            .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
            .slice(0, 2)
            .map(v => v.hit);

        candidates.push({ centerDay: d, centerISO: cISO, startISO: start.toISOString(), endISO: end.toISOString(), score, topHits });
    }

    // Pick top-2 non-overlapping peaks, then bottom-2 non-overlapping valleys.
    function pickNonOverlapping(sorted: typeof candidates, n: number): typeof candidates {
        const picked: typeof candidates = [];
        for (const c of sorted) {
            if (picked.every(p => Math.abs(p.centerDay - c.centerDay) >= minGapDays)) {
                picked.push(c);
                if (picked.length === n) break;
            }
        }
        return picked;
    }

    const byScoreDesc = [...candidates].sort((a, b) => b.score - a.score);
    const byScoreAsc  = [...candidates].sort((a, b) => a.score - b.score);

    const goodPicked = pickNonOverlapping(byScoreDesc, 2);
    const badPicked  = pickNonOverlapping(byScoreAsc, 2);

    function fmt(iso: string) {
        return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    function toRange(c: typeof candidates[number], ordinal: string): RangeWindow {
        return {
            label: `${ordinal} ${fmt(c.startISO)}–${fmt(c.endISO)}`,
            startISO: c.startISO,
            endISO: c.endISO,
            centerISO: c.centerISO,
            score: c.score,
            topHits: c.topHits,
        };
    }

    const ORDINALS = ["1.", "2.", "3.", "4."];
    return {
        good: goodPicked.map((c, i) => toRange(c, ORDINALS[i])),
        bad:  badPicked.map((c, i)  => toRange(c, ORDINALS[i])),
    };
}

/** Percentile: what fraction of days in the 90-day window score below the user's window. */
export function fieldPercentile(dailySeries: DailyScore[], userScore: number): number {
    if (!dailySeries.length) return 50;
    const below = dailySeries.filter(d => d.score < userScore).length;
    return Math.round((below / dailySeries.length) * 100);
}

// ─── Transit spans ────────────────────────────────────────────────────────────

export interface TransitSpan {
    transit_planet: string;
    natal_planet: string;
    aspect: string;
    /** ISO date of first in-orb sample (approximated by padding 3 days before first hit). */
    entryISO: string;
    /** ISO date of minimum-orb sample = exact. */
    exactISO: string;
    /** ISO date of last in-orb sample (approximated by padding 3 days after last hit). */
    exitISO: string;
    /** Days from travelDate to entry (may be negative if transit started before D0). */
    entryDay: number;
    exactDay: number;
    exitDay: number;
    peak_orb: number;
    benefic: boolean;
    /** True if any sample inside this span was retrograde — re-activation, not fresh wave. */
    retrograde: boolean;
}

/**
 * Derives transit spans from the existing weekly-sample TransitHit[] array.
 *
 * Groups consecutive hits (gap ≤ 14 days = 2 sample intervals) for the same
 * planet×aspect×natal combination into a single span.  Entry/exit are
 * approximated by padding ±3 days around the first/last weekly sample —
 * accurate to ±4 days for inner planets, effectively exact for outers.
 *
 * Requires no additional SwissEph calls — runs fully in-memory on the
 * TransitHit[] already stored in reading.transitWindows.
 *
 * Returns spans sorted by exactDay ascending, capped at 12 rows.
 */
/** Planet importance weights for the 90-day Gantt.
 *  Outer/social planets carry the meaningful signal at this scale.
 *  The Moon is dropped (transits last hours, not days — pure visual noise here). */
const PLANET_WEIGHT: Record<string, number> = {
    Pluto: 5, Neptune: 5, Uranus: 5, Saturn: 5, Jupiter: 4,
    Mars: 3, Sun: 2, Mercury: 1.5, Venus: 1.5,
    Moon: 0,
};

function planetWeight(name: string): number {
    const key = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    return PLANET_WEIGHT[key] ?? 1;
}

export function solveTransitSpans(
    travelDateISO: string,
    transits: TransitHit[],
    windowDays = 90,
    maxRows = 8,
    goalIds: string[] = [],
): TransitSpan[] {
    const anchorTime = new Date(travelDateISO).getTime();
    if (!isFinite(anchorTime)) return [];
    const MS_DAY = 86_400_000;
    const windowEnd = anchorTime + windowDays * MS_DAY;
    const goalTargets = new Set(goalIds.flatMap(g => GOAL_NATAL_TARGETS[g] ?? []));

    // Group hits by transit identity key.
    const groups = new Map<string, TransitHit[]>();
    for (const t of transits) {
        const tTime = new Date(t.date).getTime();
        if (!isFinite(tTime)) continue;
        // Skip Moon and any unweighted planet — they're noise at 90-day scale.
        if (planetWeight(t.transit_planet) <= 0) continue;
        // Include hits that start up to 14 days before travelDate (already in orb on arrival).
        if (tTime < anchorTime - 14 * MS_DAY || tTime > windowEnd) continue;
        const key = `${t.transit_planet}|${t.natal_planet}|${t.aspect}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(t);
    }

    const spans: TransitSpan[] = [];

    for (const [key, hits] of groups) {
        const sorted = hits.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        // Split into runs: a new run starts when gap > 14 days.
        const runs: TransitHit[][] = [];
        let currentRun: TransitHit[] = [sorted[0]];
        for (let i = 1; i < sorted.length; i++) {
            const gap = new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime();
            if (gap > 14 * MS_DAY) {
                runs.push(currentRun);
                currentRun = [];
            }
            currentRun.push(sorted[i]);
        }
        runs.push(currentRun);

        const [planet, natal, aspect] = key.split("|");

        for (const run of runs) {
            const exactHit = run.reduce((best, h) => (h.orb ?? 99) < (best.orb ?? 99) ? h : best, run[0]);
            const firstTime = new Date(run[0].date).getTime();
            const lastTime  = new Date(run[run.length - 1].date).getTime();

            const entryTime = firstTime - 3 * MS_DAY;
            const exitTime  = lastTime  + 3 * MS_DAY;

            const entryDay = Math.round((entryTime - anchorTime) / MS_DAY);
            const exactDay = Math.round((new Date(exactHit.date).getTime() - anchorTime) / MS_DAY);
            const exitDay  = Math.min(windowDays, Math.round((exitTime - anchorTime) / MS_DAY));

            // Skip spans entirely outside the display window.
            // Keep spans whose exit is within 7 days before anchor — they are still active or just-passed.
            if (exitDay < -7 || entryDay > windowDays) continue;

            spans.push({
                transit_planet: planet,
                natal_planet:   natal,
                aspect,
                entryISO: new Date(entryTime).toISOString().slice(0, 10),
                exactISO: exactHit.date,
                exitISO:  new Date(exitTime).toISOString().slice(0, 10),
                entryDay,
                exactDay,
                exitDay,
                peak_orb: exactHit.orb ?? 0,
                benefic:  exactHit.benefic,
                retrograde: run.some(h => h.retrograde),
            });
        }
    }

    // Score each span by importance, then keep the top N, then re-sort chronologically
    // by exactDay so the rendered Gantt reads left-to-right in time.
    const scoreSpan = (s: TransitSpan): number => {
        const w = planetWeight(s.transit_planet);
        const tightness = Math.max(0.2, 1 - s.peak_orb / 3); // 0.2..1
        const natalKey = s.natal_planet.toLowerCase();
        const goalBoost = goalTargets.has(natalKey) ? 1.5 : 1;
        const spanDays = Math.max(1, s.exitDay - s.entryDay);
        const widthFactor = 0.5 + Math.min(1, spanDays / 30); // 0.5..1.5
        return w * tightness * goalBoost * widthFactor;
    };

    const top = spans
        .map(s => ({ s, score: scoreSpan(s) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, maxRows)
        .map(x => x.s)
        .sort((a, b) => a.exactDay - b.exactDay);

    return top;
}

// ─── Monthly grain (relocation timing) ────────────────────────────────────────
//
// Trip readings score days and weeks because the user is choosing when within
// ±30 days of an anchor to leave for 7 nights. Relocation readings answer two
// different questions on the same hit data:
//
//   1. "When should I move?"      → buildArrivalScores ranks candidate arrival
//                                    months by their forward-weighted 90-day
//                                    settling arc, because the first weeks at
//                                    a new place dominate whether the move
//                                    feels like it worked.
//   2. "What's the year ahead?"   → buildMonthlySeries scores each calendar
//                                    month in isolation; buildMonthlyHighlights
//                                    surfaces the strongest 2 + hardest 1.
//
// Both reuse the same scoring math as scoreDate (TRANSIT_SCALE, MAX_DELTA,
// GOAL_BOOST), but aggregate over a calendar month instead of a ±halfWidth
// daily sample. Hits within a month are deduped by combo (transit_planet ×
// natal_planet × aspect) keeping the tightest sample so the 4 weekly samples
// of e.g. Saturn-Sun-square don't count 4× toward the month's score.

/** Internal: score a calendar month through the fused engine. The engine
 *  filters transits to ±halfWidth around `centerISO`; for monthly grain the
 *  caller passes the mid-month date and a halfWidth wide enough to cover the
 *  whole month. Hits are deduped by combo (tightest-orb wins) before
 *  scoring so weekly samples of the same slow transit don't multi-count. */
function scoreMonthFused(
    layers: PlaceAffinityLayers,
    inputs: FusedWindowInputs,
    stations: ReturnType<typeof stationContribs>,
    rangeStartMs: number,
    rangeEndMs: number,
): { score: number; drivers: string[] } {
    // Filter to the calendar month, then dedupe.
    const inMonth: TransitHit[] = [];
    for (const t of inputs.transits) {
        const tTime = new Date(t.date).getTime();
        if (!isFinite(tTime) || tTime < rangeStartMs || tTime > rangeEndMs) continue;
        inMonth.push(t);
    }
    const deduped = dedupTightestByCombo(inMonth);
    if (deduped.length === 0) {
        // No hits in this month → score the place itself (layers + sky + station)
        // through the same finalize path.
        const { score } = scoreAtAnchor({
            layers,
            transits: [],
            centerISO: new Date((rangeStartMs + rangeEndMs) / 2).toISOString(),
            goalIds: inputs.goalIds,
            selectedGoalIndices: inputs.selectedGoalIndices ?? null,
            natalPlanetHouse: inputs.natalPlanetHouse,
            halfWidthDays: 31,
            skyState: inputs.skyState ?? null,
            stationContributions: stations,
        });
        return { score, drivers: [] };
    }

    // Anchor at mid-month; halfWidth wide enough to capture every day in the
    // month (31 days both sides is generous but cheap — the deduped/in-month
    // filter above already bounded the hit set).
    const centerMs = (rangeStartMs + rangeEndMs) / 2;
    const { score, drivers } = scoreAtAnchor({
        layers,
        transits: deduped,
        centerISO: new Date(centerMs).toISOString(),
        goalIds: inputs.goalIds,
        selectedGoalIndices: inputs.selectedGoalIndices ?? null,
        natalPlanetHouse: inputs.natalPlanetHouse,
        halfWidthDays: 31,
        skyState: inputs.skyState ?? null,
        stationContributions: stations,
    });
    return { score, drivers };
}

export interface MonthlyScore {
    /** First day of the calendar month, YYYY-MM-DD. */
    monthISO: string;
    /** "May 2026" — UTC-anchored so server/client agree on month names. */
    monthLabel: string;
    score: number;
    drivers: string[];
}

/** Build a per-calendar-month score series anchored on the month containing
 *  `anchorISO`. Calendar-aligned to the first of the month so labels are
 *  whole-month proper nouns ("September") rather than rolling 30-day spans. */
export function buildMonthlySeries(
    anchorISO: string | null,
    inputs: FusedWindowInputs,
    monthCount = 12,
): MonthlyScore[] {
    if (!anchorISO) return [];
    const anchor = new Date(anchorISO);
    if (isNaN(anchor.getTime())) return [];

    const startYear = anchor.getUTCFullYear();
    const startMonth = anchor.getUTCMonth();

    const layers = computePlaceAffinityLayers(inputs.matrixResult, inputs.relocatedPlanets);
    const stations = stationContribs(inputs);

    const out: MonthlyScore[] = [];
    for (let i = 0; i < monthCount; i++) {
        const monthStart = new Date(Date.UTC(startYear, startMonth + i, 1));
        const nextMonthStart = new Date(Date.UTC(startYear, startMonth + i + 1, 1));
        const rangeStartMs = monthStart.getTime();
        // Inclusive end-of-month: nextMonthStart - 1ms. A hit on the last day
        // (any hour, UTC) is included; a hit on the 1st of the next month is not.
        const rangeEndMs = nextMonthStart.getTime() - 1;

        const { score, drivers } = scoreMonthFused(
            layers, inputs, stations, rangeStartMs, rangeEndMs,
        );

        out.push({
            monthISO: monthStart.toISOString().slice(0, 10),
            monthLabel: monthStart.toLocaleDateString("en-US", {
                month: "long", year: "numeric", timeZone: "UTC",
            }),
            score,
            drivers,
        });
    }
    return out;
}

/** Spread (top - bottom score) below which we don't surface a "hardest" month —
 *  a year where every month scores 60-65 is "steady," not "Aug is rough." */
const MONTHLY_HIGHLIGHT_SPREAD_THRESHOLD = 5;

export interface MonthlyHighlights {
    /** Up to 2 months, score-desc. Empty when the input has fewer than 2 months. */
    strongest: MonthlyScore[];
    /** 1 month or empty. Only surfaces when spread ≥ threshold; otherwise the
     *  year is genuinely steady and naming a "hardest" month would mislead. */
    hardest: MonthlyScore[];
    /** Convenience: the spread between top and bottom across all months. */
    spread: number;
}

/** Pick the strongest 2 and the hardest 1 calendar months from a monthly series.
 *  Suppresses `hardest` when the year is too flat to justify naming one. */
export function buildMonthlyHighlights(series: MonthlyScore[]): MonthlyHighlights {
    if (series.length < 2) return { strongest: [], hardest: [], spread: 0 };

    const sortedDesc = [...series].sort((a, b) => b.score - a.score);
    const top = sortedDesc[0];
    const bottom = sortedDesc[sortedDesc.length - 1];
    const spread = top.score - bottom.score;

    const strongest = sortedDesc.slice(0, 2);
    const hardest = spread >= MONTHLY_HIGHLIGHT_SPREAD_THRESHOLD ? [bottom] : [];

    return { strongest, hardest, spread };
}

/** Front-weighted kernel for the 90-day settling arc.
 *  Month 0 (arrival) carries the heaviest weight because the first weeks
 *  dominate whether a relocation feels like it worked. M+1 and M+2 still
 *  matter — a strong arrival into a rough autumn is a different decision
 *  than a strong arrival into a strong autumn. */
const ARRIVAL_ARC_WEIGHTS = [0.5, 0.3, 0.2] as const;

/** Spread between M, M+1, M+2 below which we describe the arc as "steady"
 *  rather than front-/back-loaded. Same threshold as monthly highlights so
 *  copy stays internally consistent. */
const ARRIVAL_ARC_DESCRIPTOR_THRESHOLD = 5;

export interface ArrivalCandidate {
    /** First day of the candidate arrival month, YYYY-MM-DD. */
    monthISO: string;
    /** "October 2026" — UTC-anchored. */
    monthLabel: string;
    /** Forward-weighted score of months M, M+1, M+2 from this arrival. 0–100. */
    arcScore: number;
    /** Top drivers across the three months of the arc, deduped, weight-ordered. */
    drivers: string[];
    /** Label of the lowest-scoring of M / M+1 / M+2 if the spread within the arc
     *  is meaningful. Lets prose say "October opens cleanly but November is the
     *  test." Undefined when the arc is steady. */
    hardestSubmonth?: string;
    /** Shape of the score curve across M → M+2.
     *  - "front-loaded": strongest at arrival, softens later
     *  - "steady": flat within threshold
     *  - "back-loaded": weakest at arrival, builds */
    settlingArcDescriptor: "front-loaded" | "steady" | "back-loaded";
}

/** Score each of `candidateCount` calendar months as a possible arrival month
 *  for a relocation. Each candidate's score is a front-weighted average of its
 *  90-day settling arc — the months immediately following arrival are what the
 *  move actually feels like.
 *
 *  Returns candidates in chronological order (the consumer ranks/filters).
 *  Internally requests `candidateCount + 2` months from buildMonthlySeries so
 *  every candidate has a full M+2 lookahead. */
export function buildArrivalScores(
    anchorISO: string | null,
    inputs: FusedWindowInputs,
    candidateCount = 12,
): ArrivalCandidate[] {
    if (!anchorISO || candidateCount < 1) return [];

    const months = buildMonthlySeries(
        anchorISO, inputs, candidateCount + 2,
    );
    if (months.length < 3) return [];

    // Honesty cutoff: months past the last available transit hit get scored
    // at baseline by buildMonthlySeries (no hits in range → no delta from
    // baseline). Without filtering, every tail month would rank as a
    // legitimate "steady" arrival — but it's not steady, it's unknown.
    // Drop any candidate whose M+2 lookahead month extends past the data we
    // actually have. Result: a legacy reading with 9 months of forward hits
    // surfaces at most 7 candidates (M / M+1 / M+2 must all sit within the
    // 9-month coverage), not 12 phantom ones.
    const lastHitTime = inputs.transits.reduce((max, t) => {
        const tT = new Date(t.date).getTime();
        return isFinite(tT) && tT > max ? tT : max;
    }, -Infinity);
    const hasCoverage = (m2: MonthlyScore): boolean => {
        if (!isFinite(lastHitTime)) return false;
        // M+2 is fully covered iff its first day is at or before the last hit.
        // Boundary case: a hit on the 1st of M+2 itself counts as coverage.
        return new Date(m2.monthISO).getTime() <= lastHitTime;
    };

    const out: ArrivalCandidate[] = [];
    for (let i = 0; i < candidateCount; i++) {
        const m0 = months[i];
        const m1 = months[i + 1];
        const m2 = months[i + 2];

        if (!hasCoverage(m2)) break;


        const arcScore = Math.round(
            m0.score * ARRIVAL_ARC_WEIGHTS[0]
            + m1.score * ARRIVAL_ARC_WEIGHTS[1]
            + m2.score * ARRIVAL_ARC_WEIGHTS[2],
        );

        // Dedupe drivers across the three months. Each month's drivers are
        // already weight-ordered, so we preserve M0 ordering then append
        // anything new from M1, M2.
        const seen = new Set<string>();
        const drivers: string[] = [];
        for (const d of [...m0.drivers, ...m1.drivers, ...m2.drivers]) {
            if (seen.has(d)) continue;
            seen.add(d);
            drivers.push(d);
            if (drivers.length >= 4) break;
        }

        const trend = m2.score - m0.score;
        let descriptor: ArrivalCandidate["settlingArcDescriptor"];
        if (trend < -ARRIVAL_ARC_DESCRIPTOR_THRESHOLD) descriptor = "front-loaded";
        else if (trend > ARRIVAL_ARC_DESCRIPTOR_THRESHOLD) descriptor = "back-loaded";
        else descriptor = "steady";

        const subSorted = [m0, m1, m2].slice().sort((a, b) => a.score - b.score);
        const subSpread = subSorted[2].score - subSorted[0].score;
        const hardestSubmonth = subSpread >= ARRIVAL_ARC_DESCRIPTOR_THRESHOLD
            ? subSorted[0].monthLabel
            : undefined;

        out.push({
            monthISO: m0.monthISO,
            monthLabel: m0.monthLabel,
            arcScore,
            drivers,
            hardestSubmonth,
            settlingArcDescriptor: descriptor,
        });
    }

    return out;
}

/** Curated 4-window shortlist that pins VM and AI prompt to the SAME set of
 *  arrival months. Returns `[anchor, ...top-3-alternates-by-arcScore]`.
 *
 *  Why this exists: `buildArrivalScores` returns up to 12 candidates in
 *  chronological order. The V4 viewmodel renders the user's anchor month plus
 *  its 3 strongest alternates by arcScore. If the AI is given the full 12 and
 *  told "pick top 4 by arcScore," the AI sometimes picks a different set than
 *  the VM (the anchor's arcScore may rank below the top 4) and the UI lookup
 *  falls back to the deterministic driver string ("Pluto Sextile natal Pluto · …")
 *  for the missing entries. One source of truth fixes that — the AI writes
 *  notes for exactly the 4 the VM will render.
 *
 *  Anchor selection: the candidate whose `monthISO` matches the first-of-month
 *  derived from `travelDateISO`. Falls back to `candidates[0]` if no exact
 *  match (defensive — buildArrivalScores anchors at the same month so the
 *  match should always succeed in practice).
 *
 *  When `candidates.length < 4`, returns whatever's available; callers handle
 *  short arrays. When `travelDateISO` is null, returns the first 4 in input
 *  order (no anchor concept). */
export function pickArrivalWindowsToNarrate(
    candidates: ArrivalCandidate[],
    travelDateISO: string | null,
): ArrivalCandidate[] {
    if (!candidates.length) return [];
    if (!travelDateISO) return candidates.slice(0, 4);

    const ad = new Date(travelDateISO);
    if (isNaN(ad.getTime())) return candidates.slice(0, 4);
    const anchorMonthISO = new Date(Date.UTC(ad.getUTCFullYear(), ad.getUTCMonth(), 1))
        .toISOString().slice(0, 10);

    const anchor = candidates.find((c) => c.monthISO === anchorMonthISO) ?? candidates[0];
    const alternates = candidates
        .filter((c) => c.monthISO !== anchor.monthISO)
        .sort((a, b) => b.arcScore - a.arcScore)
        .slice(0, 3);

    return [anchor, ...alternates];
}

// ─── Universal Sky Spans ──────────────────────────────────────────────────────
//
// Sibling of `solveTransitSpans` that returns a Gantt-shaped representation of
// what's happening overhead for everyone — retrograde windows, eclipse
// activation windows, station-direct/retrograde markers, and (when a
// pre-computed UniversalSkyState is supplied) imminent sign ingresses.
//
// Read by TimingTab to render a "Universal sky over this window" section
// beneath the personal-transit Gantt, sharing the same date scale.
//
// Sources are the curated `STATIONS` and `ECLIPSES` tables in
// geodetic-events.ts. When the window falls outside the curated range
// (currently 2005–2027), affected categories are silently skipped — caller
// gets fewer/empty spans rather than an error.

export interface UniversalSkySpan {
    /** Stable identifier used to look up AI-authored or templated lay-copy
     *  for this span. Format: `<kind>-<planet>-<exactISO>`. Same span
     *  rendered across regenerations gets the same key, so caching and
     *  per-row prose stay aligned. */
    key: string;
    kind: "retrograde" | "ingress" | "sky-aspect" | "eclipse" | "node-aspect" | "station";
    /** Human-readable label for the row, e.g. "Mercury retrograde in Pisces". */
    label: string;
    /** Primary planet driving the span. Lowercase canonical name. */
    planet: string;
    /** For sky-aspect / node-aspect spans, the second planet (or "north node"). */
    secondaryPlanet?: string;
    sign?: string;
    /** Dignity tier of the planet during the span. Drives row prominence. */
    dignity?: string;
    /** Aspect type for sky-aspect / node-aspect spans. */
    aspectType?: string;
    entryISO: string;
    exactISO: string;
    exitISO: string;
    /** Days from travelDateISO to entry/exact/exit (negative if span starts before D0). */
    entryDay: number;
    exactDay: number;
    exitDay: number;
    /** Color signal for the Gantt — true = supportive, false = challenging/dampening. */
    benefic: boolean;
    /** 0–1 prominence weight; debilitated dignity → higher severity. */
    severity: number;
}

/** Map essentialDignityLabel output to our 5-tier display set. */
function rxDignityTier(planetCap: string, sign: string): string {
    const label = essentialDignityLabel(planetCap, sign);
    if (label === "Domicile")  return "domicile";
    if (label === "Exalted")   return "exalted";
    if (label === "Detriment") return "detriment";
    if (label === "Fall")      return "fall";
    return "neutral";
}

const RX_SEVERITY_BY_DIGNITY: Record<string, number> = {
    domicile: 0.25,
    exalted:  0.30,
    neutral:  0.55,
    detriment: 0.85,
    fall:     1.00,
};

const INNER_PLANETS_CAP = new Set(["Sun", "Moon", "Mercury", "Venus", "Mars"]);

function isoDay(time: number): string {
    return new Date(time).toISOString().slice(0, 10);
}

function dayOffset(time: number, anchorTime: number): number {
    return Math.round((time - anchorTime) / 86_400_000);
}

/**
 * Build universal-sky Gantt rows around the travel date.
 *
 * Pure synchronous function — pulls only from the curated event tables and
 * (optionally) a pre-computed UniversalSkyState for ingress markers.
 *
 * @param travelDateISO  Anchor date for entryDay/exactDay/exitDay offsets.
 * @param horizonDays    How far forward to search (typical: 90 for trip,
 *                       365 for relocation).
 * @param skyState       Optional snapshot from `computeUniversalSky(refDate)`;
 *                       when provided, imminent ingresses (within 30 days)
 *                       are added as zero-width markers.
 */
export function solveUniversalSkySpans(
    travelDateISO: string,
    horizonDays: number,
    skyState?: UniversalSkyState,
): UniversalSkySpan[] {
    const anchorTime = new Date(travelDateISO).getTime();
    if (!isFinite(anchorTime)) return [];
    const MS_DAY = 86_400_000;
    const horizonEnd = anchorTime + horizonDays * MS_DAY;
    // Look back enough to catch a retrograde period that's still in progress.
    const lookbackTime = anchorTime - 120 * MS_DAY;

    const spans: UniversalSkySpan[] = [];

    // Helper — capitalize a lowercase planet name for the label.
    const capPlanet = (p: string) => p ? p[0].toUpperCase() + p.slice(1) : p;
    const isInnerPlanet = (p: string) =>
        p === "sun" || p === "moon" || p === "mercury" || p === "venus" || p === "mars";

    // (1) Retrograde windows — read from skyState if available (preferred:
    //     comes from a daily ephemeris scan that catches inner-planet Rx).
    //     Fall back to the curated STATIONS table only when no skyState is
    //     supplied (legacy code paths) or the supplied skyState is from an
    //     older schema that lacks retrogradeWindows.
    const hasNewSchemaSky = !!skyState && Array.isArray(skyState.retrogradeWindows);
    if (hasNewSchemaSky && skyState) {
        for (const w of skyState.retrogradeWindows) {
            const startTime = new Date(w.entryISO).getTime();
            const endTime = new Date(w.exitISO).getTime();
            if (endTime < lookbackTime) continue;
            if (startTime > horizonEnd) continue;

            const midTime = (startTime + endTime) / 2;
            const severityBase = RX_SEVERITY_BY_DIGNITY[w.dignity] ?? 0.5;
            const severity = severityBase * (isInnerPlanet(w.planet) ? 1.0 : 0.6);

            spans.push({
                key: `retrograde-${w.planet}-${w.midISO}`,
                kind: "retrograde",
                label: `${capPlanet(w.planet)} retrograde in ${w.sign}`,
                planet: w.planet,
                sign: w.sign,
                dignity: w.dignity,
                entryISO: w.entryISO,
                exactISO: w.midISO,
                exitISO: w.exitISO,
                entryDay: dayOffset(startTime, anchorTime),
                exactDay: dayOffset(new Date(w.midISO).getTime(), anchorTime),
                exitDay: dayOffset(endTime, anchorTime),
                benefic: false,
                severity,
            });
        }

        // Station markers (zero-width pins) — derived from the same scan,
        // both Rx-station entries and direct-station exits, for every window.
        for (const w of skyState.retrogradeWindows) {
            const startTime = new Date(w.entryISO).getTime();
            const endTime = new Date(w.exitISO).getTime();
            const innerSeverity = isInnerPlanet(w.planet) ? 0.5 : 0.35;
            if (startTime >= anchorTime && startTime <= horizonEnd) {
                spans.push({
                    key: `station-rx-${w.planet}-${w.entryISO}`,
                    kind: "station",
                    label: `${capPlanet(w.planet)} stations retrograde in ${w.sign}`,
                    planet: w.planet,
                    sign: w.sign,
                    entryISO: w.entryISO,
                    exactISO: w.entryISO,
                    exitISO: w.entryISO,
                    entryDay: dayOffset(startTime, anchorTime),
                    exactDay: dayOffset(startTime, anchorTime),
                    exitDay: dayOffset(startTime, anchorTime),
                    benefic: false,
                    severity: innerSeverity,
                });
            }
            if (endTime >= anchorTime && endTime <= horizonEnd) {
                spans.push({
                    key: `station-direct-${w.planet}-${w.exitISO}`,
                    kind: "station",
                    label: `${capPlanet(w.planet)} stations direct in ${w.sign}`,
                    planet: w.planet,
                    sign: w.sign,
                    entryISO: w.exitISO,
                    exactISO: w.exitISO,
                    exitISO: w.exitISO,
                    entryDay: dayOffset(endTime, anchorTime),
                    exactDay: dayOffset(endTime, anchorTime),
                    exitDay: dayOffset(endTime, anchorTime),
                    benefic: true,
                    severity: innerSeverity,
                });
            }
        }
    } else {
        // Fallback path — curated STATIONS table. Used when the caller
        // doesn't pass a skyState OR the skyState predates the
        // retrogradeWindows field. Note: this table is intentionally
        // incomplete (only outer-planet stations + a handful of inners),
        // so Mercury/Venus/Mars Rx will be invisible here.
        const stationsByPlanet = new Map<string, StationEvent[]>();
        for (const s of STATIONS) {
            const arr = stationsByPlanet.get(s.planet);
            if (arr) arr.push(s);
            else stationsByPlanet.set(s.planet, [s]);
        }
        for (const arr of stationsByPlanet.values()) {
            arr.sort((a, b) => new Date(a.dateUtc).getTime() - new Date(b.dateUtc).getTime());
        }
        for (const [planetCap, stations] of stationsByPlanet) {
            for (let i = 0; i < stations.length; i++) {
                const start = stations[i];
                if (start.type !== "retrograde") continue;
                const startTime = new Date(start.dateUtc).getTime();
                let endTime: number | null = null;
                for (let j = i + 1; j < stations.length; j++) {
                    if (stations[j].type === "direct") {
                        endTime = new Date(stations[j].dateUtc).getTime();
                        break;
                    }
                }
                if (endTime == null) endTime = startTime + 80 * MS_DAY;
                if (endTime < lookbackTime) continue;
                if (startTime > horizonEnd) continue;

                const midTime = (startTime + endTime) / 2;
                const dignity = rxDignityTier(planetCap, start.sign);
                const severityBase = RX_SEVERITY_BY_DIGNITY[dignity] ?? 0.5;
                const severity = severityBase * (INNER_PLANETS_CAP.has(planetCap) ? 1.0 : 0.6);
                spans.push({
                    key: `retrograde-${planetCap.toLowerCase()}-${isoDay(midTime)}`,
                    kind: "retrograde",
                    label: `${planetCap} retrograde in ${start.sign}`,
                    planet: planetCap.toLowerCase(),
                    sign: start.sign,
                    dignity,
                    entryISO: isoDay(startTime),
                    exactISO: isoDay(midTime),
                    exitISO: isoDay(endTime),
                    entryDay: dayOffset(startTime, anchorTime),
                    exactDay: dayOffset(midTime, anchorTime),
                    exitDay: dayOffset(endTime, anchorTime),
                    benefic: false,
                    severity,
                });
            }
        }
        for (const s of STATIONS) {
            const t = new Date(s.dateUtc).getTime();
            if (t < anchorTime || t > horizonEnd) continue;
            const tagDate = isoDay(t);
            spans.push({
                key: `station-${s.type === "retrograde" ? "rx" : "direct"}-${s.planet.toLowerCase()}-${tagDate}`,
                kind: "station",
                label: `${s.planet} stations ${s.type === "retrograde" ? "retrograde" : "direct"} in ${s.sign}`,
                planet: s.planet.toLowerCase(),
                sign: s.sign,
                entryISO: tagDate,
                exactISO: tagDate,
                exitISO: tagDate,
                entryDay: dayOffset(t, anchorTime),
                exactDay: dayOffset(t, anchorTime),
                exitDay: dayOffset(t, anchorTime),
                benefic: s.type === "direct",
                severity: INNER_PLANETS_CAP.has(s.planet) ? 0.5 : 0.35,
            });
        }
    }

    // (3) Eclipse windows — solar 14d-before to 180d-after,
    //                      lunar 7d-before to 30d-after.
    for (const e of ECLIPSES) {
        const t = new Date(e.dateUtc).getTime();
        const isSolar = e.kind === "solar";
        const before = (isSolar ? 14 : 7) * MS_DAY;
        const after  = (isSolar ? 180 : 30) * MS_DAY;
        const eEntry = t - before;
        const eExit  = t + after;
        if (eExit < lookbackTime) continue;
        if (eEntry > horizonEnd) continue;
        spans.push({
            key: `eclipse-${isSolar ? "solar" : "lunar"}-${isoDay(t)}`,
            kind: "eclipse",
            label: `${isSolar ? "Solar" : "Lunar"} eclipse in ${e.sign}`,
            planet: isSolar ? "sun" : "moon",
            sign: e.sign,
            entryISO: isoDay(eEntry),
            exactISO: isoDay(t),
            exitISO: isoDay(eExit),
            entryDay: dayOffset(eEntry, anchorTime),
            exactDay: dayOffset(t, anchorTime),
            exitDay: dayOffset(eExit, anchorTime),
            benefic: false,
            severity: isSolar ? 0.9 : 0.6,
        });
    }

    // (4) Imminent ingresses (zero-width) — only when the snapshot is provided.
    //     The snapshot only carries the next ingress per planet (within 30d),
    //     which is the most useful slice for the timeline anyway.
    if (skyState) {
        for (const ing of skyState.ingresses) {
            const t = new Date(`${ing.dateISO}T12:00:00Z`).getTime();
            if (!isFinite(t) || t < anchorTime || t > horizonEnd) continue;
            spans.push({
                key: `ingress-${ing.planet}-${ing.dateISO}`,
                kind: "ingress",
                label: `${ing.planet[0].toUpperCase()}${ing.planet.slice(1)} enters ${ing.toSign}`,
                planet: ing.planet,
                sign: ing.toSign,
                entryISO: ing.dateISO,
                exactISO: ing.dateISO,
                exitISO: ing.dateISO,
                entryDay: dayOffset(t, anchorTime),
                exactDay: dayOffset(t, anchorTime),
                exitDay: dayOffset(t, anchorTime),
                benefic: true,  // ingresses are neutral/positive markers
                severity: 0.4,
            });
        }
    }

    spans.sort((a, b) => a.exactDay - b.exactDay);
    return spans;
}
