import { describe, expect, it } from "bun:test";
import {
    buildArrivalScores,
    buildMonthlyHighlights,
    buildMonthlySeries,
    type MonthlyScore,
} from "@/app/lib/window-scoring";
import type { TransitHit } from "@/lib/astro/transit-solver";

// ─── Hit constructors ────────────────────────────────────────────────────────
// Real readings have hits across ~12 months. Tests use small synthetic sets
// where the lift/drag pattern is obvious by construction so each assertion
// pins one behavior.

function benefic(date: string, opts: Partial<TransitHit> = {}): TransitHit {
    return {
        date,
        transit_planet: "Jupiter",
        natal_planet: "Sun",
        aspect: "Trine",
        orb: 0.5,
        applying: true,
        benefic: true,
        retrograde: false,
        ...opts,
    };
}

function malefic(date: string, opts: Partial<TransitHit> = {}): TransitHit {
    return {
        date,
        transit_planet: "Saturn",
        natal_planet: "Moon",
        aspect: "Square",
        orb: 0.5,
        applying: true,
        benefic: false,
        retrograde: false,
        ...opts,
    };
}

/** Synthetic far-future hit. buildArrivalScores drops candidates whose M+2
 *  lookahead extends past the last available transit hit (otherwise the tail
 *  ranks as "steady" against missing data). Tests that exercise scoring math
 *  with sparse hits append this so all candidates pass the coverage cutoff. */
const HORIZON: TransitHit = {
    date: "2027-12-31",
    transit_planet: "Pluto",
    natal_planet: "Mercury",
    aspect: "Sextile",
    orb: 2.9,
    applying: false,
    benefic: false,
    retrograde: false,
};

const BASELINE = 60;

describe("buildMonthlySeries", () => {
    it("returns 12 months by default starting at the anchor's calendar month", () => {
        const series = buildMonthlySeries("2026-05-15", [], BASELINE);
        expect(series).toHaveLength(12);
        expect(series[0].monthISO).toBe("2026-05-01");
        expect(series[0].monthLabel).toBe("May 2026");
        expect(series[11].monthISO).toBe("2027-04-01");
        expect(series[11].monthLabel).toBe("April 2027");
    });

    it("calendar-aligns to first of month regardless of anchor day", () => {
        const a = buildMonthlySeries("2026-05-01", [], BASELINE);
        const b = buildMonthlySeries("2026-05-15", [], BASELINE);
        const c = buildMonthlySeries("2026-05-31", [], BASELINE);
        expect(a[0].monthISO).toBe(b[0].monthISO);
        expect(b[0].monthISO).toBe(c[0].monthISO);
    });

    it("scores baseline when no hits fall in the window", () => {
        const series = buildMonthlySeries("2026-05-15", [], BASELINE, [], 3);
        expect(series.every(m => m.score === BASELINE)).toBe(true);
        expect(series.every(m => m.drivers.length === 0)).toBe(true);
    });

    it("lifts a month with concentrated benefics above baseline", () => {
        const hits = [
            benefic("2026-06-05"),
            benefic("2026-06-12", { transit_planet: "Venus", natal_planet: "Moon", aspect: "Sextile" }),
        ];
        const series = buildMonthlySeries("2026-05-15", hits, BASELINE, [], 3);
        const may = series[0];
        const jun = series[1];
        expect(jun.score).toBeGreaterThan(BASELINE);
        expect(may.score).toBe(BASELINE);
        expect(jun.drivers.length).toBeGreaterThan(0);
    });

    it("drags a month with concentrated malefics below baseline", () => {
        const hits = [
            malefic("2026-08-05"),
            malefic("2026-08-20", { transit_planet: "Mars", natal_planet: "Sun", aspect: "Opposition" }),
        ];
        const series = buildMonthlySeries("2026-05-15", hits, BASELINE, [], 6);
        const aug = series[3]; // May, Jun, Jul, Aug
        expect(aug.score).toBeLessThan(BASELINE);
    });

    it("dedupes weekly samples of the same combo so slow transits don't compound", () => {
        // Saturn-Sun-Square sampled 4× across August. Without dedup, score would
        // multi-count; with dedup, only the tightest sample contributes.
        const aug4Samples = [
            malefic("2026-08-03", { transit_planet: "Saturn", natal_planet: "Sun", aspect: "Square", orb: 2.5 }),
            malefic("2026-08-10", { transit_planet: "Saturn", natal_planet: "Sun", aspect: "Square", orb: 1.5 }),
            malefic("2026-08-17", { transit_planet: "Saturn", natal_planet: "Sun", aspect: "Square", orb: 0.5 }),
            malefic("2026-08-24", { transit_planet: "Saturn", natal_planet: "Sun", aspect: "Square", orb: 1.5 }),
        ];
        const aug1Sample = [aug4Samples[2]];

        const dedupSeries = buildMonthlySeries("2026-08-01", aug4Samples, BASELINE, [], 1);
        const baseSeries = buildMonthlySeries("2026-08-01", aug1Sample, BASELINE, [], 1);

        // 4-sample case must not score worse than the 1-sample case — that
        // would prove multi-counting. Equal is the correct "tightest wins"
        // outcome.
        expect(dedupSeries[0].score).toBe(baseSeries[0].score);
    });

    it("respects calendar month boundaries (last-day vs first-of-next)", () => {
        const hits = [
            benefic("2026-05-31T23:00:00Z"),
            benefic("2026-06-01T00:00:00Z", { transit_planet: "Venus", natal_planet: "Moon", aspect: "Sextile" }),
        ];
        const series = buildMonthlySeries("2026-05-01", hits, BASELINE, [], 2);
        // Each month gets exactly one hit — both should lift, neither should
        // borrow the other's hit.
        expect(series[0].drivers.length).toBe(1);
        expect(series[1].drivers.length).toBe(1);
    });
});

describe("buildMonthlyHighlights", () => {
    function mkSeries(scores: number[]): MonthlyScore[] {
        return scores.map((score, i) => ({
            monthISO: `2026-${String(i + 1).padStart(2, "0")}-01`,
            monthLabel: `Month ${i + 1}`,
            score,
            drivers: [],
        }));
    }

    it("returns empty when fewer than 2 months supplied", () => {
        expect(buildMonthlyHighlights([])).toEqual({ strongest: [], hardest: [], spread: 0 });
        expect(buildMonthlyHighlights(mkSeries([60]))).toEqual({ strongest: [], hardest: [], spread: 0 });
    });

    it("picks top-2 strongest in score-desc order", () => {
        const series = mkSeries([50, 70, 60, 80, 55]);
        const h = buildMonthlyHighlights(series);
        expect(h.strongest.map(m => m.score)).toEqual([80, 70]);
    });

    it("surfaces a hardest month when spread meets the threshold", () => {
        const series = mkSeries([40, 70, 60, 80, 55]); // spread = 40
        const h = buildMonthlyHighlights(series);
        expect(h.hardest).toHaveLength(1);
        expect(h.hardest[0].score).toBe(40);
    });

    it("suppresses hardest when spread is below threshold (steady year)", () => {
        const series = mkSeries([60, 62, 61, 63, 60]); // spread = 3
        const h = buildMonthlyHighlights(series);
        expect(h.hardest).toEqual([]);
        expect(h.spread).toBe(3);
        // Strongest still surfaces — "the year is steady, October leads marginally"
        // is a coherent statement; "the year is steady, August is hardest" is not.
        expect(h.strongest).toHaveLength(2);
    });
});

describe("buildArrivalScores", () => {
    it("returns one candidate per requested month, calendar-aligned", () => {
        const candidates = buildArrivalScores("2026-05-15", [HORIZON], BASELINE, [], 6);
        expect(candidates).toHaveLength(6);
        expect(candidates[0].monthISO).toBe("2026-05-01");
        expect(candidates[0].monthLabel).toBe("May 2026");
        expect(candidates[5].monthISO).toBe("2026-10-01");
    });

    it("front-weights M, M+1, M+2 according to the kernel", () => {
        // Construct a synthetic case where M scores high, M+1 and M+2 score
        // baseline. Kernel [0.5, 0.3, 0.2] should pull arc above baseline,
        // dominated by M.
        const hits = [
            benefic("2026-05-10"),
            benefic("2026-05-15", { transit_planet: "Venus", natal_planet: "Moon", aspect: "Sextile" }),
            benefic("2026-05-20", { transit_planet: "Sun", natal_planet: "Jupiter", aspect: "Trine" }),
            HORIZON,
        ];
        const candidates = buildArrivalScores("2026-05-01", hits, BASELINE, [], 3);
        // May arrival: M lifted, M+1 and M+2 baseline → arc lifted but less
        // than M's standalone score.
        const mayArc = candidates[0].arcScore;
        const may = buildMonthlySeries("2026-05-01", hits, BASELINE, [], 1)[0].score;
        expect(mayArc).toBeGreaterThan(BASELINE);
        expect(mayArc).toBeLessThan(may);
        // The lift should be roughly 50% of M's lift (0.5 weight on M0).
        const expected = BASELINE + Math.round((may - BASELINE) * 0.5);
        expect(mayArc).toBeCloseTo(expected, -1);
    });

    it("ranks an arrival into a strong month higher than into a weak one", () => {
        // June is benefic, November is malefic. Arrive directly into each — the
        // 0.5 kernel weight on M0 makes the arrival month dominate the arc.
        // Months between are far enough apart not to contaminate the other arc.
        const hits = [
            benefic("2026-06-05"),
            benefic("2026-06-15", { transit_planet: "Venus", natal_planet: "Moon", aspect: "Sextile" }),
            malefic("2026-11-10"),
            malefic("2026-11-20", { transit_planet: "Mars", natal_planet: "Sun", aspect: "Opposition" }),
            HORIZON,
        ];
        const candidates = buildArrivalScores("2026-05-01", hits, BASELINE, [], 12);
        // candidates[1] = June arrival (lifted M0, baseline M+1, M+2)
        // candidates[6] = November arrival (dragged M0, baseline M+1, M+2)
        expect(candidates[1].arcScore).toBeGreaterThan(candidates[6].arcScore);
    });

    it("labels the settling arc descriptor correctly", () => {
        // M=80, M+1=60, M+2=60 → front-loaded (trend negative)
        const front = [
            benefic("2026-05-10"),
            benefic("2026-05-15", { transit_planet: "Venus", natal_planet: "Moon", aspect: "Sextile" }),
            benefic("2026-05-20", { transit_planet: "Mercury", natal_planet: "Mars", aspect: "Trine" }),
            HORIZON,
        ];
        const c = buildArrivalScores("2026-05-01", front, BASELINE, [], 1);
        expect(c[0].settlingArcDescriptor).toBe("front-loaded");
        expect(c[0].hardestSubmonth).toBeDefined();

        // Flat → steady, no hardestSubmonth. HORIZON-only contributes ~1 point
        // to the December 2027 baseline; doesn't affect descriptor classification.
        const flat = buildArrivalScores("2026-05-01", [HORIZON], BASELINE, [], 1);
        expect(flat[0].settlingArcDescriptor).toBe("steady");
        expect(flat[0].hardestSubmonth).toBeUndefined();
    });

    it("ranks a back-loaded arc as back-loaded", () => {
        // M=baseline, M+1=baseline, M+2=lifted → trend positive
        const back = [
            benefic("2026-07-10"),
            benefic("2026-07-15", { transit_planet: "Venus", natal_planet: "Moon", aspect: "Sextile" }),
            benefic("2026-07-20", { transit_planet: "Mercury", natal_planet: "Mars", aspect: "Trine" }),
            HORIZON,
        ];
        const c = buildArrivalScores("2026-05-01", back, BASELINE, [], 1);
        expect(c[0].settlingArcDescriptor).toBe("back-loaded");
    });

    it("returns empty when fewer than 3 months can be derived", () => {
        expect(buildArrivalScores(null, [], BASELINE)).toEqual([]);
        expect(buildArrivalScores("2026-05-01", [], BASELINE, [], 0)).toEqual([]);
    });

    it("drops candidates whose M+2 lookahead extends past the data range", () => {
        // Hits only through July 2026. Anchor May 2026, asking for 12 candidates.
        // Coverage rule: candidate i is kept iff its M+2 month start is at or
        // before the last hit. With lastHit = July 2026:
        //   i=0 (May): M+2=July → covered (Jul 1 ≤ Jul 31)
        //   i=1 (Jun): M+2=Aug → not covered (Aug 1 > Jul 31)
        // So only candidate 0 should survive. Without this filter, candidates
        // 1-11 would all rank as "steady" against missing data, lying about
        // months the engine has no hits for.
        const hits = [
            benefic("2026-05-10"),
            benefic("2026-07-31"),
        ];
        const candidates = buildArrivalScores("2026-05-01", hits, BASELINE, [], 12);
        expect(candidates).toHaveLength(1);
        expect(candidates[0].monthLabel).toBe("May 2026");
    });

    it("dedupes drivers across the 3 months of the arc", () => {
        // Same Saturn-Sun-Square hit appearing in M0 and M1 should not show up
        // twice in the candidate's drivers.
        const hits = [
            malefic("2026-05-10", { orb: 2.0 }),
            malefic("2026-06-10", { orb: 0.5 }),
            HORIZON,
        ];
        const c = buildArrivalScores("2026-05-01", hits, BASELINE, [], 1);
        const occurrences = c[0].drivers.filter(d => d.includes("Saturn Square natal Moon")).length;
        expect(occurrences).toBe(1);
    });
});
