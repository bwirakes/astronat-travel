/**
 * Geodetic-weather reading pipeline. Fans out per-day forecasts for each city
 * in the request window, falls back to mock data when the engine isn't
 * reachable, and synthesises a teacher-voice overview via Gemini.
 *
 * Pure compute + AI synthesis — no DB I/O. The route owns persistence.
 */

import { writeWeatherReading, type WeatherReadingInput } from "@/lib/ai/prompts/geodetic-weather";
import type { Tone } from "@/lib/ai/schemas";
import { spellAngle } from "./house-topics";
import type { RunWeatherInput } from "./types";

interface CityForecast {
  label: string;
  lat: number;
  lon: number;
  fixedAngles: any;
  days: any[];
}

function pickTone(severity: number | undefined): Tone {
  if (severity == null) return "neutral";
  if (severity > 0) return "challenging";
  if (severity < 0) return "supportive";
  return "neutral";
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Fan out per-day forecasts for one city, falling back to mock when the engine errors. */
async function fetchCityForecast(
  city: { label: string; lat: number; lon: number },
  startDate: Date,
  windowDays: number,
  origin: string,
): Promise<CityForecast> {
  const mock = await import("@/app/lib/geodetic-weather-mock");
  const fixedAngles = mock.mockFixedAngles(city.lat, city.lon);
  const days: any[] = [];

  for (let i = 0; i < windowDays; i++) {
    const d = new Date(startDate);
    d.setUTCDate(d.getUTCDate() + i);
    d.setUTCHours(12, 0, 0, 0);

    let result: any = null;
    try {
      const res = await fetch(`${origin}/api/geodetic-weather`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: d.toISOString(), destLat: city.lat, destLon: city.lon }),
      });
      if (res.ok) result = await res.json();
    } catch {
      // fall through to mock
    }

    if (!result || typeof result.score !== "number") {
      result = mock.mockDayForecast({
        dateUtc: d,
        lat: city.lat,
        lon: city.lon,
        seed: Math.floor(city.lat * 1000 + city.lon * 37 + d.getTime() / 86_400_000) + i,
        fixedAngles,
      });
    }
    days.push(result);
  }

  return { label: city.label, lat: city.lat, lon: city.lon, fixedAngles, days };
}

/**
 * Run the geodetic-weather pipeline. Returns the `details` payload ready to
 * persist (weatherForecast key is the discriminator the UI reads).
 */
export async function runGeodeticWeather(input: RunWeatherInput): Promise<{
  result: Record<string, any>;
  macroScore: number;
  startDate: string;
}> {
  const w = input.weather;
  if (!w?.cities?.length) {
    throw new Error("Missing weather payload (cities/window).");
  }

  const windowDays: number = [7, 30, 90].includes(w.windowDays as number) ? (w.windowDays as number) : 30;
  const startDate = new Date(w.startDate || new Date().toISOString().slice(0, 10));
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + windowDays);

  const types = await import("@/app/lib/geodetic-weather-types");

  const cityForecasts = await Promise.all(
    w.cities.map((c) => fetchCityForecast(c, startDate, windowDays, input.origin)),
  );

  // Aggregate
  const allDays = cityForecasts.flatMap((c) => c.days);
  const worstTier = types.worstTier(allDays);
  const severeCount = allDays.filter((d: any) => d.severity === "Severe" || d.severity === "Extreme").length;
  const severeDates = allDays
    .filter((d: any) => d.severity === "Severe" || d.severity === "Extreme")
    .sort((a: any, b: any) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, 3)
    .map((d: any) => fmtDate(d.dateUtc));

  const macroScore = Math.round(
    allDays.reduce((sum: number, d: any) => sum + (d.score ?? 60), 0) / Math.max(1, allDays.length),
  );

  // Build AI input — no severity numbers, no scores in body
  const flatEvents = cityForecasts.flatMap((c) =>
    c.days.flatMap((d: any) =>
      (d.events ?? []).map((e: any) => ({ ...e, dateUtc: d.dateUtc, cityLabel: c.label })),
    ),
  );
  const topEvents = [...flatEvents]
    .sort((a, b) => Math.abs(b.severity ?? 0) - Math.abs(a.severity ?? 0))
    .slice(0, 6);

  const bestDay = [...allDays].sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))[0];
  const worstDay = [...allDays].sort((a: any, b: any) => (a.score ?? 0) - (b.score ?? 0))[0];

  const aiInput: WeatherReadingInput = {
    destination: input.destination || cityForecasts[0].label,
    dateRange: {
      start: startDate.toISOString().slice(0, 10),
      end: endDate.toISOString().slice(0, 10),
    },
    windowDays,
    overallScore: macroScore,
    bestDay: bestDay
      ? { date: bestDay.dateUtc.slice(0, 10), label: fmtDate(bestDay.dateUtc) }
      : null,
    worstDay: worstDay
      ? { date: worstDay.dateUtc.slice(0, 10), label: fmtDate(worstDay.dateUtc) }
      : null,
    topEvents: topEvents.map((e: any) => {
      const a = e.planets?.[0] ?? "";
      const b = e.planets?.[1] ?? "";
      return {
        aspect: e.label || `${a} ${e.layer ?? ""} ${b}`.trim(),
        planets: { a, b },
        dates: fmtDate(e.dateUtc),
        tone: pickTone(e.severity),
        angle: e.angle ? spellAngle(e.angle) : undefined,
      };
    }),
  };

  // Default fallback (when AI errors out)
  const cityPrimary = (input.destination || cityForecasts[0].label).split(",")[0].trim();
  let interpretation: any = {
    titleFlourish: "window",
    verdict: `${cityPrimary} runs mixed across this window — a few strong days, a few to skip.`,
    hook: "The AI summary has not run yet for this reading. Click regenerate above to produce a fresh summary, top dates, and narrative. The day-by-day data below is already computed.",
    dropLine: "Check the windows and movements below for the specific planetary drivers.",
    travelWindows: [],
    keyMoments: [],
    advice: {
      bestWindow: severeDates.length === 0 ? "The whole window runs steady." : "Pick days outside the rough cluster.",
      watchWindow: severeDates.length === 0 ? "No major pressure points flagged." : `Watch: ${severeDates.join(", ")}.`,
    },
  };

  try {
    interpretation = await writeWeatherReading(aiInput);
  } catch (err: any) {
    console.warn("Weather AI failed, using fallback interpretation:", err?.message);
  }

  const startIso = startDate.toISOString().slice(0, 10);
  const result = {
    destination: input.destination || cityForecasts[0].label,
    destinationLat: cityForecasts[0].lat,
    destinationLon: cityForecasts[0].lon,
    weatherForecast: {
      windowDays,
      startDate: startIso,
      endDate: endDate.toISOString().slice(0, 10),
      goalFilter: w.goalFilter ?? null,
      cities: cityForecasts,
      macroScore,
      interpretation,
      generated: new Date().toISOString(),
      summary: {
        worstTier,
        severeCount,
        datesToWatch: severeDates,
        windowDays,
      },
    },
  };

  return { result, macroScore, startDate: startIso };
}
