import { NextRequest, NextResponse } from "next/server";
import { computeACG, haversineDistance } from "@/lib/astro/astrocartography";
import { geocodeCity } from "@/lib/geo/geocode";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cityQuery = searchParams.get("city");
  const dateStr = searchParams.get("date") || new Date().toISOString();

  if (!cityQuery) {
    return NextResponse.json({ error: "city is required" }, { status: 400 });
  }

  try {
    // 1. Geocode the location
    const location = await geocodeCity(cityQuery);
    
    // 2. Compute all 40 ACG lines for the given time
    const dt = new Date(dateStr);
    const lines = await computeACG(dt);

    // 3. Find closest distance to each line
    const results = lines.map(line => {
      let minDistance = Infinity;

      if (line.angle_type === "MC" || line.angle_type === "IC") {
        // Vertical lines: distance is simply along the same latitude to the line's longitude
        minDistance = haversineDistance(location.latitude, location.longitude, location.latitude, line.longitude!);
      } else {
        // Oblique curves: check all pre-computed segments (±3 degrees optimization)
        if (line.curve_segments) {
          for (const segment of line.curve_segments) {
            for (const pt of segment) {
              if (Math.abs(pt.lat - location.latitude) <= 3) {
                const d = haversineDistance(location.latitude, location.longitude, pt.lat, pt.lon);
                if (d < minDistance) minDistance = d;
              }
            }
          }
        }
      }

      return {
        planet: line.planet,
        angle: line.angle_type,
        distance_km: Number(minDistance.toFixed(1)),
        is_active: minDistance <= 350, // Standard 350km ACG orb
      };
    });

    // 4. Sort by closest impact first
    results.sort((a, b) => a.distance_km - b.distance_km);

    return NextResponse.json({
      query: cityQuery,
      resolved_address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      closest_impacts: results.slice(0, 10), // Return top 10 impacts
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
