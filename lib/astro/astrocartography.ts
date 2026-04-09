import SwissEph from 'swisseph-wasm';

const swe = new SwissEph();

/**
 * Normalizes longitude to be between -180 and +180.
 */
export function normalizeLongitude(lon: number): number {
  lon = lon % 360;
  if (lon > 180) lon -= 360;
  if (lon < -180) lon += 360;
  return lon;
}

/**
 * Calculates the great-circle distance between two points on the Earth surface (km).
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

class SwissEphSingleton {
  private static instance: SwissEph | null = null;
  private static initialized = false;

  public static async getInstance(): Promise<SwissEph> {
    if (!this.instance) this.instance = new SwissEph();
    if (!this.initialized) {
      await this.instance.initSwissEph();
      this.initialized = true;
    }
    return this.instance;
  }
}

export interface ACGPoint {
  lat: number;
  lon: number;
}

export interface ACGLine {
  planet: string;
  angle_type: "MC" | "IC" | "ASC" | "DSC";
  longitude: number | null; // For vertical lines (MC/IC)
  curve_segments: ACGPoint[][] | null; // For horizontal/oblique curves (ASC/DSC), split over antimeridian
  declination: number; // Expose true declination for Paran mapping
}

function splitAtAntiMeridian(points: ACGPoint[], threshold: number = 180): ACGPoint[][] {
  if (points.length === 0) return [];
  const segments: ACGPoint[][] = [];
  let currentSegment: ACGPoint[] = [points[0]];

  for (let i = 1; i < points.length; i++) {
    const prevLon = points[i - 1].lon;
    const currLon = points[i].lon;

    if (Math.abs(currLon - prevLon) > threshold) {
      segments.push(currentSegment);
      currentSegment = [];
    }
    currentSegment.push(points[i]);
  }

  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }
  return segments;
}

/**
 * Computes all 4 ACG angularity lines for a given moment.
 */
export async function computeACG(dtUtc: Date): Promise<ACGLine[]> {
  const sw = await SwissEphSingleton.getInstance();
  
  const jd = sw.julday(
    dtUtc.getUTCFullYear(),
    dtUtc.getUTCMonth() + 1,
    dtUtc.getUTCDate(),
    dtUtc.getUTCHours() + dtUtc.getUTCMinutes() / 60.0 + dtUtc.getUTCSeconds() / 3600.0
  );

  // Constants
  const SEFLG_EQUATORIAL = 2048;
  const SE_SUN = 0, SE_MOON = 1, SE_MERCURY = 2, SE_VENUS = 3, SE_MARS = 4, 
        SE_JUPITER = 5, SE_SATURN = 6, SE_URANUS = 7, SE_NEPTUNE = 8, SE_PLUTO = 9;

  const planets: Record<string, number> = {
    "Sun": SE_SUN, "Moon": SE_MOON, "Mercury": SE_MERCURY, "Venus": SE_VENUS, 
    "Mars": SE_MARS, "Jupiter": SE_JUPITER, "Saturn": SE_SATURN, 
    "Uranus": SE_URANUS, "Neptune": SE_NEPTUNE, "Pluto": SE_PLUTO
  };

  const gstHours = sw.sidtime(jd);
  const gstDeg = (gstHours * 15.0) % 360.0;

  const lines: ACGLine[] = [];

  for (const [name, pid] of Object.entries(planets)) {
    // Get Equatorial RA/Dec
    // calc returns {longitude, latitude, distance, ...} where longitude=RA, latitude=Dec if flag is set
    const coords = sw.calc(jd, pid, SEFLG_EQUATORIAL);
    const ra = coords.longitude;
    const dec = coords.latitude;

    // 1. Compute MC/IC Lines (Vertical longitudes)
    const mcLon = (ra - gstDeg + 360) % 360;
    const icLon = (mcLon + 180) % 360;

    lines.push({ planet: name, angle_type: "MC", longitude: normalizeLongitude(mcLon), curve_segments: null, declination: dec });
    lines.push({ planet: name, angle_type: "IC", longitude: normalizeLongitude(icLon), curve_segments: null, declination: dec });

    // 2. Compute ASC/DSC Curves (Oblique curves)
    const ascPoints: ACGPoint[] = [];
    const dscPoints: ACGPoint[] = [];
    const decRad = dec * Math.PI / 180;

    for (let latDeg = -89; latDeg < 90; latDeg++) {
      const latRad = latDeg * Math.PI / 180;
      const cosLha = -Math.tan(latRad) * Math.tan(decRad);

      if (Math.abs(cosLha) <= 1.0) {
        const lhaDeg = Math.acos(cosLha) * 180 / Math.PI;
        
        const ascLonRaw = (ra + lhaDeg - gstDeg + 720) % 360;
        const dscLonRaw = (ra - lhaDeg - gstDeg + 720) % 360;

        ascPoints.push({ lat: latDeg, lon: normalizeLongitude(ascLonRaw) });
        dscPoints.push({ lat: latDeg, lon: normalizeLongitude(dscLonRaw) });
      }
    }

    lines.push({ planet: name, angle_type: "ASC", longitude: null, curve_segments: splitAtAntiMeridian(ascPoints), declination: dec });
    lines.push({ planet: name, angle_type: "DSC", longitude: null, curve_segments: splitAtAntiMeridian(dscPoints), declination: dec });
  }

  return lines;
}
