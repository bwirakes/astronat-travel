/**
 * POST /api/geodetic-weather
 * Scores a location's astrological "weather severity" for a given date.
 *
 * Request body:
 *   { date: "YYYY-MM-DD", time?: "HH:MM", destLat: number, destLon: number }
 *
 * Response: GeodeticWeatherResult
 *   — decomposable per-layer breakdown + 0–100 score (high=calm) +
 *     severity tier (Calm|Unsettled|Turbulent|Severe|Extreme) +
 *     attributed event list (each event = planet × orb × layer).
 */
import { NextRequest, NextResponse } from "next/server";
import { computeGeodeticWeather } from "@/app/lib/geodetic-weather";
import { computeRealtimePositions } from "@/lib/astro/transits";
import { computeMundaneData } from "@/app/lib/mundane-engine";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { date, time = "12:00", destLat, destLon } = body;

        if (!date || destLat === undefined || destLon === undefined) {
            return NextResponse.json(
                { error: "Required: date (YYYY-MM-DD), destLat, destLon" },
                { status: 400 }
            );
        }

        const dateUtc = new Date(`${date}T${time}:00Z`);
        if (Number.isNaN(dateUtc.getTime())) {
            return NextResponse.json({ error: "Invalid date/time" }, { status: 400 });
        }

        const [positions, mundane] = await Promise.all([
            computeRealtimePositions(dateUtc),
            computeMundaneData({
                date, time,
                lat: Number(destLat),
                lon: Number(destLon),
            }),
        ]);

        const result = computeGeodeticWeather({
            dateUtc,
            destLat: Number(destLat),
            destLon: Number(destLon),
            positions,
            parans: mundane.parans,
        });

        return NextResponse.json(result);
    } catch (err) {
        console.error("[/api/geodetic-weather]", err);
        return NextResponse.json(
            { error: "Geodetic weather computation failed", detail: String(err) },
            { status: 500 }
        );
    }
}
