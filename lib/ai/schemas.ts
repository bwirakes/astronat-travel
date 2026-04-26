import { z } from "zod";

export const ToneSchema = z.enum(["supportive", "challenging", "neutral"]);
export type Tone = z.infer<typeof ToneSchema>;

/**
 * Output of the astrocartography teacher reading prompt. Shape carries the
 * summary / signals / longRead fields consumed by the V4 reading view's
 * vibe + month panels (app/(frontend)/(app)/reading/[id]/components/v4).
 */
export const TeacherReadingSchema = z.object({
  summary: z.object({
    headline: z.string(),
    theRead: z.string(),
    leanInto: z.array(z.string()).max(3),
    goEasy: z.array(z.string()).max(2),
    whereYoullFeelIt: z.array(z.string()).max(3),
  }),
  signals: z.object({
    weather: z
      .array(
        z.object({
          title: z.string(),
          body: z.string(),
          datesRange: z.string(),
          tone: ToneSchema,
        }),
      )
      .max(3),
    moments: z
      .array(
        z.object({
          title: z.string(),
          body: z.string(),
          tone: ToneSchema,
        }),
      )
      .max(3),
    chart: z
      .array(
        z.object({
          title: z.string(),
          body: z.string(),
        }),
      )
      .max(3),
  }),
  longRead: z.object({
    thePlace: z.object({ title: z.string(), content: z.string() }),
    yourTiming: z.object({ title: z.string(), content: z.string() }),
    biggerPicture: z.object({ title: z.string(), content: z.string() }),
    howYouChangeHere: z.object({ title: z.string(), content: z.string() }),
    theCall: z.object({ title: z.string(), content: z.string() }),
  }),
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
