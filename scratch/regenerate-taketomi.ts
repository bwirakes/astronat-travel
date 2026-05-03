/**
 * regenerate-taketomi.ts
 *
 * Pulls Brandon's natal chart from Supabase, runs the new calibrated engine
 * (Pass 1 + Pass 2 + stretch fix) for Taketomi on 2026-08-17, and prints
 * macro + breakdown so we can compare to the stored 97 from the old engine.
 *
 * No DB writes — just an in-memory recompute.
 */

import { createAdminClient } from "../lib/supabase/admin";
import { SwissEphSingleton, computeRealtimePositions } from "../lib/astro/transits";
import { computeACG, ACGLine, haversineDistance } from "../lib/astro/astrocartography";
import { computeParans, type ACGCityLine } from "../lib/astro/acg-lines";
import { solve12MonthTransits } from "../lib/astro/transit-solver";
import { computeHouseMatrix, mapTransitsToMatrix, computeGlobalPenalty } from "../app/lib/house-matrix";
import { determineSect, computeLotOfFortune, computeLotOfSpirit } from "../app/lib/arabic-parts";
import { essentialDignityLabel } from "../app/lib/dignity";
import { computeProgressedBands } from "../app/lib/progressions";
import { birthToUtc } from "../lib/astro/birth-utc";

const TARGET_EMAIL = "brandon.r.wirakesuma@gmail.com";
const TAKETOMI = { lat: 24.3358, lon: 124.0875 };
const TARGET_DATE = "2026-08-17";

async function main() {
  const supabase = createAdminClient();

  // 1. Look up the user
  console.log(`Looking up ${TARGET_EMAIL}...`);
  const { data: usersList } = await supabase.auth.admin.listUsers();
  const user = usersList.users.find(u => u.email === TARGET_EMAIL);
  if (!user) {
    console.error(`User not found: ${TARGET_EMAIL}`);
    process.exit(1);
  }
  console.log(`  user.id = ${user.id}`);

  // 2. Profile (for birth data)
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile?.birth_date || !profile?.birth_time) {
    console.error("Profile missing birth data");
    process.exit(1);
  }
  console.log(`  birth: ${profile.birth_date} ${profile.birth_time} @ (${profile.birth_lat}, ${profile.birth_lon})`);

  // 3. Cached natal chart
  const { data: chartRow } = await supabase
    .from("natal_charts")
    .select("*")
    .eq("user_id", user.id)
    .eq("chart_type", "natal")
    .single();
  let natalPlanets: any[];
  if (chartRow?.ephemeris_data?.planets) {
    natalPlanets = chartRow.ephemeris_data.planets;
    console.log(`  natal chart: ${natalPlanets.length} planets (cached)`);
  } else {
    console.log("  no cached chart — computing");
    const dt = await birthToUtc(profile.birth_date, profile.birth_time, profile.birth_lat, profile.birth_lon);
    const swe = await SwissEphSingleton.getInstance();
    const jd = swe.julday(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate(),
      dt.getUTCHours() + dt.getUTCMinutes() / 60.0);
    const sys = Math.abs(profile.birth_lat) >= 66 ? "W" : "P";
    const h = swe.houses(jd, profile.birth_lat, profile.birth_lon, sys) as any;
    const cusps: number[] = [];
    for (let i = 1; i <= 12; i++) cusps.push(h.cusps[i.toString()]);
    const computed = await computeRealtimePositions(dt, cusps);
    natalPlanets = computed.map((p: any) => ({
      ...p,
      dignity: essentialDignityLabel(p.name, p.sign).toUpperCase(),
    }));
  }

  // 4. Build refs
  const dtUtcBirth = await birthToUtc(profile.birth_date, profile.birth_time, profile.birth_lat, profile.birth_lon);
  const swe = await SwissEphSingleton.getInstance();
  const jd = swe.julday(
    dtUtcBirth.getUTCFullYear(), dtUtcBirth.getUTCMonth() + 1, dtUtcBirth.getUTCDate(),
    dtUtcBirth.getUTCHours() + dtUtcBirth.getUTCMinutes() / 60.0,
  );

  // 5. Relocated cusps at Taketomi
  const sys = Math.abs(TAKETOMI.lat) >= 66 ? "W" : "P";
  const h = swe.houses(jd, TAKETOMI.lat, TAKETOMI.lon, sys) as any;
  const relocatedCusps: number[] = [];
  for (let i = 1; i <= 12; i++) relocatedCusps.push(h.cusps[i.toString()]);

  // 6. ACG + parans
  const acgAllLines = await computeACG(dtUtcBirth);
  const acgLines: ACGCityLine[] = [];
  const MAX_DIST = 2000, LAT_WIN = 5;
  for (const line of acgAllLines) {
    let dist: number;
    if (line.angle_type === "MC" || line.angle_type === "IC") {
      if (line.longitude === null) continue;
      dist = haversineDistance(TAKETOMI.lat, TAKETOMI.lon, TAKETOMI.lat, line.longitude);
    } else {
      if (!line.curve_segments?.length) continue;
      let minD = Infinity;
      for (const seg of line.curve_segments) for (const pt of seg) {
        if (Math.abs(pt.lat - TAKETOMI.lat) > LAT_WIN) continue;
        const d = haversineDistance(TAKETOMI.lat, TAKETOMI.lon, pt.lat, pt.lon);
        if (d < minD) minD = d;
      }
      if (!isFinite(minD)) continue;
      dist = minD;
    }
    if (dist <= MAX_DIST) acgLines.push({ planet: line.planet, angle: line.angle_type, distance_km: Math.round(dist) });
  }
  acgLines.sort((a, b) => a.distance_km - b.distance_km);
  const parans = computeParans(acgAllLines, TAKETOMI.lat);

  // 7. Transits
  const refDate = new Date(TARGET_DATE);
  const rawTransits = await solve12MonthTransits(natalPlanets, refDate);
  const mapped = mapTransitsToMatrix(rawTransits, natalPlanets, relocatedCusps, profile.birth_lat ?? undefined);
  const globalPenalty = computeGlobalPenalty(mapped);

  // 8. Sect, lots, A1/A5 inputs
  const sun = natalPlanets.find((p: any) => (p.planet || p.name || "").toLowerCase() === "sun");
  const moon = natalPlanets.find((p: any) => (p.planet || p.name || "").toLowerCase() === "moon");
  const ascLon = relocatedCusps[0] ?? 0;
  const sect = sun ? determineSect(sun.longitude, ascLon) : undefined;
  const lotF = sun && moon ? computeLotOfFortune(ascLon, sun.longitude, moon.longitude, sect) : undefined;
  const lotS = sun && moon ? computeLotOfSpirit(ascLon, sun.longitude, moon.longitude, sect) : undefined;
  const transitPositions = await computeRealtimePositions(refDate);
  const progressedBands = await computeProgressedBands({
    birthDateUtc: dtUtcBirth, refDate, destLon: TAKETOMI.lon,
  });

  // 9. Run matrix
  const m = computeHouseMatrix({
    natalPlanets, relocatedCusps, acgLines,
    transits: mapped, parans,
    destLat: TAKETOMI.lat, destLon: TAKETOMI.lon,
    globalPenalty, birthLat: profile.birth_lat ?? undefined,
    lotOfFortuneLon: lotF, lotOfSpiritLon: lotS, sect,
    transitPositions, refDate, progressedBands,
  });

  // 10. Display
  console.log("\n══════════════════════════════════════════════════════════════════");
  console.log(`TAKETOMI · 2026-08-17 · ${profile.first_name ?? "Brandon"}`);
  console.log(`(re-run on Pass-1 + Pass-2 + 1.4× stretch calibration)`);
  console.log("══════════════════════════════════════════════════════════════════");
  console.log(`  Macro Score   : ${m.macroScore}  (was 97 on old engine)`);
  console.log(`  Macro Verdict : ${m.macroVerdict}`);
  console.log(`  House System  : ${m.houseSystem}`);
  console.log(`  Sect          : ${sect}`);
  if ((m as any).chartRuler) {
    const cr = (m as any).chartRuler;
    console.log(`  Chart Ruler   : ${cr.rulerName} → relocated H${cr.rulerRelocatedHouse}  ${cr.rulerAngular ? "(ANGULAR)" : "(cadent/succedent)"}`);
  }

  console.log("\n  ACG lines within 2000km:");
  if (acgLines.length === 0) console.log("    (none)");
  for (const l of acgLines.slice(0, 8)) console.log(`    ${l.planet.padEnd(10)} ${l.angle.padEnd(4)} ${l.distance_km}km`);

  console.log("\n  Parans within ±5° of destination latitude:");
  if (parans.length === 0) console.log("    (none)");
  for (const p of parans.slice(0, 8)) console.log(`    ${p.p1.padEnd(10)} × ${p.p2.padEnd(10)} @ lat ${p.lat.toFixed(2)}  type=${p.type}`);

  console.log("\n  House scores (sorted by macro weight):");
  console.log(`  ${"H".padStart(2)} ${"sphere".padEnd(11)} ${"sign".padEnd(11)} ${"score".padStart(5)} ${"status".padEnd(20)} ${"ruler".padEnd(8)}`);
  console.log("  " + "─".repeat(70));
  // Macro weights: H1 0.40, H10 0.40, H7 0.10, H4 0.10, others 0
  const order = [1, 10, 7, 4, 2, 3, 5, 6, 8, 9, 11, 12];
  for (const hNum of order) {
    const hs = m.houses.find(x => x.house === hNum);
    if (!hs) continue;
    console.log(`  ${String(hs.house).padStart(2)} ${hs.sphere.padEnd(11)} ${hs.relocatedSign.padEnd(11)} ${String(hs.score).padStart(5)} ${hs.status.padEnd(20)} ${hs.rulerPlanet.padEnd(8)}`);
  }

  console.log("\n  Top breakdown components for H1 + H10 (macro drivers):");
  for (const hNum of [1, 10]) {
    const hs = m.houses.find(x => x.house === hNum);
    if (!hs) continue;
    console.log(`\n  H${hNum} (${hs.relocatedSign}, ${hs.rulerPlanet}, score=${hs.score}):`);
    const b = hs.breakdown;
    const items = [
      ["base",            b.base],
      ["dignity",         b.dignity],
      ["occupants",       b.occupants],
      ["acgLine",         b.acgLine],
      ["geodetic",        b.geodetic],
      ["geodeticTransit", (b as any).geodeticTransit],
      ["worldPoints",     (b as any).worldPoints],
      ["chartRuler",      (b as any).chartRuler],
      ["transits",        b.transits],
      ["transitRx",       b.transitRx],
      ["retrograde",      b.retrograde],
      ["paran",           b.paran],
      ["natalBridge",     b.natalBridge],
      ["lotBonus",        b.lotBonus],
      ["progression",     (b as any).progression],
    ].filter(([_, v]) => typeof v === "number" && v !== 0)
     .sort((a, b) => Math.abs((b[1] as number)) - Math.abs((a[1] as number)));
    for (const [k, v] of items) console.log(`    ${(k as string).padEnd(18)} ${(v as number) >= 0 ? "+" : ""}${v}`);
    console.log(`    (buckets: natal=${b.bucketNatal}, occupants=${b.bucketOccupants}, transit=${b.bucketTransit}, geodetic=${b.bucketGeodetic})`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
