/**
 * POST /api/travel-windows
 * Computes the 12-month travel window scores for a destination
 * using the house-matrix engine.
 */

import { NextRequest, NextResponse } from "next/server";
import { compute12MonthWindows } from "@/app/lib/travel-windows";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { 
            startDate, 
            lat, 
            lon, 
            natalPlanets, 
            acgLines 
        } = body;

        if (!startDate || lat === undefined || lon === undefined || !natalPlanets) {
            return NextResponse.json(
                { error: "Required: startDate (YYYY-MM-DD), lat, lon, natalPlanets" },
                { status: 400 }
            );
        }

        const windows = await compute12MonthWindows({
            startDateStr: startDate,
            lat,
            lon,
            natalPlanets,
            acgLines: acgLines || []
        });

        return NextResponse.json({ windows });

    } catch (err) {
        console.error("[/api/travel-windows]", err);
        return NextResponse.json(
            { error: "Travel window computation failed", detail: String(err) },
            { status: 500 }
        );
    }
}
