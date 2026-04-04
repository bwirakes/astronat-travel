import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeDailyWeather } from "@/lib/astro/transits";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  
  // Fetch user profile (assuming profile stores natal_planets and house_cusps)
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("user_id, display_name, natal_chart, house_cusps")
    .eq("user_id", userId)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "User profile not found" }, { status: 404 });
  }

  // Parse natal charts from the profile
  const natalPlanets = typeof profile.natal_chart === 'string' ? JSON.parse(profile.natal_chart) : profile.natal_chart;
  const houseCusps = typeof profile.house_cusps === 'string' ? JSON.parse(profile.house_cusps) : profile.house_cusps;

  const weather = await computeDailyWeather(
    { 
      user_id: profile.user_id, 
      display_name: profile.display_name, 
      natal_planets: natalPlanets, 
      house_cusps: houseCusps 
    },
    date
  );

  return NextResponse.json(weather);
}
