/**
 * acg-lines.ts — ACG city distance resolver + paran computation.
 *
 * Given a birth datetime and target city coordinates, computes all planetary
 * angularity lines (MC, IC, ASC, DSC) for the birth moment and returns the
 * subset within MAX_DISTANCE_KM of the city, sorted by proximity.
 *
 * MC/IC are vertical meridian lines (fixed longitude). Distance is the
 * great-circle distance from the city to the nearest point on that meridian
 * (same latitude, line's longitude).
 *
 * ASC/DSC are oblique curves described by discrete lat/lon points. Distance
 * is the minimum haversine distance across all points within ±LAT_WINDOW°
 * latitude of the city.
 *
 * Parans are the latitudes where two ACG lines from different planets
 * intersect on the map. computeParans() derives these from the full ACGLine[]
 * geometry and filters to a window around the destination latitude.
 */

import { computeACG, haversineDistance, ACGLine, ACGPoint } from "./astrocartography";

/** Maximum distance (km) to include a line in the result. */
const MAX_DISTANCE_KM = 2000;

/** Latitude search window for ASC/DSC curve sampling (degrees). */
const LAT_WINDOW_DEG = 5;

/** Max longitudinal gap (°) when matching a curve point to an MC/IC longitude. */
const MC_CURVE_LON_TOL = 3;

export interface ACGCityLine {
  planet: string;
  angle: string; // "MC" | "IC" | "ASC" | "DSC"
  distance_km: number;
}

/**
 * Paran: the latitude where two ACG lines from different planets intersect.
 * Structurally compatible with MatrixParan (all required fields present).
 */
export interface ParanResult {
  p1: string;    // planet 1
  p2: string;    // planet 2
  lat: number;   // latitude of intersection (degrees)
  type?: string; // e.g., "MC/ASC"
}

// ── Geometry helpers ─────────────────────────────────────────────────────────

/** Normalize longitude to [0, 360). */
function normLon(lon: number): number {
  return ((lon % 360) + 360) % 360;
}

/** Shortest signed angular difference in (−180, 180]. */
function lonDiff(a: number, b: number): number {
  let d = normLon(a) - normLon(b);
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

/**
 * For an ASC/DSC oblique curve, interpolate the latitude at which the curve's
 * longitude equals targetLon. Returns null if the curve never comes within
 * MC_CURVE_LON_TOL° of targetLon.
 */
function latAtLon(line: ACGLine, targetLon: number): number | null {
  if (!line.curve_segments) return null;

  let bestLat: number | null = null;
  let bestDiff = MC_CURVE_LON_TOL;

  outer:
  for (const segment of line.curve_segments) {
    for (let i = 0; i < segment.length - 1; i++) {
      const p1 = segment[i];
      const p2 = segment[i + 1];
      const d1 = lonDiff(p1.lon, targetLon);
      const d2 = lonDiff(p2.lon, targetLon);

      if (d1 * d2 <= 0) {
        // Crossing found — interpolate exact latitude
        const denom = Math.abs(d1) + Math.abs(d2);
        const t = denom > 0 ? Math.abs(d1) / denom : 0;
        bestLat = p1.lat + t * (p2.lat - p1.lat);
        bestDiff = 0;
        break outer;
      }

      const minD = Math.min(Math.abs(d1), Math.abs(d2));
      if (minD < bestDiff) {
        bestDiff = minD;
        bestLat = Math.abs(d1) <= Math.abs(d2) ? p1.lat : p2.lat;
      }
    }
  }

  return bestLat;
}

/**
 * Find the latitude where two ASC/DSC curves intersect (share the same
 * longitude). Scans lineA's points and detects a sign change in (lonA − lonB).
 * Returns null if no intersection is found.
 */
function curveIntersectionLat(lineA: ACGLine, lineB: ACGLine): number | null {
  if (!lineA.curve_segments || !lineB.curve_segments) return null;

  // Build a latitude-sorted list of lineB's points for binary-search interpolation.
  const bPoints: ACGPoint[] = lineB.curve_segments.flat().sort((a, b) => a.lat - b.lat);

  function lonBAtLat(lat: number): number | null {
    let lo = 0;
    let hi = bPoints.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (bPoints[mid].lat < lat) lo = mid + 1;
      else hi = mid;
    }
    if (lo === 0 || lo >= bPoints.length) return null;
    const p1 = bPoints[lo - 1];
    const p2 = bPoints[lo];
    const span = p2.lat - p1.lat;
    if (Math.abs(span) < 1e-9) return p1.lon;
    const t = (lat - p1.lat) / span;
    // Interpolate using signed diff to handle antimeridian wrap.
    return normLon(p1.lon + t * lonDiff(p2.lon, p1.lon));
  }

  const aPoints: ACGPoint[] = lineA.curve_segments.flat().sort((a, b) => a.lat - b.lat);

  let prevDiff: number | null = null;
  let prevLat: number | null = null;

  for (const pt of aPoints) {
    const lonB = lonBAtLat(pt.lat);
    if (lonB === null) continue;

    const diff = lonDiff(pt.lon, lonB);

    if (prevDiff !== null && prevLat !== null && prevDiff * diff < 0) {
      // Sign change: interpolate crossing latitude
      const denom = Math.abs(prevDiff) + Math.abs(diff);
      const t = denom > 0 ? Math.abs(prevDiff) / denom : 0;
      return prevLat + t * (pt.lat - prevLat);
    }

    prevDiff = diff;
    prevLat = pt.lat;
  }

  return null;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Computes parans — latitudes where two ACG lines from different planets
 * intersect on the map. Only returns parans within latWindow° of cityLat.
 *
 * @param allLines  — full ACGLine[] from computeACG() or resolveACGFull()
 * @param cityLat   — destination latitude
 * @param latWindow — degrees around cityLat to include parans (default 5°)
 */
export function computeParans(
  allLines: ACGLine[],
  cityLat: number,
  latWindow = 5,
): ParanResult[] {
  const parans: ParanResult[] = [];

  for (let i = 0; i < allLines.length; i++) {
    for (let j = i + 1; j < allLines.length; j++) {
      const lineA = allLines[i];
      const lineB = allLines[j];

      if (lineA.planet === lineB.planet) continue;

      const vertA = lineA.angle_type === "MC" || lineA.angle_type === "IC";
      const vertB = lineB.angle_type === "MC" || lineB.angle_type === "IC";

      let paranLat: number | null = null;

      if (vertA && vertB) {
        // Two vertical meridian lines never intersect geographically — skip.
        continue;
      } else if (vertA) {
        if (lineA.longitude === null) continue;
        paranLat = latAtLon(lineB, lineA.longitude);
      } else if (vertB) {
        if (lineB.longitude === null) continue;
        paranLat = latAtLon(lineA, lineB.longitude);
      } else {
        paranLat = curveIntersectionLat(lineA, lineB);
      }

      if (paranLat === null) continue;
      if (Math.abs(paranLat - cityLat) > latWindow) continue;

      parans.push({
        p1: lineA.planet,
        p2: lineB.planet,
        lat: Math.round(paranLat * 100) / 100,
        type: `${lineA.angle_type}/${lineB.angle_type}`,
      });
    }
  }

  return parans;
}

/** Internal: converts a full ACGLine[] into ACGCityLine[] for a specific city. */
function filterCityLines(
  allLines: ACGLine[],
  cityLat: number,
  cityLon: number,
): ACGCityLine[] {
  const results: ACGCityLine[] = [];

  for (const line of allLines) {
    let dist: number;

    if (line.angle_type === "MC" || line.angle_type === "IC") {
      if (line.longitude === null) continue;
      dist = haversineDistance(cityLat, cityLon, cityLat, line.longitude);
    } else {
      if (!line.curve_segments || line.curve_segments.length === 0) continue;

      let minDist = Infinity;
      for (const segment of line.curve_segments) {
        for (const pt of segment) {
          if (Math.abs(pt.lat - cityLat) > LAT_WINDOW_DEG) continue;
          const d = haversineDistance(cityLat, cityLon, pt.lat, pt.lon);
          if (d < minDist) minDist = d;
        }
      }

      if (!isFinite(minDist)) continue;
      dist = minDist;
    }

    if (dist <= MAX_DISTANCE_KM) {
      results.push({
        planet: line.planet,
        angle: line.angle_type,
        distance_km: Math.round(dist),
      });
    }
  }

  return results.sort((a, b) => a.distance_km - b.distance_km);
}

/**
 * Resolves ACG lines for a city and returns both the city-filtered list and
 * the full ACGLine[] geometry needed for paran computation.
 *
 * Prefer this over resolveACGForCity when you also need computeParans(), so
 * computeACG() is only called once per request.
 *
 * @param dtUtc   — birth datetime in UTC
 * @param cityLat — target city latitude
 * @param cityLon — target city longitude
 */
export async function resolveACGFull(
  dtUtc: Date,
  cityLat: number,
  cityLon: number,
): Promise<{ cityLines: ACGCityLine[]; allLines: ACGLine[] }> {
  const allLines = await computeACG(dtUtc);
  return { cityLines: filterCityLines(allLines, cityLat, cityLon), allLines };
}

/**
 * Resolves ACG lines for a city based on the natal birth datetime.
 *
 * @param dtUtc   — birth datetime in UTC
 * @param cityLat — target city latitude
 * @param cityLon — target city longitude
 * @returns Array of ACGCityLine sorted by distance_km ascending, within 2000km.
 */
export async function resolveACGForCity(
  dtUtc: Date,
  cityLat: number,
  cityLon: number,
): Promise<ACGCityLine[]> {
  const allLines = await computeACG(dtUtc);
  return filterCityLines(allLines, cityLat, cityLon);
}
