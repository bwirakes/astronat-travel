import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReadingAccess } from "@/lib/access";
import { createPendingReading } from "@/lib/readings/persist";

/**
 * /api/readings/generate — fast job creation.
 * Auth, parse, gate, create a pending reading row, and return immediately.
 * The reading page calls /api/readings/[id]/complete while showing the
 * destination loading shell, so users are not trapped on the form during LLM
 * generation.
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

    const requestedCategory = readingCategory ?? "astrocartography";
    const category: "astrocartography" | "synastry" | "mundane" =
      requestedCategory === "geodetic-weather"
        ? "mundane"
        : requestedCategory === "synastry"
          ? "synastry"
          : "astrocartography";
    const readingDate = requestedCategory === "geodetic-weather"
      ? (weather?.startDate || new Date().toISOString().slice(0, 10))
      : (travelDate || new Date().toISOString());

    if (readingCategory === "geodetic-weather") {
      const { readingId } = await createPendingReading({
        supabase,
        userId: user.id,
        category,
        readingDate,
        details: {
          generationStage: "Queued",
          generationInput: body,
          generationAccessSource: access.accessSource,
          destination,
          travelDate: readingDate,
          travelType: "trip",
        },
      });
      return NextResponse.json({ success: true, readingId, processing: true });
    }

    if (!destination || !targetLat || !targetLon) {
      return NextResponse.json(
        { error: "Missing required geospatial payload." },
        { status: 400 },
      );
    }

    const { readingId } = await createPendingReading({
      supabase,
      userId: user.id,
      partnerId: requestedCategory === "synastry" ? partner_id ?? null : null,
      category,
      readingDate,
      details: {
        generationStage: "Queued",
        generationInput: body,
        generationAccessSource: access.accessSource,
        destination,
        destinationLat: targetLat,
        destinationLon: targetLon,
        travel_type: travelType ?? "trip",
        travelType: travelType ?? "trip",
        travelDate: travelDate ?? null,
        goals: goals ?? [],
      },
    });

    return NextResponse.json({ success: true, readingId, processing: true });
  } catch (error: unknown) {
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
