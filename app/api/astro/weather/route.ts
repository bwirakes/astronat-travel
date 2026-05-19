import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeDailyWeather } from "@/lib/astro/transits";
import { getNatalChart, getProfileFresh } from "@/lib/db";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { captureServerError } from "@/lib/monitoring/sentry";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limited = await enforceRateLimit(request, "astroCompute", user.id);
    if (limited) return limited;

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const [profile, chart] = await Promise.all([getProfileFresh(user.id), getNatalChart(user.id)]);
    const ephemeris = chart?.ephemeris_data as { planets?: unknown[]; cusps?: number[] } | null | undefined;

    if (!profile || !ephemeris?.planets || !ephemeris?.cusps) {
      return NextResponse.json({ error: "Natal chart not found" }, { status: 404 });
    }

    const weather = await computeDailyWeather(
      {
        user_id: user.id,
        display_name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "AstroNat user",
        natal_planets: ephemeris.planets,
        house_cusps: ephemeris.cusps,
      },
      date,
    );

    return NextResponse.json(weather);
  } catch (error) {
    captureServerError(error, { route: "/api/astro/weather", method: "GET" });
    console.error("[/api/astro/weather]", error);
    return NextResponse.json({ error: "Weather computation failed" }, { status: 500 });
  }
}
