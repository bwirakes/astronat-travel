#!/usr/bin/env bun
/**
 * sweep-cluster-scoring.ts — Distribution comparison for CLUSTER_SCORING_V1.
 *
 * Generates N synthetic natal charts with realistic placement constraints
 * (Mercury never further than 28° from the Sun, Venus never further than 48°
 * from the Sun, outers spread freely), scores each chart twice (flag off,
 * flag on), and prints per-event distribution stats plus the delta induced
 * by the cluster amplifier.
 *
 * USE
 *   bun run scripts/sweep-cluster-scoring.ts                 # default 500 charts
 *   bun run scripts/sweep-cluster-scoring.ts --n 2000        # bigger sweep
 *   bun run scripts/sweep-cluster-scoring.ts --seed 7        # different seed
 *
 * NOTE
 *   Until the Phase 1 amplifier in house-matrix.ts (PR #2) lands, the flag
 *   is a no-op — the run will report a zero delta for every event. That's
 *   the expected baseline. Re-run after each downstream PR to see the
 *   amplifier / leader / dispositor / pattern contributions accrue.
 *
 *   Plan: docs/implementation_plans/cluster-scoring.md §9 (validation).
 */

import { computeHouseMatrix, type MatrixNatalPlanet } from "@/app/lib/house-matrix";
import { computeEventScores, type OccupancyPlanet } from "@/app/lib/scoring-engine";
import { LIFE_EVENTS } from "@/app/lib/planet-library";
import { ZODIAC_SIGNS } from "@/app/lib/astro-constants";
import { signFromLongitude } from "@/app/lib/geodetic";
import { setClusterScoringEnabled } from "@/app/lib/scoring-flags";

// ── CLI ──────────────────────────────────────────────────────────────────

function parseFlags(argv: string[]): { n: number; seed: number } {
    let n = 500;
    let seed = 42;
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === "--n" && argv[i + 1]) n = parseInt(argv[++i], 10);
        else if (argv[i] === "--seed" && argv[i + 1]) seed = parseInt(argv[++i], 10);
    }
    return { n, seed };
}

// ── Deterministic PRNG (mulberry32) ──────────────────────────────────────
//
// We want bit-for-bit reproducible runs so that flag-on vs flag-off scores
// the same chart twice. Math.random() doesn't give us that.

function mulberry32(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6D2B79F5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const PLANET_NAMES_CAP = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];

// ── Synthetic chart generator ────────────────────────────────────────────

interface SyntheticChart {
    natalPlanets: MatrixNatalPlanet[];
    occupancyPlanets: OccupancyPlanet[];
    relocatedCusps: number[];
    ascLon: number;
    sect: "day" | "night";
}

/** Produce a single synthetic natal chart. Whole-sign houses anchored to
 *  a randomly-drawn ASC. Mercury/Venus respect their orbital bounds against
 *  the Sun; outer planets spread freely. */
function generateChart(rng: () => number): SyntheticChart {
    const sunLon = rng() * 360;
    const mercuryOffset = (rng() - 0.5) * 56;  // ±28°
    const venusOffset   = (rng() - 0.5) * 96;  // ±48°
    const mercuryLon = (sunLon + mercuryOffset + 360) % 360;
    const venusLon   = (sunLon + venusOffset + 360) % 360;

    const longitudes: Record<string, number> = {
        Sun:     sunLon,
        Moon:    rng() * 360,
        Mercury: mercuryLon,
        Venus:   venusLon,
        Mars:    rng() * 360,
        Jupiter: rng() * 360,
        Saturn:  rng() * 360,
        Uranus:  rng() * 360,
        Neptune: rng() * 360,
        Pluto:   rng() * 360,
    };

    const ascLon = rng() * 360;

    // Whole-sign cusps anchored to the sign holding the ASC.
    const ascSignIdx = Math.floor(ascLon / 30);
    const relocatedCusps = Array.from({ length: 12 }, (_, i) => ((ascSignIdx + i) % 12) * 30);

    // House assignment: which sign-block does the planet fall in, relative
    // to the ASC sign? (Whole-sign houses, Hellenistic style.)
    function houseOf(lon: number): number {
        const planetSignIdx = Math.floor(lon / 30);
        const offset = (planetSignIdx - ascSignIdx + 12) % 12;
        return offset + 1; // 1–12
    }

    const natalPlanets: MatrixNatalPlanet[] = PLANET_NAMES_CAP.map((name) => {
        const lon = longitudes[name];
        return {
            planet: name,
            sign: signFromLongitude(lon),
            longitude: lon,
            retrograde: false,
            house: houseOf(lon),
        };
    });

    const occupancyPlanets: OccupancyPlanet[] = PLANET_NAMES_CAP.map((name) => ({
        name: name.toLowerCase(),
        house: houseOf(longitudes[name]),
    }));

    // Sect: day if Sun is above the horizon (H7-H12 in whole-sign reckoning).
    const sunHouse = houseOf(sunLon);
    const sect: "day" | "night" = (sunHouse >= 7 && sunHouse <= 12) ? "day" : "night";

    return { natalPlanets, occupancyPlanets, relocatedCusps, ascLon, sect };
}

// ── Scoring ──────────────────────────────────────────────────────────────

function scoreChart(chart: SyntheticChart): number[] {
    const matrix = computeHouseMatrix({
        natalPlanets: chart.natalPlanets,
        relocatedCusps: chart.relocatedCusps,
        acgLines: [],
        transits: [],
        parans: [],
        destLat: 0,
        destLon: 0,
        sect: chart.sect,
    });
    const events = computeEventScores(matrix, chart.occupancyPlanets);
    return events.map((e) => e.finalScore);
}

// ── Stats ────────────────────────────────────────────────────────────────

interface DistStats {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
    p10: number;
    p90: number;
}

function describe(values: number[]): DistStats {
    if (values.length === 0) {
        return { mean: 0, median: 0, std: 0, min: 0, max: 0, p10: 0, p90: 0 };
    }
    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((s, v) => s + v, 0);
    const mean = sum / sorted.length;
    const variance = sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / sorted.length;
    const std = Math.sqrt(variance);
    const pct = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
    return {
        mean,
        median: pct(0.5),
        std,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p10: pct(0.1),
        p90: pct(0.9),
    };
}

function fmt(n: number, w = 7, d = 2): string {
    return n.toFixed(d).padStart(w);
}

function printDistTable(label: string, perEventValues: number[][]): void {
    console.log(`\n${label}`);
    console.log("─".repeat(82));
    console.log("  event                              mean   median     std     p10     p90    span");
    console.log("─".repeat(82));
    for (let e = 0; e < LIFE_EVENTS.length; e++) {
        const s = describe(perEventValues[e]);
        const name = LIFE_EVENTS[e].padEnd(34);
        console.log(`  ${name}${fmt(s.mean)} ${fmt(s.median)} ${fmt(s.std)} ${fmt(s.p10)} ${fmt(s.p90)} ${fmt(s.max - s.min)}`);
    }
}

function printDeltaTable(perEventDeltas: number[][]): void {
    console.log("\nFlag-on minus Flag-off (per event)");
    console.log("─".repeat(82));
    console.log("  event                              mean   median     std     min     max  |Δ|p90");
    console.log("─".repeat(82));
    for (let e = 0; e < LIFE_EVENTS.length; e++) {
        const s = describe(perEventDeltas[e]);
        const absDeltas = perEventDeltas[e].map(Math.abs).sort((a, b) => a - b);
        const absP90 = absDeltas[Math.floor(absDeltas.length * 0.9)];
        const name = LIFE_EVENTS[e].padEnd(34);
        console.log(`  ${name}${fmt(s.mean)} ${fmt(s.median)} ${fmt(s.std)} ${fmt(s.min)} ${fmt(s.max)} ${fmt(absP90)}`);
    }
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
    const { n, seed } = parseFlags(process.argv.slice(2));
    console.log(`Sweep: ${n} synthetic charts, seed ${seed}`);
    const rng = mulberry32(seed);

    // Generate once, score twice with the flag flipped — same charts, same RNG draw.
    const charts = Array.from({ length: n }, () => generateChart(rng));

    console.log("Scoring with CLUSTER_SCORING_V1 = OFF...");
    setClusterScoringEnabled(false);
    const offScores = charts.map(scoreChart);

    console.log("Scoring with CLUSTER_SCORING_V1 = ON...");
    setClusterScoringEnabled(true);
    const onScores = charts.map(scoreChart);

    setClusterScoringEnabled(false); // restore default

    // Reshape: per-event arrays of length n.
    const perEventOff: number[][] = LIFE_EVENTS.map((_, e) => offScores.map((s) => s[e]));
    const perEventOn:  number[][] = LIFE_EVENTS.map((_, e) => onScores.map((s) => s[e]));
    const perEventDelta: number[][] = LIFE_EVENTS.map((_, e) =>
        offScores.map((s, i) => onScores[i][e] - s[e]),
    );

    printDistTable("Flag OFF", perEventOff);
    printDistTable("Flag ON", perEventOn);
    printDeltaTable(perEventDelta);

    // Aggregate signal: how many charts moved at all?
    const movedCounts = LIFE_EVENTS.map((_, e) =>
        perEventDelta[e].filter((d) => Math.abs(d) > 0.5).length,
    );
    const totalMoved = perEventDelta.reduce(
        (n, deltas) => n + deltas.filter((d) => Math.abs(d) > 0.5).length,
        0,
    );
    const totalCells = n * LIFE_EVENTS.length;

    console.log("\nMovement summary");
    console.log("─".repeat(60));
    console.log(`  charts × events:          ${totalCells}`);
    console.log(`  cells with |Δ| > 0.5:     ${totalMoved} (${(100 * totalMoved / totalCells).toFixed(1)}%)`);
    console.log(`  per-event move counts:`);
    for (let e = 0; e < LIFE_EVENTS.length; e++) {
        console.log(`    ${LIFE_EVENTS[e].padEnd(34)} ${movedCounts[e]} / ${n}`);
    }

    if (totalMoved === 0) {
        console.log("\nZero movement detected — this is expected until the Phase 1");
        console.log("amplifier in house-matrix.ts (PR #2) lands. The detector is");
        console.log("present but no caller reads its output.");
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
