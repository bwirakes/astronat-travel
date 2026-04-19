import { GEODETIC_ZONES } from "@/app/geodetic/data/geodeticZones";

// Inlined to keep this module client-safe (importing from transits.ts pulls
// swisseph-wasm into the bundle, which fails on `import("module")`).
const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

export const GEN_START_YEAR = 1976;
export const GEN_END_YEAR = 2026;

// SE planet/asteroid IDs (mirrors swisseph-wasm constants)
export const BODIES: Record<string, number> = {
  Sun: 0,
  Moon: 1,
  Mercury: 2,
  Venus: 3,
  Mars: 4,
  Jupiter: 5,
  Saturn: 6,
  Uranus: 7,
  Neptune: 8,
  Pluto: 9,
  "True Node": 11,
  Chiron: 15,
  Ceres: 17,
  Pallas: 18,
  Juno: 19,
  Vesta: 20,
};

// Bodies that have meaningful retrograde stations.
// Sun/Moon never station; True Node is always retrograde (mean motion).
export const STATIONING_BODIES = [
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
  "Chiron",
  "Ceres",
  "Pallas",
  "Juno",
  "Vesta",
];

export type EventType =
  | "ingress"
  | "station"
  | "eclipse-solar"
  | "eclipse-lunar"
  | "lunation-new"
  | "lunation-full"
  | "retrograde-span"
  | "aspect"
  | "midpoint-ingress";

/** Outer-planet aspect catalog: pairs × hard aspects (conj/sqr/opp). */
export const OUTER_BODIES = ["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Chiron"] as const;
export const HARD_ASPECTS = [
  { name: "conjunction", angle: 0 },
  { name: "square", angle: 90 },
  { name: "opposition", angle: 180 },
] as const;

/** 29°+ of any sign — "anaretic" / late-degree flag. */
export const isAnaretic = (lon: number): boolean => ((lon % 30) + 30) % 30 >= 29;

export interface PatternEvent {
  utc: string;            // ISO 8601 UTC
  jd: number;             // Julian Day UT
  type: EventType;
  body: string;           // e.g. "Mars", "Sun"
  fromSign?: string;      // ingress only
  toSign?: string;        // ingress only
  sign?: string;          // station / lunation / eclipse position
  lon?: number;           // ecliptic longitude at event
  geodeticZone?: string;  // archetypal meridian band id
  meta?: Record<string, string | number | boolean>;
}

export function getSign(lon: number): string {
  return ZODIAC_SIGNS[Math.floor(((lon % 360) + 360) % 360 / 30)];
}

/** Tag an ecliptic longitude with its geodetic zone (archetypal meridian band). */
export function geodeticZoneFor(lon: number): string {
  const norm = ((lon % 360) + 360) % 360;
  const idx = Math.floor(norm / 30);
  return GEODETIC_ZONES[idx]?.id ?? "";
}
