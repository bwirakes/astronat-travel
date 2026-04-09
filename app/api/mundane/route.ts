/**
 * POST /api/mundane
 * Computes mundane (world) astrology for a given date + location:
 *   1. Sky-to-sky aspects (world transits) — all major aspects between transiting planets
 *   2. Angular planets — which transiting planets are on MC, IC, ASC, or DSC over the location
 *   3. Paran crossings — which planet pairs cross each other within ±2° latitude of the location
 *
 * This is the engine for the backtest tool.
 *
 * Request body:
 *   { date: "YYYY-MM-DD", time?: "HH:MM", lat: number, lon: number, city?: string }
 *
 * Response:
 *   { worldTransits, angularPlanets, parans, planets, date, location }
 */
import { NextRequest, NextResponse } from "next/server";
import { computeMundaneData } from "@/app/lib/mundane-engine";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { date, time = "12:00", lat, lon, city = "Unknown" } = body;

        if (!date || lat === undefined || lon === undefined) {
            return NextResponse.json(
                { error: "Required: date (YYYY-MM-DD), lat, lon" },
                { status: 400 }
            );
        }

        const data = await computeMundaneData({ date, time, lat, lon });

        return NextResponse.json({
            date, time, location: { lat, lon, city },
            ...data,
            meta: {
                planetCount: data.planets.length,
                aspectCount: data.worldTransits.length,
            }
        });

    } catch (err) {
        console.error("[/api/mundane]", err);
        return NextResponse.json({ error: "Mundane computation failed", detail: String(err) }, { status: 500 });
    }
}
