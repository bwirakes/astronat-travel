type BirthProfile = {
  birth_date?: string | null;
  birth_time?: string | null;
  birth_lat?: number | null;
  birth_lon?: number | null;
};

type CachedNatalChart = {
  ephemeris_data?: {
    planets?: unknown;
    profile_time?: unknown;
    birth_date?: unknown;
    birth_time?: unknown;
    birth_lat?: unknown;
    birth_lon?: unknown;
    cusps?: unknown;
  } | null;
  house_placements?: { cusps?: unknown } | null;
  cusps_data?: { cusps?: unknown } | null;
} | null | undefined;

function normalizeTime(value?: string | null): string | null {
  if (!value) return null;
  const [hh = "00", mm = "00", ss = "00"] = value.split(":");
  return `${hh.padStart(2, "0")}:${mm.padStart(2, "0")}:${ss.padStart(2, "0")}`;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function closeEnough(a: unknown, b: unknown, tolerance = 0.0001): boolean {
  return typeof a === "number" && typeof b === "number" && Math.abs(a - b) <= tolerance;
}

function sameInstant(a: unknown, b: Date, toleranceMs = 60_000): boolean {
  if (typeof a !== "string" || !a) return false;
  const ms = new Date(a).getTime();
  return Number.isFinite(ms) && Math.abs(ms - b.getTime()) <= toleranceMs;
}

export function natalCacheMatchesProfile(
  cached: CachedNatalChart,
  profile: BirthProfile,
  expectedUtc: Date,
): boolean {
  const data = cached?.ephemeris_data;
  if (!data || !Array.isArray(data.planets) || data.planets.length === 0) return false;

  if (!sameInstant(data.profile_time, expectedUtc)) return false;

  const cachedDate = stringOrNull(data.birth_date);
  const cachedTime = normalizeTime(stringOrNull(data.birth_time));
  if (cachedDate || cachedTime || data.birth_lat != null || data.birth_lon != null) {
    return (
      cachedDate === profile.birth_date &&
      cachedTime === normalizeTime(profile.birth_time) &&
      closeEnough(data.birth_lat, profile.birth_lat) &&
      closeEnough(data.birth_lon, profile.birth_lon)
    );
  }

  return true;
}

export function natalCuspsFromCache(cached: CachedNatalChart): number[] {
  const candidates = [
    cached?.ephemeris_data?.cusps,
    cached?.house_placements?.cusps,
    cached?.cusps_data?.cusps,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length === 12) {
      return candidate.map(Number);
    }
  }

  return [];
}
