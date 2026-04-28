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

const HALF_WIDTH_DAYS = 5;          // window is centred ± this many days
const TRANSIT_SCALE = 6;            // each tight benefic ≈ +6 to baseline
const MAX_DELTA = 25;               // cap so baseline still dominates
const GOAL_BOOST = 1.6;             // multiplier for goal-relevant transits

// /reading/new goal IDs → natal planets that act as the "target" for that
// goal's transits. A user picking `love` cares more about transits hitting
// natal Venus + Moon than transits hitting Saturn or Pluto. We use planet
// names (lowercase) to match TransitHit.natal_planet.
export const GOAL_NATAL_TARGETS: Record<string, string[]> = {
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

/** Build the set of natal targets a transit can hit to count as "goal-relevant".
 *  Returns null if there are no goal-relevant targets (i.e. all transits weighted
 *  equally — used for the timing-only / no-goals case). */
function goalTargetSet(goalIds: string[]): Set<string> | null {
    if (!goalIds.length) return null;
    const set = new Set<string>();
    let hadAny = false;
    for (const g of goalIds) {
        const targets = GOAL_NATAL_TARGETS[g];
        if (targets && targets.length) {
            hadAny = true;
            for (const t of targets) set.add(t);
        }
    }
    return hadAny ? set : null;
}

/** Score a single date by sampling transits within ±halfWidth days. */
export function scoreDate(
    centerISO: string,
    transits: TransitHit[],
    baselineMacro: number,
    goalIds: string[] = [],
    halfWidth = HALF_WIDTH_DAYS,
): { score: number; drivers: string[] } {
    if (!centerISO) return { score: baselineMacro, drivers: [] };
    const center = new Date(centerISO).getTime();
    if (!isFinite(center)) return { score: baselineMacro, drivers: [] };

    const halfMs = halfWidth * 86_400_000;
    const goalTargets = goalTargetSet(goalIds);
    let benefic = 0;
    let malefic = 0;
    const driversTop: Array<{ note: string; weight: number; goalHit: boolean }> = [];

    for (const t of transits) {
        const tTime = new Date(t.date).getTime();
        if (!isFinite(tTime)) continue;
        if (Math.abs(tTime - center) > halfMs) continue;

        const natalKey = (t.natal_planet || "").toLowerCase();
        const goalHit = goalTargets ? goalTargets.has(natalKey) : false;
        const goalMul = goalHit ? GOAL_BOOST : 1;

        // Strength: tighter orb = stronger; |orb| in degrees, max ~3 for our window.
        // Retrograde transits externalize less — same theme, but lower visible weight.
        const retroMul = t.retrograde ? 0.7 : 1;
        const tightness = Math.max(0.2, 1 - (t.orb ?? 3) / 3) * goalMul * retroMul;
        if (t.benefic) benefic += tightness;
        else            malefic += tightness;
        driversTop.push({
            note: `${t.transit_planet}${t.retrograde ? " ℞" : ""} ${t.aspect} natal ${t.natal_planet}${goalHit ? " ★" : ""}`,
            weight: tightness * (t.benefic ? 1 : -1),
            goalHit,
        });
    }

    let delta = (benefic - malefic) * TRANSIT_SCALE;
    if (delta >  MAX_DELTA) delta =  MAX_DELTA;
    if (delta < -MAX_DELTA) delta = -MAX_DELTA;

    const score = Math.max(0, Math.min(100, Math.round(baselineMacro + delta)));
    const drivers = driversTop
        .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
        .slice(0, 3)
        .map(d => d.note);

    return { score, drivers };
}

/** Build the hero window + alternates anchored on travelDate. */
export function buildScoredWindows(
    travelDateISO: string | null,
    transits: TransitHit[],
    baselineMacro: number,
    goalIds: string[] = [],
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

    return offsets.map(({ days, label }) => {
        const c = new Date(center.getTime() + days * 86_400_000);
        const start = new Date(c.getTime() - HALF_WIDTH_DAYS * 86_400_000);
        const end = new Date(c.getTime() + HALF_WIDTH_DAYS * 86_400_000);
        const { score, drivers } = scoreDate(c.toISOString(), transits, baselineMacro, goalIds);
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
    transits: TransitHit[],
    baselineMacro: number,
    goalIds: string[] = [],
    daysBefore = 21,
    daysAfter = 79,
): DailyScore[] {
    if (!travelDateISO) return [];
    const anchor = new Date(travelDateISO);
    if (isNaN(anchor.getTime())) return [];
    const anchorDay = anchor.toISOString().slice(0, 10);

    const out: DailyScore[] = [];
    for (let d = -daysBefore; d <= daysAfter; d++) {
        const day = new Date(anchor.getTime() + d * 86_400_000);
        const iso = day.toISOString().slice(0, 10);
        const { score } = scoreDate(day.toISOString(), transits, baselineMacro, goalIds, 2);
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
    transits: TransitHit[],
    baselineMacro: number,
    goalIds: string[] = [],
    windowDays = 90,
    spanDays = 5,
    minGapDays = 10,
): RangeHighlights {
    if (!travelDateISO) return { good: [], bad: [] };
    const anchor = new Date(travelDateISO);
    if (isNaN(anchor.getTime())) return { good: [], bad: [] };

    const MS_DAY = 86_400_000;
    const halfSpan = Math.floor(spanDays / 2);

    // Build a candidate window for every center-day in [D0, D{windowDays}]
    const candidates: Array<{ centerDay: number; centerISO: string; startISO: string; endISO: string; score: number; topHits: TransitHit[] }> = [];

    for (let d = 0; d <= windowDays; d++) {
        const center = new Date(anchor.getTime() + d * MS_DAY);
        const start  = new Date(center.getTime() - halfSpan * MS_DAY);
        const end    = new Date(center.getTime() + halfSpan * MS_DAY);
        const cISO   = center.toISOString();
        const { score, drivers } = scoreDate(cISO, transits, baselineMacro, goalIds);

        // Collect the TransitHit objects whose date falls in [start, end]
        const hitMap = new Map<string, { hit: TransitHit; weight: number }>();
        const startT = start.getTime();
        const endT   = end.getTime();
        for (const t of transits) {
            const tT = new Date(t.date).getTime();
            if (!isFinite(tT) || tT < startT || tT > endT) continue;
            const key = `${t.transit_planet}|${t.natal_planet}|${t.aspect}`;
            if (!hitMap.has(key)) {
                const natalKey = (t.natal_planet ?? "").toLowerCase();
                const goalTargets = new Set(goalIds.flatMap(g => GOAL_NATAL_TARGETS[g] ?? []));
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
        void drivers; // already derived via scoreDate, topHits replaces it
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
