import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReadingAccess } from "@/lib/access";
import { computeHeroScore } from "@/app/lib/hero-score";
import { capturePostHogEvent } from "@/lib/posthog-server";
import { runAstrocarto } from "@/lib/readings/astrocarto";
import { runGeodeticWeather } from "@/lib/readings/geodetic-weather";
import { logSearch, persistReading } from "@/lib/readings/persist";
import type { Database } from "@/lib/supabase/types";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { captureServerError } from "@/lib/monitoring/sentry";

export const maxDuration = 300;

/**
 * /api/readings/generate — thin dispatcher.
 * Auth, parse, gate, compute deterministic reading, persist, return.
 * The route returns only after the reading row is usable, matching the
 * pre-pending-row flow and avoiding detail-page polling loops.
 */

const FREE_TIER_LIMIT = {
  error: "Free reading already used. Subscribe for unlimited readings.",
  code: "FREE_TIER_LIMIT",
};

type ReadingCategory = Database["public"]["Enums"]["reading_category"];
type GenerationBody = {
  destination?: string;
  travelType?: string;
  readingCategory?: ReadingCategory | "geodetic-weather";
  targetLat?: number;
  targetLon?: number;
  travelDate?: string | null;
  goals?: unknown[];
  partner_id?: string | null;
  weather?: Parameters<typeof runGeodeticWeather>[0]["weather"];
  [key: string]: unknown;
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

    const limited = await enforceRateLimit(req, "readingGenerate", user.id);
    if (limited) return limited;

    const access = await getReadingAccess(user.id);
    if (!access.canRead) {
      return NextResponse.json(FREE_TIER_LIMIT, { status: 402 });
    }

    const body = (await req.json()) as GenerationBody;
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

    const requestedCategory = readingCategory ?? "astrocartography";
    const category: ReadingCategory =
      requestedCategory === "geodetic-weather"
        ? "mundane"
        : requestedCategory === "synastry"
          ? "synastry"
          : "astrocartography";
    const readingDate = requestedCategory === "geodetic-weather"
      ? (weather?.startDate || new Date().toISOString().slice(0, 10))
      : (travelDate || new Date().toISOString());

    if (readingCategory === "geodetic-weather") {
      if (!weather) {
        return NextResponse.json({ error: "Missing weather payload." }, { status: 400 });
      }
      const { result, startDate } = await runGeodeticWeather({
        user,
        destination,
        weather,
        supabase,
        origin: new URL(req.url).origin,
      });
      const hero = computeHeroScore(result as never, startDate);
      const { readingId } = await persistReading({
        supabase,
        userId: user.id,
        category,
        readingDate: startDate,
        readingScore: hero.score,
        details: {
          ...result,
          generationInput: body,
          heroWindowScore: hero.score,
          heroScoreSource: hero.source,
        },
      });
      await capturePostHogEvent({
        distinctId: user.id,
        event: "reading_generated",
        properties: {
          reading_id: readingId,
          reading_category: "geodetic-weather",
          destination,
          macro_score: hero.score,
        },
      });
      return NextResponse.json({ success: true, readingId });
    }

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
      readingCategory: category,
      partnerId: partner_id ?? null,
      supabase,
    });
    if (result.generationTimings) {
      console.info("[readings/generate] astrocarto timings", {
        readingCategory: category,
        travelType: travelType ?? "trip",
        totalMs: result.generationTimings.totalMs,
        stepsMs: result.generationTimings.stepsMs,
      });
    }

    const hero = computeHeroScore(result as never, readingDate);
    const { readingId } = await persistReading({
      supabase,
      userId: user.id,
      partnerId,
      category,
      readingDate,
      readingScore: hero.score,
      details: {
        ...result,
        generationInput: body,
        heroWindowScore: hero.score,
        heroScoreSource: hero.source,
      },
    });

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
      houseScores: result.houses.map((h: { house: number; score: number }) => ({ house: h.house, score: h.score })),
      eventScores: result.eventScores,
      goals: result.goals,
    });

    await capturePostHogEvent({
      distinctId: user.id,
      event: "reading_generated",
      properties: {
        reading_id: readingId,
        reading_category: readingCategory ?? "astrocartography",
        destination: result.destination,
        travel_type: travelType ?? "trip",
        macro_score: result.macroScore,
        has_partner: !!partnerId,
        goals: goals ?? [],
      },
    });

    return NextResponse.json({ success: true, readingId });
  } catch (error: unknown) {
    captureServerError(error, { route: "/api/readings/generate", method: "POST" });
    console.error("Failed to generate reading:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
