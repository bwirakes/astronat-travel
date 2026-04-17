import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReadingAccess } from "@/lib/access";
import { getNatalChart, getPartnerNatalChart, getProfile, saveNatalChart, savePartnerNatalChart } from "@/lib/db";
import { SwissEphSingleton, computeRealtimePositions } from "@/lib/astro/transits";
import { resolveACGFull, computeParans } from "@/lib/astro/acg-lines";
import { solve12MonthTransits } from "@/lib/astro/transit-solver";
import { computeHouseMatrix, mapTransitsToMatrix, computeGlobalPenalty } from "@/app/lib/house-matrix";
import { computeEventScores } from "@/app/lib/scoring-engine";
import { houseFromLongitude } from "@/app/lib/geodetic";
import { birthToUtc } from "@/lib/astro/birth-utc";
import { determineSect, computeLotOfFortune, computeLotOfSpirit } from "@/app/lib/arabic-parts";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

const google = createGoogleGenerativeAI({
  // GOOGLE_GENERATIVE_AI_API_KEY is the @ai-sdk/google default; fall back to
  // GEMINI_API_KEY so both env var conventions work.
  apiKey:
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY,
});

/** Compute bi-directional synastry aspects between two sets of natal planets. */
function computeSynastryAspects(planetsA: any[], planetsB: any[]) {
  const ASPECTS = [
    { name: "conjunction", angle: 0, orb: 8, tone: "neutral" as const },
    { name: "opposition", angle: 180, orb: 8, tone: "tense" as const },
    { name: "trine", angle: 120, orb: 6, tone: "harmonious" as const },
    { name: "square", angle: 90, orb: 6, tone: "tense" as const },
    { name: "sextile", angle: 60, orb: 4, tone: "harmonious" as const },
  ];
  const results: {
    planet1: string;
    planet2: string;
    aspect: string;
    orb: number;
    tone: "harmonious" | "tense" | "neutral";
  }[] = [];
  for (const pA of planetsA) {
    for (const pB of planetsB) {
      const diff = Math.abs((pA.longitude - pB.longitude + 360) % 360);
      const angle = diff > 180 ? 360 - diff : diff;
      for (const asp of ASPECTS) {
        const orb = Math.abs(angle - asp.angle);
        if (orb <= asp.orb) {
          results.push({
            planet1: pA.planet || pA.name,
            planet2: pB.planet || pB.name,
            aspect: asp.name,
            orb: parseFloat(orb.toFixed(2)),
            tone: asp.tone,
          });
        }
      }
    }
  }
  return results;
}

/** Classify a house by user/partner score divergence. */
function classifyHouseBucket(
  userScore: number,
  partnerScore: number,
): "overlap" | "excitement" | "friction" | "neutral" {
  const delta = Math.abs(userScore - partnerScore);
  const avg = (userScore + partnerScore) / 2;
  const max = Math.max(userScore, partnerScore);
  const min = Math.min(userScore, partnerScore);
  if (avg >= 70 && delta < 15) return "overlap";
  if (max >= 80 && delta >= 15) return "excitement";
  if (delta >= 20 && min <= 55) return "friction";
  return "neutral";
}

/** Determine recommendation badge from bucket counts. */
function computeRecommendation(
  houseComparison: { bucket: string }[],
  scoreDelta: number,
): "go" | "caution" | "avoid" {
  const overlap = houseComparison.filter((h) => h.bucket === "overlap").length;
  const friction = houseComparison.filter((h) => h.bucket === "friction").length;
  if (overlap >= 3 && friction <= 1) return "go";
  if (friction >= 3 || (friction >= 2 && scoreDelta > 25)) return "avoid";
  return "caution";
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Validate Authentication
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      destination,
      travelType,
      readingCategory,
      targetLat,
      targetLon,
      travelDate,
      goals, // string[] from ReadingFlow (e.g. ["love","career"]) or legacy number[]
      partner_id, // optional UUID for synastry/couples readings
    } = body;

    // Map ReadingFlow string IDs to W_EVENTS row indices.
    // "timing" is intentionally omitted — it drives transit windows, not house weights.
    const GOAL_INDEX_MAP: Record<string, number> = {
      love:       3, // Romance  (H5 + H7)
      career:     6, // Career   (H10 + H6 + H2)
      community:  7, // Friendship (H3 + H11)
      growth:     8, // Spirituality (H8 + H9 + H12)
      relocation: 2, // Home     (H4)
    };

    if (!destination || !targetLat || !targetLon) {
      return NextResponse.json(
        { error: "Missing required geospatial payload." },
        { status: 400 },
      );
    }

    // 2. Access gate — first reading is free for everyone; after that, require subscription
    const access = await getReadingAccess(user.id);
    if (!access.canRead) {
      return NextResponse.json(
        {
          error: "Free reading already used. Subscribe for unlimited readings.",
          code: "FREE_TIER_LIMIT",
        },
        { status: 402 },
      );
    }

    // 3. Get User Profile (needed for birth data + natal computation)
    const profile = await getProfile(user.id);
    if (!profile || !profile.birth_date || !profile.birth_time) {
      return NextResponse.json(
        {
          error:
            "Incomplete birth data in profile. Please complete your profile first.",
        },
        { status: 400 },
      );
    }

    if (profile.birth_lat == null || profile.birth_lon == null) {
      return NextResponse.json(
        {
          error:
            "Birth city coordinates not found. Please re-save your profile with a valid birth city.",
        },
        { status: 400 },
      );
    }

    // 4. Cache-Aside: natal chart — compute on-the-fly if missing
    let cachedChart = await getNatalChart(user.id);
    let natalPlanets: any[];

    const dtUtcBirth = await birthToUtc(
      profile.birth_date,
      profile.birth_time,
      profile.birth_lat,
      profile.birth_lon,
    );

    if (!cachedChart || !cachedChart.ephemeris_data?.planets) {
      const sweInit = await SwissEphSingleton.getInstance();
      const birthYear  = dtUtcBirth.getUTCFullYear();
      const birthMonth = dtUtcBirth.getUTCMonth() + 1;
      const birthDay   = dtUtcBirth.getUTCDate();
      const birthHour  =
        dtUtcBirth.getUTCHours() + dtUtcBirth.getUTCMinutes() / 60.0;

      const birthJd  = sweInit.julday(birthYear, birthMonth, birthDay, birthHour);
      const birthSys = Math.abs(profile.birth_lat) >= 66 ? "W" : "P";
      const birthH   = sweInit.houses(birthJd, profile.birth_lat, profile.birth_lon, birthSys) as any;

      const birthCusps: number[] = [];
      for (let i = 1; i <= 12; i++) birthCusps.push(birthH.cusps[i.toString()]);

      const computedPlanets = await computeRealtimePositions(dtUtcBirth, birthCusps);
      const { essentialDignityLabel } = await import("@/app/lib/dignity");
      const planetsWithDignity = computedPlanets.map((p: any) => ({
        ...p,
        dignity: essentialDignityLabel(p.name, p.sign).toUpperCase(),
      }));

      const asc = birthH.ascmc["0"];
      const mc  = birthH.ascmc["1"];

      await saveNatalChart(
        user.id,
        { planets: planetsWithDignity, cusps: birthCusps, asc, mc, profile_time: dtUtcBirth.toISOString() },
        { cusps: birthCusps },
      );
      natalPlanets = planetsWithDignity;
    } else {
      natalPlanets = cachedChart.ephemeris_data.planets;
    }

    // 4b. Synastry: compute partner chart and cross-aspects for couples readings
    let partnerNatalPlanets: any[] | null = null;
    let synastryAspects: ReturnType<typeof computeSynastryAspects> = [];
    let partnerProfile: any = null;
    let dtUtcPartner: Date | null = null;

    if (readingCategory === "synastry" && partner_id) {
      const { data: pp } = await supabase
        .from("partner_profiles")
        .select("*")
        .eq("id", partner_id)
        .eq("owner_id", user.id) // ownership guard
        .maybeSingle();
      partnerProfile = pp;

      if (partnerProfile && partnerProfile.birth_lat != null && partnerProfile.birth_lon != null) {
        const cachedPartnerChart = await getPartnerNatalChart(partner_id);

        dtUtcPartner = await birthToUtc(
          partnerProfile.birth_date,
          partnerProfile.birth_time || "12:00:00",
          partnerProfile.birth_lat,
          partnerProfile.birth_lon,
        );

        if (!cachedPartnerChart || !cachedPartnerChart.ephemeris_data?.planets) {
          const sweP = await SwissEphSingleton.getInstance();
          const pJd = sweP.julday(
            dtUtcPartner.getUTCFullYear(),
            dtUtcPartner.getUTCMonth() + 1,
            dtUtcPartner.getUTCDate(),
            dtUtcPartner.getUTCHours() + dtUtcPartner.getUTCMinutes() / 60.0,
          );
          const pSys = Math.abs(partnerProfile.birth_lat) >= 66 ? "W" : "P";
          const pH = sweP.houses(pJd, partnerProfile.birth_lat, partnerProfile.birth_lon, pSys) as any;
          const pCusps: number[] = [];
          for (let i = 1; i <= 12; i++) pCusps.push(pH.cusps[i.toString()]);

          const pPlanets = await computeRealtimePositions(dtUtcPartner, pCusps);
          const { essentialDignityLabel: edLabel } = await import("@/app/lib/dignity");
          const pPlanetsWithDignity = pPlanets.map((p: any) => ({
            ...p,
            dignity: edLabel(p.name, p.sign).toUpperCase(),
          }));

          await savePartnerNatalChart(
            partner_id,
            { planets: pPlanetsWithDignity, cusps: pCusps, profile_time: dtUtcPartner.toISOString() },
            { cusps: pCusps },
          );
          partnerNatalPlanets = pPlanetsWithDignity;
        } else {
          partnerNatalPlanets = cachedPartnerChart.ephemeris_data.planets;
        }

        synastryAspects = computeSynastryAspects(natalPlanets, partnerNatalPlanets);
      }
    }

    // 5. Compute relocated house cusps at destination
    const swe = await SwissEphSingleton.getInstance();
    const year  = dtUtcBirth.getUTCFullYear();
    const month = dtUtcBirth.getUTCMonth() + 1;
    const day   = dtUtcBirth.getUTCDate();
    const hour  =
      dtUtcBirth.getUTCHours() +
      dtUtcBirth.getUTCMinutes() / 60.0 +
      dtUtcBirth.getUTCSeconds() / 3600.0;

    const jd  = swe.julday(year, month, day, hour);
    const sys = Math.abs(targetLat) >= 66 ? "W" : "P";
    const h   = swe.houses(jd, targetLat, targetLon, sys) as any;

    const relocatedCusps: number[] = [];
    for (let i = 1; i <= 12; i++) relocatedCusps.push(h.cusps[i.toString()]);

    // 6. Compute ACG lines — resolveACGFull returns both the city-filtered list
    // (for matrix scoring) and the full geometry (for paran computation),
    // calling computeACG() only once.
    const { cityLines: acgLines, allLines: acgAllLines } = await resolveACGFull(dtUtcBirth, targetLat, targetLon);

    // 7. Compute 12-month transits (replaces broken get12MonthTransits REST call)
    const refDate = travelDate ? new Date(travelDate) : new Date();
    const rawTransits = await solve12MonthTransits(natalPlanets, refDate);

    const mappedTransits = mapTransitsToMatrix(
      rawTransits,
      natalPlanets,
      relocatedCusps,
      profile.birth_lat ?? undefined,
    );
    const globalPenalty = computeGlobalPenalty(mappedTransits);

    // 8. Determine natal sect (day/night chart)
    const sunPlanet = natalPlanets.find(
      (p: any) => (p.planet || p.name || "").toLowerCase() === "sun",
    );
    const sect = sunPlanet
      ? determineSect(sunPlanet.longitude, relocatedCusps[0] ?? 0)
      : undefined;

    // 8b. Arabic Parts — Lot of Fortune & Lot of Spirit, using the relocated
    // ASC so the lots reflect the destination chart context.
    const moonPlanet = natalPlanets.find(
      (p: any) => (p.planet || p.name || "").toLowerCase() === "moon",
    );
    const relocatedAsc = relocatedCusps[0] ?? 0;
    const lotOfFortuneLon = (sunPlanet && moonPlanet)
      ? computeLotOfFortune(relocatedAsc, sunPlanet.longitude, moonPlanet.longitude, sect)
      : undefined;
    const lotOfSpiritLon = (sunPlanet && moonPlanet)
      ? computeLotOfSpirit(relocatedAsc, sunPlanet.longitude, moonPlanet.longitude, sect)
      : undefined;

    // 8c. Parans — latitudes where two ACG lines from different planets
    // intersect near the destination. Uses the full ACGLine[] geometry already
    // computed in step 6.
    const parans = computeParans(acgAllLines, targetLat);

    // 9. Run house matrix with real ACG + transit data
    // Accept both string IDs from ReadingFlow and legacy numeric indices.
    const selectedGoals: number[] | undefined = (() => {
      if (!Array.isArray(goals) || goals.length === 0) return undefined;
      const indices = goals
        .map((g: unknown) => typeof g === "string" ? GOAL_INDEX_MAP[g] : g)
        .filter((i): i is number => typeof i === "number");
      return indices.length > 0 ? indices : undefined;
    })();

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

    // 9b. Synastry: mirror the compute pipeline for the partner so we have
    // partner macro score, houses, ACG lines, and relocated cusps at the same
    // destination. Guarded so astrocartography readings skip this entirely.
    let partnerMatrix: {
      macroScore: number;
      macroVerdict: string;
      houses: { house: number; score: number }[];
      acgLines: any[];
      relocatedCusps: number[];
    } | null = null;

    if (
      readingCategory === "synastry"
      && partnerNatalPlanets
      && partnerProfile
      && dtUtcPartner
      && partnerProfile.birth_lat != null
      && partnerProfile.birth_lon != null
    ) {
      const sweP2 = await SwissEphSingleton.getInstance();
      const pYear = dtUtcPartner.getUTCFullYear();
      const pMonth = dtUtcPartner.getUTCMonth() + 1;
      const pDay = dtUtcPartner.getUTCDate();
      const pHour =
        dtUtcPartner.getUTCHours()
        + dtUtcPartner.getUTCMinutes() / 60.0
        + dtUtcPartner.getUTCSeconds() / 3600.0;
      const pJd = sweP2.julday(pYear, pMonth, pDay, pHour);
      const pSys = Math.abs(targetLat) >= 66 ? "W" : "P";
      const pH = sweP2.houses(pJd, targetLat, targetLon, pSys) as any;
      const pRelocatedCusps: number[] = [];
      for (let i = 1; i <= 12; i++) pRelocatedCusps.push(pH.cusps[i.toString()]);

      const { cityLines: pAcgLines, allLines: pAcgAllLines } = await resolveACGFull(
        dtUtcPartner,
        targetLat,
        targetLon,
      );

      const pRefDate = travelDate ? new Date(travelDate) : new Date();
      const pRawTransits = await solve12MonthTransits(partnerNatalPlanets, pRefDate);
      const pMappedTransits = mapTransitsToMatrix(
        pRawTransits,
        partnerNatalPlanets,
        pRelocatedCusps,
        partnerProfile.birth_lat ?? undefined,
      );
      const pGlobalPenalty = computeGlobalPenalty(pMappedTransits);
      const pParans = computeParans(pAcgAllLines, targetLat);

      const pSunPlanet = partnerNatalPlanets.find(
        (p: any) => (p.planet || p.name || "").toLowerCase() === "sun",
      );
      const pMoonPlanet = partnerNatalPlanets.find(
        (p: any) => (p.planet || p.name || "").toLowerCase() === "moon",
      );
      const pRelocatedAsc = pRelocatedCusps[0] ?? 0;
      const pSect = pSunPlanet
        ? determineSect(pSunPlanet.longitude, pRelocatedAsc)
        : undefined;
      const pLotOfFortuneLon = (pSunPlanet && pMoonPlanet)
        ? computeLotOfFortune(pRelocatedAsc, pSunPlanet.longitude, pMoonPlanet.longitude, pSect)
        : undefined;
      const pLotOfSpiritLon = (pSunPlanet && pMoonPlanet)
        ? computeLotOfSpirit(pRelocatedAsc, pSunPlanet.longitude, pMoonPlanet.longitude, pSect)
        : undefined;

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
        lotOfFortuneLon: pLotOfFortuneLon,
        lotOfSpiritLon: pLotOfSpiritLon,
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

    // 9c. Derive houseComparison[] + scoreDelta + recommendation when synastry.
    let synastryDerived: {
      houseComparison: {
        house: number;
        userScore: number;
        partnerScore: number;
        delta: number;
        avg: number;
        bucket: "overlap" | "excitement" | "friction" | "neutral";
      }[];
      scoreDelta: number;
      averageScore: number;
      recommendation: "go" | "caution" | "avoid";
    } | null = null;

    if (partnerMatrix) {
      const userHousesMap = new Map(
        matrixResult.houses.map((h) => [h.house, h.score]),
      );
      const partnerHousesMap = new Map(
        partnerMatrix.houses.map((h) => [h.house, h.score]),
      );
      const houseComparison = Array.from({ length: 12 }, (_, i) => {
        const houseNum = i + 1;
        const userScore = userHousesMap.get(houseNum) ?? 0;
        const partnerScore = partnerHousesMap.get(houseNum) ?? 0;
        return {
          house: houseNum,
          userScore,
          partnerScore,
          delta: Math.abs(userScore - partnerScore),
          avg: (userScore + partnerScore) / 2,
          bucket: classifyHouseBucket(userScore, partnerScore),
        };
      });

      const scoreDelta = Math.abs(
        matrixResult.macroScore - partnerMatrix.macroScore,
      );
      const averageScore =
        (matrixResult.macroScore + partnerMatrix.macroScore) / 2;
      const recommendation = computeRecommendation(houseComparison, scoreDelta);

      synastryDerived = {
        houseComparison,
        scoreDelta,
        averageScore,
        recommendation,
      };
    }

    // 10. AI insights — graceful fallback if Gemini fails
    const DEFAULT_AI_INSIGHTS = {
      primary:   { label: "MACRO OVERVIEW",         title: "The Astrological Verdict", content: "Chart matrix computed. AI synthesis unavailable." },
      highest:   { label: "HIGHEST ENERGY",          title: "Peak Resonance",           content: "Review the house breakdown for your strongest sector." },
      vulnerable:{ label: "FRICTION POINT",          title: "Vulnerability Score",       content: "Review the house breakdown for friction points." },
      timing:    { label: "OPTIMAL ACTION WINDOW",   title: "Peak Timing",              content: "Review the transit window for peak dates." },
    };

    let aiInsights = DEFAULT_AI_INSIGHTS;

    try {
      const aiPayload = JSON.stringify({
        destination,
        macroScore:   matrixResult.macroScore,
        macroVerdict: matrixResult.macroVerdict,
        houses:       matrixResult.houses,
        acgLines:     acgLines.slice(0, 5),
        peakTransits: rawTransits.slice(0, 10),
      });

      const { object } = await generateObject({
        model: google("gemini-3.1-flash-lite-preview"),
        system: `You are the principal astrologer for AstroNat, a premium, brutalist, Gen-Z/Millennial travel astrology platform. Your voice is direct, architectural, uncompromising, and highly analytical.
You avoid spiritual fluff (no "universe", "vibrations", "manifesting"). You speak in terms of friction, leverage, angles, dominance, and mathematical inevitability.

I will provide you with a JSON payload representing a user's relocated astrological score for a specific city. The payload includes macro scores, house dominance, ACG line proximity, and peak transit windows.

Your task is to synthesize this data into 4 specific editorial "Verdict" paragraphs. Return ONLY a pure JSON object matching the schema.`,
        prompt: `Relocation Data Payload:\n${aiPayload}`,
        schema: z.object({
          primary:    z.object({ label: z.string(), title: z.string(), content: z.string() }),
          highest:    z.object({ label: z.string(), title: z.string(), content: z.string() }),
          vulnerable: z.object({ label: z.string(), title: z.string(), content: z.string() }),
          timing:     z.object({ label: z.string(), title: z.string(), content: z.string() }),
        }),
      });

      aiInsights = object;
    } catch (aiErr: any) {
      console.warn("AI insights generation failed, using defaults:", aiErr?.message);
    }

    // 11. Build full reading detail payload
    const detailedResult = {
      destination,
      destinationLat:  targetLat,
      destinationLon:  targetLon,
      travelType,
      travelDate:      travelDate || null,
      goals:           selectedGoals ?? [],
      macroScore:      matrixResult.macroScore,
      macroVerdict:    matrixResult.macroVerdict,
      houses:          matrixResult.houses,
      houseSystem:     matrixResult.houseSystem,
      // planetaryLines stores ACGCityLine[] (planet, angle, distance_km) for
      // house-matrix scoring only — no curve geometry.
      // The AcgMap component recomputes full ACGLine[] from natalPlanets at
      // render time (natalPlanets is stored below), so there is no need to
      // persist redundant curve_segments here.
      planetaryLines:  acgLines,
      transitWindows:  rawTransits.slice(0, 10),
      eventScores,
      aiInsights,
      natalPlanets,
      relocatedCusps,
      ...(matrixResult.lotOfFortune ? { lotOfFortune: matrixResult.lotOfFortune } : {}),
      ...(matrixResult.lotOfSpirit  ? { lotOfSpirit:  matrixResult.lotOfSpirit  } : {}),
      ...(partnerNatalPlanets ? { partnerNatalPlanets, synastryAspects } : {}),
      ...(partnerMatrix && synastryDerived
        ? {
            // Explicit per-side fields for the couples comparison UI.
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

    // 12. Write to `readings` table
    const { data: newReading, error: readingError } = await supabase
      .from("readings")
      .insert({
        user_id:       user.id,
        partner_id:    (readingCategory === "synastry" && partner_id) ? partner_id : null,
        category:      readingCategory || "astrocartography",
        reading_date:  travelDate || new Date().toISOString(),
        reading_score: matrixResult.macroScore,
        details:       detailedResult,
      })
      .select("id")
      .single();

    if (readingError) throw readingError;

    // 13. Write to `searches` table (non-blocking — log failure, don't throw)
    const searchPayload = {
      user_id:      user.id,
      destination,
      dest_lat:     targetLat,
      dest_lon:     targetLon,
      travel_date:  travelDate ? new Date(travelDate).toISOString().split("T")[0] : null,
      travel_type:  travelType === "relocation" ? "relocation" : "trip",
      macro_score:  matrixResult.macroScore,
      verdict:      matrixResult.macroVerdict,
      score_detail: {
        houseScores: matrixResult.houses.map((h) => ({ house: h.house, score: h.score })),
        eventScores,
        goals: selectedGoals ?? [],
      },
    };

    const { error: searchError } = await supabase
      .from("searches")
      .insert(searchPayload);

    if (searchError) {
      console.warn("Failed to write to searches table:", searchError.message);
    }

    // 14. Return reading UUID for client routing
    return NextResponse.json({ success: true, readingId: newReading.id });
  } catch (error: any) {
    console.error("Failed to generate reading:", error);
    return NextResponse.json(
      {
        error:   "Internal Server Error",
        message: error.message,
        stack:   process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
