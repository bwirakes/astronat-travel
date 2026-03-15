/**
 * POST /api/astrocarto
 * Get planetary line distances for a destination city.
 */
import { NextRequest, NextResponse } from "next/server";
import { geocodeCity, getAstrocarto } from "@/app/lib/astro-client";
import { MOCK_PLANET_LINES, PLANET_MEANINGS } from "@/app/lib/planet-data";

export async function POST(req: NextRequest) {
    try {
        const { user_id, destination } = await req.json();

        if (!user_id || !destination) {
            return NextResponse.json({ error: "Missing user_id or destination" }, { status: 400 });
        }

        // Geocode the destination
        const geo = await geocodeCity(destination);
        if (!geo) {
            return NextResponse.json({ lines: MOCK_PLANET_LINES, mock: true });
        }

        const result = await getAstrocarto(user_id, geo.lat, geo.lon, destination);

        if (!result) {
            return NextResponse.json({ lines: MOCK_PLANET_LINES, mock: true, geo });
        }

        // Enrich lines with meanings
        const enrichedLines = (result.lines || []).map((line) => ({
            planet: line.planet,
            angle: line.angle,
            distance_km: Math.round(line.distance_km),
            orb: line.orb,
            is_paran: line.is_paran,
            meaning: PLANET_MEANINGS[line.planet]?.[line.angle] ?? { badge: `${line.planet} ${line.angle}` },
        }));

        return NextResponse.json({
            lines: enrichedLines,
            geo,
            user_id,
        });
    } catch (err) {
        console.error("[/api/astrocarto]", err);
        return NextResponse.json({ lines: MOCK_PLANET_LINES, mock: true });
    }
}
