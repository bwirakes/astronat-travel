/**
 * simulate-fused-scores.ts — Statistical sweep of computeFusedReadingPackage.
 *
 * Generates N synthetic readings with random natal dates (1900–2020), random
 * times, random destinations across continents, and a 1-year travel window
 * from today. We mock the heavy ephemeris + transit-solver paths (random
 * draws calibrated to realistic house cusp / transit hit distributions) and
 * call the real scoring-engine code paths.
 *
 * Usage:  bun run scripts/simulate-fused-scores.ts --n=5000
 *
 * Reports min / max / mean / stdev of the fused macroScore, distribution
 * stats for each of the 9 event rows, count of out-of-bounds (>100 / <0)
 * readings (expected 0), thrown / NaN count, and a small histogram.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  computeFusedReadingPackage,
  buildNatalPlanetRelocatedHouseMap,
  type FinalEventScore,
} from "@/app/lib/scoring-engine";

// ─── CLI ──────────────────────────────────────────────────────────────────────

function parseN(): number {
  const arg = process.argv.find((a) => a.startsWith("--n="));
  if (!arg) return 5000;
  const n = Number(arg.slice(4));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 5000;
}

const N = parseN();

// ─── Random helpers ───────────────────────────────────────────────────────────

const PLANETS = [
  "sun", "moon", "mercury", "venus", "mars",
  "jupiter", "saturn", "uranus", "neptune", "pluto",
];

const ASPECTS = ["conjunction", "sextile", "square", "trine", "opposition"];

const DIGNITIES = ["Domicile", "Exalted", "Detriment", "Fall", undefined];

// Continent lat/lng anchors (small spread per continent).
const CONTINENT_ANCHORS: Array<{ name: string; lat: number; lon: number; spread: number }> = [
  { name: "north_america", lat:  40, lon:  -95, spread: 25 },
  { name: "south_america", lat: -15, lon:  -60, spread: 20 },
  { name: "europe",        lat:  50, lon:   10, spread: 15 },
  { name: "africa",        lat:   0, lon:   20, spread: 25 },
  { name: "asia",          lat:  30, lon:   90, spread: 30 },
  { name: "oceania",       lat: -25, lon:  140, spread: 20 },
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNatalDate(): Date {
  // Year span 1900–2020.
  const year = randInt(1900, 2020);
  const month = randInt(0, 11);
  const day = randInt(1, 28);
  const hour = randInt(0, 23);
  const min = randInt(0, 59);
  return new Date(Date.UTC(year, month, day, hour, min));
}

function randomDestination(): { lat: number; lon: number; continent: string } {
  const a = pick(CONTINENT_ANCHORS);
  return {
    lat: a.lat + randFloat(-a.spread, a.spread),
    lon: a.lon + randFloat(-a.spread, a.spread),
    continent: a.name,
  };
}

function randomTravelISO(): string {
  // 1-year window from today.
  const today = Date.now();
  const offset = randInt(0, 365) * 86_400_000;
  return new Date(today + offset).toISOString();
}

// ─── Synthetic chart payload ──────────────────────────────────────────────────

function makeNatalPlanets(): any[] {
  return PLANETS.map((name) => ({
    planet: name,
    longitude: randFloat(0, 360),
    dignity: pick(DIGNITIES),
  }));
}

function makeRelocatedCusps(): number[] {
  // 12 cusps starting at a random ASC, ~30° spacing with some jitter.
  const ascLon = randFloat(0, 360);
  const cusps: number[] = [];
  for (let i = 0; i < 12; i++) {
    cusps.push((ascLon + i * 30 + randFloat(-3, 3) + 360) % 360);
  }
  return cusps;
}

function makeMatrixHouses(): Array<{ house: number; score: number }> {
  // House scores roughly ~Normal(50, 15), clamped 0–100.
  return Array.from({ length: 12 }, (_, i) => {
    const raw = 50 + (Math.random() + Math.random() + Math.random() - 1.5) * 20;
    return { house: i + 1, score: Math.max(0, Math.min(100, Math.round(raw))) };
  });
}

function makeRelocatedPlanets(natalPlanets: any[], cusps: number[]): any[] {
  // Mirror buildOccupancyPlanets but inline + cheap (we already have planets).
  const ascLon = cusps[0] ?? 0;
  return natalPlanets.map((p) => {
    let house = Math.floor(((p.longitude - ascLon + 360) % 360) / 30) + 1;
    if (house < 1) house = 1;
    if (house > 12) house = 12;
    return {
      name: p.planet,
      house,
      dignityStatus: p.dignity,
      hasLine: Math.random() < 0.15,
    };
  });
}

function makeTransits(centerISO: string): any[] {
  // 0–60 hits within ±15d of center, mostly closer to center.
  const center = new Date(centerISO).getTime();
  const count = randInt(0, 60);
  const out: any[] = [];
  for (let i = 0; i < count; i++) {
    const dayOffset = randFloat(-15, 15);
    const date = new Date(center + dayOffset * 86_400_000).toISOString();
    out.push({
      transit_planet: pick(PLANETS),
      natal_planet: pick(PLANETS),
      aspect: pick(ASPECTS),
      benefic: Math.random() < 0.5,
      retrograde: Math.random() < 0.2,
      orb: randFloat(0, 3),
      date,
    });
  }
  return out;
}

// ─── Stats helpers ────────────────────────────────────────────────────────────

function stats(xs: number[]): { min: number; max: number; mean: number; stdev: number } {
  if (!xs.length) return { min: 0, max: 0, mean: 0, stdev: 0 };
  let min = Infinity, max = -Infinity, sum = 0;
  for (const x of xs) {
    if (x < min) min = x;
    if (x > max) max = x;
    sum += x;
  }
  const mean = sum / xs.length;
  let varSum = 0;
  for (const x of xs) varSum += (x - mean) ** 2;
  const stdev = Math.sqrt(varSum / xs.length);
  return { min, max, mean, stdev };
}

function histogram(xs: number[], buckets = 10, lo = 0, hi = 100): number[] {
  const out = new Array(buckets).fill(0);
  const w = (hi - lo) / buckets;
  for (const x of xs) {
    let b = Math.floor((x - lo) / w);
    if (b < 0) b = 0;
    if (b >= buckets) b = buckets - 1;
    out[b]++;
  }
  return out;
}

// ─── Run sweep ────────────────────────────────────────────────────────────────

function main(): void {
  console.log(`Running fused scoring sweep — N=${N}`);
  const t0 = Date.now();

  const fusedScores: number[] = [];
  const eventRows: number[][] = Array.from({ length: 9 }, () => []);
  const continentCounts: Record<string, number> = {};
  let outOfBounds = 0;
  let nanCount = 0;
  let throwCount = 0;

  for (let i = 0; i < N; i++) {
    try {
      const natalPlanets = makeNatalPlanets();
      const relocatedCusps = makeRelocatedCusps();
      const houses = makeMatrixHouses();
      const matrixResult = { houses, macroScore: 50, macroVerdict: "Mixed" } as any;
      const relocatedPlanets = makeRelocatedPlanets(natalPlanets, relocatedCusps);
      const travelISO = randomTravelISO();
      const transits = makeTransits(travelISO);
      const dest = randomDestination();
      continentCounts[dest.continent] = (continentCounts[dest.continent] ?? 0) + 1;

      // Random goal selection (0–3 goals).
      const allGoalIds = ["love", "career", "community", "growth", "relocation", "timing"];
      const numGoals = randInt(0, 3);
      const goalIds: string[] = [];
      for (let g = 0; g < numGoals; g++) goalIds.push(pick(allGoalIds));
      // Selected event indices for headline weighting (0–8).
      const numSel = randInt(0, 3);
      const selectedGoalIndices: number[] = [];
      for (let s = 0; s < numSel; s++) selectedGoalIndices.push(randInt(0, 8));

      const natalPlanetHouse = buildNatalPlanetRelocatedHouseMap(natalPlanets, relocatedCusps);

      const fused = computeFusedReadingPackage({
        matrixResult,
        relocatedPlanets,
        transits,
        centerISO: travelISO,
        goalIds,
        selectedGoalIndices: selectedGoalIndices.length ? selectedGoalIndices : null,
        natalPlanetHouse,
      });

      const s = fused.readingScore;
      if (!Number.isFinite(s)) { nanCount++; continue; }
      if (s < 0 || s > 100) outOfBounds++;
      fusedScores.push(s);
      fused.eventScores.forEach((row: FinalEventScore, idx: number) => {
        if (Number.isFinite(row.finalScore)) eventRows[idx].push(row.finalScore);
      });
    } catch (err) {
      throwCount++;
    }
  }

  const elapsedMs = Date.now() - t0;
  const headline = stats(fusedScores);
  const hist = histogram(fusedScores);

  console.log("\n=== Fused macroScore ===");
  console.log(`  count   : ${fusedScores.length}`);
  console.log(`  min/max : ${headline.min.toFixed(2)} / ${headline.max.toFixed(2)}`);
  console.log(`  mean    : ${headline.mean.toFixed(2)}`);
  console.log(`  stdev   : ${headline.stdev.toFixed(2)}`);
  console.log("\n  histogram (0–100, 10 buckets):");
  hist.forEach((n, i) => {
    const lo = i * 10, hi = (i + 1) * 10;
    const bar = "#".repeat(Math.round((n / Math.max(...hist)) * 40));
    console.log(`    [${String(lo).padStart(3)}–${String(hi).padStart(3)}] ${String(n).padStart(5)} ${bar}`);
  });

  console.log("\n=== Event row stats ===");
  eventRows.forEach((rows, i) => {
    const s = stats(rows);
    console.log(`  row ${i}:  min=${s.min.toFixed(1).padStart(5)}  max=${s.max.toFixed(1).padStart(5)}  mean=${s.mean.toFixed(1).padStart(5)}  stdev=${s.stdev.toFixed(2)}`);
  });

  console.log("\n=== Continent distribution ===");
  for (const [k, v] of Object.entries(continentCounts)) {
    console.log(`  ${k.padEnd(15)} ${v}`);
  }

  console.log("\n=== Health ===");
  console.log(`  out-of-bounds     : ${outOfBounds}  (expected 0)`);
  console.log(`  NaN count         : ${nanCount}`);
  console.log(`  thrown errors     : ${throwCount}`);
  console.log(`  elapsed           : ${elapsedMs} ms`);
}

main();
