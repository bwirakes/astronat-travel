import { generateObject } from "ai";
import { gemini, MODEL } from "@/lib/ai/client";
import { SHARED_VOICE } from "@/lib/ai/voice";
import {
    WeatherReadingSchema,
    MundaneReadingSchema,
    type WeatherReading,
    type MundaneReading,
    type Tone,
} from "@/lib/ai/schemas";

export interface WeatherReadingInput {
    destination: string;
    dateRange: { start: string; end: string };
    windowDays: number;
    overallScore: number;
    bestDay: { date: string; label: string } | null;
    worstDay: { date: string; label: string } | null;
    topEvents: Array<{
        aspect: string;                   // "Mars conjuncts Tokyo's Midheaven"
        planets: { a: string; b: string };
        dates: string;                     // "May 12 — May 14"
        tone: Tone;
        angle?: string;                    // "Midheaven", "Descendant", etc.
    }>;
    /**
     * Deterministically-computed candidate travel windows. The AI MUST
     * use these verbatim (same dates, nights, score). Its only job is
     * to choose a rank label and write a one-sentence note for each.
     */
    candidateWindows: Array<{
        dates: string;          // "May 12 – May 22, 2026"
        startDate: string;       // "2026-05-12"
        endDate: string;         // "2026-05-22"
        nights: number;
        score: number;           // 0-100
        topDrivers: string[];    // up to 2 planet names active in the window
    }>;
    /**
     * Personal lens — surfaces chart-ruler relocation and close natal-angle
     * contacts so the model has real, user-specific facts to write from.
     * Null if the user has no birth chart on file — in which case the model
     * must still fill rulerJourneyChain with a generic statement naming
     * the city's geodetic sign column (fallback path).
     */
    personalLens: null | {
        relocatedAscSign: string;
        chartRulerPlanet: string;
        chartRulerNatalHouse: number;
        chartRulerRelocatedHouse: number;
        chartRulerNatalDomain: string;
        chartRulerRelocatedDomain: string;
        activeAngleLines: Array<{
            planet: string;
            angle: "ASC" | "DSC" | "MC" | "IC";
            orbDeg: number;
            isChartRuler: boolean;
        }>;
        worldPointContacts: Array<{
            planet: string;
            pointType: string;
            orbDeg: number;
        }>;
    };
}

const PERSONAL_SYSTEM = `You are writing a short personal geodetic reading for one traveller, one city, one window. Help them pick good days and understand what the place does to THEIR chart.

${SHARED_VOICE}

OUTPUT FIELDS — fill all of them:

titleFlourish — one lowercase word the UI renders next to the city name in script ("opening", "pause", "window", "drift", "return", "rest", "tilt"). Pick one that fits the overall feel.

verdict — one short sentence, 8–15 words. Names the city and the main theme. Magazine-deck register.

hook — 2–3 short sentences. Sentence 1 describes the moving sky over this city right now. Sentence 2 describes the zodiac sign this city sits under forever and what is crossing it. Sentence 3 ties them together, or names the chart-ruler shift if the personalLens gives you one.

dropLine — one sentence naming 2–3 specific planet moves from the topEvents array.

rulerJourneyChain — ONE sentence in strict Chain syntax. If personalLens is provided, this is the line the reader will remember. Example shape:
  "Chain: {City} → you become {relocatedAscSign} rising → {chartRulerPlanet} rules → your natal {N}th ({natalDomain}) → relocated {M}th ({relocatedDomain}) → {what that does to this trip}."
Every arrow-separated segment MUST name a proper noun (planet, sign, house ordinal). No adjective-only links. If personalLens is null, fall back to: "Chain: {City} → under the {geodeticSign} column → {transiting planet from topEvents} crosses → {implication for the window}."

travelWindows — Use the exact entries in candidateWindows[]. Do NOT change dates, nights, or score — the window-proposer has already computed those from real daily engine output. Your job is only:
  rank — a clear label, preferring life-domain words: "Best for rest", "Best for connection", "Best for a launch", "Quiet recovery", "Strong second". If there's only one window, label it "Best overall".
  note — one short sentence citing a specific transit from topEvents OR the candidate's topDrivers. Make it concrete.
Return exactly the same number of windows as candidateWindows has, in the same chronological order.

keyMoments — 3–5 short stories. Each:
  title — short, human
  driver — "Jupiter on Descendant", "Venus on Midheaven", etc.
  dates — "MMM D – MMM D" or single date
  body — 2–3 simple sentences, THEN a final "Chain:" sentence following the strict Chain syntax above.
  impact — "challenging" | "supportive" | "neutral"

advice:
  bestWindow — one short sentence naming a specific date range + reason
  watchWindow — one short sentence naming the date range to avoid + reason

Only use dates and planets that appear in the input. Do not invent.`;

const MUNDANE_SYSTEM = `You are writing a one-sentence "situation lead" for a geodetic weather report — mundane / earth-weather context, not personal. Think: NOAA forecast discussion, one decisive opening line.

${SHARED_VOICE}

OUTPUT: situationLead — a single declarative sentence, under 40 words, that names:
  1. The single highest-severity event in the window (planet, sign, aspect if any)
  2. The date range it peaks
  3. One physical-world signature it typically drives (seismic / hydro / atmospheric / civil / fire pressure)

Example:
  "Uranus at 27° Taurus crosses the Midheaven over this region from Feb 27 – Mar 2, a late-degree fixed-sign pattern that historically shows up as seismic pressure and sudden infrastructure stress."

Do not invent. Use only what is in topEvents.`;

export async function writeWeatherReading(
    input: WeatherReadingInput,
): Promise<WeatherReading> {
    const { object } = await generateObject({
        model: gemini(MODEL),
        system: PERSONAL_SYSTEM,
        prompt: `<signal>\n${JSON.stringify(input, null, 2)}\n</signal>\n\nWrite the personal-geodetic reading JSON. Stay strictly inside the signal — do not invent.`,
        schema: WeatherReadingSchema,
    });
    return validateRulerChain(object);
}

export async function writeMundaneLead(
    input: WeatherReadingInput,
): Promise<MundaneReading> {
    const { object } = await generateObject({
        model: gemini(MODEL),
        system: MUNDANE_SYSTEM,
        prompt: `<signal>\n${JSON.stringify(input, null, 2)}\n</signal>\n\nWrite ONE situation-lead sentence.`,
        schema: MundaneReadingSchema,
    });
    return object;
}

// ─────────────────────────────────────────────────────────────────────────
//  Chain validator — rejects hollow Chains like "Eclipse → Renewal → Focus"
// ─────────────────────────────────────────────────────────────────────────

const PLANET_NAMES = new Set([
    "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
    "uranus", "neptune", "pluto", "chiron", "north node", "south node",
]);
const SIGN_NAMES = new Set([
    "aries", "taurus", "gemini", "cancer", "leo", "virgo",
    "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
]);
const ANGLE_NAMES = new Set([
    "ascendant", "descendant", "midheaven", "imum coeli",
    "asc", "dsc", "mc", "ic",
]);
const HOUSE_ORDINAL_RE = /\b\d{1,2}(st|nd|rd|th)\b/i;

function segmentHasAnchor(segment: string): boolean {
    const lower = segment.toLowerCase();
    for (const p of PLANET_NAMES) if (lower.includes(p)) return true;
    for (const s of SIGN_NAMES) if (lower.includes(s)) return true;
    for (const a of ANGLE_NAMES) if (lower.includes(a)) return true;
    if (HOUSE_ORDINAL_RE.test(segment)) return true;
    return false;
}

/**
 * Verify every `→` segment in `rulerJourneyChain` and every Chain line
 * inside `keyMoments[].body` contains at least one proper noun (planet,
 * sign, angle, or house ordinal). If a chain fails, replace it with a
 * deterministic marker that surfaces the miss instead of silently shipping
 * filler. Better to show a lint error than pretend.
 */
function validateRulerChain<T extends WeatherReading>(out: T): T {
    const checkChain = (s: string): boolean => {
        if (!s || !s.toLowerCase().includes("chain:")) return false;
        const after = s.slice(s.toLowerCase().indexOf("chain:") + "chain:".length);
        const parts = after.split("→").map((p) => p.trim()).filter(Boolean);
        if (parts.length < 3) return false;
        return parts.every(segmentHasAnchor);
    };

    if (!checkChain(out.rulerJourneyChain)) {
        out.rulerJourneyChain =
            "Chain validation flagged this response. Regenerate to produce a chain with named planets, houses, and angles.";
    }
    for (const m of out.keyMoments) {
        const lines = m.body.split(/\. +/);
        const chainIdx = lines.findIndex((l) => l.toLowerCase().includes("chain:"));
        if (chainIdx >= 0 && !checkChain(lines[chainIdx])) {
            lines[chainIdx] = "Chain: (regeneration needed — links lacked named planets or houses)";
            m.body = lines.join(". ");
        }
    }
    return out;
}
