import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getNatalChart } from "@/lib/db";
import { findAllAspects, PlanetPosition } from "@/lib/astro/aspects";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { captureServerError } from "@/lib/monitoring/sentry";

export async function GET(request: NextRequest) {
  try {
    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limited = await enforceRateLimit(request, "astroCompute", user.id);
    if (limited) return limited;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || new Date().toISOString().split("T")[0];
    const months = Math.min(parseInt(searchParams.get("months") || "12", 10), 24);

    const chart = await getNatalChart(user.id);
    const natalPlanets = (chart?.ephemeris_data as { planets?: PlanetPosition[] } | null | undefined)?.planets;
    if (!natalPlanets?.length) {
      return NextResponse.json({ error: "Natal chart not found" }, { status: 404 });
    }

    const supabase = createAdminClient();
    const start = new Date(startDate);
    const end = new Date(startDate);
    end.setMonth(end.getMonth() + months);

    const { data: transitRows, error: transitErr } = await supabase
      .from("ephemeris_daily")
      .select("date_ut, planet_name, longitude")
      .gte("date_ut", start.toISOString().split("T")[0])
      .lte("date_ut", end.toISOString().split("T")[0])
      .order("date_ut", { ascending: true });

    if (transitErr || !transitRows) {
      return NextResponse.json({ error: "No transit data found for this range" }, { status: 500 });
    }

    const transitsByDate: Record<string, PlanetPosition[]> = {};
    transitRows.forEach((row) => {
      if (!transitsByDate[row.date_ut]) transitsByDate[row.date_ut] = [];
      transitsByDate[row.date_ut].push({
        name: row.planet_name,
        longitude: row.longitude,
      });
    });

    const results = Object.entries(transitsByDate)
      .map(([date, planets]) => {
        const hits = findAllAspects(planets, natalPlanets);
        return {
          date,
          aspects: hits.filter((h) => h.orb <= 1.5),
        };
      })
      .filter((day) => day.aspects.length > 0);

    return NextResponse.json(results);
  } catch (error) {
    captureServerError(error, { route: "/api/astro/transits", method: "GET" });
    console.error("[/api/astro/transits]", error);
    return NextResponse.json({ error: "Transit computation failed" }, { status: 500 });
  }
}
