/**
 * simulate-distribution-v3.ts
 *
 * Same 10×10×5 grid as v2, but now:
 *   1. Relies on the in-place house-matrix.ts fixes (retrograde dual-field
 *      read, chartRuler bias 18/-8 + neighbor bleed + always-on global lift).
 *   2. Wires transitPositions, refDate, and progressedBands so the new
 *      A1 / A4 / A5 / A9 layers (geodeticTransit, eclipsePenalty, lunation,
 *      progression) actually fire.
 *
 * Compares result against v1/v2 numbers in the report.
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
  { name: "Tokyo",        lat: 35.6762,  lon: 139.6503 },
  { name: "NewYork",      lat: 40.7128,  lon: -74.0060 },
  { name: "London",       lat: 51.5074,  lon: -0.1278  },
  { name: "Bali",         lat: -8.4095,  lon: 115.1889 },
  { name: "Lagos",        lat: 6.5244,   lon: 3.3792   },
  { name: "Reykjavik",    lat: 64.1466,  lon: -21.9426 },
  { name: "BuenosAires",  lat: -34.6037, lon: -58.3816 },
  { name: "Sydney",       lat: -33.8688, lon: 151.2093 },
  { name: "Mumbai",       lat: 19.0760,  lon: 72.8777  },
  { name: "MexicoCity",   lat: 19.4326,  lon: -99.1332 },
];

const DATES = ["2026-06-15", "2026-09-15", "2026-12-15", "2027-03-15", "2027-06-15"];

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
  // No need to map is_retrograde → retrograde anymore: the matrix now reads
  // both fields. Production (loadOrComputeNatal in astrocarto.ts) likewise
  // benefits without any extra mapping.
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
    if (dist <= MAX_DIST_KM) {
      out.push({ planet: line.planet, angle: line.angle_type, distance_km: Math.round(dist) });
    }
  }
  return out.sort((a, b) => a.distance_km - b.distance_km);
}

// Cache for transitPositions and progressedBands so we don't re-run
// SwissEph 500 times for inputs that depend only on (date) or (user, date).
const transitPosCache = new Map<string, any[]>();
const progressedCache = new Map<string, any>();

async function getTransitPositions(refDate: Date) {
  const key = refDate.toISOString().slice(0, 10);
  let cached = transitPosCache.get(key);
  if (!cached) {
    cached = await computeRealtimePositions(refDate);
    transitPosCache.set(key, cached);
  }
  return cached;
}

async function getProgressedBands(uc: UserCache, refDate: Date, destLon: number) {
  // depends on (user, refDate, destLon), so key is per user-date-place
  const key = `${uc.id}:${refDate.toISOString().slice(0, 10)}:${destLon.toFixed(2)}`;
  let cached = progressedCache.get(key);
  if (!cached) {
    cached = await computeProgressedBands({
      birthDateUtc: uc.dtUtc,
      refDate,
      destLon,
    });
    progressedCache.set(key, cached);
  }
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
  const lotS = computeLotOfSpirit (relocatedCusps[0] ?? 0, uc.sunLon, uc.moonLon, sect);

  // ─── New for v3: wire optional A1/A4/A5/A9 inputs ───────────────────────
  const transitPositions = await getTransitPositions(refDate);
  const progressedBands = await getProgressedBands(uc, refDate, dest.lon);

  return computeHouseMatrix({
    natalPlanets: uc.natalPlanets, relocatedCusps, acgLines,
    transits: mapped, parans, destLat: dest.lat, destLon: dest.lon,
    globalPenalty, birthLat: uc.birthLat,
    lotOfFortuneLon: lotF, lotOfSpiritLon: lotS, sect,
    transitPositions,
    refDate,
    progressedBands,
  });
}

async function main() {
  console.log("Building per-user caches...");
  const userCaches: UserCache[] = [];
  for (const u of USERS) userCaches.push(await buildUserCache(u));

  type Row = {
    user: string; place: string; date: string;
    macro: number;
    rulerHouse?: number; rulerAngular?: boolean;
    crFiringHouses: number;  // how many houses got chartRuler ≠ 0
  };
  const rows: Row[] = [];
  const compVals: Record<string, number[]> = {};
  const COMPS = ["base","globalPenalty","dignity","occupants","acgLine","geodetic",
    "geodeticTransit","worldPoints","chartRuler","eclipsePenalty","lunation","progression",
    "transits","retrograde","transitRx","paran","natalBridge","lotBonus",
    "bucketNatal","bucketOccupants","bucketTransit","bucketGeodetic"] as const;
  for (const c of COMPS) compVals[c] = [];

  let n = 0;
  const t0 = Date.now();
  for (const uc of userCaches) for (const dest of DESTINATIONS) for (const date of DATES) {
    const m = await runOne(uc, dest, date);
    let crFire = 0;
    for (const hs of m.houses) {
      for (const c of COMPS) {
        const v = (hs.breakdown as any)[c];
        if (typeof v === "number") compVals[c].push(v);
      }
      if ((hs.breakdown as any).chartRuler !== 0) crFire++;
    }
    const cr = (m as any).chartRuler;
    rows.push({
      user: uc.id, place: dest.name, date,
      macro: m.macroScore,
      rulerHouse: cr?.rulerRelocatedHouse,
      rulerAngular: cr?.rulerAngular,
      crFiringHouses: crFire,
    });
    n++;
    if (n % 100 === 0) process.stdout.write(`  ${n}/500 (${((Date.now()-t0)/1000).toFixed(1)}s)\n`);
  }
  console.log(`All ${n} readings done in ${((Date.now()-t0)/1000).toFixed(1)}s.\n`);

  // ── Macro distribution ────────────────────────────────────────────────────
  const macros = rows.map(r => r.macro);
  console.log("══════════════ MACRO SCORE DISTRIBUTION (v3) ══════════════════");
  console.log(`  mean : ${mean(macros).toFixed(2)}    (v1/v2 = 42.0 / 41.4)`);
  console.log(`  sd   : ${stdev(macros).toFixed(2)}   (v1/v2 = 21.4 / 21.6)`);
  console.log(`  p5/25/50/75/95 : ${[5,25,50,75,95].map(p => pct(macros,p).toFixed(1)).join(" / ")}`);
  console.log(`  min/max : ${Math.min(...macros).toFixed(1)} / ${Math.max(...macros).toFixed(1)}`);

  console.log("\nHistogram (10-pt bins):");
  const bins = [0,10,20,30,40,50,60,70,80,90,100];
  const counts = bins.slice(0,-1).map((b,i) => macros.filter(s => s >= b && s < bins[i+1]).length);
  const max = Math.max(...counts, 1);
  for (let i = 0; i < counts.length; i++) {
    const range = `${bins[i]}-${bins[i+1]}`.padStart(7);
    const bar = "█".repeat(Math.round((counts[i]/max) * 50));
    console.log(`  ${range} | ${bar} ${counts[i]}`);
  }

  // ── Variance attribution ────────────────────────────────────────────────
  function gMean(rs: Row[], k: keyof Row) {
    const g: Record<string, number[]> = {};
    for (const r of rs) (g[String(r[k])] ||= []).push(r.macro);
    return Object.entries(g).map(([key, v]) => ({ key, mean: mean(v) }));
  }
  const totalSd = stdev(macros);
  const userSd = stdev(gMean(rows,"user").map(r => r.mean));
  const placeSd = stdev(gMean(rows,"place").map(r => r.mean));
  const dateSd = stdev(gMean(rows,"date").map(r => r.mean));
  console.log("\n══════════════ VARIANCE ATTRIBUTION ════════════════════════════");
  console.log(`  total sd : ${totalSd.toFixed(2)}`);
  console.log(`  user  sd : ${userSd.toFixed(2)} → ${((userSd/totalSd)*100).toFixed(0)}%`);
  console.log(`  place sd : ${placeSd.toFixed(2)} → ${((placeSd/totalSd)*100).toFixed(0)}%`);
  console.log(`  date  sd : ${dateSd.toFixed(2)} → ${((dateSd/totalSd)*100).toFixed(0)}%`);

  // ── Driver table ────────────────────────────────────────────────────────
  console.log("\n══════════════ COMPONENT DRIVERS (v3) ══════════════════════════");
  const drivers = COMPS.map(c => {
    const v = compVals[c];
    return { name: c, n: v.length, mean: mean(v), sd: stdev(v),
             p5: pct(v,5), p95: pct(v,95) };
  }).filter(r => r.n > 0).sort((a,b) => b.sd - a.sd);
  console.log(`  ${"component".padEnd(17)} ${"mean".padStart(8)} ${"sd".padStart(8)} ${"p5".padStart(8)} ${"p95".padStart(8)}`);
  for (const r of drivers) {
    console.log(`  ${r.name.padEnd(17)} ${r.mean.toFixed(2).padStart(8)} ${r.sd.toFixed(2).padStart(8)} ${r.p5.toFixed(2).padStart(8)} ${r.p95.toFixed(2).padStart(8)}`);
  }

  // ── Targeted diagnostics ────────────────────────────────────────────────
  console.log("\n══════════════ TARGETED DIAGNOSTICS ════════════════════════════");
  const retroVals = compVals.retrograde;
  const nonZeroRetro = retroVals.filter(v => v !== 0).length;
  console.log(`  Retrograde:`);
  console.log(`    non-zero rows : ${nonZeroRetro}/${retroVals.length} (${((nonZeroRetro/retroVals.length)*100).toFixed(0)}%) — was 0% before fix`);
  console.log(`    mean / sd     : ${mean(retroVals).toFixed(2)} / ${stdev(retroVals).toFixed(2)}`);

  const macroAng = rows.filter(r => r.rulerAngular).map(r => r.macro);
  const macroCad = rows.filter(r => r.rulerAngular === false).map(r => r.macro);
  console.log(`  ChartRuler:`);
  console.log(`    angular n=${macroAng.length}, mean=${mean(macroAng).toFixed(2)}`);
  console.log(`    cadent  n=${macroCad.length}, mean=${mean(macroCad).toFixed(2)}`);
  console.log(`    Δ = ${(mean(macroAng)-mean(macroCad)).toFixed(2)} pts (was 4.19 in v2)`);
  const avgFiring = mean(rows.map(r => r.crFiringHouses));
  console.log(`    avg houses where chartRuler ≠ 0 per reading: ${avgFiring.toFixed(2)} (was ~1.0 — should now be ~3.0 with neighbor bleed)`);

  console.log(`  New A-layers (now active with transitPositions/refDate/progressedBands):`);
  for (const k of ["geodeticTransit","eclipsePenalty","lunation","progression"]) {
    const v = compVals[k];
    const nz = v.filter(x => x !== 0).length;
    console.log(`    ${k.padEnd(17)} non-zero=${nz}/${v.length} (${((nz/v.length)*100).toFixed(0)}%)  mean=${mean(v).toFixed(2)}  sd=${stdev(v).toFixed(2)}  p5/p95=${pct(v,5).toFixed(1)}/${pct(v,95).toFixed(1)}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
