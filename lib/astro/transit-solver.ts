/**
 * transit-solver.ts — Native 12-month transit solver.
 *
 * Scans a date window (default: 90 days before → 9 months after the reference
 * date) every SAMPLE_INTERVAL_DAYS days using the daily ephemeris cache, finds
 * aspect hits between transiting planets and natal planets, and returns the top
 * matches sorted chronologically then by orb tightness.
 *
 * This replaces the broken REST call to the Python MCP server in astro-client.ts.
 */

import { UNIVERSAL_SKY_BODIES, getComputedSkyForDateRange } from "./ephemeris-cache";
import { calculateAspect } from "./aspects";

/** Planets considered benefic for benefic/malefic scoring. */
const BENEFIC_SET = new Set(["Venus", "Jupiter", "Sun", "Moon"]);

/** Sampling interval: one check per week. */
const SAMPLE_INTERVAL_DAYS = 7;

/** Max orb to include a transit hit (degrees). */
const MAX_ORB = 3.0;

/** Default max transit hits returned for trip-shaped readings.
 *  Sized for the V4 Timing tab: anchor-7 → anchor+90 day Gantt needs ~14 weeks
 *  of weekly samples × ~10 hits/week ≈ 140 hits. 200 gives headroom and still
 *  keeps the persisted reading payload small.
 *  Relocation readings override this via the `maxResults` option. */
const MAX_RESULTS = 200;

/**
 * Result-selection policy.
 *  - `proximity` (default): keep hits closest in time to `referenceDate`.
 *    Right for trips — the Gantt and field views focus near the anchor.
 *  - `chronological`: keep hits sorted by date and return the head of the
 *    range up to `maxResults`. Right for relocations, which need even
 *    coverage across the full 12 months because the user is making an
 *    arrival-month decision, not a trip-week decision.
 */
export type SolvePolicy = "proximity" | "chronological";

// ── In-process cache ─────────────────────────────────────────────────────────
// Cache the result keyed by natal positions + reference week so subsequent
// readings for different destinations (same user, same week) skip recomputing
// aspect hits. This is worker-lifetime cache; for cross-worker persistence use
// Supabase or a dedicated transit-hit cache table.

const _transitCache = new Map<string, TransitHit[]>();
const _CACHE_MAX = 20; // evict oldest after this many unique keys
const MS_DAY = 86_400_000;

function _weekNum(d: Date): number {
  return Math.floor(d.getTime() / (7 * MS_DAY));
}

function _natalKey(planets: Array<{ longitude: number }>): string {
  return planets.map(p => Math.round(p.longitude * 10)).join(",");
}

function _dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function _dateFromOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export interface TransitHit {
  date: string;           // ISO date string (YYYY-MM-DD)
  transit_planet: string;
  /** Ecliptic longitude (degrees) of the transiting planet on `date`. Lets the
   *  V4 reading view's Step 4 chart draw aspect lines from a real geometric
   *  position rather than the natal target. Optional for back-compat with
   *  cached hits produced before this field was added. */
  transit_planet_lon?: number;
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
 * @param options       — windowing and result-selection options
 *
 * Defaults preserve trip-shaped behavior: 90 days before / 270 days after the
 * reference, proximity-sorted, capped at MAX_RESULTS=200 hits clustered near
 * the anchor. Relocation callers should pass `policy: "chronological"` and a
 * larger `maxResults` to get even monthly coverage across the full window.
 */
export async function solve12MonthTransits(
  natalPlanets: Array<{ name?: string; planet?: string; longitude: number }>,
  referenceDate: Date,
  options: {
    windowDaysBefore?: number;
    windowDaysAfter?: number;
    policy?: SolvePolicy;
    maxResults?: number;
  } = {},
): Promise<TransitHit[]> {
  const {
    windowDaysBefore = 90,
    windowDaysAfter = 270,
    policy = "proximity",
    maxResults = MAX_RESULTS,
  } = options;

  // Cache key includes window dimensions + policy + maxResults so a relocation
  // request never gets served a previously-cached trip-shaped result (different
  // window, different sort).
  const cacheKey = `${_natalKey(natalPlanets)}:${_weekNum(referenceDate)}:${windowDaysBefore}:${windowDaysAfter}:${policy}:${maxResults}`;
  const cached = _transitCache.get(cacheKey);
  if (cached) return cached;

  const results: TransitHit[] = [];

  const start = new Date(referenceDate.getTime() - windowDaysBefore * MS_DAY);
  const end   = new Date(referenceDate.getTime() + windowDaysAfter  * MS_DAY);

  const startDay = _dateFromOnly(_dateOnly(start));
  const endDay = _dateFromOnly(_dateOnly(end));
  const dayCount = Math.floor((endDay.getTime() - startDay.getTime()) / MS_DAY) + 1;
  const positionsByDate = await getComputedSkyForDateRange(startDay, dayCount, {
    bodies: UNIVERSAL_SKY_BODIES,
  });

  let current = new Date(start);

  while (current <= end) {
    const transitPositions = positionsByDate.get(_dateOnly(current)) ?? [];

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
          date: _dateOnly(current),
          transit_planet: transit.name,
          transit_planet_lon: transit.longitude,
          natal_planet: natalName,
          aspect: result.aspect,
          orb: result.orb,
          applying,
          benefic: BENEFIC_SET.has(transit.name),
          retrograde: transit.is_retrograde,
        });
      }
    }

    current = new Date(current.getTime() + SAMPLE_INTERVAL_DAYS * MS_DAY);
  }

  // Two-pass cap so no single combo eats the budget.
  //
  // Pass 1: per-combo cap. Each `(transit_planet, natal_planet, aspect)` combo
  // is allowed at most PER_COMBO_CAP weekly samples, picked tightest-orb-first.
  // This stops fast-moving bodies (Moon, Mercury, Venus) — which generate many
  // hits per week — from crowding out outer-planet transits when sorted globally.
  //
  // Pass 2: global sort by proximity to the reference date so "top N" still
  // reflects the user's travel window. Tightness is the tie-breaker.
  const PER_COMBO_CAP = 6;
  const byCombo = new Map<string, TransitHit[]>();
  for (const h of results) {
    const key = `${h.transit_planet}|${h.natal_planet}|${h.aspect}`;
    if (!byCombo.has(key)) byCombo.set(key, []);
    byCombo.get(key)!.push(h);
  }
  const balanced: TransitHit[] = [];
  for (const arr of byCombo.values()) {
    arr.sort((a, b) => a.orb - b.orb);
    for (const h of arr.slice(0, PER_COMBO_CAP)) balanced.push(h);
  }

  if (policy === "proximity") {
    const refTime = referenceDate.getTime();
    balanced.sort((a, b) => {
      const da = Math.abs(new Date(a.date).getTime() - refTime);
      const db = Math.abs(new Date(b.date).getTime() - refTime);
      return da !== db ? da - db : a.orb - b.orb;
    });
  } else {
    // Chronological: even temporal coverage. Per-combo cap (above) already
    // prevents fast bodies from drowning the outers. Tie-break tightest-first.
    balanced.sort((a, b) => {
      const ad = new Date(a.date).getTime();
      const bd = new Date(b.date).getTime();
      return ad !== bd ? ad - bd : a.orb - b.orb;
    });
  }

  const hits = balanced.slice(0, maxResults);

  if (_transitCache.size >= _CACHE_MAX) {
    const oldest = _transitCache.keys().next().value;
    if (oldest !== undefined) _transitCache.delete(oldest);
  }
  _transitCache.set(cacheKey, hits);

  return hits;
}
