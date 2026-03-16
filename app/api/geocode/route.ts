import { NextRequest, NextResponse } from "next/server";
import { geocodeCity } from "@/app/lib/astro-client";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const city = searchParams.get("city");

        if (!city) {
            return NextResponse.json({ error: "Missing city parameter" }, { status: 400 });
        }

        const geo = await geocodeCity(city);
        
        if (!geo) {
            return NextResponse.json({ error: "City not found" }, { status: 404 });
        }

        return NextResponse.json(geo);
    } catch (err) {
        console.error("[/api/geocode] error:", err);
        return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
    }
}
