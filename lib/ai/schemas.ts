import { z } from "zod";

export const ToneSchema = z.enum(["supportive", "challenging", "neutral"]);
export type Tone = z.infer<typeof ToneSchema>;

/**
 * Output of the astrocartography teacher reading prompt. Shape matches the
 * 3-stage view in TeacherReadingView.tsx: summary → signals → longRead.
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
