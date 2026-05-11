/**
 * POST /api/astrocarto
 * Legacy stub — superseded by POST /api/astro/astrocartography, which performs
 * the real planetary-line computation. This route is kept only for any old
 * clients still pointing at it, and returns a mock payload.
 */
import { NextRequest, NextResponse } from "next/server";
import { geocodeCity } from "@/lib/geo/geocode";
import { MOCK_PLANET_LINES } from "@/app/lib/planet-data";

export async function POST(req: NextRequest) {
    try {
        const { user_id, destination } = await req.json();

        if (!user_id || !destination) {
            return NextResponse.json({ error: "Missing user_id or destination" }, { status: 400 });
        }

        const geo = await geocodeCity(destination);
        return NextResponse.json({ lines: MOCK_PLANET_LINES, mock: true, geo: geo ?? null });
    } catch (err) {
        console.error("[/api/astrocarto]", err);
        return NextResponse.json({ lines: MOCK_PLANET_LINES, mock: true });
    }
}
