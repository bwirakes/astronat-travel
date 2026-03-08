/**
 * POST /api/chart
 * Register a user's natal chart with the astro engine.
 * Falls back gracefully if the engine is unavailable.
 */
import { NextRequest, NextResponse } from "next/server";
import { registerChart } from "@/app/lib/astro-client";
import {
    MOCK_PLANET_LINES,
    MOCK_TRANSITS,
    MOCK_12_MONTH_WINDOWS,
    PLANET_GLYPHS,
    SIGN_GLYPHS,
} from "@/app/lib/planet-data";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, date, time, city } = body;

        if (!name || !date || !time || !city) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Create a stable user_id from the name + date
        const userId = `${name.toLowerCase().replace(/\s+/g, "_")}_${date.replace(/-/g, "")}`;

        const result = await registerChart({
            userId,
            name,
            birthDate: date,
            birthTime: time,
            birthCity: city,
        });

        if (!result) {
            // Return a mock response if engine is unavailable
            return NextResponse.json({
                user_id: userId,
                status: "mock",
                natal_planets: [],
                mock: true,
            });
        }

        return NextResponse.json({ ...result, user_id: userId });
    } catch (err) {
        console.error("[/api/chart]", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
