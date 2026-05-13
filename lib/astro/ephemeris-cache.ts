/**
 * Ephemeris cache — read daily planetary positions from Supabase `ephemeris_daily`.
 *
 * Falls back to live SwissEph computation + write-through cache on miss.
 * Used by the narrative endpoint to avoid recomputing the same sky for every
 * user asking about the same date.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { computeRealtimePositions, type ComputedPosition } from "@/lib/astro/transits";

export const EPHEMERIS_DAILY_BODIES = [
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
  "True Node",
  "Chiron",
  "Ceres",
  "Pallas",
  "Juno",
  "Vesta",
  "Lilith",
  "Eris",
  "Sedna",
  "Haumea",
  "Makemake",
] as const;

export const UNIVERSAL_SKY_BODIES = [
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
  "True Node",
] as const;

const SWISS_FALLBACK_BODIES = new Set([
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
  "True Node",
]);

export interface CachedSkyPosition {
  name: string;
  longitude: number;
  speed: number;
  is_retrograde: boolean;
  sign: string;
  degree_in_sign: number;
  computed_at_utc: string;
}

export interface SkyCacheOptions {
  bodies?: readonly string[];
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function normalizeBodySet(bodies: readonly string[] = EPHEMERIS_DAILY_BODIES): string[] {
  return Array.from(new Set(bodies));
}

function rowToCachedPosition(row: {
  planet_name: string;
  longitude: number;
  speed: number;
  is_retrograde: boolean;
  zodiac_sign: string;
  zodiac_degree: number;
}, dateStr: string): CachedSkyPosition {
  return {
    name: row.planet_name,
    longitude: row.longitude,
    speed: row.speed,
    is_retrograde: row.is_retrograde,
    sign: row.zodiac_sign,
    degree_in_sign: row.zodiac_degree,
    computed_at_utc: `${dateStr}T00:00:00.000Z`,
  };
}

export function cachedToComputedPosition(position: CachedSkyPosition): ComputedPosition {
  return {
    name: position.name,
    longitude: position.longitude,
    sign: position.sign,
    degree_in_sign: position.degree_in_sign,
    degree_minutes: Math.floor((position.degree_in_sign - Math.floor(position.degree_in_sign)) * 60),
    speed: position.speed,
    is_retrograde: position.is_retrograde,
    computed_at_utc: position.computed_at_utc,
  };
}

/**
 * Fetch the sky for a given date. Reads from `ephemeris_daily` if present;
 * otherwise computes via SwissEph WASM and writes back.
 */
export async function getSkyForDate(
  date: Date,
  options: SkyCacheOptions = {}
): Promise<CachedSkyPosition[]> {
  const dateStr = dateOnly(date);
  const requestedBodies = normalizeBodySet(options.bodies);
  const admin = createAdminClient();

  // Cache read
  const { data: rows } = await admin
    .from("ephemeris_daily")
    .select("planet_name, longitude, speed, is_retrograde, zodiac_sign, zodiac_degree")
    .eq("date_ut", dateStr)
    .in("planet_name", requestedBodies);

  if (rows && rows.length >= requestedBodies.length) {
    return rows.map((r) => rowToCachedPosition(r, dateStr));
  }

  // Cache miss — compute live for bodies Swiss can compute. TNOs or other
  // Horizons-backed rows should be backfilled into Postgres by scripts/jobs.
  const computed = await computeRealtimePositions(date);
  const fallback = computed.filter((p) =>
    requestedBodies.includes(p.name) && SWISS_FALLBACK_BODIES.has(p.name)
  );

  // Write-through (non-blocking; don't fail the request if this errors)
  if (fallback.length) {
    admin
      .from("ephemeris_daily")
      .upsert(
        fallback.map((p) => ({
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
  }

  const cachedRows = rows?.map((r) => rowToCachedPosition(r, dateStr)) ?? [];
  const cachedNames = new Set(cachedRows.map((p) => p.name));
  const fallbackRows: CachedSkyPosition[] = fallback
    .filter((p) => !cachedNames.has(p.name))
    .map((p) => ({
      name: p.name,
      longitude: p.longitude,
      speed: p.speed,
      is_retrograde: p.is_retrograde,
      sign: p.sign,
      degree_in_sign: p.degree_in_sign,
      computed_at_utc: p.computed_at_utc,
    }));

  return [...cachedRows, ...fallbackRows];
}

export async function getComputedSkyForDate(
  date: Date,
  options: SkyCacheOptions = {},
): Promise<ComputedPosition[]> {
  const rows = await getSkyForDate(date, options);
  return rows.map(cachedToComputedPosition);
}
