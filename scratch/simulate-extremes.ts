/**
 * simulate-extremes.ts
 *
 * Wider sweep focused on the upper tail. Adds Taketomi (the user's anomaly
 * city) and Aug 17 2026 (the user's anomaly date), expands to 20 places and
 * 12 dates spanning a full year, and dumps the breakdown of every reading
 * that scores 90+ so we can audit the drivers.
 *
 * 10 users × 20 places × 12 dates = 2400 readings.
 */

import { SwissEphSingleton, computeRealtimePositions } from "../lib/astro/transits";
import { computeACG, ACGLine, haversineDistance } from "../lib/astro/astrocartography";
import { computeParans, type ACGCityLine } from "../lib/astro/acg-lines";
import { solve12MonthTransits } from "../lib/astro/transit-solver";
import { computeHouseMatrix, mapTransitsToMatrix, computeGlobalPenalty } from "../app/lib/house-matrix";
import { determineSect, computeLotOfFortune, computeLotOfSpirit } from "../app/lib/arabic-parts";
import { essentialDignityLabel } from "../app/lib/dignity";
import { computeProgressedBands } from "../app/lib/progressions";

const USERS = [
  { id: "U01", date: "1985-03-15", time: "08:30", lat: 40.7128,  lon: -74.0060 },
  { id: "U02", date: "1990-07-22", time: "14:15", lat: 51.5074,  lon: -0.1278  },
  { id: "U03", date: "1988-11-03", time: "22:45", lat: -6.2088,  lon: 106.8456 },
  { id: "U04", date: "1982-05-19", time: "06:10", lat: 19.4326,  lon: -99.1332 },
  { id: "U05", date: "1995-09-08", time: "11:50", lat: 35.6762,  lon: 139.6503 },
  { id: "U06", date: "1979-01-27", time: "16:30", lat: -33.8688, lon: 151.2093 },
  { id: "U07", date: "1992-12-12", time: "03:20", lat: 52.5200,  lon: 13.4050  },
  { id: "U08", date: "1986-06-04", time: "19:00", lat: 28.6139,  lon: 77.2090  },
  { id: "U09", date: "1998-02-28", time: "13:05", lat: -22.9068, lon: -43.1729 },
  { id: "U10", date: "1983-10-15", time: "05:45", lat: 6.5244,   lon: 3.3792   },
];

const DESTINATIONS = [
  { name: "Taketomi",     lat: 24.3358,  lon: 124.0875 },  // ← user's anomaly city
  { name: "Tokyo",        lat: 35.6762,  lon: 139.6503 },
  { name: "NewYork",      lat: 40.7128,  lon: -74.0060 },
  { name: "London",       lat: 51.5074,  lon: -0.1278  },
  { name: "Paris",        lat: 48.8566,  lon: 2.3522   },
  { name: "Bali",         lat: -8.4095,  lon: 115.1889 },
  { name: "Lagos",        lat: 6.5244,   lon: 3.3792   },
  { name: "Reykjavik",    lat: 64.1466,  lon: -21.9426 },
  { name: "BuenosAires",  lat: -34.6037, lon: -58.3816 },
  { name: "Sydney",       lat: -33.8688, lon: 151.2093 },
  { name: "Mumbai",       lat: 19.0760,  lon: 72.8777  },
  { name: "MexicoCity",   lat: 19.4326,  lon: -99.1332 },
  { name: "CapeTown",     lat: -33.9249, lon: 18.4241  },
  { name: "Vancouver",    lat: 49.2827,  lon: -123.1207},
  { name: "Singapore",    lat: 1.3521,   lon: 103.8198 },
  { name: "Dubai",        lat: 25.2048,  lon: 55.2708  },
  { name: "Auckland",     lat: -36.8485, lon: 174.7633 },
  { name: "Honolulu",     lat: 21.3099,  lon: -157.8581},
  { name: "Cairo",        lat: 30.0444,  lon: 31.2357  },
  { name: "Anchorage",    lat: 61.2181,  lon: -149.9003},
];

const DATES = [
  "2026-01-15", "2026-02-15", "2026-03-15", "2026-04-15",
  "2026-05-15", "2026-06-15", "2026-07-15", "2026-08-17",  // ← user's anomaly date
  "2026-09-15", "2026-10-15", "2026-11-15", "2026-12-15",
];

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
  return s[Math.min(s.length - 1, Math.max(0, Math.floor((p / 100) * s.length)))];
};

interface UserCache {
  id: string; birthLat: number; birthLon: number;
  dtUtc: Date; jd: number;
  natalPlanets: any[]; acgAllLines: ACGLine[];
  sunLon: number; moonLon: number;
}

async function buildUserCache(u: typeof USERS[number]): Promise<UserCache> {
  const swe = await SwissEphSingleton.getInstance();
  const dt = new Date(`${u.date}T${u.time}:00Z`);
  const jd = swe.julday(
    dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate(),
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
  const sun = planets.find((p: any) => (p.name || "").toLowerCase() === "sun")!;
  const moon = planets.find((p: any) => (p.name || "").toLowerCase() === "moon")!;
  return {
    id: u.id, birthLat: u.lat, birthLon: u.lon,
    dtUtc: dt, jd, natalPlanets: planets, acgAllLines,
    sunLon: sun.longitude, moonLon: moon.longitude,
  };
}

const MAX_DIST_KM = 2000, LAT_WIN_DEG = 5;
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
      for (const seg of line.curve_segments) for (const pt of seg) {
        if (Math.abs(pt.lat - cityLat) > LAT_WIN_DEG) continue;
        const d = haversineDistance(cityLat, cityLon, pt.lat, pt.lon);
        if (d < minD) minD = d;
      }
      if (!isFinite(minD)) continue;
      dist = minD;
    }
    if (dist <= MAX_DIST_KM) out.push({ planet: line.planet, angle: line.angle_type, distance_km: Math.round(dist) });
  }
  return out.sort((a, b) => a.distance_km - b.distance_km);
}

const transitPosCache = new Map<string, any[]>();
async function getTransitPositions(refDate: Date) {
  const key = refDate.toISOString().slice(0, 10);
  let cached = transitPosCache.get(key);
  if (!cached) { cached = await computeRealtimePositions(refDate); transitPosCache.set(key, cached); }
  return cached;
}

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
  const lotS = computeLotOfSpirit(relocatedCusps[0] ?? 0, uc.sunLon, uc.moonLon, sect);
  const transitPositions = await getTransitPositions(refDate);
  const progressedBands = await computeProgressedBands({ birthDateUtc: uc.dtUtc, refDate, destLon: dest.lon });
  return computeHouseMatrix({
    natalPlanets: uc.natalPlanets, relocatedCusps, acgLines,
    transits: mapped, parans, destLat: dest.lat, destLon: dest.lon,
    globalPenalty, birthLat: uc.birthLat,
    lotOfFortuneLon: lotF, lotOfSpiritLon: lotS, sect,
    transitPositions, refDate, progressedBands,
  });
}

async function main() {
  console.log("Building user caches...");
  const userCaches: UserCache[] = [];
  for (const u of USERS) userCaches.push(await buildUserCache(u));

  type Row = {
    user: string; place: string; date: string; macro: number;
    rulerHouse?: number; rulerAngular?: boolean;
    bucketNatal: number; bucketOccupants: number; bucketTransit: number; bucketGeodetic: number;
    angularHouseScores: number[]; // H1, H4, H7, H10
  };
  const rows: Row[] = [];

  let n = 0;
  const t0 = Date.now();
  const total = userCaches.length * DESTINATIONS.length * DATES.length;
  for (const uc of userCaches) for (const dest of DESTINATIONS) for (const date of DATES) {
    const m = await runOne(uc, dest, date);
    const cr = (m as any).chartRuler;
    // Average buckets across all 12 houses
    const bN = mean(m.houses.map(h => h.breakdown.bucketNatal));
    const bO = mean(m.houses.map(h => h.breakdown.bucketOccupants));
    const bT = mean(m.houses.map(h => h.breakdown.bucketTransit));
    const bG = mean(m.houses.map(h => h.breakdown.bucketGeodetic));
    const angScore = (h: number) => m.houses.find(x => x.house === h)?.score ?? 0;
    rows.push({
      user: uc.id, place: dest.name, date,
      macro: m.macroScore,
      rulerHouse: cr?.rulerRelocatedHouse,
      rulerAngular: cr?.rulerAngular,
      bucketNatal: bN, bucketOccupants: bO, bucketTransit: bT, bucketGeodetic: bG,
      angularHouseScores: [angScore(1), angScore(4), angScore(7), angScore(10)],
    });
    n++;
    if (n % 500 === 0) process.stdout.write(`  ${n}/${total} (${((Date.now()-t0)/1000).toFixed(1)}s)\n`);
  }
  console.log(`All ${n} readings done in ${((Date.now()-t0)/1000).toFixed(1)}s.\n`);

  // ── Macro distribution ────────────────────────────────────────────────
  const macros = rows.map(r => r.macro);
  console.log("══════════════ MACRO DISTRIBUTION (n=" + macros.length + ") ══════════════");
  console.log(`  mean=${mean(macros).toFixed(1)}  median=${pct(macros,50).toFixed(0)}  sd=${stdev(macros).toFixed(1)}`);
  console.log(`  p1/p5/p25/p50/p75/p95/p99: ${[1,5,25,50,75,95,99].map(p => pct(macros,p)).join(" / ")}`);
  console.log(`  min=${Math.min(...macros)}  max=${Math.max(...macros)}`);
  const at95 = macros.filter(s => s >= 95).length;
  const at90 = macros.filter(s => s >= 90).length;
  const at80 = macros.filter(s => s >= 80).length;
  console.log(`  ≥95: ${at95}/${macros.length} (${((at95/macros.length)*100).toFixed(1)}%)`);
  console.log(`  ≥90: ${at90}/${macros.length} (${((at90/macros.length)*100).toFixed(1)}%)`);
  console.log(`  ≥80: ${at80}/${macros.length} (${((at80/macros.length)*100).toFixed(1)}%)`);

  // ── Top 15 readings — see what drives 90+ scores ──────────────────────
  console.log("\n══════════════ TOP 15 READINGS — driver audit ══════════════");
  const top = [...rows].sort((a,b) => b.macro - a.macro).slice(0, 15);
  console.log(
    `  ${"user".padEnd(4)} ${"place".padEnd(13)} ${"date".padEnd(12)} ${"macro".padStart(5)} ` +
    `${"ruler".padStart(5)} ${"bN".padStart(5)} ${"bO".padStart(5)} ${"bT".padStart(5)} ${"bG".padStart(5)} ` +
    `${"H1".padStart(4)} ${"H4".padStart(4)} ${"H7".padStart(4)} ${"H10".padStart(4)}`);
  console.log("  " + "─".repeat(105));
  for (const r of top) {
    const rulerTag = r.rulerAngular === undefined ? "—" : r.rulerAngular ? "ANG" : "cad";
    console.log(
      `  ${r.user.padEnd(4)} ${r.place.padEnd(13)} ${r.date.padEnd(12)} ${r.macro.toFixed(0).padStart(5)} ` +
      `${rulerTag.padStart(5)} ${r.bucketNatal.toFixed(0).padStart(5)} ${r.bucketOccupants.toFixed(0).padStart(5)} ${r.bucketTransit.toFixed(0).padStart(5)} ${r.bucketGeodetic.toFixed(0).padStart(5)} ` +
      `${r.angularHouseScores.map(s => s.toFixed(0).padStart(4)).join(" ")}`);
  }

  // ── Taketomi-specific deep dive ───────────────────────────────────────
  console.log("\n══════════════ TAKETOMI ACROSS ALL USERS × DATES ══════════════");
  const taketomi = rows.filter(r => r.place === "Taketomi");
  console.log(`  n=${taketomi.length}, mean=${mean(taketomi.map(r=>r.macro)).toFixed(1)}, sd=${stdev(taketomi.map(r=>r.macro)).toFixed(1)}`);
  console.log(`  range: ${Math.min(...taketomi.map(r=>r.macro))} – ${Math.max(...taketomi.map(r=>r.macro))}`);
  const taketomiHigh = taketomi.filter(r => r.macro >= 90);
  console.log(`  ≥90 readings: ${taketomiHigh.length}/${taketomi.length}`);
  for (const r of taketomiHigh.slice(0, 10)) {
    const rulerTag = r.rulerAngular ? "ANG" : "cad";
    console.log(`    ${r.user} ${r.date} score=${r.macro} ruler=${rulerTag}H${r.rulerHouse} bN=${r.bucketNatal.toFixed(0)} bO=${r.bucketOccupants.toFixed(0)} bT=${r.bucketTransit.toFixed(0)} bG=${r.bucketGeodetic.toFixed(0)}`);
  }

  // ── Aug 17 2026 cross-section ─────────────────────────────────────────
  console.log("\n══════════════ AUG 17 2026 ACROSS ALL USERS × PLACES ══════════════");
  const aug17 = rows.filter(r => r.date === "2026-08-17");
  console.log(`  n=${aug17.length}, mean=${mean(aug17.map(r=>r.macro)).toFixed(1)}, sd=${stdev(aug17.map(r=>r.macro)).toFixed(1)}`);
  const aug17High = aug17.filter(r => r.macro >= 90);
  console.log(`  ≥90 readings: ${aug17High.length}/${aug17.length}`);

  // ── Per-place mean (which cities tend to score highest?) ──────────────
  console.log("\n══════════════ PLACE LEADERBOARD (mean macro) ══════════════");
  const byPlace: Record<string, number[]> = {};
  for (const r of rows) (byPlace[r.place] ||= []).push(r.macro);
  const placeRanks = Object.entries(byPlace)
    .map(([p, vs]) => ({ p, mean: mean(vs), max: Math.max(...vs), p95: pct(vs, 95) }))
    .sort((a, b) => b.mean - a.mean);
  for (const r of placeRanks) {
    console.log(`  ${r.p.padEnd(13)} mean=${r.mean.toFixed(1).padStart(5)}  p95=${r.p95.toFixed(0).padStart(3)}  max=${r.max}`);
  }

  // ── Ceiling-effect check: how often does any single bucket cap at 100? ──
  console.log("\n══════════════ CEILING-EFFECT CHECK ══════════════");
  const houseScores = rows.flatMap(r => r.angularHouseScores);
  const at100 = houseScores.filter(s => s >= 99).length;
  const at95plus = houseScores.filter(s => s >= 95).length;
  console.log(`  Angular house scores at 99+: ${at100}/${houseScores.length} (${((at100/houseScores.length)*100).toFixed(2)}%)`);
  console.log(`  Angular house scores at 95+: ${at95plus}/${houseScores.length} (${((at95plus/houseScores.length)*100).toFixed(2)}%)`);
  // Bucket-level ceiling
  const bNs = rows.map(r => r.bucketNatal);
  const bOs = rows.map(r => r.bucketOccupants);
  const bTs = rows.map(r => r.bucketTransit);
  const bGs = rows.map(r => r.bucketGeodetic);
  console.log(`  Per-reading mean bucketNatal at 99+:     ${bNs.filter(v => v >= 99).length}/${bNs.length}`);
  console.log(`  Per-reading mean bucketOccupants at 99+: ${bOs.filter(v => v >= 99).length}/${bOs.length}`);
  console.log(`  Per-reading mean bucketTransit at 99+:   ${bTs.filter(v => v >= 99).length}/${bTs.length}`);
  console.log(`  Per-reading mean bucketGeodetic at 99+:  ${bGs.filter(v => v >= 99).length}/${bGs.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
