/**
 * Astrocartography reading pipeline. Pure compute + AI synthesis — no DB I/O.
 * The route hands us the parsed input, we hand back the full `details` payload
 * ready to persist.
 */

import { getNatalChart, getPartnerNatalChart, getProfile, saveNatalChart, savePartnerNatalChart } from "@/lib/db";
import { SwissEphSingleton, computeRealtimePositions } from "@/lib/astro/transits";
import { resolveACGFull, computeParans } from "@/lib/astro/acg-lines";
import { solve12MonthTransits, type TransitHit } from "@/lib/astro/transit-solver";
import { computeHouseMatrix, mapTransitsToMatrix, computeGlobalPenalty } from "@/app/lib/house-matrix";
import { computeEventScores } from "@/app/lib/scoring-engine";
import { houseFromLongitude, signFromLongitude } from "@/app/lib/geodetic";
import { birthToUtc } from "@/lib/astro/birth-utc";
import { determineSect, computeLotOfFortune, computeLotOfSpirit } from "@/app/lib/arabic-parts";

import { writeTeacherReading, type TeacherReadingInput } from "@/lib/ai/prompts/teacher-reading";
import type { Tone } from "@/lib/ai/schemas";
import { houseTopic, spellAngle, closenessBand, houseVibe } from "./house-topics";
import { computeSynastryAspects, classifyHouseBucket, computeRecommendation } from "./synastry";
import type { AstrocartoReadingResult, RunAstrocartoInput } from "./types";

const GOAL_INDEX_MAP: Record<string, number> = {
  love:       3,
  career:     6,
  community:  7,
  growth:     8,
  relocation: 2,
};

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
async function relocatedCuspsAt(
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

/** Pretty-format a date range from a single ISO date (with ± window). */
function formatTransitDates(dateIso: string): string {
  const d = new Date(dateIso);
  const before = new Date(d);
  before.setUTCDate(before.getUTCDate() - 2);
  const after = new Date(d);
  after.setUTCDate(after.getUTCDate() + 2);
  const fmt = (x: Date) => x.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(before)} — ${fmt(after)}`;
}

const HARMONIOUS = new Set(["trine", "sextile"]);
const TENSE = new Set(["square", "opposition"]);

function transitTone(hit: TransitHit): Tone {
  const a = hit.aspect.toLowerCase();
  if (HARMONIOUS.has(a)) return "supportive";
  if (TENSE.has(a)) return "challenging";
  // Conjunctions: lean on benefic flag
  if (a === "conjunction") return hit.benefic ? "supportive" : "challenging";
  return "neutral";
}

function aspectSentence(hit: TransitHit, transitSign: string, natalSign: string): string {
  const aspectVerb: Record<string, string> = {
    trine: "trines",
    sextile: "sextiles",
    square: "squares",
    opposition: "opposes",
    conjunction: "joins",
  };
  const verb = aspectVerb[hit.aspect.toLowerCase()] ?? hit.aspect;
  return `${hit.transit_planet} in ${transitSign} ${verb} your ${hit.natal_planet} in ${natalSign}`;
}

/**
 * Build the pre-analyzed signal handed to the AI. The AI never sees orbs,
 * degrees, points, dignity labels, or km. Only the resolved facts.
 */
function buildAIInput(args: {
  destination: string;
  travelDate: string | null;
  matrixResult: any;
  acgLines: any[];
  rawTransits: TransitHit[];
  natalPlanets: any[];
  relocatedCusps: number[];
}): TeacherReadingInput {
  const { destination, travelDate, matrixResult, acgLines, rawTransits, natalPlanets, relocatedCusps } = args;

  // Window: travel date ± 10 days, default to today + 10
  const start = travelDate ? new Date(travelDate) : new Date();
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 10);
  const dateRange = {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };

  // Top transits — closest orbs, max 3
  const topTransits = [...rawTransits]
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 3)
    .map((hit) => {
      const transitNatal = natalPlanets.find(
        (p) => String(p.name || p.planet).toLowerCase() === hit.transit_planet.toLowerCase(),
      );
      const natalNatal = natalPlanets.find(
        (p) => String(p.name || p.planet).toLowerCase() === hit.natal_planet.toLowerCase(),
      );
      const transitSign = transitNatal?.sign ?? signFromLongitude(transitNatal?.longitude ?? 0);
      const natalSign = natalNatal?.sign ?? signFromLongitude(natalNatal?.longitude ?? 0);

      // Find which house in the relocated chart this lands in
      const ascLon = relocatedCusps[0] ?? 0;
      const targetHouse = natalNatal
        ? houseFromLongitude(natalNatal.longitude, ascLon)
        : null;
      const houseTopics = targetHouse ? [houseTopic(targetHouse)].filter(Boolean) : [];

      return {
        aspect: aspectSentence(hit, transitSign, natalSign),
        planets: {
          a: `${hit.transit_planet} in ${transitSign}`,
          b: `${hit.natal_planet} in ${natalSign}`,
        },
        dateRange: formatTransitDates(hit.date),
        tone: transitTone(hit),
        houseTopics,
      };
    });

  // Nearby ACG lines — top 3 by distance
  const nearbyLines = [...(acgLines || [])]
    .sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity))
    .slice(0, 3)
    .map((l: any) => ({
      planet: l.planet,
      angle: spellAngle(l.angle || l.line || ""),
      closeness: closenessBand(l.distance_km ?? 9999),
    }));

  // Active houses — top 3 by absolute deviation from neutral 50
  const activeHouses = [...(matrixResult.houses || [])]
    .sort((a: any, b: any) => Math.abs(b.score - 50) - Math.abs(a.score - 50))
    .slice(0, 3)
    .map((h: any) => ({
      topic: houseTopic(h.house),
      vibe: houseVibe(h.score),
    }))
    .filter((h) => h.topic);

  // Natal spotlight — Sun, Moon, plus the strongest other placement
  const pick = (name: string) =>
    natalPlanets.find((p) => String(p.name || p.planet).toLowerCase() === name);
  const sun = pick("sun");
  const moon = pick("moon");
  const otherCandidates = natalPlanets.filter((p) => {
    const n = String(p.name || p.planet).toLowerCase();
    return n !== "sun" && n !== "moon";
  });
  const other = otherCandidates[0];

  const natalSpotlight = [sun, moon, other]
    .filter(Boolean)
    .map((p: any) => ({
      planet: p.name || p.planet,
      sign: p.sign || signFromLongitude(p.longitude),
      role: "Doing real work",
    }));

  return {
    destination,
    dateRange,
    overallScore: matrixResult.macroScore,
    topTransits,
    nearbyLines,
    activeHouses,
    natalSpotlight,
  };
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

    if (partnerProfile?.birth_lat != null && partnerProfile.birth_lon != null) {
      const partnerData = await loadOrComputePartnerNatal(partnerId, partnerProfile);
      partnerNatalPlanets = partnerData.planets;
      dtUtcPartner = partnerData.dtUtc;
      synastryAspects = computeSynastryAspects(natalPlanets, partnerNatalPlanets);
    }
  }

  // 3. Relocated cusps + ACG lines + transits at destination
  const relocatedCusps = await relocatedCuspsAt(dtUtcBirth, targetLat, targetLon);
  const { cityLines: acgLines, allLines: acgAllLines } = await resolveACGFull(dtUtcBirth, targetLat, targetLon);
  const refDate = travelDate ? new Date(travelDate) : new Date();
  const rawTransits = await solve12MonthTransits(natalPlanets, refDate);
  const mappedTransits = mapTransitsToMatrix(rawTransits, natalPlanets, relocatedCusps, profile.birth_lat ?? undefined);
  const globalPenalty = computeGlobalPenalty(mappedTransits);

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
  });

  const ascLon = relocatedCusps[0] ?? 0;
  const relocatedPlanets = natalPlanets.map((p: any) => ({
    name: p.planet || p.name,
    house: houseFromLongitude(p.longitude, ascLon),
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
    });

    partnerMatrix = {
      macroScore: pMatrixResult.macroScore,
      macroVerdict: pMatrixResult.macroVerdict,
      houses: pMatrixResult.houses.map((h) => ({ house: h.house, score: h.score })),
      acgLines: pAcgLines,
      relocatedCusps: pRelocatedCusps,
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
    travelDate: travelDate ?? null,
    matrixResult,
    acgLines,
    rawTransits,
    natalPlanets,
    relocatedCusps,
  });

  let teacherReading: any = undefined;
  try {
    teacherReading = await writeTeacherReading(aiInput);
  } catch (err: any) {
    console.warn("Teacher reading AI failed, persisting without it:", err?.message);
  }

  // 9. Assemble final details payload
  const result: AstrocartoReadingResult = {
    destination,
    destinationLat: targetLat,
    destinationLon: targetLon,
    travelType,
    travelDate: travelDate ?? null,
    goals: selectedGoals ?? [],
    macroScore: matrixResult.macroScore,
    macroVerdict: matrixResult.macroVerdict,
    houses: matrixResult.houses,
    houseSystem: matrixResult.houseSystem,
    planetaryLines: acgLines,
    transitWindows: rawTransits.slice(0, 10),
    eventScores,
    natalPlanets,
    relocatedCusps,
    ...(matrixResult.lotOfFortune ? { lotOfFortune: matrixResult.lotOfFortune } : {}),
    ...(matrixResult.lotOfSpirit ? { lotOfSpirit: matrixResult.lotOfSpirit } : {}),
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
