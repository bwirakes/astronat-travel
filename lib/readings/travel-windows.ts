/**
 * Travel-window finder. Turns a per-day score series into the top N
 * non-overlapping contiguous windows ranked by average score.
 *
 * Pure function. No AI. Deterministic output from the same input.
 *
 * Rationale: previously the AI was asked to INVENT window date ranges
 * from a top-events list, which meant windows were frequently wrong,
 * empty, or misleading. Now we compute candidate windows up-front and
 * the AI's only job is to label them ("Best for rest", "Meet people")
 * and write the one-sentence `note` — it cannot change the dates.
 */

import type { GeodeticWeatherResult } from "@/app/lib/geodetic-weather-types";

export interface CandidateWindow {
    /** 0-based day index into the forecast window. */
    startIdx: number;
    endIdx: number;      // inclusive
    nights: number;      // endIdx - startIdx + 1 - 1 (nights between days)
    avgScore: number;    // 0-100
    startDate: string;   // YYYY-MM-DD
    endDate: string;     // YYYY-MM-DD
    startLabel: string;  // "May 12"
    endLabel: string;    // "May 22"
    dates: string;       // "May 12 – May 22, 2026"
    nightsLabel: string; // "10 nights"
    score: number;       // rounded avgScore (0-100)
    /** Tone of the dominant event drivers in the window, if any. */
    topDrivers: string[]; // up to 2 planet names
}

/**
 * Return the top N (default 3) non-overlapping contiguous windows with
 * the highest average score. Window length is chosen to fit the trip
 * brief — shorter for 7-day forecasts, longer for 90-day.
 */
export function findTravelWindows(
    days: GeodeticWeatherResult[],
    opts: { startDate: Date; maxWindows?: number; minLen?: number; maxLen?: number } = {
        startDate: new Date(),
    },
): CandidateWindow[] {
    if (!days || days.length === 0) return [];
    const n = days.length;
    const maxWindows = opts.maxWindows ?? 3;

    // Sensible length ranges: short trip = 4-10 nights, medium = 5-14, long = 6-21.
    const minLen = opts.minLen ?? (n <= 10 ? 3 : n <= 35 ? 5 : 7);
    const maxLen = opts.maxLen ?? (n <= 10 ? 7 : n <= 35 ? 12 : 18);

    // Precompute prefix sums for fast range-average.
    const prefix: number[] = [0];
    for (let i = 0; i < n; i++) {
        prefix.push(prefix[i] + (days[i].score ?? 60));
    }
    const avg = (a: number, b: number) => (prefix[b + 1] - prefix[a]) / (b - a + 1);

    // Generate every valid window, then greedy-pick top-scoring non-overlapping.
    const candidates: Array<{ start: number; end: number; score: number }> = [];
    for (let len = minLen; len <= Math.min(maxLen, n); len++) {
        for (let start = 0; start + len - 1 < n; start++) {
            const end = start + len - 1;
            candidates.push({ start, end, score: avg(start, end) });
        }
    }
    candidates.sort((a, b) => b.score - a.score);

    const picked: typeof candidates = [];
    const taken = new Array(n).fill(false);
    for (const c of candidates) {
        if (picked.length >= maxWindows) break;
        let overlap = false;
        for (let i = c.start; i <= c.end; i++) {
            if (taken[i]) { overlap = true; break; }
        }
        if (overlap) continue;
        picked.push(c);
        for (let i = c.start; i <= c.end; i++) taken[i] = true;
    }

    // Order final windows chronologically (best-score first within the AI label step).
    picked.sort((a, b) => a.start - b.start);

    return picked.map((c): CandidateWindow => {
        const startDay = days[c.start];
        const endDay = days[c.end];
        const startDate = new Date(startDay.dateUtc);
        const endDate = new Date(endDay.dateUtc);
        const year = endDate.getUTCFullYear();

        const fmtShort = (d: Date) => d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
        });

        const startLabel = fmtShort(startDate);
        const endLabel = fmtShort(endDate);
        const nights = c.end - c.start;     // nights between first & last day
        const score = Math.round(c.score);

        // Pull top drivers from events across the window for the AI to cite.
        const driverCounts: Record<string, number> = {};
        for (let i = c.start; i <= c.end; i++) {
            for (const e of days[i].events ?? []) {
                for (const p of e.planets ?? []) driverCounts[p] = (driverCounts[p] ?? 0) + 1;
            }
        }
        const topDrivers = Object.entries(driverCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([p]) => p);

        return {
            startIdx: c.start,
            endIdx: c.end,
            nights,
            avgScore: c.score,
            startDate: startDay.dateUtc.slice(0, 10),
            endDate: endDay.dateUtc.slice(0, 10),
            startLabel,
            endLabel,
            dates: `${startLabel} – ${endLabel}, ${year}`,
            nightsLabel: `${nights} night${nights === 1 ? "" : "s"}`,
            score,
            topDrivers,
        };
    });
}

/**
 * Deterministic rank labels keyed by position + window score.
 * Used as fallback when AI does not label, and as validation guardrail
 * (we reject AI ranks that would confuse the visual hierarchy).
 */
export function defaultRankLabels(windows: CandidateWindow[], intent: "personal" | "mundane"): string[] {
    if (windows.length === 0) return [];
    if (intent === "mundane") {
        return windows.map((_, i) => (i === 0 ? "Calmest stretch" : i === 1 ? "Second calmest" : "Third calmest"));
    }
    // Personal: pick from a small vocabulary ordered by score.
    const sortedByScore = [...windows].sort((a, b) => b.score - a.score);
    const labels: Record<number, string> = {};
    sortedByScore.forEach((w, i) => {
        labels[w.startIdx] =
            i === 0 ? "Best overall" : i === 1 ? "Strong second" : "Steady third";
    });
    return windows.map((w) => labels[w.startIdx]);
}
