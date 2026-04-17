/**
 * transit-solver.ts — Native 12-month transit solver.
 *
 * Scans a date window (default: 90 days before → 9 months after the reference
 * date) every SAMPLE_INTERVAL_DAYS days using the JS SwissEph singleton, finds
 * aspect hits between transiting planets and natal planets, and returns the top
 * matches sorted chronologically then by orb tightness.
 *
 * This replaces the broken REST call to the Python MCP server in astro-client.ts.
 */

import { SwissEphSingleton, computeRealtimePositions } from "./transits";
import { calculateAspect } from "./aspects";

/** Planets considered benefic for benefic/malefic scoring. */
const BENEFIC_SET = new Set(["Venus", "Jupiter", "Sun", "Moon"]);

/** Sampling interval: one check per week. */
const SAMPLE_INTERVAL_DAYS = 7;

/** Max orb to include a transit hit (degrees). */
const MAX_ORB = 3.0;

/** Max transit hits to return — prevents flooding the house matrix. */
const MAX_RESULTS = 50;

// ── In-process cache ─────────────────────────────────────────────────────────
// Each reading fires ~52 SwissEph batches (7-day steps × 360-day window).
// Cache the result keyed by natal positions + reference week so subsequent
// readings for different destinations (same user, same week) skip recomputation.
// This is worker-lifetime cache; for cross-worker persistence use Supabase.

const _transitCache = new Map<string, TransitHit[]>();
const _CACHE_MAX = 20; // evict oldest after this many unique keys

function _weekNum(d: Date): number {
  return Math.floor(d.getTime() / (7 * 86_400_000));
}

function _natalKey(planets: Array<{ longitude: number }>): string {
  return planets.map(p => Math.round(p.longitude * 10)).join(",");
}

export interface TransitHit {
  date: string;           // ISO date string (YYYY-MM-DD)
  transit_planet: string;
  natal_planet: string;
  aspect: string;
  orb: number;
  applying: boolean;
  benefic: boolean;
  retrograde: boolean;
}

/**
 * Solves transits over a date window and returns tight aspect hits.
 *
 * @param natalPlanets  — natal chart planets (must have name/planet + longitude)
 * @param referenceDate — anchor date (travel date or today)
 * @param windowDaysBefore — days before reference to start scanning (default 90)
 * @param windowDaysAfter  — days after reference to stop scanning (default 270 = ~9mo)
 */
export async function solve12MonthTransits(
  natalPlanets: Array<{ name?: string; planet?: string; longitude: number }>,
  referenceDate: Date,
  windowDaysBefore = 90,
  windowDaysAfter = 270,
): Promise<TransitHit[]> {
  const cacheKey = `${_natalKey(natalPlanets)}:${_weekNum(referenceDate)}`;
  const cached = _transitCache.get(cacheKey);
  if (cached) return cached;

  const results: TransitHit[] = [];

  const start = new Date(referenceDate.getTime() - windowDaysBefore * 86_400_000);
  const end   = new Date(referenceDate.getTime() + windowDaysAfter  * 86_400_000);

  // Ensure SwissEph is initialised once before the loop.
  await SwissEphSingleton.getInstance();

  let current = new Date(start);

  while (current <= end) {
    const transitPositions = await computeRealtimePositions(current);

    for (const transit of transitPositions) {
      for (const natal of natalPlanets) {
        const natalName = natal.planet ?? natal.name ?? "";
        const result = calculateAspect(
          transit.longitude,
          natal.longitude,
          transit.name,
          natalName,
        );

        if (!result || result.orb > MAX_ORB) continue;

        // "Applying" heuristic: direct-motion planet is moving toward natal.
        // This is a simplified proxy — accurate enough for house-matrix scoring.
        const applying = !transit.is_retrograde;

        results.push({
          date: current.toISOString().split("T")[0],
          transit_planet: transit.name,
          natal_planet: natalName,
          aspect: result.aspect,
          orb: result.orb,
          applying,
          benefic: BENEFIC_SET.has(transit.name),
          retrograde: transit.is_retrograde,
        });
      }
    }

    current = new Date(current.getTime() + SAMPLE_INTERVAL_DAYS * 86_400_000);
  }

  // Sort: chronological first, then tightest orb within same date.
  results.sort((a, b) => {
    const d = new Date(a.date).getTime() - new Date(b.date).getTime();
    return d !== 0 ? d : a.orb - b.orb;
  });

  const hits = results.slice(0, MAX_RESULTS);

  if (_transitCache.size >= _CACHE_MAX) {
    const oldest = _transitCache.keys().next().value;
    if (oldest !== undefined) _transitCache.delete(oldest);
  }
  _transitCache.set(cacheKey, hits);

  return hits;
}
