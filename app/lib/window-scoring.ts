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
 *   + transit boost  (sum of benefic transit strengths active on that date)
 *   - transit drag   (sum of malefic transit strengths active on that date)
 *
 * Only the transit term varies day to day — the relocated chart angles + ACG
 * lines are fixed for the destination. So two dates close together at the
 * same destination only differ by which transits land in their ±5 day
 * window.
 */
import type { TransitHit } from "@/lib/astro/transit-solver";

const HALF_WIDTH_DAYS = 5;          // window is centred ± this many days
const TRANSIT_SCALE = 6;            // each tight benefic ≈ +6 to baseline
const MAX_DELTA = 25;               // cap so baseline still dominates

export interface ScoredWindow {
    label: string;                  // "Your dates" | "−2 weeks" | "+2 weeks" | "+1 month"
    centerISO: string;              // anchor day
    startISO: string;               // centerISO − HALF_WIDTH_DAYS
    endISO: string;                 // centerISO + HALF_WIDTH_DAYS
    score: number;                  // 0–100, real
    drivers: string[];              // top transits explaining the score
}

/** Score a single date by sampling transits within ±halfWidth days. */
export function scoreDate(
    centerISO: string,
    transits: TransitHit[],
    baselineMacro: number,
    halfWidth = HALF_WIDTH_DAYS,
): { score: number; drivers: string[] } {
    if (!centerISO) return { score: baselineMacro, drivers: [] };
    const center = new Date(centerISO).getTime();
    if (!isFinite(center)) return { score: baselineMacro, drivers: [] };

    const halfMs = halfWidth * 86_400_000;
    let benefic = 0;
    let malefic = 0;
    const driversTop: Array<{ note: string; weight: number }> = [];

    for (const t of transits) {
        const tTime = new Date(t.date).getTime();
        if (!isFinite(tTime)) continue;
        if (Math.abs(tTime - center) > halfMs) continue;
        // Strength: tighter orb = stronger; |orb| in degrees, max ~3 for our window
        const tightness = Math.max(0.2, 1 - (t.orb ?? 3) / 3);
        if (t.benefic) benefic += tightness;
        else            malefic += tightness;
        driversTop.push({
            note: `${t.transit_planet} ${t.aspect} natal ${t.natal_planet}`,
            weight: tightness * (t.benefic ? 1 : -1),
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
        const { score, drivers } = scoreDate(c.toISOString(), transits, baselineMacro);
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
