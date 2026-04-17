/**
 * POST /api/chart/interpret
 *
 * Generates an editorial interpretation of the user's natal chart using the
 * same house-matrix scoring engine that powers relocation readings — but
 * scoped to the user's BIRTH coordinates instead of a travel destination, so
 * it reveals their native house strengths rather than a relocation delta.
 *
 * Output is a 4-section narrative streamed as NDJSON:
 *   1. chartEssence     — top-level archetype synthesis (ASC/Sun/Moon + ruler)
 *   2. houseArchitecture — peak & shadow houses from house-matrix scores
 *   3. aspectWeaver     — 5 most significant natal aspects, interpreted
 *   4. naturalAngles    — ACG lines closest to the birthplace (native shaping)
 *
 * Cached on natal_charts.ephemeris_data.interpretation so subsequent loads
 * stream instantly from cache without re-running Gemini.
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile, getNatalChart } from "@/lib/db";
import { computeHouseMatrix } from "@/app/lib/house-matrix";
import { resolveACGFull } from "@/lib/astro/acg-lines";
import { signFromLongitude } from "@/app/lib/geodetic";
import { SIGN_RULERS, HOUSE_THEMES } from "@/app/lib/astro-constants";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY,
});

const SYSTEM_PROMPT = `You are the principal astrologer for AstroNat — a premium, brutalist, Gen-Z/Millennial astrology platform.
Your voice is editorial, precise, and architectural. You avoid generic spiritual language ("universe", "vibrations", "manifesting").
Speak in terms of structure, leverage, friction, dominance, and mathematical pressure.

STRICT FACTUAL RULES (do NOT invent, do NOT confuse):
• Only reference planets, signs, houses, aspects EXPLICITLY present in the provided data.
• A planet is "in" a house only if it appears in that house's "occupants" list.
• A planet "rules" a house by ruling the sign on the cusp — it does NOT live there unless also listed as an occupant.
• If you say "X in H{n}", verify X is in that house's occupants. If you say "X rules H{n}", reference "rulerNatalHouse" for where X actually sits.

STRICT LENGTH: each section's \`content\` must be 2–3 sharp sentences, under 55 words total. Title: 5–8 words max.
No filler. No horoscope platitudes. No adjectives-as-filler.`;

const Section = z.object({
  title: z.string(),
  content: z.string(),
});

interface HouseSummary {
  house: number;
  score: number;
  sphere: string;
  sign: string;
  /** Planets physically inside this house (can be empty). */
  occupants: Array<{ planet: string; sign: string; dignity: string }>;
  /** Traditional ruler of the sign on the cusp. */
  rulerPlanet: string;
  /** Dignity condition of the ruler in its natal sign. */
  rulerCondition: string;
  /** Which house the ruler itself is sitting in natally. */
  rulerNatalHouse: number | null;
  /** Sign the ruler is actually in (so Gemini doesn't confuse it with cusp sign). */
  rulerNatalSign: string | null;
}

interface Payload {
  firstName: string | null;
  natal: {
    ascSign: string;
    ascDegree: number;
    mcSign: string;
    sunSign: string;
    sunHouse: number;
    moonSign: string;
    moonHouse: number;
    chartRuler: string;
    chartRulerSign: string;
    chartRulerHouse: number;
  };
  peakHouses: HouseSummary[];
  shadowHouses: HouseSummary[];
  topAspects: Array<{ aspect: string; type: string; orb: string; planet1: string; planet2: string }>;
  closestAcg: Array<{ planet: string; angle: string; dist_km: number; tier: string }>;
  macroScore: number;
  macroVerdict: string;
}

export async function POST() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const encoder = new TextEncoder();
  const emit = (c: ReadableStreamDefaultController, msg: unknown) =>
    c.enqueue(encoder.encode(JSON.stringify(msg) + "\n"));

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // Load profile + natal chart
  const profile = await getProfile(user.id);
  const natalRow = await getNatalChart(user.id);
  if (!profile || !natalRow?.ephemeris_data) {
    return new Response(
      JSON.stringify({ error: "Natal chart not yet computed. Visit /chart first to generate it." }),
      { status: 400 },
    );
  }

  const cachedInterpretation = (natalRow.ephemeris_data as any).interpretation;

  // ─── Cached path: stream immediately ─────────────────────────────
  if (cachedInterpretation) {
    const stream = new ReadableStream({
      start(controller) {
        for (const key of ["chartEssence", "houseArchitecture", "aspectWeaver", "naturalAngles"]) {
          if (cachedInterpretation[key]) {
            emit(controller, { section: key, data: cachedInterpretation[key] });
          }
        }
        emit(controller, { done: true });
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
    });
  }

  // ─── Cold path: build payload then stream 4 parallel Gemini calls ─
  let payload: Payload;
  try {
    payload = await buildPayload(user.id, profile, natalRow.ephemeris_data);
  } catch (err: any) {
    console.error("[chart/interpret] payload build failed:", err);
    return new Response(JSON.stringify({ error: "Payload build failed", message: err.message }), {
      status: 500,
    });
  }

  const payloadStr = JSON.stringify(payload, null, 2);

  const callEssence = () =>
    generateObject({
      model: google("gemini-3.1-flash-lite-preview"),
      system: SYSTEM_PROMPT,
      prompt: `Write the "chartEssence" section (2–3 sentences, <55 words). Data:\n${payloadStr}

Distill ${payload.firstName ?? "the native"}'s archetype from ASC sign, Sun-house, Moon-house, and chart ruler. Name the core tension the chart is architected around. Declarative. No preamble.`,
      schema: z.object({ chartEssence: Section }),
    });

  const callHouses = () =>
    generateObject({
      model: google("gemini-3.1-flash-lite-preview"),
      system: SYSTEM_PROMPT,
      prompt: `Write the "houseArchitecture" section (2–3 sentences, <55 words). Data:\n${payloadStr}

CRITICAL FACTUAL RULES — do not conflate:
• "occupants" = planets LITERALLY SITTING IN the house. Use the verb "in", "sits in", "occupies".
• "rulerPlanet" + "rulerNatalHouse" = the planet that RULES the house because it rules the sign on the cusp. The ruler usually lives in a DIFFERENT house ("rulerNatalHouse"). Use the verb "rules from H{rulerNatalHouse}".
• Never say a ruler is "in" the house it rules unless rulerNatalHouse equals that house.

Name the top peak house + the sharpest shadow house. For each: name actual occupants (if any) OR that the house is empty; then name the ruler + where it rules from. 2–3 sentences. <55 words total.`,
      schema: z.object({ houseArchitecture: Section }),
    });

  const callAspects = () =>
    generateObject({
      model: google("gemini-3.1-flash-lite-preview"),
      system: SYSTEM_PROMPT,
      prompt: `Write the "aspectWeaver" section (2–3 sentences, <55 words). Data:\n${payloadStr}

Pick the 2 tightest / most significant aspects (Sun/Moon/ASC-ruler priority). One sentence per — name the planets, aspect, and what it structurally produces. No adjectives.`,
      schema: z.object({ aspectWeaver: Section }),
    });

  const callAcg = () =>
    generateObject({
      model: google("gemini-3.1-flash-lite-preview"),
      system: SYSTEM_PROMPT,
      prompt: `Write the "naturalAngles" section (2–3 sentences, <55 words). Data:\n${payloadStr}

If Intense lines (<250km) exist, name 1–2 and what they activate. If not, state the chart is unfixed — character derives from natal configuration over geography. One concrete takeaway.`,
      schema: z.object({ naturalAngles: Section }),
    });

  const stream = new ReadableStream({
    async start(controller) {
      const interpretation: Record<string, any> = {};

      const tasks = [callEssence, callHouses, callAspects, callAcg].map(async (call) => {
        try {
          const { object } = await call();
          for (const [key, value] of Object.entries(object)) {
            interpretation[key] = value;
            emit(controller, { section: key, data: value });
          }
        } catch (err: any) {
          console.error("[chart/interpret] Gemini call failed:", err?.message);
          emit(controller, { error: err?.message || "Gemini call failed" });
        }
      });

      await Promise.all(tasks);

      // Persist interpretation back into natal_charts.ephemeris_data
      try {
        await admin
          .from("natal_charts")
          .update({
            ephemeris_data: { ...natalRow.ephemeris_data, interpretation },
          })
          .eq("user_id", user.id)
          .eq("chart_type", "natal");
      } catch (err: any) {
        console.warn("[chart/interpret] persist failed:", err?.message);
      }

      emit(controller, { done: true });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
  });
}

// ─── Payload builder ────────────────────────────────────────────────

async function buildPayload(userId: string, profile: any, ephemeris: any): Promise<Payload> {
  const planets: any[] = ephemeris.planets ?? [];
  const cusps: number[] = ephemeris.cusps ?? [];
  const aspects: any[] = ephemeris.aspects ?? [];

  // 1. House-matrix at birth coordinates (no relocation)
  const natalForMatrix = planets.map((p: any) => ({
    planet: p.name ?? p.planet,
    name: p.name ?? p.planet,
    sign: p.sign ?? signFromLongitude(p.longitude),
    longitude: p.longitude,
    retrograde: !!(p.is_retrograde ?? p.retrograde),
    house: p.house,
    dignity: p.dignity,
    speed: p.speed,
  }));

  // ACG lines — distance-filtered to birth city
  let cityLines: any[] = [];
  try {
    const dtUtc = new Date(ephemeris.profile_time ?? new Date().toISOString());
    const res = await resolveACGFull(dtUtc, profile.birth_lat, profile.birth_lon);
    cityLines = res.cityLines;
  } catch (err: any) {
    console.warn("[chart/interpret] ACG compute failed:", err?.message);
  }

  // Determine sect (day vs night chart) from Sun vs Ascendant
  const sun = planets.find((p: any) => (p.name ?? p.planet)?.toLowerCase() === "sun");
  const ascLon = cusps[0] ?? 0;
  let sect: "day" | "night" | undefined;
  if (sun) {
    const { determineSect } = await import("@/app/lib/arabic-parts");
    sect = determineSect(sun.longitude, ascLon);
  }

  const matrix = computeHouseMatrix({
    natalPlanets: natalForMatrix,
    relocatedCusps: cusps,
    acgLines: cityLines.map((l: any) => ({
      planet: l.planet,
      angle: l.angle,
      distance_km: l.distance_km,
    })),
    transits: [],
    parans: [],
    destLat: profile.birth_lat,
    destLon: profile.birth_lon,
    birthLat: profile.birth_lat,
    sect,
  });

  // 2. Derive peak & shadow houses — include occupants + ruler location so
  //    Gemini can distinguish "Mars rules H7 from H12" vs "Mars is IN H7".
  const occupantsByHouse = new Map<number, HouseSummary["occupants"]>();
  for (const p of planets) {
    const hnum = p.house;
    if (!hnum) continue;
    const arr = occupantsByHouse.get(hnum) ?? [];
    arr.push({
      planet: p.name ?? p.planet,
      sign: p.sign,
      dignity: (p.dignity ?? "peregrine").toString().toLowerCase(),
    });
    occupantsByHouse.set(hnum, arr);
  }

  const buildSummary = (h: any): HouseSummary => {
    const rulerData = planets.find(
      (p: any) => (p.name ?? p.planet ?? "").toLowerCase() === h.rulerPlanet.toLowerCase(),
    );
    return {
      house: h.house,
      score: h.score,
      sphere: h.sphere,
      sign: h.relocatedSign,
      occupants: occupantsByHouse.get(h.house) ?? [],
      rulerPlanet: h.rulerPlanet,
      rulerCondition: h.rulerCondition,
      rulerNatalHouse: rulerData?.house ?? null,
      rulerNatalSign: rulerData?.sign ?? null,
    };
  };

  const sorted = [...matrix.houses].sort((a, b) => b.score - a.score);
  const peakHouses = sorted.slice(0, 3).map(buildSummary);
  const shadowHouses = sorted.slice(-2).map(buildSummary);

  // 3. Top 5 aspects — prefer tighter orbs + Sun/Moon/ASC-ruler involvement
  const ascSign = signFromLongitude(ascLon);
  const chartRulerPlanet = SIGN_RULERS[ascSign];
  const priorityPlanets = new Set(
    [chartRulerPlanet, "Sun", "Moon"].map((p) => p.toLowerCase()),
  );
  const parseOrbDeg = (s: string): number => {
    const m = s?.match?.(/(-?\d+)°\s*(\d+)/);
    if (!m) return 99;
    return parseInt(m[1]) + parseInt(m[2]) / 60;
  };
  const rankedAspects = [...aspects]
    .map((a) => ({
      ...a,
      _priority:
        (priorityPlanets.has((a.planet1 ?? "").toLowerCase()) ||
        priorityPlanets.has((a.planet2 ?? "").toLowerCase())
          ? 0
          : 1) * 10 + parseOrbDeg(a.orb ?? ""),
    }))
    .sort((a, b) => a._priority - b._priority)
    .slice(0, 5)
    .map((a) => ({
      aspect: a.aspect,
      type: a.type,
      orb: a.orb,
      planet1: a.planet1,
      planet2: a.planet2,
    }));

  // 4. Closest ACG lines — top 6 by distance
  const closestAcg = cityLines
    .slice()
    .sort((a: any, b: any) => a.distance_km - b.distance_km)
    .slice(0, 6)
    .map((l: any) => ({
      planet: l.planet,
      angle: l.angle,
      dist_km: Math.round(l.distance_km),
      tier:
        l.distance_km < 250 ? "Intense"
        : l.distance_km < 500 ? "Strong"
        : l.distance_km < 800 ? "Moderate" : "Background",
    }));

  // Key natal hook-points for Essence section
  const moon = planets.find((p: any) => (p.name ?? p.planet)?.toLowerCase() === "moon");
  const ruler = planets.find((p: any) => (p.name ?? p.planet)?.toLowerCase() === chartRulerPlanet.toLowerCase());
  const mcLon = cusps[9] ?? 0;

  return {
    firstName: profile.first_name ?? null,
    natal: {
      ascSign,
      ascDegree: Number((ascLon % 30).toFixed(1)),
      mcSign: signFromLongitude(mcLon),
      sunSign: sun?.sign ?? "?",
      sunHouse: sun?.house ?? 1,
      moonSign: moon?.sign ?? "?",
      moonHouse: moon?.house ?? 1,
      chartRuler: chartRulerPlanet,
      chartRulerSign: ruler?.sign ?? "?",
      chartRulerHouse: ruler?.house ?? 1,
    },
    peakHouses: peakHouses.map((h) => ({ ...h, sphere: HOUSE_THEMES[h.house] ?? h.sphere })),
    shadowHouses: shadowHouses.map((h) => ({ ...h, sphere: HOUSE_THEMES[h.house] ?? h.sphere })),
    topAspects: rankedAspects,
    closestAcg,
    macroScore: matrix.macroScore,
    macroVerdict: matrix.macroVerdict,
  };
}
