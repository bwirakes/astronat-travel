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
  | "midpoint-ingress"
  | "stellium"
  | "oob-span"
  | "nodal-activation"
  | "one-sided-nodal"
  | "sun-over-mc";

/** Threshold for the "all planets one side of Nodal axis" configuration. */
export const ONE_SIDED_NODAL_THRESHOLD = 6;
export const ONE_SIDED_NODAL_BODIES = [
  "Sun", "Moon", "Mercury", "Venus", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
] as const;

/** Four cardinal sign starts — define the "seasonal ingress charts". */
export const CARDINAL_SIGNS = new Set(["Aries", "Cancer", "Libra", "Capricorn"]);

/** Sign names as they appear in `sign`, `fromSign`, `toSign` fields. */
export const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

/** Stellium config — matches the research-framework artifact ("3+ planets within 5°"). */
export const STELLIUM_BODIES = [
  "Sun", "Mercury", "Venus", "Mars", "Jupiter",
  "Saturn", "Uranus", "Neptune", "Pluto",
] as const;
export const STELLIUM_MIN = 3;
export const STELLIUM_ORB_DEG = 5;

/** Outer-planet aspect catalog. Mars included for the "transiting Mars square outer" technique. */
export const OUTER_BODIES = ["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Chiron"] as const;
export const ASPECT_BODIES = ["Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Chiron"] as const;
export const HARD_ASPECTS = [
  { name: "conjunction", angle: 0 },
  { name: "square", angle: 90 },
  { name: "opposition", angle: 180 },
] as const;

/** Named research midpoints per the geodetic research framework. */
export const MIDPOINT_PAIRS: ReadonlyArray<[string, string]> = [
  ["Mars", "Uranus"],
  ["Mars", "Pluto"],
  ["Mars", "True Node"],
  ["Saturn", "Neptune"],
  ["Jupiter", "Neptune"],
];

/** Bodies whose conjunctions with True Node count as "nodal axis activations". */
export const NODAL_TRANSIT_BODIES = ["Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"] as const;
export const NODAL_ORB_DEG = 1.5;

/** OOB: declination magnitude above the Sun's max. */
export const OOB_DECLINATION_DEG = 23.4393;

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
