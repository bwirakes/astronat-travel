import { generateObject } from "ai";
import { gemini, MODEL } from "@/lib/ai/client";
import { SHARED_VOICE } from "@/lib/ai/voice";
import { WeatherReadingSchema, type WeatherReading, type Tone } from "@/lib/ai/schemas";

export interface WeatherReadingInput {
  destination: string;
  dateRange: { start: string; end: string };
  windowDays: number;
  overallScore: number;
  bestDay: { date: string; label: string } | null;
  worstDay: { date: string; label: string } | null;
  topEvents: Array<{
    aspect: string;            // "Mars conjuncts Tokyo's Midheaven"
    planets: { a: string; b: string };
    dates: string;             // "May 12 — May 14"
    tone: Tone;
    angle?: string;            // "Midheaven", "Descendant", etc.
  }>;
}

const SYSTEM = `You are writing a short travel almanac for one person, one city, one window. Your job: help them pick good days to travel and understand what the sky is doing there.

${SHARED_VOICE}

OUTPUT FIELDS — fill all of them:

titleFlourish — one lowercase word the UI renders next to the city name in script ("opening", "pause", "window", "drift", "return", "rest", "tilt"). Pick one that fits the overall feel.

verdict — one short sentence, 8–15 words. Names the city and the main theme. Reads like a magazine deck. No astrology words.
  Good: "Tokyo is a strong window for work and relationships."

hook — 2–3 short sentences. Sentence 1 describes the moving sky over this city right now. Sentence 2 describes the zodiac sign this city sits under forever and what is crossing it. Sentence 3 ties them together or sets the feel.

dropLine — one sentence that names 2–3 specific planet moves from the data in plain words.

travelWindows — 3 real date ranges the user could book. Each has:
  rank — a clear label ("Best overall", "Meet new people", "Quiet rest", or similar)
  dates — format "MMM D – MMM D, YYYY"
  nights — integer, matches the range
  score — 0–100
  note — one short sentence saying why
Do not overlap ranges. Best score first.

keyMoments — 3–5 short stories for the window. Each has:
  title — human, short
  driver — short driver label in plain words ("Jupiter on Descendant", "Venus on Midheaven")
  dates — "MMM D – MMM D" or single date
  body — 2–3 simple sentences, then one final "Chain: [fact] → [ruler/aspect] → [result]." sentence
  impact — "challenging" | "supportive" | "neutral"

advice:
  bestWindow — one short sentence
  watchWindow — one short sentence

Only use dates and planets that appear in the input. Do not invent.`;

export async function writeWeatherReading(
  input: WeatherReadingInput,
): Promise<WeatherReading> {
  const { object } = await generateObject({
    model: gemini(MODEL),
    system: SYSTEM,
    prompt: `<signal>\n${JSON.stringify(input, null, 2)}\n</signal>\n\nWrite the weather reading JSON. Stay strictly inside the signal — do not invent.`,
    schema: WeatherReadingSchema,
  });
  return object;
}
