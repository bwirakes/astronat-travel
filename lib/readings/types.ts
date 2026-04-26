import type { TeacherReading } from "@/lib/ai/schemas";

/** Final shape persisted into readings.details for an astrocartography reading. */
export interface AstrocartoReadingResult {
  destination: string;
  destinationLat: number;
  destinationLon: number;
  travelType?: string;
  travelDate: string | null;
  goals: number[];
  macroScore: number;
  macroVerdict: string;
  houses: any[];
  houseSystem?: string;
  planetaryLines: any[];
  transitWindows: any[];
  eventScores: any[];
  natalPlanets: any[];
  relocatedCusps: number[];
  lotOfFortune?: any;
  lotOfSpirit?: any;

  /** Teacher-voice AI output. Consumed by the V4 reading view as the source
   *  for vibe blurbs (summary.leanInto) and aspect explanations (signals.weather). */
  teacherReading?: TeacherReading;

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
