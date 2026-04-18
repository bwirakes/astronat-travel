import { generateObject } from "ai";
import { gemini, MODEL } from "@/lib/ai/client";
import { SHARED_VOICE } from "@/lib/ai/voice";
import { TeacherReadingSchema, type TeacherReading, type Tone } from "@/lib/ai/schemas";

/**
 * Pre-analyzed signal handed to the AI. The lib resolves all chart math
 * (orbs, degrees, dignity, points, deltas) before this point — the AI never
 * touches numbers. It only writes.
 */
export interface TeacherReadingInput {
  destination: string;
  dateRange: { start: string; end: string };
  overallScore: number;

  topTransits: Array<{
    aspect: string;            // e.g. "Mars in Aquarius squares Uranus in Taurus"
    planets: { a: string; b: string };
    dateRange: string;         // e.g. "Feb 27 — Mar 2"
    tone: Tone;
    houseTopics: string[];     // life areas, plain English
  }>;

  nearbyLines: Array<{
    planet: string;
    angle: string;             // "Ascendant" | "Descendant" | "Midheaven" | "Imum Coeli"
    closeness: "very close" | "near" | "distant";
  }>;

  activeHouses: Array<{
    topic: string;             // e.g. "career and reputation"
    vibe: string;              // e.g. "lit up", "under pressure"
  }>;

  natalSpotlight: Array<{
    planet: string;
    sign: string;
    role: string;              // "Amplified here" | "Under pressure" | "Doing real work"
  }>;
}

const SYSTEM = `You are an astrology columnist writing for readers who are smart but new to astrology. You are given a pre-analyzed chart signal. Your only job is to write — do not compute, do not pick what matters, do not invent events that aren't in the input.

${SHARED_VOICE}`;

export async function writeTeacherReading(
  input: TeacherReadingInput,
): Promise<TeacherReading> {
  const { object } = await generateObject({
    model: gemini(MODEL),
    system: SYSTEM,
    prompt: `<signal>\n${JSON.stringify(input, null, 2)}\n</signal>\n\nWrite the teacher reading JSON. Stay strictly inside the signal — do not invent.`,
    schema: TeacherReadingSchema,
  });
  return object;
}
