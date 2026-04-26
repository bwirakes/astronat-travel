import { generateObject } from "ai";
import { gemini, MODEL } from "@/lib/ai/client";
import { SHARED_VOICE } from "@/lib/ai/voice";
import { TeacherReadingSchema, type TeacherReading, type Tone } from "@/lib/ai/schemas";

/**
 * Pre-analyzed signal handed to the AI. The lib resolves all chart math
 * (orbs, degrees, dignity, points, deltas) before this point — the AI never
 * touches numbers. It only writes.
 *
 * Inputs are structured to match the V4 reading view's seven-step layout:
 *   destination + dateRange + travelType + goalIds → Step 1 hero
 *   topTransits                                    → Step 2 + Step 4
 *   activeHouses + nearbyLines + natalSpotlight    → Step 3 vibes + Step 6
 *   angleDeltas + planetShifts + aspectsToAngles   → Step 7
 */
export interface TeacherReadingInput {
  destination: string;
  dateRange: { start: string; end: string };
  overallScore: number;
  /** "trip" or "relocation" — drives the hero framing and the todo list. */
  travelType: "trip" | "relocation";
  /** User's goal-ID picks from /reading/new, in priority order. The prompt
   *  emits one vibe per goal, in the same order. */
  goalIds: string[];

  topTransits: Array<{
    aspect: string;            // e.g. "Mars in Aquarius squares Uranus in Taurus"
    planets: { a: string; b: string };
    dateRange: string;         // e.g. "Feb 27 — Mar 2"
    tone: Tone;
    houseTopics: string[];     // life areas, plain English
    /** Stable identifier the V4 chart uses to look up the prompt's per-aspect
     *  prose. Format: "<monthKey>-<i>-<transit>-<natal-or-angle>". */
    aspectKey: string;
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

  /** Per-angle natal vs relocated comparison for Step 7. */
  angleShifts?: Array<{
    angle: "ASC" | "IC" | "DSC" | "MC";
    natalSign: string;
    relocatedSign: string;
  }>;

  /** Per-planet natal house → relocated house for Step 7. */
  planetHouseShifts?: Array<{
    planet: string;
    natalHouse: number;
    relocatedHouse: number;
  }>;

  /** Tight aspects from natal planets to the relocated angles. */
  aspectsToAngles?: Array<{
    planet: string;
    angle: "ASC" | "IC" | "DSC" | "MC";
    aspect: string;            // "conjunct" | "sextile" | "square" | "trine" | "opposition"
    orb: number;               // degrees
  }>;
}

const SYSTEM = `You are an astrology columnist writing for readers who are smart but new to astrology. You are given a pre-analyzed chart signal. Your only job is to write — do not compute, do not pick what matters, do not invent events that aren't in the input.

${SHARED_VOICE}

You are writing for a seven-step reading layout. Your output goes into specific named slots, not a single essay.

# What goes where

**chrome** — Short visible chrome strings that personalise the page rather than repeat across every reading:
- \`step3Intro\` — 2–3 sentences introducing the "Why {city}, for you" section. Reference this specific place and the user's chart in plain English. No jargon.
- \`step7Intro\` — 2–3 sentences introducing the relocated-chart section. Mention the specific city and what changes when the chart rotates here.
- \`step7AnglesSub\` — One sentence. The hardcoded version is "The four angles change." Write a place-specific version (e.g. "Your four angles all shift sign in {city}.").
- \`step7HousesSub\` — One sentence. The hardcoded version is "Planets move into new houses." Write a place-specific version.
- \`step7AspectsSub\` — One sentence. The hardcoded version is "New aspects to the angles." Write a place-specific version (e.g. "The tightest new aspects in {city}.").

**hero.explainer** — One short paragraph. For \`travelType: "trip"\`, frame around the date window. For \`travelType: "relocation"\`, frame around the place itself, not a window inside it.

**windows[3]** — Only when \`travelType === "trip"\`. Three travel windows, ordered best → alternate → alternate. Each maps onto a transit in \`topTransits\`. \`flavorTitle\` is a short label (e.g. "Home-like, settling", "Meeting people"); \`note\` is a 1–2 sentence reason; \`score\` is 0–100.

**vibes[]** — One vibe per goal in \`goalIds\`, in the same order. Use the user's words back to them. Example for \`goalId: "love"\` → title "Love and closeness soften here.", body 2–3 sentences specific to the chart signals. Pick an icon character that fits ("♡", "⌂", "▲", "◈", "✦", "✧"). Don't invent goals that weren't picked.

**monthAspects[]** — One entry for each entry in \`topTransits\`, keyed by \`aspectKey\`. \`why\` is 1–2 sentences on why this matters; \`timing\` is when it's exact and how long it lasts.

**angleDeltas[4]** — One per angle (ASC, IC, DSC, MC). Reference both the natal sign and the relocated sign from \`angleShifts\`. Example: ASC moves from Aries to Cancer → "Your public-facing self shifts from direct and sharp to soft and attentive — people will read you as gentler here."

**planetShifts[]** — One per entry in \`planetHouseShifts\`. Plain English on what changes when this planet activates the new house.

**aspectPlains[]** — One per entry in \`aspectsToAngles\`. \`plain\` describes what the aspect feels like in this place. \`wasNatal\` describes how it differs from the natal chart.

**weeks[6]** — Six weekly entries, anchored on \`dateRange.start\`. Each has a short title and 2–3 sentence body.

**todos[3-4]** — Practical actions. Branch on \`travelType\`: "trip" todos are about the visit; "relocation" todos are about the first month after the move. Honor the picked \`goalIds\` — e.g. if "love" is picked, one todo should be relationship-aware.

**summary, signals, longRead** — Legacy shape. Fill them as you have before, but the V4 view reads the new fields above first.

# Hard constraints

- Never invent transits, lines, or aspects that aren't in the input.
- Never use astrological jargon without immediately glossing it ("the IC, your home point").
- Each \`monthAspects[].aspectKey\` must match exactly one \`topTransits[].aspectKey\`.
- Each \`vibes[].goalId\` must come from the input \`goalIds\` array.
- Numbers (degrees, orbs, dates) are already in the input — do not modify them.`;

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
