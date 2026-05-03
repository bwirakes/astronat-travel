/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TeacherReading } from "@/lib/ai/schemas";
import type { ScoreNarrative } from "@/app/lib/reading-tabs";

/** Final shape persisted into readings.details for an astrocartography reading. */
export interface AstrocartoReadingResult {
  destination: string;
  destinationLat: number;
  destinationLon: number;
  travelType?: string;
  travelDate: string | null;
  goals: number[];
  /** Original goal IDs as picked on /reading/new ("love" | "career" | "community" |
   *  "timing" | "growth" | "relocation"). Carried so the V4 view can order Step 3
   *  vibes by the user's stated intent rather than by raw event score. */
  goalIds?: string[];
  macroScore: number;
  macroVerdict: string;
  /** Date+goal-adjusted hero score, persisted at reading-generation time so
   *  the readings list and the reading detail header agree. Computed by
   *  app/lib/hero-score.ts:computeHeroScore. Optional only for legacy rows
   *  that predate the field — runtime falls back to the live-derived value. */
  heroWindowScore?: number;
  /** Provenance for `heroWindowScore` (which fallback branch produced it).
   *  See HeroScoreSource in app/lib/hero-score.ts. */
  heroScoreSource?: string;
  /** 3-bucket decomposition of macroScore. Sums to macroScore (rounded).
   *  Consumed by the V4 view's §01 score pills so the reader can see where
   *  the points came from. Optional only because cached readings predate it. */
  scoreBreakdown?: { place: number; timing: number; sky: number };
  scoreNarrative?: ScoreNarrative;
  /** Sepharial geodetic band the destination longitude falls in. Drives the
   *  V4 view's §05 "world sky" section. Optional for back-compat. */
  geodeticBand?: { sign: string; longitudeRange: string };
  houses: any[];
  houseSystem?: string;
  planetaryLines: any[];
  transitWindows: any[];
  eventScores: any[];
  natalPlanets: any[];
  relocatedCusps: number[];
  /** Natal house angles (cusps 0/3/6/9 computed at the birth lat/lon).
   *  Consumed by the V4 reading view's Step 7 to render real natal-vs-relocated
   *  angle deltas. Optional because legacy cached readings predate this field. */
  natalAngles?: { ASC: number; IC: number; DSC: number; MC: number };
  /** All 12 natal house cusps (Placidus / whole-sign per the same rule used
   *  for relocatedCusps). Consumed by Step 7's RelocationBiWheel. Optional
   *  for back-compat with cached readings. */
  natalCusps?: number[];
  /** Birth-chart pole for the V4 view's Step 7 (natal vs relocated header).
   *  Mirrored from profiles.* — copied here so the reading is self-contained
   *  and we don't need a profile fetch on the page. */
  birth?: {
    city?: string | null;
    date?: string | null;
    time?: string | null;
    lat?: number | null;
    lon?: number | null;
  };
  lotOfFortune?: any;
  lotOfSpirit?: any;

  /** Teacher-voice AI output. Consumed by the V4 reading view as the source
   *  for vibe blurbs (summary.leanInto) and aspect explanations (signals.weather). */
  teacherReading?: TeacherReading;

  /** Marker stamped onto every reading generated with the geodetic-extras
   *  pipeline (activeGeoTransits, personalEclipses, personalLunations,
   *  parans, geodeticHouseFrame). Used by PlaceFieldTab's §02 empty-state
   *  to distinguish a truly quiet sky (marker present, all timing fields
   *  empty) from an old reading whose engine outputs predate these fields
   *  (marker missing). Datestamp form so future bumps are diffable. */
  geodeticEngineVersion?: string;

  // Synastry add-ons (only present when readingCategory === "synastry")
  partnerNatalPlanets?: any[];
  synastryAspects?: any[];
  userMacroScore?: number;
  userMacroVerdict?: string;
  userHouses?: { house: number; score: number }[];
  userPlanetaryLines?: any[];
  userRelocatedCusps?: number[];
  partnerMacroScore?: number;
  partnerMacroVerdict?: string;
  partnerHouses?: { house: number; score: number }[];
  partnerPlanetaryLines?: any[];
  partnerRelocatedCusps?: number[];
  partnerEventScores?: import("@/app/lib/scoring-engine").FinalEventScore[];
  partnerName?: string;
  scoreDelta?: number;
  averageScore?: number;
  houseComparison?: any[];
  recommendation?: "go" | "caution" | "avoid";
}

export interface RunAstrocartoInput {
  user: { id: string };
  destination: string;
  targetLat: number;
  targetLon: number;
  travelDate?: string | null;
  travelType?: string;
  goals?: unknown[];
  readingCategory: "astrocartography" | "synastry" | "natal" | "solar_return" | "mundane";
  partnerId?: string | null;
  supabase: any;
}

export interface RunWeatherInput {
  user: { id: string };
  destination?: string;
  weather: {
    cities: Array<{ label: string; lat: number; lon: number }>;
    windowDays?: number;
    startDate?: string;
    goalFilter?: any;
  };
  supabase: any;
  origin: string;
}
