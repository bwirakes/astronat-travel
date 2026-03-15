/**
 * POST /api/natal
 * Computes a natal chart from birth data using circular-natal-horoscope-js.
 * Returns planets (with longitudinal data), house cusps, and aspects.
 */
import { NextRequest, NextResponse } from "next/server";

async function geocodeBirthplace(birthplace: string): Promise<{ lat: number; lon: number } | null> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(birthplace)}&format=json&limit=1`,
            { headers: { "User-Agent": "AstroNat-Travel-App/1.0" } }
        );
        const data = await res.json();
        if (data?.[0]) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
        return null;
    } catch {
        return null;
    }
}

/** Map sign index (0=Aries) to sign name */
const SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

/** Map circular-natal-horoscope-js planet names to our display names */
const PLANET_NAME_MAP: Record<string, string> = {
    sun: "Sun",
    moon: "Moon",
    mercury: "Mercury",
    venus: "Venus",
    mars: "Mars",
    jupiter: "Jupiter",
    saturn: "Saturn",
    uranus: "Uranus",
    neptune: "Neptune",
    pluto: "Pluto",
    chiron: "Chiron",
    sirius: "Sirius",
};

export async function POST(req: NextRequest) {
    try {
        const { dob, time, birthplace } = await req.json();

        if (!dob || !birthplace) {
            return NextResponse.json({ error: "dob and birthplace are required" }, { status: 400 });
        }

        // Parse date + time
        const [year, month, day] = dob.split("-").map(Number);
        const [hour, minute] = (time || "12:00").split(":").map(Number);

        // Geocode birthplace
        const coords = await geocodeBirthplace(birthplace);
        const lat = coords?.lat ?? 40.7128; // Default NYC
        const lon = coords?.lon ?? -74.006;

        // Dynamic import — library requires Origin wrapper around birth data
        const { Origin, Horoscope } = await import("circular-natal-horoscope-js");

        const origin = new Origin({
            year,
            month: month - 1, // 0-indexed months
            date: day,
            hour,
            minute,
            latitude: lat,
            longitude: lon,
        });

        const horoscope = new Horoscope({
            origin,
            houseSystem: "placidus",
            zodiac: "tropical",
            aspectPoints: ["bodies", "points", "angles"],
            aspectWithPoints: ["bodies", "points", "angles"],
            aspectTypes: ["major"],
            customOrbs: {},
            language: "en",
        });

        // Extract planet data
        const celestialBodies = horoscope.CelestialBodies;
        const planets = Object.entries(celestialBodies)
            .filter(([, body]: [string, any]) => body && body.ChartPosition)
            .map(([key, body]: [string, any]) => {
                const lon360 = body.ChartPosition.Ecliptic?.DecimalDegrees ?? 0;
                const signIndex = Math.floor(lon360 / 30) % 12;
                const degreeInSign = lon360 % 30;
                return {
                    planet: PLANET_NAME_MAP[key] ?? key,
                    sign: SIGNS[signIndex],
                    degree: Math.round(degreeInSign * 10) / 10,
                    longitude: Math.round(lon360 * 10) / 10,
                    retrograde: body.isRetrograde ?? false,
                    house: body.House?.id ?? 1,
                };
            });

        // Extract house cusps (12 cusps)
        const cusps = horoscope.Houses?.map((h: any) => h.ChartPosition?.StartPosition?.Ecliptic?.DecimalDegrees ?? 0) ?? [];

        // Extract major aspects — stored under .all in this library
        const aspects = ((horoscope.Aspects as any)?.all ?? []).map((asp: any) => ({
            point1: PLANET_NAME_MAP[asp.point1?.name] ?? asp.point1?.name,
            point2: PLANET_NAME_MAP[asp.point2?.name] ?? asp.point2?.name,
            aspect: asp.aspect?.label ?? asp.aspect?.name,
            orb: Math.round((asp.orb ?? 0) * 10) / 10,
        }));

        // Ascendant + MC
        const ascendant = horoscope.Angles?.Ascendant?.ChartPosition?.Ecliptic?.DecimalDegrees ?? null;
        const mc = horoscope.Angles?.Midheaven?.ChartPosition?.Ecliptic?.DecimalDegrees ?? null;

        return NextResponse.json({
            planets,
            cusps,
            aspects,
            ascendant: ascendant !== null ? Math.round(ascendant * 10) / 10 : null,
            mc: mc !== null ? Math.round(mc * 10) / 10 : null,
            birthplace,
            coords: { lat, lon },
        });
    } catch (err) {
        console.error("[/api/natal] error:", err);
        return NextResponse.json({ error: "Failed to compute natal chart", detail: String(err) }, { status: 500 });
    }
}
