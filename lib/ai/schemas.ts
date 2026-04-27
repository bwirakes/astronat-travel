import { z } from "zod";
import { READING_TAB_IDS } from "@/app/lib/reading-tabs";

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
  // §01 score-bar caption. One pithy line under the bar that names where
  // the points came from in plain English. ≤ 14 words.
  step1Breakdown: z.string().optional(),
  // §03 intro — "Why this place, for you" lead-in.
  step3Intro: z.string(),
  // §04 intro — "Planetary lines near {city}" lead-in. Guides the user on
  // how to read the map and the line list. ≤ 30 words.
  step4Intro: z.string().optional(),
  // §04 takeaway — single goal-aware "so what" sentence at the top of the
  // lines section. Names the dominant line and ties it to the user's first
  // goal. ≤ 30 words.
  step4Takeaway: z.string().optional(),
  // §04 geodetic note — one sentence on what the destination's Sepharial
  // geodetic band feels like as a *place* (not a personal chart signal).
  // Distinct from astrocartography: same for every visitor to this
  // longitude. Names the sign and tilts language by its archetype. ≤ 30 words.
  step4GeodeticNote: z.string().optional(),
  // §06 callout — replaces the (incorrect) hardcoded callout under the
  // month-by-month chart. ≤ 28 words.
  monthChartCallout: z.string().optional(),
  // §07 intro — relocated-chart lead-in (was step7 in the old numbering).
  step7Intro: z.string(),
  step7AnglesSub: z.string(),
  step7HousesSub: z.string(),
  step7AspectsSub: z.string(),
});

// V4 Step 6 — per-line note. `lineKey` matches `${planet}-${angle}` (lowercase
// planet, uppercase angle) so the prompt can target a specific line.
const LineNoteSchema = z.object({
  lineKey: z.string(),
  note: z.string(),
});

// V4 Step 7 — glossary entries the prompt writes in a way that references
// this specific reading (e.g. mentioning the user's actual ASC sign change).
const GlossaryEntrySchema = z.object({
  term: z.enum(["relocated-chart", "angles", "houses", "aspects"]),
  def: z.string(),
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

const ReadingTabIdSchema = z.enum(READING_TAB_IDS);

const EditorialSpineSchema = z.object({
  thesis: z.string(),
  primaryQuestion: z.string(),
  throughline: z.string(),
  transitionOrder: z.array(ReadingTabIdSchema),
});

const TabEditorialSchema = z.object({
  lead: z.string(),
  plainEnglishSummary: z.string(),
  evidenceCaption: z.string(),
  nextTabBridge: z.string().optional(),
});

const OverviewEditorialSchema = z.object({
  scoreExplanation: z.string(),
  goalExplanation: z.string(),
  leanInto: z.array(z.string()).max(5),
  watchOut: z.array(z.string()).max(5),
});

const TimingEditorialSchema = z.object({
  activationAdvice: z.array(z.string()).max(5),
  closingVerdict: z.string(),
});

export const TeacherReadingSchema = z.object({
  // Legacy shape — kept for back-compat with cached readings.
  summary: z.object({
    headline: z.string(),
    theRead: z.string(),
    leanInto: z.array(z.string()).max(5),
    goEasy: z.array(z.string()).max(5),
    whereYoullFeelIt: z.array(z.string()).max(5),
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
  editorialSpine: EditorialSpineSchema.optional(),
  tabs: z.record(ReadingTabIdSchema, TabEditorialSchema).optional(),
  overview: OverviewEditorialSchema.optional(),
  timing: TimingEditorialSchema.optional(),
  hero: HeroSchema.optional(),
  windows: z.array(WindowSchema).max(3).optional(),
  vibes: z.array(VibeSchema).min(1).max(3).optional(),
  monthAspects: z.array(MonthAspectSchema).max(12).optional(),
  angleDeltas: z.array(AngleDeltaSchema).max(4).optional(),
  planetShifts: z.array(PlanetShiftSchema).max(10).optional(),
  aspectPlains: z.array(AspectPlainSchema).max(8).optional(),
  weeks: z.array(WeekSchema).max(13).optional(),
  todos: z.array(TodoSchema).min(2).max(4).optional(),
  lineNotes: z.array(LineNoteSchema).max(8).optional(),
  glossaryEntries: z.array(GlossaryEntrySchema).max(4).optional(),
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
