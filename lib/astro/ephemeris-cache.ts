/**
 * Ephemeris cache — read daily planetary positions from Supabase `ephemeris_daily`.
 *
 * Falls back to live SwissEph computation + write-through cache on miss.
 * Used by the narrative endpoint to avoid recomputing the same sky for every
 * user asking about the same date.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { computeRealtimePositions } from "@/lib/astro/transits";

const MAIN_PLANETS = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
];

export interface CachedSkyPosition {
  name: string;
  longitude: number;
  speed: number;
  is_retrograde: boolean;
}

/**
 * Fetch the sky for a given date. Reads from `ephemeris_daily` if present;
 * otherwise computes via SwissEph WASM and writes back.
 */
export async function getSkyForDate(
  date: Date
): Promise<CachedSkyPosition[]> {
  const dateStr = date.toISOString().slice(0, 10);
  const admin = createAdminClient();

  // Cache read
  const { data: rows } = await admin
    .from("ephemeris_daily")
    .select("planet_name, longitude, speed, is_retrograde")
    .eq("date_ut", dateStr)
    .in("planet_name", MAIN_PLANETS);

  if (rows && rows.length >= MAIN_PLANETS.length) {
    return rows.map((r) => ({
      name: r.planet_name,
      longitude: r.longitude,
      speed: r.speed,
      is_retrograde: r.is_retrograde,
    }));
  }

  // Cache miss — compute live
  const computed = await computeRealtimePositions(date);

  // Write-through (non-blocking; don't fail the request if this errors)
  admin
    .from("ephemeris_daily")
    .upsert(
      computed.map((p) => ({
        date_ut: dateStr,
        planet_name: p.name,
        longitude: p.longitude,
        speed: p.speed,
        is_retrograde: p.is_retrograde,
        zodiac_sign: p.sign,
        zodiac_degree: p.degree_in_sign,
      })),
      { onConflict: "date_ut,planet_name" }
    )
    .then(({ error }) => {
      if (error) console.warn("Ephemeris write-through failed:", error.message);
    });

  return computed.map((p) => ({
    name: p.name,
    longitude: p.longitude,
    speed: p.speed,
    is_retrograde: p.is_retrograde,
  }));
}
