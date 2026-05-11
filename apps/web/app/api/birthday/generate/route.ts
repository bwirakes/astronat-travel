import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getNatalChart, getProfile } from "@/lib/db";
import { SwissEphSingleton } from "@/lib/astro/transits";
import { computeHouseMatrix, mapTransitsToMatrix, computeGlobalPenalty } from "@/app/lib/house-matrix";
import { houseFromLongitude } from "@/app/lib/geodetic";
import { determineSect } from "@/app/lib/arabic-parts";

// Curated list of top global cities to evaluate for Solar Returns
// In a production environment, this could be stored in a database
const TOP_CITIES = [
  { name: "Tokyo, Japan", lat: 35.6762, lon: 139.6503 },
  { name: "Bali, Indonesia", lat: -8.3405, lon: 115.0920 },
  { name: "Paris, France", lat: 48.8566, lon: 2.3522 },
  { name: "New York, USA", lat: 40.7128, lon: -74.0060 },
  { name: "Lisbon, Portugal", lat: 38.7223, lon: -9.1393 },
  { name: "Barcelona, Spain", lat: 41.3851, lon: 2.1734 },
  { name: "Cape Town, South Africa", lat: -33.9249, lon: 18.4241 },
  { name: "Sydney, Australia", lat: -33.8688, lon: 151.2093 },
  { name: "Rio de Janeiro, Brazil", lat: -22.9068, lon: -43.1729 },
  { name: "Berlin, Germany", lat: 52.5200, lon: 13.4050 },
  { name: "London, UK", lat: 51.5074, lon: -0.1278 },
  { name: "Dubai, UAE", lat: 25.2048, lon: 55.2708 },
  { name: "Mexico City, Mexico", lat: 19.4326, lon: -99.1332 },
  { name: "Buenos Aires, Argentina", lat: -34.6037, lon: -58.3816 },
  { name: "Bangkok, Thailand", lat: 13.7563, lon: 100.5018 },
  { name: "Seoul, South Korea", lat: 37.5665, lon: 126.9780 },
  { name: "Rome, Italy", lat: 41.9028, lon: 12.4964 },
  { name: "Istanbul, Turkey", lat: 41.0082, lon: 28.9784 },
  { name: "Cairo, Egypt", lat: 30.0444, lon: 31.2357 },
  { name: "Mumbai, India", lat: 19.0760, lon: 72.8777 },
];

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { year } = body;

    if (!year) {
      return NextResponse.json({ error: "Missing required year parameter." }, { status: 400 });
    }

    const cachedChart = await getNatalChart(user.id);
    if (!cachedChart || !cachedChart.ephemeris_data || !cachedChart.ephemeris_data.planets) {
      return NextResponse.json({ error: "Natal chart not found." }, { status: 400 });
    }

    const natalPlanets = cachedChart.ephemeris_data.planets;
    const profile = await getProfile(user.id);
    if (!profile || !profile.birth_date || !profile.birth_time) {
      return NextResponse.json({ error: "Incomplete birth data in profile" }, { status: 400 });
    }

    // Solar Return is essentially the user's birth date shifted to the selected year.
    // Use the same timezone-correct conversion helper as /api/natal so houses
    // aren't rotated by the tz offset.
    const { birthToUtc } = await import("@/lib/astro/birth-utc");
    const birthMonthDay = profile.birth_date.substring(5); // MM-DD
    const dtUtc = await birthToUtc(
      `${year}-${birthMonthDay}`,
      profile.birth_time,
      profile.birth_lat ?? 0,
      profile.birth_lon ?? 0,
    );

    const swe = await SwissEphSingleton.getInstance();
    const dtYear = dtUtc.getUTCFullYear();
    const dtMonth = dtUtc.getUTCMonth() + 1;
    const dtDay = dtUtc.getUTCDate();
    const dtHour = dtUtc.getUTCHours() + dtUtc.getUTCMinutes() / 60.0 + dtUtc.getUTCSeconds() / 3600.0;
    
    const jd = swe.julday(dtYear, dtMonth, dtDay, dtHour);

    // Evaluate each city for the Solar Return
    const results = [];

    for (const city of TOP_CITIES) {
      const sys = Math.abs(city.lat) >= 66 ? 'W' : 'P';
      const h = swe.houses(jd, city.lat, city.lon, sys) as any;
      
      const relocatedCusps: number[] = [];
      for (let i = 1; i <= 12; i++) {
          relocatedCusps.push(h.cusps[i.toString()]);
      }

      // Compute sect: Sun planet from natal chart vs relocated ASC
      const sunPlanetForSect = natalPlanets.find((p: any) =>
          (p.planet || p.name || "").toLowerCase() === "sun"
      );
      const sect = sunPlanetForSect
          ? determineSect(sunPlanetForSect.longitude, relocatedCusps[0] ?? 0)
          : undefined;

      // Compute Matrix for this city
      const matrixResult = computeHouseMatrix({
          natalPlanets,
          relocatedCusps,
          acgLines: [],
          transits: [],
          parans: [],
          destLat: city.lat,
          destLon: city.lon,
          birthLat: profile.birth_lat || undefined,
          sect,
      });

      let highestScoreHouse = matrixResult.houses.reduce((prev, current) => (prev.score > current.score) ? prev : current);

      results.push({
        name: city.name,
        score: matrixResult.macroScore,
        verdict: `Strong potential for ${highestScoreHouse.sphere.toLowerCase()} themes. ${matrixResult.macroVerdict} year ahead.`
      });
    }

    // Sort by descending score
    results.sort((a, b) => b.score - a.score);

    return NextResponse.json({ success: true, results: results.slice(0, 10) });

  } catch (error: any) {
    console.error("Failed to generate birthday locations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
