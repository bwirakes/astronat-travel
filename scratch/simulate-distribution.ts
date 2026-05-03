/**
 * simulate-distribution.ts
 *
 * Runs computeHouseMatrix across 10 users × 10 destinations × 5 dates = 500
 * readings, then prints the macro-score distribution and the per-component
 * driver statistics (which raw breakdown components vary the most).
 *
 * Caches per-user natal data + per-user ACG geometry to avoid 500 SwissEph
 * batches. Transits are cached by the module-level cache I added in
 * lib/astro/transit-solver.ts (key: natalHash:weekNum).
 */

import { SwissEphSingleton, computeRealtimePositions } from "../lib/astro/transits";
import { computeACG, ACGLine, haversineDistance } from "../lib/astro/astrocartography";
import { computeParans, type ACGCityLine } from "../lib/astro/acg-lines";
import { solve12MonthTransits } from "../lib/astro/transit-solver";
import { computeHouseMatrix, mapTransitsToMatrix, computeGlobalPenalty } from "../app/lib/house-matrix";
import { determineSect, computeLotOfFortune, computeLotOfSpirit } from "../app/lib/arabic-parts";
import { essentialDignityLabel } from "../app/lib/dignity";

// ── Inputs ───────────────────────────────────────────────────────────────────

const USERS = [
  { id: "U01", date: "1985-03-15", time: "08:30", lat: 40.7128,  lon: -74.0060 },  // NYC
  { id: "U02", date: "1990-07-22", time: "14:15", lat: 51.5074,  lon: -0.1278  },  // London
  { id: "U03", date: "1988-11-03", time: "22:45", lat: -6.2088,  lon: 106.8456 },  // Jakarta
  { id: "U04", date: "1982-05-19", time: "06:10", lat: 19.4326,  lon: -99.1332 },  // Mexico City
  { id: "U05", date: "1995-09-08", time: "11:50", lat: 35.6762,  lon: 139.6503 },  // Tokyo
  { id: "U06", date: "1979-01-27", time: "16:30", lat: -33.8688, lon: 151.2093 },  // Sydney
  { id: "U07", date: "1992-12-12", time: "03:20", lat: 52.5200,  lon: 13.4050  },  // Berlin
  { id: "U08", date: "1986-06-04", time: "19:00", lat: 28.6139,  lon: 77.2090  },  // Delhi
  { id: "U09", date: "1998-02-28", time: "13:05", lat: -22.9068, lon: -43.1729 },  // Rio
  { id: "U10", date: "1983-10-15", time: "05:45", lat: 6.5244,   lon: 3.3792   },  // Lagos
];

const DESTINATIONS = [
  { name: "Tokyo",        lat: 35.6762,  lon: 139.6503 },
  { name: "New York",     lat: 40.7128,  lon: -74.0060 },
  { name: "London",       lat: 51.5074,  lon: -0.1278  },
  { name: "Bali",         lat: -8.4095,  lon: 115.1889 },
  { name: "Lagos",        lat: 6.5244,   lon: 3.3792   },
  { name: "Reykjavik",    lat: 64.1466,  lon: -21.9426 },
  { name: "BuenosAires",  lat: -34.6037, lon: -58.3816 },
  { name: "Sydney",       lat: -33.8688, lon: 151.2093 },
  { name: "Mumbai",       lat: 19.0760,  lon: 72.8777  },
  { name: "MexicoCity",   lat: 19.4326,  lon: -99.1332 },
];

const DATES = [
  "2026-06-15",
  "2026-09-15",
  "2026-12-15",
  "2027-03-15",
  "2027-06-15",
];

// ── Stats helpers ────────────────────────────────────────────────────────────

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const mean = (a: number[]) => (a.length ? sum(a) / a.length : 0);
const stdev = (a: number[]) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(sum(a.map(v => (v - m) ** 2)) / (a.length - 1));
};
const pct = (a: number[], p: number) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const idx = Math.min(s.length - 1, Math.max(0, Math.floor((p / 100) * s.length)));
  return s[idx];
};

// ── Per-user prep (run once each) ────────────────────────────────────────────

interface UserCache {
  id: string;
  birthLat: number;
  birthLon: number;
  dtUtc: Date;
  jd: number;
  natalPlanets: any[];
  acgAllLines: ACGLine[];
  sunLon: number;
  moonLon: number;
}

async function buildUserCache(u: typeof USERS[number]): Promise<UserCache> {
  const swe = await SwissEphSingleton.getInstance();
  const dtStr = `${u.date}T${u.time}:00Z`;
  const dt = new Date(dtStr);
  const jd = swe.julday(
    dt.getUTCFullYear(),
    dt.getUTCMonth() + 1,
    dt.getUTCDate(),
    dt.getUTCHours() + dt.getUTCMinutes() / 60.0,
  );
  const sys = Math.abs(u.lat) >= 66 ? "W" : "P";
  const h = swe.houses(jd, u.lat, u.lon, sys) as any;
  const cusps: number[] = [];
  for (let i = 1; i <= 12; i++) cusps.push(h.cusps[i.toString()]);

  const computed = await computeRealtimePositions(dt, cusps);
  const planets = computed.map((p: any) => ({
    ...p,
    dignity: essentialDignityLabel(p.name, p.sign).toUpperCase(),
  }));

  const acgAllLines = await computeACG(dt);
  const sun = planets.find((p: any) => (p.name || p.planet || "").toLowerCase() === "sun")!;
  const moon = planets.find((p: any) => (p.name || p.planet || "").toLowerCase() === "moon")!;

  return {
    id: u.id,
    birthLat: u.lat,
    birthLon: u.lon,
    dtUtc: dt,
    jd,
    natalPlanets: planets,
    acgAllLines,
    sunLon: sun.longitude,
    moonLon: moon.longitude,
  };
}

// ── ACG city filter (mirrors lib/astro/acg-lines.ts) ─────────────────────────

const MAX_DIST_KM = 2000;
const LAT_WIN_DEG = 5;

function filterCity(allLines: ACGLine[], cityLat: number, cityLon: number): ACGCityLine[] {
  const out: ACGCityLine[] = [];
  for (const line of allLines) {
    let dist: number;
    if (line.angle_type === "MC" || line.angle_type === "IC") {
      if (line.longitude === null) continue;
      dist = haversineDistance(cityLat, cityLon, cityLat, line.longitude);
    } else {
      if (!line.curve_segments?.length) continue;
      let minD = Infinity;
      for (const seg of line.curve_segments) {
        for (const pt of seg) {
          if (Math.abs(pt.lat - cityLat) > LAT_WIN_DEG) continue;
          const d = haversineDistance(cityLat, cityLon, pt.lat, pt.lon);
          if (d < minD) minD = d;
        }
      }
      if (!isFinite(minD)) continue;
      dist = minD;
    }
    if (dist <= MAX_DIST_KM) {
      out.push({ planet: line.planet, angle: line.angle_type, distance_km: Math.round(dist) });
    }
  }
  return out.sort((a, b) => a.distance_km - b.distance_km);
}

// ── Single reading run ───────────────────────────────────────────────────────

async function runOne(uc: UserCache, dest: typeof DESTINATIONS[number], dateIso: string) {
  const swe = await SwissEphSingleton.getInstance();
  const sys = Math.abs(dest.lat) >= 66 ? "W" : "P";
  const h = swe.houses(uc.jd, dest.lat, dest.lon, sys) as any;
  const relocatedCusps: number[] = [];
  for (let i = 1; i <= 12; i++) relocatedCusps.push(h.cusps[i.toString()]);

  const acgLines = filterCity(uc.acgAllLines, dest.lat, dest.lon);
  const parans = computeParans(uc.acgAllLines, dest.lat);

  const refDate = new Date(dateIso);
  const rawTransits = await solve12MonthTransits(uc.natalPlanets, refDate);
  const mapped = mapTransitsToMatrix(rawTransits, uc.natalPlanets, relocatedCusps, uc.birthLat);
  const globalPenalty = computeGlobalPenalty(mapped);

  const sect = determineSect(uc.sunLon, relocatedCusps[0] ?? 0);
  const lotF = computeLotOfFortune(relocatedCusps[0] ?? 0, uc.sunLon, uc.moonLon, sect);
  const lotS = computeLotOfSpirit (relocatedCusps[0] ?? 0, uc.sunLon, uc.moonLon, sect);

  return computeHouseMatrix({
    natalPlanets: uc.natalPlanets,
    relocatedCusps,
    acgLines,
    transits: mapped,
    parans,
    destLat: dest.lat,
    destLon: dest.lon,
    globalPenalty,
    birthLat: uc.birthLat,
    lotOfFortuneLon: lotF,
    lotOfSpiritLon: lotS,
    sect,
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Initializing SwissEph and per-user caches...");
  const t0 = Date.now();

  const userCaches: UserCache[] = [];
  for (const u of USERS) {
    const uc = await buildUserCache(u);
    userCaches.push(uc);
    process.stdout.write(`  ${uc.id} ✓\n`);
  }
  console.log(`User caches built in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);

  // Components we want to track (per-house raw breakdown values).
  const COMPONENTS = [
    "base", "globalPenalty", "dignity", "occupants", "acgLine", "geodetic",
    "geodeticTransit", "worldPoints", "chartRuler", "eclipsePenalty",
    "lunation", "progression", "transits", "retrograde", "transitRx",
    "paran", "natalBridge", "lotBonus",
    "bucketNatal", "bucketOccupants", "bucketTransit", "bucketGeodetic",
  ] as const;

  const macroScores: number[] = [];
  const componentVals: Record<string, number[]> = {};
  for (const c of COMPONENTS) componentVals[c] = [];
  const houseScores: number[] = [];

  let runCount = 0;
  const t1 = Date.now();
  for (const uc of userCaches) {
    for (const dest of DESTINATIONS) {
      for (const date of DATES) {
        const m = await runOne(uc, dest, date);
        macroScores.push(m.macroScore);
        for (const hs of m.houses) {
          houseScores.push(hs.score);
          for (const c of COMPONENTS) {
            const v = (hs.breakdown as any)[c];
            if (typeof v === "number") componentVals[c].push(v);
          }
        }
        runCount++;
        if (runCount % 50 === 0) {
          const elapsed = ((Date.now() - t1) / 1000).toFixed(1);
          process.stdout.write(`  ${runCount}/500 done (${elapsed}s)\n`);
        }
      }
    }
  }
  console.log(`\nAll ${runCount} readings done in ${((Date.now() - t1) / 1000).toFixed(1)}s.\n`);

  // ── Macro distribution ────────────────────────────────────────────────────
  console.log("══════════════════════════════════════════════════════════════════");
  console.log(`MACRO SCORE DISTRIBUTION (n=${macroScores.length})`);
  console.log("══════════════════════════════════════════════════════════════════");
  console.log(`  mean   : ${mean(macroScores).toFixed(2)}`);
  console.log(`  stdev  : ${stdev(macroScores).toFixed(2)}`);
  console.log(`  min    : ${Math.min(...macroScores).toFixed(2)}`);
  console.log(`  max    : ${Math.max(...macroScores).toFixed(2)}`);
  console.log(`  p5/25/50/75/95 : ${[5, 25, 50, 75, 95].map(p => pct(macroScores, p).toFixed(1)).join(" / ")}`);

  console.log("\nHistogram (10-pt bins):");
  const bins = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const maxBar = 50;
  const binCounts = bins.slice(0, -1).map((b, i) =>
    macroScores.filter(s => s >= b && s < bins[i + 1]).length
  );
  const maxCount = Math.max(...binCounts, 1);
  for (let i = 0; i < binCounts.length; i++) {
    const range = `${bins[i]}-${bins[i + 1]}`.padStart(7);
    const bar = "█".repeat(Math.round((binCounts[i] / maxCount) * maxBar));
    console.log(`  ${range} | ${bar} ${binCounts[i]}`);
  }

  // ── Per-house score distribution ──────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════════════════");
  console.log(`PER-HOUSE SCORE DISTRIBUTION (n=${houseScores.length})`);
  console.log("══════════════════════════════════════════════════════════════════");
  console.log(`  mean   : ${mean(houseScores).toFixed(2)}`);
  console.log(`  stdev  : ${stdev(houseScores).toFixed(2)}`);
  console.log(`  p5/25/50/75/95 : ${[5, 25, 50, 75, 95].map(p => pct(houseScores, p).toFixed(1)).join(" / ")}`);

  // ── Component drivers — sorted by stdev (= most variance = biggest driver)
  console.log("\n══════════════════════════════════════════════════════════════════");
  console.log("COMPONENT DRIVERS  (raw breakdown values across 6000 house-readings)");
  console.log("Sorted by stdev (descending = biggest driver of variance)");
  console.log("══════════════════════════════════════════════════════════════════");
  const driverRows = COMPONENTS.map(c => {
    const v = componentVals[c];
    return {
      name: c,
      n: v.length,
      mean: mean(v),
      sd: stdev(v),
      min: v.length ? Math.min(...v) : 0,
      max: v.length ? Math.max(...v) : 0,
      p5: pct(v, 5),
      p95: pct(v, 95),
    };
  })
  .filter(r => r.n > 0)
  .sort((a, b) => b.sd - a.sd);

  console.log(
    `  ${"component".padEnd(17)} ` +
    `${"mean".padStart(8)} ${"stdev".padStart(8)} ` +
    `${"min".padStart(8)} ${"p5".padStart(8)} ` +
    `${"p95".padStart(8)} ${"max".padStart(8)}`
  );
  console.log("  " + "─".repeat(72));
  for (const r of driverRows) {
    console.log(
      `  ${r.name.padEnd(17)} ` +
      `${r.mean.toFixed(2).padStart(8)} ${r.sd.toFixed(2).padStart(8)} ` +
      `${r.min.toFixed(2).padStart(8)} ${r.p5.toFixed(2).padStart(8)} ` +
      `${r.p95.toFixed(2).padStart(8)} ${r.max.toFixed(2).padStart(8)}`
    );
  }

  console.log("\nLegend: mean/stdev/p5/p95 capture the typical range each");
  console.log("component contributes per house-reading. High stdev = strong driver.");
  console.log("Components stuck at 0 contributed nothing this run (likely gated on");
  console.log("optional inputs not passed: transitPositions, refDate, progressedBands).");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
