import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAllAspects, PlanetPosition } from "@/lib/astro/aspects";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const startDate = searchParams.get("startDate") || new Date().toISOString().split("T")[0];
  const months = parseInt(searchParams.get("months") || "12");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  
  // 1. Fetch user profile
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("user_id, display_name, natal_chart")
    .eq("user_id", userId)
    .single();

  if (profileErr || !profile) {
    return NextResponse.json({ error: "User profile not found" }, { status: 404 });
  }

  const natalPlanets: PlanetPosition[] = typeof profile.natal_chart === 'string' ? JSON.parse(profile.natal_chart) : profile.natal_chart;

  // 2. Fetch daily transit positions from Supabase for the next X months
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

  // 3. Group transit data by date and calculate aspects vs natal
  const transitsByDate: Record<string, PlanetPosition[]> = {};
  transitRows.forEach(row => {
    if (!transitsByDate[row.date_ut]) transitsByDate[row.date_ut] = [];
    transitsByDate[row.date_ut].push({
      name: row.planet_name,
      longitude: row.longitude
    });
  });

  // 4. Calculate aspects for each day (filtering only for tight orbs/exacts)
  const results = Object.entries(transitsByDate).map(([date, planets]) => {
    const hits = findAllAspects(planets, natalPlanets);
    // Return only exact or close aspects to reduce data size
    return {
      date,
      aspects: hits.filter(h => h.orb <= 1.5) // 1.5° orb for transits
    };
  }).filter(day => day.aspects.length > 0);

  return NextResponse.json(results);
}
