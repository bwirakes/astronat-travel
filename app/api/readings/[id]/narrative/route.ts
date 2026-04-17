import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getNatalChart } from "@/lib/db";
import { getSkyForDate } from "@/lib/astro/ephemeris-cache";
import { calculateAspect } from "@/lib/astro/aspects";
import { signFromLongitude, houseFromLongitude } from "@/app/lib/geodetic";
import { SIGN_RULERS } from "@/app/lib/astro-constants";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY,
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Auth guard
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch reading
    const { data: reading, error: readingError } = await supabase
      .from("readings")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (readingError || !reading) {
      return NextResponse.json(
        { error: "Reading not found" },
        { status: 404 }
      );
    }

    // Return cached narrative if it exists
    if (reading.details?.narrative) {
      return NextResponse.json({ narrative: reading.details.narrative });
    }

    const details = reading.details || {};

    // Step A: ACG line orb tiers
    const acgLines = (details.planetaryLines || []).slice(0, 6).map((l: any) => ({
      planet: l.planet,
      angle: l.angle,
      dist_km: Math.round(l.distance_km),
      tier:
        l.distance_km < 250
          ? "Intense"
          : l.distance_km < 500
            ? "Strong"
            : l.distance_km < 800
              ? "Moderate"
              : "Background",
    }));

    // Step B: World transits (sky-to-sky on travel date)
    const travelDate = details.travelDate
      ? new Date(details.travelDate)
      : new Date();
    const skyPositions = await getSkyForDate(travelDate);
    const worldTransits: any[] = [];

    for (let i = 0; i < skyPositions.length; i++) {
      for (let j = i + 1; j < skyPositions.length; j++) {
        const result = calculateAspect(
          skyPositions[i].longitude,
          skyPositions[j].longitude,
          skyPositions[i].name,
          skyPositions[j].name
        );
        if (result && result.orb <= 4) {
          const isTense = ["Square", "Opposition"].includes(result.aspect) &&
            ["Mars", "Saturn", "Pluto", "Uranus"].some((m) =>
              [skyPositions[i].name, skyPositions[j].name].includes(m)
            );

          worldTransits.push({
            p1: skyPositions[i].name,
            p2: skyPositions[j].name,
            aspect: result.aspect.toLowerCase(),
            orb: parseFloat(result.orb.toFixed(2)),
            applying: skyPositions[i].speed > 0,
            tense: isTense,
          });
        }
      }
    }

    // Step C: Chart ruler (derives relocated ASC sign → traditional ruler → natal/relocated house)
    const natalChart = await getNatalChart(user.id);
    const natalAscLon = natalChart?.ephemeris_data?.cusps?.[0] ?? 0;

    const relocatedAscLon = (details.relocatedCusps ?? [])[0] ?? 0;
    const relocatedAscSign = signFromLongitude(relocatedAscLon);
    const natalAscSign = signFromLongitude(natalAscLon);
    const chartRulerPlanet = SIGN_RULERS[relocatedAscSign];

    const rulerPlanetData = (details.natalPlanets ?? []).find(
      (p: any) =>
        (p.planet || p.name || "").toLowerCase() ===
        chartRulerPlanet.toLowerCase()
    );

    const chart = {
      natalAscSign,
      relocatedAscSign,
      chartRuler: chartRulerPlanet,
      chartRulerNatalHouse: rulerPlanetData
        ? houseFromLongitude(rulerPlanetData.longitude, natalAscLon)
        : null,
      chartRulerRelocatedHouse: rulerPlanetData
        ? houseFromLongitude(rulerPlanetData.longitude, relocatedAscLon)
        : null,
    };

    // Step D: Assemble final payload
    const narrativePayload = {
      destination: details.destination,
      travelDate: details.travelDate,
      macroScore: details.macroScore,
      macroVerdict: details.macroVerdict,
      acgLines,
      transits: (details.transitWindows ?? []).slice(0, 8),
      worldTransits: worldTransits.slice(0, 8),
      chart,
      topHouses: [...(details.houses ?? [])]
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 3)
        .map((h: any) => ({ house: h.house, score: h.score })),
      worstHouses: [...(details.houses ?? [])]
        .sort((a: any, b: any) => a.score - b.score)
        .slice(0, 2)
        .map((h: any) => ({ house: h.house, score: h.score })),
    };

    // Step 3: Gemini generateObject call
    const NarrativeSection = z.object({
      title: z.string(),
      content: z.string(),
    });

    const { object: narrative } = await generateObject({
      model: google("gemini-3.1-flash-lite-preview"),
      system: `You are the principal astrologer for AstroNat — a premium, brutalist, Gen-Z/Millennial travel astrology platform.
Your voice is editorial, precise, and architectural. You avoid generic spiritual language ("universe", "vibrations", "manifesting").
Speak in terms of friction, leverage, angles, dominance, and mathematical pressure.
Each section should be 2–3 paragraphs. Be specific — name planets, aspects, and houses. No filler sentences.`,

      prompt: `Generate a 6-section astrological narrative for this relocation reading. Data:\n${JSON.stringify(narrativePayload, null, 2)}

Sections:
1. "permanentMap" — Analyze the ACG lines. For each line, state the orb tier, what the angle type (MC/IC/ASC/DSC) activates, and whether it adds leverage or friction to the destination.
2. "personalTiming" — Analyze the personal transits. State which aspects are applying vs separating, the orb, benefic/malefic nature. End with 1–2 specific recommended travel windows within 30 days of travelDate.
3. "collectiveClimate" — Analyze the world transits. Name applying tense aspects and their risk, and any amplifying benefic configurations. This affects everyone at the destination, not just this person.
4. "relocatedChart" — Analyze the chart ruler shift. Use EXACTLY the provided chart data: natal ASC sign, relocated ASC sign, chart ruler planet, and its house shift. Explain what this house shift means for the travel experience.
5. "countryChart" — Use your training knowledge of the country's founding/independence chart. What transits currently aspect the country's natal placements? What collective energy does this create for a visitor?
6. "verdict" — Synthesize all sections. Provide structured output only: bestWindows (1–2 date ranges + reason), datesAvoid (any hard transits within ±7 days of travelDate + why), bestHouses (top 2–3 activated houses + what they enable).`,

      schema: z.object({
        permanentMap: NarrativeSection,
        personalTiming: NarrativeSection,
        collectiveClimate: NarrativeSection,
        relocatedChart: NarrativeSection,
        countryChart: NarrativeSection,
        verdict: z.object({
          title: z.string(),
          content: z.string(),
          bestWindows: z.array(z.string()),
          datesAvoid: z.array(z.string()),
          bestHouses: z.array(z.string()),
        }),
      }),
    });

    // Step 4: Store back to Supabase (patch only narrative key)
    await supabase
      .from("readings")
      .update({ details: { ...reading.details, narrative } })
      .eq("id", id);

    return NextResponse.json({ narrative });
  } catch (error: any) {
    console.error("Failed to generate narrative:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
