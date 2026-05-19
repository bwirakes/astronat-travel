import { NextRequest, NextResponse } from "next/server";
import { geocodeCity, searchCitySuggestions } from "@/lib/geo/geocode";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { captureServerError } from "@/lib/monitoring/sentry";

export async function GET(req: NextRequest) {
    try {
        const limited = await enforceRateLimit(req, "geocode");
        if (limited) return limited;

        const { searchParams } = new URL(req.url);
        const city = searchParams.get("city");
        const autocomplete = searchParams.get("autocomplete") === "true";

        if (!city) {
            return NextResponse.json({ error: "Missing city parameter" }, { status: 400 });
        }

        // Autocomplete mode: use the same geocoding provider chain as the
        // generation routes so city search and final resolution cannot drift.
        if (autocomplete) {
            const suggestions = await searchCitySuggestions(city, 6);
            return NextResponse.json({ suggestions });
        }

        // Standard single-resolve mode for use in generation routes
        const geo = await geocodeCity(city);
        
        if (!geo) {
            return NextResponse.json({ error: "City not found" }, { status: 404 });
        }

        return NextResponse.json(geo);
    } catch (err) {
        captureServerError(err, { route: "/api/geocode", method: "GET" });
        console.error("[/api/geocode] error:", err);
        return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
    }
}
