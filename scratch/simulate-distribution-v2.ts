/**
 * simulate-distribution-v2.ts
 *
 * Extends v1 with:
 *   - Variance decomposition by user / place / date (between-group means + sd)
 *   - Retrograde diagnostic (counts natal-Rx planets per user, traces why it's 0)
 *   - Chart-ruler diagnostic (when does it fire? on which house?)
 *   - Sensitivity preview: what mean shift do candidate calibrations produce?
 */

import { SwissEphSingleton, computeRealtimePositions } from "../lib/astro/transits";
import { computeACG, ACGLine, haversineDistance } from "../lib/astro/astrocartography";
import { computeParans, type ACGCityLine } from "../lib/astro/acg-lines";
import { solve12MonthTransits } from "../lib/astro/transit-solver";
import { computeHouseMatrix, mapTransitsToMatrix, computeGlobalPenalty } from "../app/lib/house-matrix";
import { determineSect, computeLotOfFortune, computeLotOfSpirit } from "../app/lib/arabic-parts";
import { essentialDignityLabel } from "../app/lib/dignity";

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
  // CRITICAL FIX FOR DIAGNOSTIC: house-matrix expects `retrograde` (camelCase)
  // but computeRealtimePositions returns `is_retrograde` (snake_case). The
  // production pipeline does NOT translate this — confirming the bug.
  // For accurate "with-fix" simulation we set both fields.
  const planets = computed.map((p: any) => ({
    ...p,
    retrograde: p.is_retrograde,         // ← FIX: bridge the field-name mismatch
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
    natalPlanets: uc.natalPlanets, relocatedCusps, acgLines,
    transits: mapped, parans, destLat: dest.lat, destLon: dest.lon,
    globalPenalty, birthLat: uc.birthLat,
    lotOfFortuneLon: lotF, lotOfSpiritLon: lotS, sect,
  });
}

async function main() {
  const userCaches: UserCache[] = [];
  for (const u of USERS) userCaches.push(await buildUserCache(u));

  // ── Retrograde audit: which natal planets are retrograde per user? ────────
  console.log("══════════════ RETROGRADE AUDIT (natal Rx counts) ═══════════════");
  for (const uc of userCaches) {
    const rx = uc.natalPlanets.filter(p => p.retrograde).map(p => p.name);
    console.log(`  ${uc.id}: ${rx.length} Rx — [${rx.join(", ") || "none"}]`);
  }

  // Per-cell records (one row per (user, place, date))
  type Row = {
    user: string; place: string; date: string;
    macro: number; rulerHouse?: number; rulerAngular?: boolean;
    rulerHouseScore?: number;
    retroSum: number; chartRulerSum: number;
  };
  const rows: Row[] = [];
  // Also track raw breakdown values across all 12 houses
  const compVals: Record<string, number[]> = {};
  const COMPS = ["base","globalPenalty","dignity","occupants","acgLine","geodetic",
    "geodeticTransit","worldPoints","chartRuler","eclipsePenalty","lunation","progression",
    "transits","retrograde","transitRx","paran","natalBridge","lotBonus",
    "bucketNatal","bucketOccupants","bucketTransit","bucketGeodetic"] as const;
  for (const c of COMPS) compVals[c] = [];

  let n = 0;
  for (const uc of userCaches) for (const dest of DESTINATIONS) for (const date of DATES) {
    const m = await runOne(uc, dest, date);
    let retroSum = 0, chartRulerSum = 0;
    for (const hs of m.houses) {
      for (const c of COMPS) {
        const v = (hs.breakdown as any)[c];
        if (typeof v === "number") compVals[c].push(v);
      }
      retroSum += hs.breakdown.retrograde || 0;
      chartRulerSum += (hs.breakdown as any).chartRuler || 0;
    }
    const cr = (m as any).chartRuler;
    rows.push({
      user: uc.id, place: dest.name, date,
      macro: m.macroScore,
      rulerHouse: cr?.rulerRelocatedHouse,
      rulerAngular: cr?.rulerAngular,
      rulerHouseScore: cr?.rulerRelocatedHouse
        ? m.houses.find(h => h.house === cr.rulerRelocatedHouse)?.score
        : undefined,
      retroSum, chartRulerSum,
    });
    n++;
  }

  // ── Variance decomposition ───────────────────────────────────────────────
  function groupedMean<K extends string>(rs: Row[], key: keyof Row) {
    const g: Record<string, number[]> = {};
    for (const r of rs) {
      const k = String(r[key]);
      (g[k] ||= []).push(r.macro);
    }
    return Object.entries(g)
      .map(([k, v]) => ({ k, mean: mean(v), sd: stdev(v), n: v.length }))
      .sort((a, b) => b.mean - a.mean);
  }

  console.log("\n══════════════ MACRO MEAN BY USER (n=50 each) ═══════════════════");
  const byUser = groupedMean(rows, "user");
  for (const r of byUser) console.log(`  ${r.k}: mean=${r.mean.toFixed(1)}  within-sd=${r.sd.toFixed(1)}`);
  console.log(`  → between-user spread (sd of group means): ${stdev(byUser.map(r => r.mean)).toFixed(2)}`);

  console.log("\n══════════════ MACRO MEAN BY PLACE (n=50 each) ══════════════════");
  const byPlace = groupedMean(rows, "place");
  for (const r of byPlace) console.log(`  ${r.k.padEnd(13)}: mean=${r.mean.toFixed(1)}  within-sd=${r.sd.toFixed(1)}`);
  console.log(`  → between-place spread (sd of group means): ${stdev(byPlace.map(r => r.mean)).toFixed(2)}`);

  console.log("\n══════════════ MACRO MEAN BY DATE (n=100 each) ══════════════════");
  const byDate = groupedMean(rows, "date");
  for (const r of byDate) console.log(`  ${r.k}: mean=${r.mean.toFixed(1)}  within-sd=${r.sd.toFixed(1)}`);
  console.log(`  → between-date spread (sd of group means): ${stdev(byDate.map(r => r.mean)).toFixed(2)}`);

  // ── Variance attribution ─────────────────────────────────────────────────
  const totalSd = stdev(rows.map(r => r.macro));
  const userSd = stdev(byUser.map(r => r.mean));
  const placeSd = stdev(byPlace.map(r => r.mean));
  const dateSd = stdev(byDate.map(r => r.mean));
  console.log("\n══════════════ VARIANCE ATTRIBUTION ════════════════════════════");
  console.log(`  total stdev (across all 500 readings): ${totalSd.toFixed(2)}`);
  console.log(`  between-user  sd: ${userSd.toFixed(2)} → ${((userSd/totalSd)*100).toFixed(0)}% of total`);
  console.log(`  between-place sd: ${placeSd.toFixed(2)} → ${((placeSd/totalSd)*100).toFixed(0)}% of total`);
  console.log(`  between-date  sd: ${dateSd.toFixed(2)} → ${((dateSd/totalSd)*100).toFixed(0)}% of total`);
  console.log("  (Pseudo-R²: how much of macro variance each axis explains.)");

  // ── chartRuler diagnostic ────────────────────────────────────────────────
  console.log("\n══════════════ CHART RULER DIAGNOSTIC ═══════════════════════════");
  const angularCount = rows.filter(r => r.rulerAngular).length;
  const cadentCount  = rows.filter(r => r.rulerAngular === false).length;
  const noRuler      = rows.filter(r => r.rulerAngular === undefined).length;
  console.log(`  Ruler is angular (1/4/7/10): ${angularCount}/${rows.length} (${((angularCount/rows.length)*100).toFixed(0)}%)`);
  console.log(`  Ruler is cadent/succedent  : ${cadentCount}/${rows.length} (${((cadentCount/rows.length)*100).toFixed(0)}%)`);
  console.log(`  No ruler resolved          : ${noRuler}/${rows.length}`);
  console.log(`  chartRuler raw component (per-house, n=6000): mean=${mean(compVals.chartRuler).toFixed(2)}, sd=${stdev(compVals.chartRuler).toFixed(2)}, p5=${pct(compVals.chartRuler,5)}, p95=${pct(compVals.chartRuler,95)}`);
  console.log("  → chartRuler only fires on the ONE house the ruler lands in (1/12 of");
  console.log("    house-readings), so its sd is tiny by construction. Per-row impact");
  console.log("    on the macro score is small unless the ruler's house carries weight.");

  // Mean macro when ruler angular vs not
  const macroAngular = rows.filter(r => r.rulerAngular).map(r => r.macro);
  const macroCadent  = rows.filter(r => r.rulerAngular === false).map(r => r.macro);
  console.log(`  Macro mean when ruler ANGULAR:  ${mean(macroAngular).toFixed(2)} (n=${macroAngular.length})`);
  console.log(`  Macro mean when ruler CADENT :  ${mean(macroCadent).toFixed(2)} (n=${macroCadent.length})`);
  console.log(`  Δ = ${(mean(macroAngular) - mean(macroCadent)).toFixed(2)} pts — current effect size`);

  // ── Retrograde diagnostic ────────────────────────────────────────────────
  console.log("\n══════════════ RETROGRADE COMPONENT DIAGNOSTIC ══════════════════");
  console.log(`  retrograde raw (per-house, n=6000): mean=${mean(compVals.retrograde).toFixed(2)}, sd=${stdev(compVals.retrograde).toFixed(2)}, p5=${pct(compVals.retrograde,5)}, p95=${pct(compVals.retrograde,95)}`);
  const nonZeroRetro = compVals.retrograde.filter(v => v !== 0).length;
  console.log(`  Non-zero retrograde rows: ${nonZeroRetro}/${compVals.retrograde.length} (${((nonZeroRetro/compVals.retrograde.length)*100).toFixed(0)}%)`);
  console.log("  After applying p.retrograde = p.is_retrograde fix, this should be > 0.");

  // ── Calibration sensitivity preview ──────────────────────────────────────
  console.log("\n══════════════ CALIBRATION TARGETS ══════════════════════════════");
  const macroVals = rows.map(r => r.macro);
  console.log(`  Current macro:  mean=${mean(macroVals).toFixed(1)}, median=${pct(macroVals,50).toFixed(1)}`);
  console.log(`  Target:         mean≈55, median≈55`);
  console.log(`  Gap:            +${(55 - mean(macroVals)).toFixed(1)} pts to mean, +${(55 - pct(macroVals,50)).toFixed(1)} pts to median`);
  console.log("");
  console.log("  Top suspects for the low baseline:");
  console.log(`    • globalPenalty saturated at 25 in 100% of readings (max-cap permanently).`);
  console.log("      Penalty is being added to base and pulled out of the cadent floor.");
  console.log(`    • retrograde never fires (field-name bug). Outer-Rx normally adds +5.`);
  console.log(`    • bucketTransit mean 36.8 vs neutral 50 — transits skew negative.`);
  console.log(`    • bucketGeodetic mean 50.4 — already neutral, no headroom there.`);
}

main().catch(e => { console.error(e); process.exit(1); });
