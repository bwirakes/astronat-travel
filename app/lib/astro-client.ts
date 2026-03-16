/**
 * astro-client.ts — Thin HTTP client for the astro engine REST API
 * Falls back to null on error so callers can use mock data
 */

const BASE = process.env.ASTRO_ENGINE_URL || "http://127.0.0.1:8788";

import { find } from "geo-tz";

async function post<T>(path: string, body: object): Promise<T | null> {
    try {
        const res = await fetch(`${BASE}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            // 10 second timeout for Swiss Ephemeris computations
            signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) {
            console.error(`[astro-client] ${path} → ${res.status}`, await res.text());
            return null;
        }
        return (await res.json()) as T;
    } catch (err) {
        console.error(`[astro-client] ${path} failed:`, err);
        return null;
    }
}

export interface NatalPlanet {
    planet: string;
    sign: string;
    degree: number;
    longitude: number;
    retrograde: boolean;
    house: number;
    condition?: string;
    dignity?: string;
}

export interface RegisterResult {
    user_id: string;
    status: string;
    natal_planets: NatalPlanet[];
}

export interface AspectHit {
    date: string;
    transit_planet: string;
    natal_planet: string;
    aspect: string;
    orb: number;
    system?: "natal" | "geodetic";
}

export interface TransitResult {
    user_id: string;
    user_name: string;
    period_start: string;
    period_end: string;
    major_aspects: AspectHit[];
    ingresses: object[];
    retrograde_periods: object[];
}

export interface PlanetLine {
    planet: string;
    angle: string;        // MC | IC | ASC | DSC
    distance_km: number;
    latitude?: number;
    longitude?: number;
    orb?: number;
    is_paran?: boolean;
}

export interface AstrocartoResult {
    user_id: string;
    city_lat: number;
    city_lon: number;
    lines: PlanetLine[];
}

export interface GeoResult {
    lat: number;
    lon: number;
    display_name: string;
    timezone?: string;
}

// ── Geocode a city name using Nominatim (free, no key needed) ──────────────
export async function geocodeCity(city: string): Promise<GeoResult | null> {
    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
        const res = await fetch(url, {
            headers: { "User-Agent": "AstroNat-Travel-App/1.0" },
            signal: AbortSignal.timeout(5_000),
        });
        const data = await res.json();
        if (!data?.[0]) return null;

        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const display_name = data[0].display_name;
        
        const timezones = find(lat, lon);
        const timezone = timezones.length > 0 ? timezones[0] : undefined;

        return {
            lat,
            lon,
            display_name,
            timezone,
        };
    } catch {
        return null;
    }
}

// ── Register user birth chart ─────────────────────────────────────────────
export async function registerChart(params: {
    userId: string;
    name: string;
    birthDate: string;   // YYYY-MM-DD
    birthTime: string;   // HH:MM
    birthCity: string;
}): Promise<RegisterResult | null> {
    const [year, month, day] = params.birthDate.split("-").map(Number);
    const [hour, minute] = params.birthTime.split(":").map(Number);

    const geo = await geocodeCity(params.birthCity);
    if (!geo) return null;

    // Estimate timezone offset from longitude (rough but workable for MVP)
    const tzOffset = Math.round(geo.lon / 15);

    return post<RegisterResult>("/register", {
        user_id: params.userId,
        display_name: params.name,
        birth_year: year,
        birth_month: month,
        birth_day: day,
        birth_hour: hour,
        birth_minute: minute,
        timezone_offset: tzOffset,
        latitude: geo.lat,
        longitude: geo.lon,
        city: params.birthCity,
        country: "",
    });
}

// ── Get 12-month transits ─────────────────────────────────────────────────
export async function get12MonthTransits(userId: string, startDate: string): Promise<TransitResult | null> {
    return post<TransitResult>("/transits", { user_id: userId, start_date: startDate });
}

// ── Get astrocartography lines for a city ────────────────────────────────
export async function getAstrocarto(userId: string, cityLat: number, cityLon: number, cityName: string): Promise<AstrocartoResult | null> {
    return post<AstrocartoResult>("/astrocarto", {
        user_id: userId,
        city_lat: cityLat,
        city_lon: cityLon,
        city_name: cityName,
    });
}
