import { NextRequest, NextResponse } from "next/server";
import { geocodeCity } from "@/lib/geo/geocode";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const city = searchParams.get("city");
        const autocomplete = searchParams.get("autocomplete") === "true";

        if (!city) {
            return NextResponse.json({ error: "Missing city parameter" }, { status: 400 });
        }

        // Autocomplete mode: use Photon for search-as-you-type suggestions
        if (autocomplete) {
            const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(city)}&limit=6&lang=en`;
            const res = await fetch(url, {
                headers: { "User-Agent": "AstroNat-Travel-App/1.0" },
                signal: AbortSignal.timeout(4_000),
            });
            if (!res.ok) {
                return NextResponse.json({ suggestions: [] });
            }
            const data = await res.json();
            const suggestions = (data.features || [])
                .filter((f: any) => f.properties && (f.geometry?.coordinates))
                .map((f: any) => {
                    const p = f.properties;
                    const parts = [p.name, p.city, p.county, p.state, p.country].filter(Boolean);
                    // deduplicate consecutive identical parts
                    const label = parts.filter((v, i, a) => i === 0 || v !== a[i - 1]).join(", ");
                    return {
                        label,
                        lat: f.geometry.coordinates[1],
                        lon: f.geometry.coordinates[0],
                        type: p.type || p.osm_value || "place",
                    };
                })
                // deduplicate by identical label
                .filter((v: any, i: number, a: any[]) => a.findIndex(x => x.label === v.label) === i);

            return NextResponse.json({ suggestions });
        }

        // Standard single-resolve mode for use in generation routes
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
