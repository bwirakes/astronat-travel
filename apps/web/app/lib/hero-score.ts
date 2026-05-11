/**
 * hero-score.ts — single source of truth for the **persisted** hero score.
 *
 * The reading-detail VM (reading-viewmodel.ts) derives a date+goal-adjusted
 * score at view time via deriveTravelWindows(). That number is what users see
 * (e.g. "49/100"), but it was never persisted — meaning the readings list had
 * to fall back to `details.macroScore` (the place fit, e.g. "58/100"), and
 * the two surfaces disagreed for the same row.
 *
 * This helper mirrors the same fallback ladder as deriveTravelWindows() but
 * returns just the headline score, callable at write time. The output is
 * persisted as `readings.reading_score` and `details.heroWindowScore` so every
 * consumer reads the same number.
 */
import { buildScoredWindows } from "./window-scoring";
import type { TransitHit } from "@/lib/astro/transit-solver";

export type HeroScoreSource =
    | "weather-window"   // pulled from details.weatherForecast.interpretation.travelWindows[0].score
    | "transit-window"   // computed from transitWindows + travelDate via buildScoredWindows
    | "relocation"       // relocation readings score the place itself; no window concept
    | "macro-fallback";  // missing inputs (no travel date, empty transits, etc.)

export interface HeroScoreResult {
    score: number;
    source: HeroScoreSource;
}

/** Reading details shape relevant to hero-score derivation. Loose typing
 *  (Record<string, any>) keeps this callable from JS-untyped Supabase rows. */
type DetailsLike = Record<string, any>;

const isFiniteNumber = (n: unknown): n is number =>
    typeof n === "number" && Number.isFinite(n);

/** Compute the hero score that should be persisted on `readings.reading_score`.
 *  Mirrors deriveTravelWindows()'s fallback order so list and detail agree.
 *
 *  @param details        the `details` JSON about to be persisted
 *  @param travelDateISO  the row's `reading_date` (ISO string or null)
 */
export function computeHeroScore(
    details: DetailsLike | null | undefined,
    travelDateISO: string | null | undefined,
): HeroScoreResult {
    const macroScore = isFiniteNumber(details?.macroScore)
        ? Math.round(details!.macroScore)
        : 50;

    if (!details) return { score: macroScore, source: "macro-fallback" };

    // 1. Relocation readings have no 7-night window — score the place itself.
    //    Mirrors reading-viewmodel.ts:597-610.
    if (details.travelType === "relocation") {
        return { score: macroScore, source: "relocation" };
    }

    // 2. Weather forecast present? Use its top-ranked travel window score.
    const wfWindows = details?.weatherForecast?.interpretation?.travelWindows;
    if (Array.isArray(wfWindows) && wfWindows.length) {
        const raw = wfWindows[0]?.score;
        if (isFiniteNumber(raw)) {
            return { score: Math.round(raw), source: "weather-window" };
        }
    }

    // 3. Hit-shape transit windows + travel date → run buildScoredWindows.
    const tw = details?.transitWindows;
    if (Array.isArray(tw) && tw.length && travelDateISO) {
        const isHitShape = tw[0] && typeof tw[0] === "object" && "transit_planet" in tw[0];
        if (isHitShape) {
            const goalIds: string[] = Array.isArray(details?.goalIds) ? details.goalIds : [];
            const scored = buildScoredWindows(travelDateISO, tw as TransitHit[], macroScore, goalIds);
            if (scored.length && isFiniteNumber(scored[0].score)) {
                return { score: scored[0].score, source: "transit-window" };
            }
        }
    }

    // 4. Nothing date-specific available — fall back to the place fit.
    return { score: macroScore, source: "macro-fallback" };
}
