import { z } from "zod";

export const ToneSchema = z.enum(["supportive", "challenging", "neutral"]);
export type Tone = z.infer<typeof ToneSchema>;

/**
 * Output of the astrocartography teacher reading prompt.
 *
 * The summary / signals / longRead block is the legacy shape preserved for
 * back-compat with cached readings.
 *
 * The vibes / monthAspects / angleDeltas / planetShifts / aspectPlains /
 * weeks / todos / windows / hero block is the V4-shaped output consumed by
 * app/(frontend)/(app)/reading/[id]/components/v4.
 */

// V4 Step 3 — vibes ordered by user's goal picks.
const VibeSchema = z.object({
  goalId: z.string(),     // "love" | "career" | "community" | "timing" | "growth" | "relocation"
  icon: z.string(),       // single character — e.g. "♡", "⌂"
  title: z.string(),      // headline, ≤ 60 chars
  body: z.string(),       // 2–3 sentences, plain English, may include <strong>…</strong>
});

// V4 Step 4 — per-aspect tooltip prose. `aspectKey` matches the
// `${monthKey}-${transitPlanet}-${natalPlanet|angle}` shape the view-model
// produces so the prompt can target a specific chart aspect.
const MonthAspectSchema = z.object({
  aspectKey: z.string(),
  why: z.string(),        // 1–2 sentences — why this aspect matters this month
  timing: z.string(),     // when it's exact / how long it lasts
});

// V4 Step 7A — angle deltas. One per angle, sign-aware.
const AngleDeltaSchema = z.object({
  angle: z.enum(["ASC", "IC", "DSC", "MC"]),
  delta: z.string(),      // 1–2 sentence plain-English shift
});

// V4 Step 7B — per-planet house shift.
const PlanetShiftSchema = z.object({
  planet: z.string(),
  shift: z.string(),      // plain-English description of the life-area shift
});

// V4 Step 7C — per-aspect prose for the aspects-to-angles cards.
const AspectPlainSchema = z.object({
  planet: z.string(),
  angle: z.enum(["ASC", "IC", "DSC", "MC"]),
  plain: z.string(),
  wasNatal: z.string(),   // how this aspect differs from the natal chart
});

// V4 Step 6 — weekly narrative.
const WeekSchema = z.object({
  w: z.number().int().min(1).max(13),
  range: z.string(),
  title: z.string(),
  body: z.string(),
});

// V4 Step 5 — practical todos.
const TodoSchema = z.object({
  title: z.string(),
  body: z.string(),
});

// V4 visible chrome — intros and section sub-headings the AI writes so the
// page is actually personalised instead of repeating the same shell on
// every reading.
const ChromeSchema = z.object({
  // Step 3 intro: "Astrologers read cities like they read people. ..." today
  // is hardcoded. We let the AI write a 2–3 sentence intro that names this
  // specific place.
  step3Intro: z.string(),
  // Step 7 intro: today's hardcoded paragraph about relocated charts. AI
  // writes a place-specific version.
  step7Intro: z.string(),
  // Step 7 angles sub: "The four angles change." → e.g. "Your four angles
  // shift sign." Specific to the chart.
  step7AnglesSub: z.string(),
  // Step 7 houses sub: "Planets move into new houses."
  step7HousesSub: z.string(),
  // Step 7 aspects sub: "New aspects to the angles."
  step7AspectsSub: z.string(),
});

// V4 Step 1+2 — hero + alternate windows.
const HeroSchema = z.object({
  explainer: z.string(),
});
const WindowSchema = z.object({
  flavorTitle: z.string(),
  dates: z.string(),
  nights: z.string(),
  score: z.number().min(0).max(100),
  note: z.string(),
});

export const TeacherReadingSchema = z.object({
  // Legacy shape — kept for back-compat with cached readings.
  summary: z.object({
    headline: z.string(),
    theRead: z.string(),
    leanInto: z.array(z.string()).max(3),
    goEasy: z.array(z.string()).max(2),
    whereYoullFeelIt: z.array(z.string()).max(3),
  }),
  signals: z.object({
    weather: z.array(z.object({ title: z.string(), body: z.string(), datesRange: z.string(), tone: ToneSchema })).max(3),
    moments: z.array(z.object({ title: z.string(), body: z.string(), tone: ToneSchema })).max(3),
    chart: z.array(z.object({ title: z.string(), body: z.string() })).max(3),
  }),
  longRead: z.object({
    thePlace: z.object({ title: z.string(), content: z.string() }),
    yourTiming: z.object({ title: z.string(), content: z.string() }),
    biggerPicture: z.object({ title: z.string(), content: z.string() }),
    howYouChangeHere: z.object({ title: z.string(), content: z.string() }),
    theCall: z.object({ title: z.string(), content: z.string() }),
  }),

  // V4 fields — required for new readings, optional only because cached
  // readings predate them. Once cached readings have rotated out, these can
  // be tightened to z.array(...).min(...).
  chrome: ChromeSchema.optional(),
  hero: HeroSchema.optional(),
  windows: z.array(WindowSchema).max(3).optional(),
  vibes: z.array(VibeSchema).min(1).max(3).optional(),
  monthAspects: z.array(MonthAspectSchema).max(12).optional(),
  angleDeltas: z.array(AngleDeltaSchema).max(4).optional(),
  planetShifts: z.array(PlanetShiftSchema).max(10).optional(),
  aspectPlains: z.array(AspectPlainSchema).max(8).optional(),
  weeks: z.array(WeekSchema).max(13).optional(),
  todos: z.array(TodoSchema).min(2).max(4).optional(),
});
export type TeacherReading = z.infer<typeof TeacherReadingSchema>;

/**
 * Output of the geodetic-weather prompt — shorter, day-window focused.
 */
export const WeatherReadingSchema = z.object({
  titleFlourish: z.string(),
  verdict: z.string(),
  hook: z.string(),
  dropLine: z.string(),
  /**
   * One sentence that ties the trip to the chart-ruler relocation.
   * Required to reference the chart ruler by name and name at least one
   * house number. Validation in personal-lens-validator.ts rejects fillers
   * that don't mention a planet + house.
   */
  rulerJourneyChain: z.string(),
  travelWindows: z
    .array(
      z.object({
        rank: z.string(),
        dates: z.string(),
        nights: z.number().int().positive(),
        score: z.number().min(0).max(100),
        note: z.string(),
      }),
    )
    .min(1)
    .max(3),
  keyMoments: z
    .array(
      z.object({
        title: z.string(),
        driver: z.string(),
        dates: z.string(),
        body: z.string(),
        impact: z.enum(["challenging", "supportive", "neutral"]),
      }),
    )
    .min(2)
    .max(5),
  advice: z.object({
    bestWindow: z.string(),
    watchWindow: z.string(),
  }),
});
export type WeatherReading = z.infer<typeof WeatherReadingSchema>;

/**
 * Mundane / weather-forecasting output. Much smaller than the personal
 * reading — the majority of the mundane page is deterministic, so the AI
 * only writes the single "situation lead" sentence.
 */
export const MundaneReadingSchema = z.object({
  situationLead: z
    .string()
    .max(280),
});
export type MundaneReading = z.infer<typeof MundaneReadingSchema>;
