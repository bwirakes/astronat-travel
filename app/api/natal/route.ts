/**
 * POST /api/natal
 * Computes a natal chart from birth data using circular-natal-horoscope-js.
 * Returns planets (with longitudinal data), house cusps, and aspects.
 */
import { NextRequest, NextResponse } from "next/server";

import { geocodeCity } from "@/app/lib/astro-client";

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
        const body = await req.json();
        const { dob, time, birthplace, originalBirthplace } = body;

        if (!dob || !birthplace) {
            return NextResponse.json({ error: "dob and birthplace are required" }, { status: 400 });
        }

        // Parse date + time
        const [year, month, day] = dob.split("-").map(Number);
        const [hour, minute] = (time || "12:00").split(":").map(Number);

        // Geocode birthplace (this is the destination for relocation, or natal place for natal)
        const coords = await geocodeCity(birthplace);
        const lat = coords?.lat ?? 40.7128;
        const lon = coords?.lon ?? -74.006;

        const { Origin, Horoscope } = await import("circular-natal-horoscope-js");

        const isRelocation = originalBirthplace && originalBirthplace !== birthplace;

        // For relocation: compute the chart at the ORIGINAL birthplace first to get the UTC moment,
        // then compute at the destination coords using that same UTC moment.
        // For natal: just compute directly.
        let chartLat = lat;
        let chartLon = lon;
        let chartYear = year;
        let chartMonth = month;
        let chartDay = day;
        let chartHour = hour;
        let chartMinute = minute;

        if (isRelocation) {
            const origCoords = await geocodeCity(originalBirthplace);
            if (origCoords) {
                // Step 1: Compute natal chart at original birthplace to get the true UTC date/time
                const origOrigin = new Origin({
                    year, month: month - 1, date: day,
                    hour, minute,
                    latitude: origCoords.lat, longitude: origCoords.lon,
                });

                // The Origin.utcTime should be a Date object representing the UTC moment of birth.
                // We need to extract the UTC components from this to feed into a new Origin at the destination.
                const utcDate = origOrigin.utcTime;
                if (utcDate instanceof Date && !isNaN(utcDate.getTime())) {
                    chartYear = utcDate.getUTCFullYear();
                    chartMonth = utcDate.getUTCMonth() + 1; // back to 1-indexed
                    chartDay = utcDate.getUTCDate();
                    chartHour = utcDate.getUTCHours();
                    chartMinute = utcDate.getUTCMinutes();

                    console.log("[Relocation] Original local:", { year, month, day, hour, minute, place: originalBirthplace });
                    console.log("[Relocation] UTC from Origin:", { chartYear, chartMonth, chartDay, chartHour, chartMinute });
                    console.log("[Relocation] Dest:", { birthplace, lat, lon });

                    // Step 2: We need to find what LOCAL time at the destination corresponds to this UTC moment.
                    // The Origin constructor expects LOCAL time, so we convert UTC → destination local.
                    const utcMs = utcDate.getTime();
                    const destFormatter = new Intl.DateTimeFormat('en-US', {
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // we'll detect below
                        year: 'numeric', month: 'numeric', day: 'numeric',
                        hour: 'numeric', minute: 'numeric', second: 'numeric',
                        hour12: false,
                    });

                    // Use a temporary Origin at destination to discover its timezone string
                    const tmpOrigin = new Origin({
                        year, month: month - 1, date: day,
                        hour: 12, minute: 0,
                        latitude: lat, longitude: lon,
                    });
                    const destTz = tmpOrigin.timezone || "UTC";

                    const locFormatter = new Intl.DateTimeFormat('en-US', {
                        timeZone: destTz,
                        year: 'numeric', month: 'numeric', day: 'numeric',
                        hour: 'numeric', minute: 'numeric', second: 'numeric',
                        hour12: false,
                    });
                    const parts = locFormatter.formatToParts(utcDate);
                    const pt = (type: string) => parts.find(p => p.type === type)?.value;

                    chartYear = Number(pt('year'));
                    chartMonth = Number(pt('month'));
                    chartDay = Number(pt('day'));
                    chartHour = Number(pt('hour')) === 24 ? 0 : Number(pt('hour'));
                    chartMinute = Number(pt('minute'));

                    console.log("[Relocation] Dest local time:", { chartYear, chartMonth, chartDay, chartHour, chartMinute, destTz });
                } else {
                    // utcTime is not a Date — try using julianDate approach
                    console.warn("[Relocation] Origin.utcTime is not a Date:", typeof utcDate, utcDate);
                    // Fallback: manually compute UTC from local time + timezone offset
                    // Jakarta is UTC+7, so 22:15 Jakarta = 15:15 UTC
                    // We'll use a simple geo-based timezone estimate: lon/15 hours
                    const origOffsetH = Math.round(origCoords.lon / 15);
                    const destOffsetH = Math.round(lon / 15);
                    const diffH = destOffsetH - origOffsetH;
                    chartHour = hour + diffH;
                    // Handle day rollover
                    if (chartHour >= 24) { chartHour -= 24; chartDay += 1; }
                    if (chartHour < 0) { chartHour += 24; chartDay -= 1; }
                    console.log("[Relocation] Fallback offset:", { origOffsetH, destOffsetH, diffH, chartHour });
                }

                chartLat = lat;
                chartLon = lon;
            }
        }

        const origin = new Origin({
            year: chartYear,
            month: chartMonth - 1,
            date: chartDay,
            hour: chartHour,
            minute: chartMinute,
            latitude: chartLat,
            longitude: chartLon,
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
                    degree: degreeInSign,
                    longitude: lon360,
                    retrograde: body.isRetrograde ?? false,
                    house: body.House?.id ?? 1,
                };
            });

        // Extract house cusps
        const cusps = horoscope.Houses?.map((h: any) => h.ChartPosition?.StartPosition?.Ecliptic?.DecimalDegrees ?? 0) ?? [];

        // Extract aspects
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
            coords: { lat: chartLat, lon: chartLon },
        });
    } catch (err) {
        console.error("[/api/natal] error:", err);
        return NextResponse.json({ error: "Failed to compute natal chart", detail: String(err) }, { status: 500 });
    }
}

