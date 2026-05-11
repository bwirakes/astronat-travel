import SwissEph from 'swisseph-wasm';
import { AspectHit, findAllAspects } from './aspects';
import { computeDeclination, isOutOfBounds } from './declination';

export const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

// Swisseph Constants (re-declared for clarity and matching index.d.ts)
const SE = {
  SUN: 0,
  MOON: 1,
  MERCURY: 2,
  VENUS: 3,
  MARS: 4,
  JUPITER: 5,
  SATURN: 6,
  URANUS: 7,
  NEPTUNE: 8,
  PLUTO: 9,
  TRUE_NODE: 11,
  GREG_CAL: 1,
  FLG_SPEED: 256,
  FLG_SWIEPH: 2,
};

export const PLANETS: Record<string, number> = {
  "Sun": SE.SUN,
  "Moon": SE.MOON,
  "Mercury": SE.MERCURY,
  "Venus": SE.VENUS,
  "Mars": SE.MARS,
  "Jupiter": SE.JUPITER,
  "Saturn": SE.SATURN,
  "Uranus": SE.URANUS,
  "Neptune": SE.NEPTUNE,
  "Pluto": SE.PLUTO,
  "True Node": SE.TRUE_NODE,
};

export class SwissEphSingleton {
  private static instance: SwissEph | null = null;
  private static initialized = false;

  public static async getInstance(): Promise<SwissEph> {
    if (!this.instance) {
      this.instance = new SwissEph();
    }
    if (!this.initialized) {
      await this.instance.initSwissEph();
      this.initialized = true;
    }
    return this.instance;
  }
}

export function getSign(longitude: number): string {
  return ZODIAC_SIGNS[Math.floor(longitude / 30)];
}

export function getHouse(longitude: number, cusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    if (start < end) {
      if (longitude >= start && longitude < end) {
        return i + 1;
      }
    } else {
      if (longitude >= start || longitude < end) {
        return i + 1;
      }
    }
  }
  return 1;
}

export interface ComputedPosition {
  name: string;
  longitude: number;
  latitude?: number;
  /** Equatorial declination in degrees, derived from ecliptic lon/lat.
   *  Out-of-bounds when |declination| > 23.4393°. */
  declination?: number;
  isOOB?: boolean;
  sign: string;
  degree_in_sign: number;
  degree_minutes: number;
  speed: number;
  is_retrograde: boolean;
  computed_at_utc: string;
  house?: number;
}

/**
 * Compute geocentric tropical positions for all major planets at a specific minute.
 */
export async function computeRealtimePositions(dtUtc: Date, houseCusps?: number[]): Promise<ComputedPosition[]> {
  const swe = await SwissEphSingleton.getInstance();
  const year = dtUtc.getUTCFullYear();
  const month = dtUtc.getUTCMonth() + 1;
  const day = dtUtc.getUTCDate();
  const hour = dtUtc.getUTCHours() + dtUtc.getUTCMinutes() / 60.0 + dtUtc.getUTCSeconds() / 3600.0;
  
  // Use julday with 4 args as per d.ts
  const jd = swe.julday(year, month, day, hour);
  
  const positions: ComputedPosition[] = [];
  const tsIso = dtUtc.toISOString();

  // Use SEFLG_SPEED | SEFLG_SWIEPH equivalent
  const flags = SE.FLG_SPEED | SE.FLG_SWIEPH;

  for (const [name, pid] of Object.entries(PLANETS)) {
    // Use calc for better object return
    const res = swe.calc(jd, pid, flags);
    const lon = res.longitude;
    const speed = res.longitudeSpeed;
    
    const signIdx = Math.floor(lon / 30);
    const degInSign = lon % 30;
    
    const ecliptic_lat = Number(res.latitude.toFixed(6));
    const decl = computeDeclination(lon, ecliptic_lat);
    const pos: ComputedPosition = {
      name,
      longitude: Number(lon.toFixed(6)),
      latitude: ecliptic_lat,
      declination: Number(decl.toFixed(4)),
      isOOB: isOutOfBounds(decl),
      sign: ZODIAC_SIGNS[signIdx],
      degree_in_sign: Number(degInSign.toFixed(4)),
      degree_minutes: Math.floor((degInSign - Math.floor(degInSign)) * 60),
      speed: Number(speed.toFixed(6)),
      is_retrograde: speed < 0,
      computed_at_utc: tsIso,
    };
    
    if (houseCusps) {
      pos.house = getHouse(lon, houseCusps);
    }
    
    positions.push(pos);
  }
  
  return positions;
}

export interface DailyWeather {
  user_id: string;
  user_name: string;
  date: string;
  computed_at_utc: string;
  transit_positions: ComputedPosition[];
  active_aspects: (AspectHit & { date: string })[];
}

/**
 * Compute today's cosmic weather: current transits vs natal chart.
 */
export async function computeDailyWeather(
  userProfile: { user_id: string; display_name: string; natal_planets: any[]; house_cusps: number[] },
  dateStr: string,
  timeUtc: string = "00:00"
): Promise<DailyWeather> {
  const dtStr = `${dateStr}T${timeUtc}:00Z`;
  const dtUtc = new Date(dtStr);

  const houseCusps = userProfile.house_cusps;
  const transitPositions = await computeRealtimePositions(dtUtc, houseCusps);
  
  const natalPlanets = userProfile.natal_planets;
  const aspects = findAllAspects(transitPositions, natalPlanets);

  const activeAspects = aspects.map(a => ({ ...a, date: dateStr }));

  return {
    user_id: userProfile.user_id,
    user_name: userProfile.display_name,
    date: dateStr,
    computed_at_utc: dtUtc.toISOString(),
    transit_positions: transitPositions,
    active_aspects: activeAspects,
  };
}
