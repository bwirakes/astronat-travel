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

const _skyRangeCache = new Map<string, Map<string, CachedSkyPosition[]>>();
const _SKY_RANGE_CACHE_MAX = 20;

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

type EphemerisDailyRow = {
  date_ut?: string;
  planet_name: string;
  longitude: number;
  speed: number;
  is_retrograde: boolean;
  zodiac_sign: string;
  zodiac_degree: number;
};

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dateFromOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function enumerateDateStrings(startDate: Date, count: number): string[] {
  const startMs = dateFromOnly(dateOnly(startDate)).getTime();
  return Array.from({ length: count }, (_, index) =>
    dateOnly(new Date(startMs + index * 86_400_000))
  );
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

async function fetchCachedRowsForDateRange(
  firstDate: string,
  lastDate: string,
  requestedBodies: string[],
): Promise<EphemerisDailyRow[]> {
  const admin = createAdminClient();
  const pageSize = 1000;
  const rows: EphemerisDailyRow[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from("ephemeris_daily")
      .select("date_ut, planet_name, longitude, speed, is_retrograde, zodiac_sign, zodiac_degree")
      .gte("date_ut", firstDate)
      .lte("date_ut", lastDate)
      .in("planet_name", requestedBodies)
      .range(from, from + pageSize - 1);

    if (error) throw error;
    rows.push(...((data ?? []) as EphemerisDailyRow[]));
    if (!data || data.length < pageSize) break;
  }

  return rows;
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

/**
 * Fetch many daily sky snapshots with one cache read.
 *
 * Universal-sky station scans walk 100-400 consecutive dates. Calling
 * getSkyForDate once per day turns that into hundreds of Supabase round trips,
 * even when every row is already cached. This helper batches the cached read and
 * only falls back to per-date SwissEph computation for missing dates.
 */
export async function getSkyForDateRange(
  startDate: Date,
  count: number,
  options: SkyCacheOptions = {},
): Promise<Map<string, CachedSkyPosition[]>> {
  const requestedBodies = normalizeBodySet(options.bodies);
  const dateStrings = enumerateDateStrings(startDate, Math.max(0, count));
  const result = new Map<string, CachedSkyPosition[]>();
  if (!dateStrings.length) return result;

  const firstDate = dateStrings[0];
  const lastDate = dateStrings[dateStrings.length - 1];
  const cacheKey = `${firstDate}:${lastDate}:${requestedBodies.join(",")}`;
  const cached = _skyRangeCache.get(cacheKey);
  if (cached) return new Map(cached);

  const rows = await fetchCachedRowsForDateRange(firstDate, lastDate, requestedBodies);

  const grouped = new Map<string, CachedSkyPosition[]>();
  for (const row of rows) {
    const dateStr = String(row.date_ut).slice(0, 10);
    const positions = grouped.get(dateStr) ?? [];
    positions.push(rowToCachedPosition(row, dateStr));
    grouped.set(dateStr, positions);
  }

  for (const dateStr of dateStrings) {
    const cached = grouped.get(dateStr) ?? [];
    if (cached.length >= requestedBodies.length) {
      result.set(dateStr, cached);
      continue;
    }
    result.set(dateStr, await getSkyForDate(dateFromOnly(dateStr), options));
  }

  if (_skyRangeCache.size >= _SKY_RANGE_CACHE_MAX) {
    const oldest = _skyRangeCache.keys().next().value;
    if (oldest !== undefined) _skyRangeCache.delete(oldest);
  }
  _skyRangeCache.set(cacheKey, new Map(result));

  return result;
}

export async function getComputedSkyForDateRange(
  startDate: Date,
  count: number,
  options: SkyCacheOptions = {},
): Promise<Map<string, ComputedPosition[]>> {
  const rowsByDate = await getSkyForDateRange(startDate, count, options);
  const computedByDate = new Map<string, ComputedPosition[]>();
  for (const [dateStr, rows] of rowsByDate) {
    computedByDate.set(dateStr, rows.map(cachedToComputedPosition));
  }
  return computedByDate;
}
