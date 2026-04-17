import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getNatalChart, getPartnerNatalChart, getProfile, saveNatalChart, savePartnerNatalChart } from "@/lib/db";
import { SwissEphSingleton, computeRealtimePositions } from "@/lib/astro/transits";
import { resolveACGFull, computeParans } from "@/lib/astro/acg-lines";
import { solve12MonthTransits } from "@/lib/astro/transit-solver";
import { computeHouseMatrix, mapTransitsToMatrix, computeGlobalPenalty } from "@/app/lib/house-matrix";
import { computeEventScores } from "@/app/lib/scoring-engine";
import { houseFromLongitude } from "@/app/lib/geodetic";
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
    { name: "conjunction", angle: 0, orb: 8 },
    { name: "opposition", angle: 180, orb: 8 },
    { name: "trine", angle: 120, orb: 6 },
    { name: "square", angle: 90, orb: 6 },
    { name: "sextile", angle: 60, orb: 4 },
  ];
  const results: { planet1: string; planet2: string; aspect: string; orb: number }[] = [];
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
          });
        }
      }
    }
  }
  return results;
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

    // 2. Subscription gate — require an active or trialing subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("id, status")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    if (!subscription) {
      return NextResponse.json(
        { error: "Active subscription required to generate readings.", code: "SUBSCRIPTION_REQUIRED" },
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

    const birthDtStr = `${profile.birth_date}T${
      profile.birth_time.length === 5
        ? profile.birth_time + ":00"
        : profile.birth_time
    }Z`;
    const dtUtcBirth = new Date(birthDtStr);

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

    if (readingCategory === "synastry" && partner_id) {
      const { data: partnerProfile } = await supabase
        .from("partner_profiles")
        .select("*")
        .eq("id", partner_id)
        .eq("owner_id", user.id) // ownership guard
        .maybeSingle();

      if (partnerProfile && partnerProfile.birth_lat != null && partnerProfile.birth_lon != null) {
        const cachedPartnerChart = await getPartnerNatalChart(partner_id);

        const pBirthTimeStr = partnerProfile.birth_time?.length === 5
          ? partnerProfile.birth_time + ":00"
          : (partnerProfile.birth_time || "12:00:00");
        const dtUtcPartner = new Date(`${partnerProfile.birth_date}T${pBirthTimeStr}Z`);

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
