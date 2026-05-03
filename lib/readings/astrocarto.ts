/**
 * Astrocartography reading pipeline. Pure compute + AI synthesis — no DB I/O.
 * The route hands us the parsed input, we hand back the full `details` payload
 * ready to persist.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getNatalChart, getPartnerNatalChart, getProfile, saveNatalChart, savePartnerNatalChart } from "@/lib/db";
import { SwissEphSingleton, computeRealtimePositions } from "@/lib/astro/transits";
import { resolveACGFull, computeParans } from "@/lib/astro/acg-lines";
import { solve12MonthTransits, type TransitHit } from "@/lib/astro/transit-solver";
import { computeHouseMatrix, mapTransitsToMatrix, computeGlobalPenalty, acgLineRawScore } from "@/app/lib/house-matrix";
import { computeEventScores } from "@/app/lib/scoring-engine";
import { houseFromLongitude, signFromLongitude } from "@/app/lib/geodetic";
import { birthToUtc } from "@/lib/astro/birth-utc";
import { determineSect, computeLotOfFortune, computeLotOfSpirit } from "@/app/lib/arabic-parts";
import { GOAL_DEFINITIONS, buildEditorialEvidence, deriveScoreNarrative } from "@/app/lib/reading-tabs";

import { computeProgressedBands } from "@/app/lib/progressions";
import { writeTeacherReading, type TeacherReadingInput } from "@/lib/ai/prompts/teacher-reading";
import { TeacherReadingSchema, type Tone } from "@/lib/ai/schemas";
import { houseTopic, spellAngle, closenessBand, houseVibe } from "./house-topics";
import { computeSynastryAspects, classifyHouseBucket, computeRecommendation } from "./synastry";
import { buildAIInput } from "./ai-input-builder";
import type { AstrocartoReadingResult, RunAstrocartoInput } from "./types";

const GOAL_INDEX_MAP = Object.fromEntries(
  Object.entries(GOAL_DEFINITIONS)
    .filter(([, definition]) => definition.eventIndex != null)
    .map(([goalId, definition]) => [goalId, definition.eventIndex]),
) as Record<string, number>;

/** Parse ReadingFlow goal IDs (string or numeric) into matrix row indices. */
function parseGoals(goals: unknown[] | undefined): number[] | undefined {
  if (!Array.isArray(goals) || goals.length === 0) return undefined;
  const indices = goals
    .map((g) => (typeof g === "string" ? GOAL_INDEX_MAP[g] : g))
    .filter((i): i is number => typeof i === "number");
  return indices.length > 0 ? indices : undefined;
}

/** Cache-aside natal compute. Uses Swiss Ephemeris if no cached chart. */
async function loadOrComputeNatal(
  userId: string,
  profile: any,
): Promise<{ planets: any[]; cusps: number[]; dtUtc: Date }> {
  const dtUtc = await birthToUtc(
    profile.birth_date,
    profile.birth_time,
    profile.birth_lat,
    profile.birth_lon,
  );

  const cached = await getNatalChart(userId);
  if (cached?.ephemeris_data?.planets) {
    return { planets: cached.ephemeris_data.planets, cusps: cached.cusps_data?.cusps ?? [], dtUtc };
  }

  const swe = await SwissEphSingleton.getInstance();
  const jd = swe.julday(
    dtUtc.getUTCFullYear(),
    dtUtc.getUTCMonth() + 1,
    dtUtc.getUTCDate(),
    dtUtc.getUTCHours() + dtUtc.getUTCMinutes() / 60.0,
  );
  const sys = Math.abs(profile.birth_lat) >= 66 ? "W" : "P";
  const h = swe.houses(jd, profile.birth_lat, profile.birth_lon, sys) as any;
  const cusps: number[] = [];
  for (let i = 1; i <= 12; i++) cusps.push(h.cusps[i.toString()]);

  const computed = await computeRealtimePositions(dtUtc, cusps);
  const { essentialDignityLabel } = await import("@/app/lib/dignity");
  const planets = computed.map((p: any) => ({
    ...p,
    dignity: essentialDignityLabel(p.name, p.sign).toUpperCase(),
  }));

  await saveNatalChart(
    userId,
    { planets, cusps, asc: h.ascmc["0"], mc: h.ascmc["1"], profile_time: dtUtc.toISOString() },
    { cusps },
  );
  return { planets, cusps, dtUtc };
}

/** Cache-aside partner chart compute (synastry only). */
async function loadOrComputePartnerNatal(
  partnerId: string,
  partnerProfile: any,
): Promise<{ planets: any[]; cusps: number[]; dtUtc: Date }> {
  const dtUtc = await birthToUtc(
    partnerProfile.birth_date,
    partnerProfile.birth_time || "12:00:00",
    partnerProfile.birth_lat,
    partnerProfile.birth_lon,
  );

  const cached = await getPartnerNatalChart(partnerId);
  if (cached?.ephemeris_data?.planets) {
    return { planets: cached.ephemeris_data.planets, cusps: cached.cusps_data?.cusps ?? [], dtUtc };
  }

  const swe = await SwissEphSingleton.getInstance();
  const jd = swe.julday(
    dtUtc.getUTCFullYear(),
    dtUtc.getUTCMonth() + 1,
    dtUtc.getUTCDate(),
    dtUtc.getUTCHours() + dtUtc.getUTCMinutes() / 60.0,
  );
  const sys = Math.abs(partnerProfile.birth_lat) >= 66 ? "W" : "P";
  const h = swe.houses(jd, partnerProfile.birth_lat, partnerProfile.birth_lon, sys) as any;
  const cusps: number[] = [];
  for (let i = 1; i <= 12; i++) cusps.push(h.cusps[i.toString()]);

  const computed = await computeRealtimePositions(dtUtc, cusps);
  const { essentialDignityLabel } = await import("@/app/lib/dignity");
  const planets = computed.map((p: any) => ({
    ...p,
    dignity: essentialDignityLabel(p.name, p.sign).toUpperCase(),
  }));

  await savePartnerNatalChart(
    partnerId,
    { planets, cusps, profile_time: dtUtc.toISOString() },
    { cusps },
  );
  return { planets, cusps, dtUtc };
}

/** Compute relocated house cusps at a destination using Swiss Ephemeris. */
export async function relocatedCuspsAt(
  dtUtc: Date,
  targetLat: number,
  targetLon: number,
): Promise<number[]> {
  const swe = await SwissEphSingleton.getInstance();
  const jd = swe.julday(
    dtUtc.getUTCFullYear(),
    dtUtc.getUTCMonth() + 1,
    dtUtc.getUTCDate(),
    dtUtc.getUTCHours() + dtUtc.getUTCMinutes() / 60.0 + dtUtc.getUTCSeconds() / 3600.0,
  );
  const sys = Math.abs(targetLat) >= 66 ? "W" : "P";
  const h = swe.houses(jd, targetLat, targetLon, sys) as any;
  const cusps: number[] = [];
  for (let i = 1; i <= 12; i++) cusps.push(h.cusps[i.toString()]);
  return cusps;
}



/**
 * Run the full astrocartography pipeline for one user × one destination.
 * Returns the `details` payload ready to persist. No DB writes here except
 * the natal-chart cache (which is incidental and idempotent).
 */
export async function runAstrocarto(
  input: RunAstrocartoInput,
): Promise<{ result: AstrocartoReadingResult; partnerId: string | null }> {
  const { user, destination, targetLat, targetLon, travelDate, travelType, goals, readingCategory, partnerId, supabase } = input;

  // 1. Profile + natal
  const profile = await getProfile(user.id);
  if (!profile?.birth_date || !profile.birth_time) {
    throw new Error("Incomplete birth data in profile. Please complete your profile first.");
  }
  if (profile.birth_lat == null || profile.birth_lon == null) {
    throw new Error("Birth city coordinates not found. Please re-save your profile with a valid birth city.");
  }

  const { planets: natalPlanets, dtUtc: dtUtcBirth } = await loadOrComputeNatal(user.id, profile);

  // 2. Optional partner chart for synastry
  let partnerNatalPlanets: any[] | null = null;
  let partnerProfile: any = null;
  let dtUtcPartner: Date | null = null;
  let synastryAspects: ReturnType<typeof computeSynastryAspects> = [];

  if (readingCategory === "synastry" && partnerId) {
    const { data: pp } = await supabase
      .from("partner_profiles")
      .select("*")
      .eq("id", partnerId)
      .eq("owner_id", user.id)
      .maybeSingle();
    partnerProfile = pp;

    if (!partnerProfile) {
      throw new Error("Partner profile not found.");
    }
    if (partnerProfile.birth_lat == null || partnerProfile.birth_lon == null) {
      throw new Error("Partner profile is missing birth coordinates. Please re-add the partner with a city from the dropdown.");
    }

    const partnerData = await loadOrComputePartnerNatal(partnerId, partnerProfile);
    partnerNatalPlanets = partnerData.planets;
    dtUtcPartner = partnerData.dtUtc;
    synastryAspects = computeSynastryAspects(natalPlanets, partnerNatalPlanets);
  }

  // 3. Relocated cusps + ACG lines + transits at destination
  const relocatedCusps = await relocatedCuspsAt(dtUtcBirth, targetLat, targetLon);
  // Natal cusps — same calculation but anchored at the birth coordinates. Used
  // to surface the real natal ASC/IC/DSC/MC alongside the relocated angles in
  // the V4 reading view's Step 7 ("the four angles change").
  const natalCusps = await relocatedCuspsAt(dtUtcBirth, profile.birth_lat, profile.birth_lon);
  const natalAngles = {
    ASC: natalCusps[0],
    IC:  natalCusps[3],
    DSC: natalCusps[6],
    MC:  natalCusps[9],
  };
  const { cityLines: acgLines, allLines: acgAllLines } = await resolveACGFull(dtUtcBirth, targetLat, targetLon);
  const refDate = travelDate ? new Date(travelDate) : new Date();
  const rawTransits = await solve12MonthTransits(natalPlanets, refDate);
  const mappedTransits = mapTransitsToMatrix(rawTransits, natalPlanets, relocatedCusps, profile.birth_lat ?? undefined);
  const globalPenalty = computeGlobalPenalty(mappedTransits);
  // A1: raw transit positions at refDate — feed Step 5b (transit-on-geodetic-angle).
  // computeHouseMatrix tolerates undefined; the cost is one extra SwissEph call.
  const transitPositionsAtRef = await computeRealtimePositions(refDate);
  // A5: progressed Sun/Moon bands at refDate (async, day-for-a-year).
  const progressedBands = await computeProgressedBands({
    birthDateUtc: dtUtcBirth,
    refDate,
    destLon: targetLon,
  });

  // 4. Sect, Arabic parts, parans
  const sunPlanet = natalPlanets.find((p: any) => (p.planet || p.name || "").toLowerCase() === "sun");
  const moonPlanet = natalPlanets.find((p: any) => (p.planet || p.name || "").toLowerCase() === "moon");
  const relocatedAsc = relocatedCusps[0] ?? 0;
  const sect = sunPlanet ? determineSect(sunPlanet.longitude, relocatedAsc) : undefined;
  const lotOfFortuneLon = sunPlanet && moonPlanet
    ? computeLotOfFortune(relocatedAsc, sunPlanet.longitude, moonPlanet.longitude, sect)
    : undefined;
  const lotOfSpiritLon = sunPlanet && moonPlanet
    ? computeLotOfSpirit(relocatedAsc, sunPlanet.longitude, moonPlanet.longitude, sect)
    : undefined;
  const parans = computeParans(acgAllLines, targetLat);

  // 5. House matrix + event scores
  const selectedGoals = parseGoals(goals);
  // Preserve the user's original goal-ID picks (string IDs from /reading/new).
  // parseGoals collapses these into matrix indices and drops "timing" — for the
  // V4 view we want the original ordered list intact.
  const goalIds: string[] | undefined = Array.isArray(goals)
    ? (goals.filter((g): g is string => typeof g === "string"))
    : undefined;
  const matrixResult = computeHouseMatrix({
    natalPlanets,
    relocatedCusps,
    acgLines,
    transits: mappedTransits,
    parans,
    destLat: targetLat,
    destLon: targetLon,
    globalPenalty,
    birthLat: profile.birth_lat ?? undefined,
    lotOfFortuneLon,
    lotOfSpiritLon,
    sect,
    selectedGoals,
    transitPositions: transitPositionsAtRef,
    refDate,
    progressedBands,
  });

  const ascLon = relocatedCusps[0] ?? 0;
  const activeLinePlanets = new Set(
    acgLines
      .filter((line: any) => Number(line.distance_km ?? Infinity) <= 2000)
      .map((line: any) => String(line.planet || "").toLowerCase())
      .filter(Boolean),
  );
  const relocatedPlanets = natalPlanets.map((p: any) => ({
    name: p.planet || p.name,
    house: houseFromLongitude(p.longitude, ascLon),
    dignityStatus: p.dignityStatus || p.dignity || p.essentialDignity,
    hasLine: activeLinePlanets.has(String(p.planet || p.name || "").toLowerCase()),
  }));
  const eventScores = computeEventScores(matrixResult, relocatedPlanets);

  // 6. Partner matrix (synastry only) — mirrors the user pipeline at the same destination
  let partnerMatrix: any = null;
  if (readingCategory === "synastry" && partnerNatalPlanets && partnerProfile && dtUtcPartner) {
    const pRelocatedCusps = await relocatedCuspsAt(dtUtcPartner, targetLat, targetLon);
    const { cityLines: pAcgLines, allLines: pAcgAllLines } = await resolveACGFull(dtUtcPartner, targetLat, targetLon);
    const pRawTransits = await solve12MonthTransits(partnerNatalPlanets, refDate);
    const pMappedTransits = mapTransitsToMatrix(pRawTransits, partnerNatalPlanets, pRelocatedCusps, partnerProfile.birth_lat ?? undefined);
    const pGlobalPenalty = computeGlobalPenalty(pMappedTransits);
    const pParans = computeParans(pAcgAllLines, targetLat);

    const pSun = partnerNatalPlanets.find((p: any) => (p.planet || p.name || "").toLowerCase() === "sun");
    const pMoon = partnerNatalPlanets.find((p: any) => (p.planet || p.name || "").toLowerCase() === "moon");
    const pRelocatedAsc = pRelocatedCusps[0] ?? 0;
    const pSect = pSun ? determineSect(pSun.longitude, pRelocatedAsc) : undefined;
    const pLotF = pSun && pMoon ? computeLotOfFortune(pRelocatedAsc, pSun.longitude, pMoon.longitude, pSect) : undefined;
    const pLotS = pSun && pMoon ? computeLotOfSpirit(pRelocatedAsc, pSun.longitude, pMoon.longitude, pSect) : undefined;

    const pMatrixResult = computeHouseMatrix({
      natalPlanets: partnerNatalPlanets,
      relocatedCusps: pRelocatedCusps,
      acgLines: pAcgLines,
      transits: pMappedTransits,
      parans: pParans,
      destLat: targetLat,
      destLon: targetLon,
      globalPenalty: pGlobalPenalty,
      birthLat: partnerProfile.birth_lat ?? undefined,
      lotOfFortuneLon: pLotF,
      lotOfSpiritLon: pLotS,
      sect: pSect,
      selectedGoals,
      transitPositions: transitPositionsAtRef,
      refDate,
    });

    // Partner relocated planet states for the affinity matrix — same shape
    // as the user's `relocatedPlanets` (lines 275–280) so the engine sees
    // the partner's chart in the same frame.
    const pAscLon = pRelocatedCusps[0] ?? 0;
    const pActiveLinePlanets = new Set(
      pAcgLines
        .filter((line: any) => Number(line.distance_km ?? Infinity) <= 2000)
        .map((line: any) => String(line.planet || "").toLowerCase())
        .filter(Boolean),
    );
    const pRelocatedPlanetStates = partnerNatalPlanets.map((p: any) => ({
      name: p.planet || p.name,
      house: houseFromLongitude(p.longitude, pAscLon),
      dignityStatus: p.dignityStatus || p.dignity || p.essentialDignity,
      hasLine: pActiveLinePlanets.has(String(p.planet || p.name || "").toLowerCase()),
    }));
    const pEventScores = computeEventScores(pMatrixResult, pRelocatedPlanetStates);

    partnerMatrix = {
      macroScore: pMatrixResult.macroScore,
      macroVerdict: pMatrixResult.macroVerdict,
      houses: pMatrixResult.houses.map((h) => ({ house: h.house, score: h.score })),
      acgLines: pAcgLines,
      relocatedCusps: pRelocatedCusps,
      eventScores: pEventScores,
    };
  }

  // 7. Synastry derived (overlap / excitement / friction houses + recommendation)
  let synastryDerived: any = null;
  if (partnerMatrix) {
    const userHousesMap = new Map<number, number>(matrixResult.houses.map((h: any) => [h.house, h.score]));
    const partnerHousesMap = new Map<number, number>(partnerMatrix.houses.map((h: any) => [h.house, h.score]));
    const houseComparison = Array.from({ length: 12 }, (_, i) => {
      const houseNum = i + 1;
      const u = userHousesMap.get(houseNum) ?? 0;
      const p = partnerHousesMap.get(houseNum) ?? 0;
      return {
        house: houseNum,
        userScore: u,
        partnerScore: p,
        delta: Math.abs(u - p),
        avg: (u + p) / 2,
        bucket: classifyHouseBucket(u, p),
      };
    });
    const scoreDelta = Math.abs(matrixResult.macroScore - partnerMatrix.macroScore);
    const averageScore = (matrixResult.macroScore + partnerMatrix.macroScore) / 2;
    const recommendation = computeRecommendation(houseComparison, scoreDelta);
    synastryDerived = { houseComparison, scoreDelta, averageScore, recommendation };
  }

  // 8. Teacher AI synthesis — graceful fallback if Gemini fails
  const aiInput = buildAIInput({
    destination,
    destinationLat: targetLat,
    destinationLon: targetLon,
    travelDate: travelDate ?? null,
    matrixResult,
    acgLines,
    rawTransits,
    eventScores,
    natalPlanets,
    relocatedCusps,
    natalAngles,
    travelType: travelType === "relocation" ? "relocation" : "trip",
    goalIds: goalIds ?? [],
  });

  let teacherReading: any = undefined;
  try {
    teacherReading = await writeTeacherReading(aiInput);
  } catch (err: any) {
    console.warn("Teacher reading AI failed, persisting without it:", err?.message);
    // Verbose diagnostics only outside production. Set DEBUG_TEACHER_READING=1
    // locally to inspect the full raw response and every Zod issue.
    if (process.env.NODE_ENV !== "production" || process.env.DEBUG_TEACHER_READING === "1") {
      const issues = err?.cause?.issues ?? err?.issues ?? err?.cause?.cause?.issues;
      if (issues) {
        console.warn("Zod issues:", JSON.stringify(issues, null, 2));
      }
      if (err?.text) {
        console.warn(`Raw text length: ${err.text.length} chars`);
        try {
          const fs = await import("node:fs");
          fs.writeFileSync("/tmp/last-teacher-response.json", err.text);
          console.warn("Full response written to /tmp/last-teacher-response.json");
        } catch (e) {
          console.warn("Could not write debug file:", e);
        }
        try {
          const parsed = JSON.parse(err.text);
          console.warn("Top-level keys present:", Object.keys(parsed));
          const result = TeacherReadingSchema.safeParse(parsed);
          if (!result.success) {
            console.warn(`ALL Zod issues (${result.error.issues.length}):`,
              JSON.stringify(result.error.issues, null, 2));
          }
        } catch (e: any) {
          console.warn("Could not JSON.parse or safeParse:", e?.message);
        }
      }
    }
  }

  // 9. Assemble final details payload
  const result: AstrocartoReadingResult = {
    destination,
    destinationLat: targetLat,
    destinationLon: targetLon,
    travelType,
    travelDate: travelDate ?? null,
    goals: selectedGoals ?? [],
    ...(goalIds && goalIds.length ? { goalIds } : {}),
    macroScore: matrixResult.macroScore,
    macroVerdict: matrixResult.macroVerdict,
    scoreBreakdown: aiInput.macro.scoreBreakdown,
    scoreNarrative: {
      selectedGoals: aiInput.editorialEvidence.selectedGoals,
      themes: aiInput.editorialEvidence.scoreDrivers.themes,
      strongestThemes: aiInput.editorialEvidence.scoreDrivers.strongestThemes,
      lessEmphasized: aiInput.editorialEvidence.scoreDrivers.lessEmphasized,
      leanIntoEvidence: aiInput.editorialEvidence.scoreDrivers.leanIntoEvidence,
      watchOutEvidence: aiInput.editorialEvidence.scoreDrivers.watchOutEvidence,
      geodetic: {
        overall: aiInput.editorialEvidence.placeDrivers.overallGeodetic,
        personal: aiInput.editorialEvidence.placeDrivers.personalGeodetic,
      },
    },
    geodeticBand: aiInput.sidebarsData.geodeticBand,
    houses: matrixResult.houses,
    houseSystem: matrixResult.houseSystem,
    planetaryLines: acgLines,
    transitWindows: rawTransits,
    eventScores,
    natalPlanets,
    relocatedCusps,
    natalAngles,
    natalCusps,
    birth: {
      city: profile.birth_city,
      date: profile.birth_date,
      time: profile.birth_time,
      lat:  profile.birth_lat,
      lon:  profile.birth_lon,
    },
    ...(matrixResult.lotOfFortune ? { lotOfFortune: matrixResult.lotOfFortune } : {}),
    ...(matrixResult.lotOfSpirit ? { lotOfSpirit: matrixResult.lotOfSpirit } : {}),
    ...(matrixResult.activeGeoTransits && matrixResult.activeGeoTransits.length > 0
      ? { activeGeoTransits: matrixResult.activeGeoTransits }
      : {}),
    ...(matrixResult.natalWorldPoints && matrixResult.natalWorldPoints.hits.length > 0
      ? { natalWorldPoints: matrixResult.natalWorldPoints }
      : {}),
    ...(matrixResult.chartRuler ? { chartRuler: matrixResult.chartRuler } : {}),
    ...(matrixResult.personalEclipses && matrixResult.personalEclipses.hits.length > 0
      ? { personalEclipses: matrixResult.personalEclipses }
      : {}),
    ...(matrixResult.progressedBands ? { progressedBands: matrixResult.progressedBands } : {}),
    ...(matrixResult.midpointTriggers && matrixResult.midpointTriggers.length > 0
      ? { midpointTriggers: matrixResult.midpointTriggers }
      : {}),
    ...(matrixResult.harmonic45Hits && matrixResult.harmonic45Hits.length > 0
      ? { harmonic45Hits: matrixResult.harmonic45Hits }
      : {}),
    ...(matrixResult.geodeticHouseFrame && matrixResult.geodeticHouseFrame.cusps.length === 12
      ? { geodeticHouseFrame: matrixResult.geodeticHouseFrame }
      : {}),
    ...(matrixResult.personalLunations && matrixResult.personalLunations.hits.length > 0
      ? { personalLunations: matrixResult.personalLunations }
      : {}),
    ...(matrixResult.parans && matrixResult.parans.length > 0
      ? { parans: matrixResult.parans }
      : {}),
    // Marker: this reading was generated with the geodetic-extras pipeline
    // (activeGeoTransits, personalEclipses, personalLunations, parans,
    // geodeticHouseFrame). Used by PlaceFieldTab to distinguish a truly
    // quiet sky from an old reading whose engine outputs predate the field.
    geodeticEngineVersion: "2026-05-02",
    ...(matrixResult.modalityCohorts && matrixResult.modalityCohorts.length > 0
      ? { modalityCohorts: matrixResult.modalityCohorts }
      : {}),
    ...(teacherReading ? { teacherReading } : {}),
    ...(partnerNatalPlanets ? { partnerNatalPlanets, synastryAspects } : {}),
    ...(partnerMatrix && synastryDerived
      ? {
          userMacroScore: matrixResult.macroScore,
          userMacroVerdict: matrixResult.macroVerdict,
          userHouses: matrixResult.houses.map((h) => ({ house: h.house, score: h.score })),
          userPlanetaryLines: acgLines,
          userRelocatedCusps: relocatedCusps,
          partnerMacroScore: partnerMatrix.macroScore,
          partnerMacroVerdict: partnerMatrix.macroVerdict,
          partnerHouses: partnerMatrix.houses,
          partnerPlanetaryLines: partnerMatrix.acgLines,
          partnerRelocatedCusps: partnerMatrix.relocatedCusps,
          partnerEventScores: partnerMatrix.eventScores,
          partnerName: partnerProfile?.first_name ?? "Partner",
          scoreDelta: synastryDerived.scoreDelta,
          averageScore: synastryDerived.averageScore,
          houseComparison: synastryDerived.houseComparison,
          recommendation: synastryDerived.recommendation,
        }
      : {}),
  };

  const persistedPartnerId = readingCategory === "synastry" && partnerId ? partnerId : null;
  return { result, partnerId: persistedPartnerId };
}
