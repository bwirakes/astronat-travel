/**
 * Geodetic-weather reading pipeline. Fans out per-day forecasts for each city
 * in the request window, falls back to mock data when the engine isn't
 * reachable, and synthesises a teacher-voice overview via Gemini.
 *
 * Pure compute + AI synthesis — no DB I/O. The route owns persistence.
 */

import { writeWeatherReading, writeMundaneLead, type WeatherReadingInput } from "@/lib/ai/prompts/geodetic-weather";
import type { Tone } from "@/lib/ai/schemas";
import { spellAngle } from "./house-topics";
import type { RunWeatherInput } from "./types";
import { getNatalChart, getProfile, saveNatalChart } from "@/lib/db";
import { SwissEphSingleton, computeRealtimePositions } from "@/lib/astro/transits";
import { birthToUtc } from "@/lib/astro/birth-utc";
import { computePersonalLens, type NatalPlanet } from "./personal-lens";

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

/**
 * Load the user's natal chart (planets + Ascendant longitude). Returns null
 * if birth data is missing. Reuses the cached chart if available, otherwise
 * computes via Swiss Ephemeris and persists it.
 */
async function loadOrComputeNatalForWeather(
  userId: string,
): Promise<{ planets: any[]; ascLon: number; dtUtc: Date; birthLat: number; birthLon: number } | null> {
  const profile: any = await getProfile(userId);
  if (!profile?.birth_date || !profile?.birth_time || profile.birth_lat == null || profile.birth_lon == null) {
    return null;
  }

  const dtUtc = await birthToUtc(
    profile.birth_date,
    profile.birth_time,
    profile.birth_lat,
    profile.birth_lon,
  );

  const cached = await getNatalChart(userId);
  if (cached?.ephemeris_data?.planets && typeof cached?.ephemeris_data?.asc === "number") {
    return {
      planets: cached.ephemeris_data.planets,
      ascLon: cached.ephemeris_data.asc,
      dtUtc,
      birthLat: profile.birth_lat,
      birthLon: profile.birth_lon,
    };
  }

  const swe = await SwissEphSingleton.getInstance();
  const jd = swe.julday(
    dtUtc.getUTCFullYear(),
    dtUtc.getUTCMonth() + 1,
    dtUtc.getUTCDate(),
    dtUtc.getUTCHours() + dtUtc.getUTCMinutes() / 60.0,
  );
  const sys = Math.abs(profile.birth_lat) >= 66 ? "W" : "P";
  const h = swe.houses(jd, profile.birth_lat, profile.birth_lon, sys) as any;
  const cusps: number[] = [];
  for (let i = 1; i <= 12; i++) cusps.push(h.cusps[i.toString()]);

  const computed = await computeRealtimePositions(dtUtc, cusps);
  const ascLon = Number(h.ascmc["0"]);

  await saveNatalChart(
    userId,
    { planets: computed, cusps, asc: ascLon, mc: h.ascmc["1"], profile_time: dtUtc.toISOString() },
    { cusps },
  );

  return {
    planets: computed,
    ascLon,
    dtUtc,
    birthLat: profile.birth_lat,
    birthLon: profile.birth_lon,
  };
}

/**
 * Fan out per-day forecasts for one city via the real geodetic engine at
 * /api/geodetic-weather. Uses in-process call (computeGeodeticWeather +
 * computeRealtimePositions) to avoid HTTP round-trips and to support SSR.
 *
 * No mock fallback. If the engine fails, the whole reading fails — a visible
 * error is better than silently shipped noise. Mock survives only for tests.
 */
async function fetchCityForecast(
  city: { label: string; lat: number; lon: number },
  startDate: Date,
  windowDays: number,
  _origin: string,
): Promise<CityForecast> {
  const [{ computeGeodeticWeather }, { computeRealtimePositions }, { computeMundaneData }, { geodeticMCLongitude, geodeticASCLongitude }] = await Promise.all([
    import("@/app/lib/geodetic-weather"),
    import("@/lib/astro/transits"),
    import("@/app/lib/mundane-engine"),
    import("@/app/lib/geodetic"),
  ]);

  const fixedAngles = {
    mc: geodeticMCLongitude(city.lon),
    ic: (geodeticMCLongitude(city.lon) + 180) % 360,
    asc: geodeticASCLongitude(city.lon, city.lat),
    dsc: (geodeticASCLongitude(city.lon, city.lat) + 180) % 360,
  };

  const days: any[] = [];
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(startDate);
    d.setUTCDate(d.getUTCDate() + i);
    d.setUTCHours(12, 0, 0, 0);

    const [positions, mundane] = await Promise.all([
      computeRealtimePositions(d),
      computeMundaneData({
        date: d.toISOString().slice(0, 10),
        time: "12:00",
        lat: city.lat,
        lon: city.lon,
      }),
    ]);

    const result = computeGeodeticWeather({
      dateUtc: d,
      destLat: city.lat,
      destLon: city.lon,
      positions,
      parans: mundane.parans,
    });
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

  // Fetch natal chart + compute personal lens in parallel with city forecasts.
  // Personal lens is optional (null if the user has no birth data on file);
  // the UI gracefully degrades to the mundane sections when absent.
  const [cityForecasts, natal] = await Promise.all([
    Promise.all(w.cities.map((c) => fetchCityForecast(c, startDate, windowDays, input.origin))),
    loadOrComputeNatalForWeather(input.user.id).catch((err) => {
      console.warn("Weather: natal fetch failed, personal lens unavailable:", err?.message);
      return null;
    }),
  ]);

  const primaryCity = cityForecasts[0];
  const personalLens =
    natal && natal.planets.length > 0
      ? computePersonalLens({
            natalPlanets: natal.planets as NatalPlanet[],
            natalAscLon: natal.ascLon,
            destLat: primaryCity.lat,
            destLon: primaryCity.lon,
        })
      : null;

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
    personalLens: personalLens
      ? {
            relocatedAscSign: personalLens.relocatedAscSign,
            chartRulerPlanet: personalLens.chartRulerPlanet,
            chartRulerNatalHouse: personalLens.chartRulerNatalHouse,
            chartRulerRelocatedHouse: personalLens.chartRulerRelocatedHouse,
            chartRulerNatalDomain: personalLens.chartRulerNatalDomain,
            chartRulerRelocatedDomain: personalLens.chartRulerRelocatedDomain,
            activeAngleLines: personalLens.activeAngleLines.map((l) => ({
                planet: l.planet,
                angle: l.angle,
                orbDeg: l.orbDeg,
                isChartRuler: l.isChartRuler,
            })),
            worldPointContacts: personalLens.worldPointContacts.map((w) => ({
                planet: w.planet,
                pointType: w.pointType,
                orbDeg: w.orbDeg,
            })),
        }
      : null,
  };

  const isMundane = (w as any).intent === "mundane";

  // Default fallback (when AI errors out). Composed from REAL numbers so it
  // never ships a canned apology — even without AI the reader learns something.
  const cityPrimary = (input.destination || cityForecasts[0].label).split(",")[0].trim();
  const goodCount = allDays.filter((d: any) => d.severity === "Calm" || d.severity === "Unsettled").length;
  const mixedCount = allDays.filter((d: any) => d.severity === "Turbulent").length;

  let interpretation: any = {
    titleFlourish: "window",
    verdict: `${cityPrimary}: ${goodCount} calmer days, ${mixedCount} mixed, ${severeCount} rough across the next ${windowDays}.`,
    hook: `Over the next ${windowDays} days, ${cityPrimary} shows ${severeCount} severe days${severeDates.length > 0 ? ` clustered near ${severeDates.join(", ")}` : ""}. The rest of the window runs steadier. Scroll for the day-by-day breakdown.`,
    dropLine: topEvents.length > 0
      ? `Top driver: ${topEvents[0].label || `${topEvents[0].planets?.[0] ?? ""} ${topEvents[0].layer ?? ""}`.trim()}.`
      : "No dominant driver — the window is quiet.",
    rulerJourneyChain: personalLens
      ? `Chain: ${cityPrimary} → you become ${personalLens.relocatedAscSign} rising → ${personalLens.chartRulerPlanet} rules → relocated ${personalLens.chartRulerRelocatedHouse}${ordinalSuffix(personalLens.chartRulerRelocatedHouse)} (${personalLens.chartRulerRelocatedDomain}) → the trip's dominant topic shifts to that house.`
      : `Chain: ${cityPrimary} → (natal chart not on file) → city's geodetic lens still active → regenerate with birth data for the personal lens.`,
    travelWindows: [],
    keyMoments: [],
    advice: {
      bestWindow: severeDates.length === 0 ? "The whole window runs steady." : "Pick days outside the rough cluster.",
      watchWindow: severeDates.length === 0 ? "No major pressure points flagged." : `Watch: ${severeDates.join(", ")}.`,
    },
  };

  let mundaneLead: string | null = null;

  try {
    if (isMundane) {
      const lead = await writeMundaneLead(aiInput);
      mundaneLead = lead.situationLead;
    } else {
      interpretation = await writeWeatherReading(aiInput);
    }
  } catch (err: any) {
    console.warn("Weather AI failed, using fallback interpretation:", err?.message);
  }

  function ordinalSuffix(n: number) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
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
      mundaneLead,
      // Natal + personal-lens payload. Consumed by the personal reading page.
      natalPlanets: natal?.planets ?? [],
      birthDateTimeUTC: natal?.dtUtc?.toISOString() ?? null,
      birthLat: natal?.birthLat ?? null,
      birthLon: natal?.birthLon ?? null,
      natalAscLon: natal?.ascLon ?? null,
      personalLens,
      // Intent flag: controls which reading page renders (set by the intake).
      // "mundane" = impersonal weather report; "personal" = traveller's brief.
      intent: isMundane ? "mundane" : "personal",
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
