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
const GOAL_NATAL_TARGETS: Record<string, string[]> = {
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

        // Strength: tighter orb = stronger; |orb| in degrees, max ~3 for our window
        const tightness = Math.max(0.2, 1 - (t.orb ?? 3) / 3) * goalMul;
        if (t.benefic) benefic += tightness;
        else            malefic += tightness;
        driversTop.push({
            note: `${t.transit_planet} ${t.aspect} natal ${t.natal_planet}${goalHit ? " ★" : ""}`,
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
    daysAfter = 35,
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
