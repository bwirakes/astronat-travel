import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReadingAccess } from "@/lib/access";
import { runAstrocarto } from "@/lib/readings/astrocarto";
import { runGeodeticWeather } from "@/lib/readings/geodetic-weather";
import { persistReading, logSearch } from "@/lib/readings/persist";
import { computeHeroScore } from "@/app/lib/hero-score";

/**
 * /api/readings/generate — thin dispatcher.
 * Auth, parse, gate, route to the appropriate compute pipeline, persist, return.
 * All math + AI synthesis lives in lib/readings/* and lib/ai/*.
 */

const FREE_TIER_LIMIT = {
  error: "Free reading already used. Subscribe for unlimited readings.",
  code: "FREE_TIER_LIMIT",
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const access = await getReadingAccess(user.id);
    if (!access.canRead) {
      return NextResponse.json(FREE_TIER_LIMIT, { status: 402 });
    }

    const body = await req.json();
    const {
      destination,
      travelType,
      readingCategory,
      targetLat,
      targetLon,
      travelDate,
      goals,
      partner_id,
      weather,
    } = body;

    // ── Geodetic weather branch ──────────────────────────────────────────
    if (readingCategory === "geodetic-weather") {
      const { result, macroScore, startDate } = await runGeodeticWeather({
        user,
        destination,
        weather,
        supabase,
        origin: new URL(req.url).origin,
      });
      const hero = computeHeroScore(result as any, startDate);
      const { readingId } = await persistReading({
        supabase,
        userId: user.id,
        category: "mundane",
        readingDate: startDate,
        readingScore: hero.score,
        details: { ...result, heroWindowScore: hero.score, heroScoreSource: hero.source },
      });
      return NextResponse.json({ success: true, readingId });
    }

    // ── Astrocartography / Synastry branch ───────────────────────────────
    if (!destination || !targetLat || !targetLon) {
      return NextResponse.json(
        { error: "Missing required geospatial payload." },
        { status: 400 },
      );
    }

    const { result, partnerId } = await runAstrocarto({
      user,
      destination,
      targetLat,
      targetLon,
      travelDate,
      travelType,
      goals,
      readingCategory: readingCategory ?? "astrocartography",
      partnerId: partner_id ?? null,
      supabase,
    });

    const readingDate = travelDate || new Date().toISOString();
    const hero = computeHeroScore(result as any, readingDate);
    const { readingId } = await persistReading({
      supabase,
      userId: user.id,
      partnerId,
      category: readingCategory ?? "astrocartography",
      readingDate,
      readingScore: hero.score,
      details: { ...result, heroWindowScore: hero.score, heroScoreSource: hero.source },
    });

    // Non-blocking: log to searches table for analytics
    await logSearch({
      supabase,
      userId: user.id,
      destination: result.destination,
      destLat: targetLat,
      destLon: targetLon,
      travelDate: travelDate ?? null,
      travelType: travelType ?? "trip",
      macroScore: result.macroScore,
      macroVerdict: result.macroVerdict,
      houseScores: result.houses.map((h: any) => ({ house: h.house, score: h.score })),
      eventScores: result.eventScores,
      goals: result.goals,
    });

    return NextResponse.json({ success: true, readingId });
  } catch (error: any) {
    console.error("Failed to generate reading:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
