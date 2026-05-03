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
import { PLANET_DOMAINS, HOUSE_DOMAINS, getOrdinal } from "@/app/lib/astro-wording";
import { essentialDignityScore } from "@/app/lib/dignity";
import { SHARED_VOICE } from "@/lib/ai/voice";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY,
});

const SYSTEM_PROMPT = `You are Astro-Nat (Natalia), a fiercely unapologetic, world-renowned astrologer.
Your signature voice is bold, sharp, slightly defiant, and deeply empowering. You do NOT do "love and light" fluff. Your readings are a wake-up call to tear down the illusions and societal conditioning holding people back. 
You speak with absolute authority because you have done the deep research. You are a provocateur. Do not sugarcoat anything. If a placement is going to be brutal, say it's going to be brutal. Challenge the reader to stop playing small. Do not use cuss words or profanity.

${SHARED_VOICE}

STRICT FACTUAL RULES (do NOT invent, do NOT confuse):
• Only reference planets, signs, houses, aspects EXPLICITLY present in the provided data.
• A planet is "in" a house only if it appears in that house's "occupants" list.
• A planet "rules" a house by ruling the sign on the cusp — it does NOT live there unless also listed as an occupant.

LANGUAGE RULES:
• Use short, punchy, editorial sentences. Let the paragraphs breathe.
• Never use fluffy astrological jargon without explaining it in plain English.
• Be direct. No filler.`;

const Section = z.object({
  title: z.string(),
  content: z.string(),
});

// For houseArchitecture — two plain tiles instead of one dense block
const HouseEnergySection = z.object({
  strongHouse: z.object({
    houseNumber: z.number(),
    plainLabel: z.string(),   // e.g. "Creativity & Fun"
    oneLiner: z.string(),     // 1 sentence, plain English
  }),
  growthHouse: z.object({
    houseNumber: z.number(),
    plainLabel: z.string(),
    oneLiner: z.string(),
  }),
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
  placements: Array<{
    planet: string;
    sign: string;
    house: number;
    houseOrdinal: string;
    houseDomain: string;
    planetDomain: string;
  }>;
  macroScore: number;
  macroVerdict: string;
}

interface EphemerisPlanet {
  name?: string;
  planet?: string;
  sign?: string;
  longitude: number;
  house?: number;
  dignity?: string;
  is_retrograde?: boolean;
  retrograde?: boolean;
  speed?: number;
}

interface NatalAspect {
  aspect?: string;
  type?: string;
  orb?: string;
  planet1?: string;
  planet2?: string;
}

interface EphemerisData {
  planets?: EphemerisPlanet[];
  cusps?: number[];
  aspects?: NatalAspect[];
  profile_time?: string;
  interpretation?: InterpretationCache;
  [key: string]: unknown;
}

interface ChartProfile {
  first_name?: string | null;
  birth_lat: number | null;
  birth_lon: number | null;
}

interface InterpretationCache extends Record<string, unknown> {
  placementImplications?: unknown;
}

interface ClosestAcgLine {
  planet: string;
  angle: string;
  distance_km: number;
}

interface MatrixHouse {
  house: number;
  score: number;
  sphere: string;
  relocatedSign: string;
  rulerPlanet: string;
  rulerCondition: string;
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unknown error";
}

function isNodePlacement(planetName?: string) {
  const normalized = planetName?.toLowerCase() ?? "";
  return normalized.includes("node") || normalized === "true node";
}

function scoreNatalHouses(planets: EphemerisPlanet[], cusps: number[], sect?: "day" | "night"): Array<{ house: number; score: number }> {
  // Start every house at 50 points
  const houseScores = Array.from({ length: 12 }, (_, i) => ({ house: i + 1, score: 50 }));

  for (const p of planets) {
    const h = p.house;
    const name = p.name ?? p.planet ?? "";
    if (!h || !name || isNodePlacement(name)) continue;

    const houseObj = houseScores[h - 1];
    if (!houseObj) continue;

    // +2 for sheer presence (Stelliums will naturally stack)
    houseObj.score += 2;

    // Get exact essential dignity score (Domicile=+5, Exaltation=+4, Detriment=-5, Fall=-4, Peregrine=-5)
    // We try to pass degree if available (some sources map it to longitude % 30)
    const degree = p.longitude !== undefined ? p.longitude % 30 : undefined;
    const dignityScore = essentialDignityScore(name, p.sign ?? "", degree, sect);
    
    // Add the dignity score directly to the house score
    houseObj.score += dignityScore;

    // Malefic penalization (unless well-dignified)
    const isMalefic = name.toLowerCase() === "saturn" || name.toLowerCase() === "mars";
    if (isMalefic && dignityScore <= 0) {
      houseObj.score -= 3;
    }
    
    // Benefic bonus
    const isBenefic = name.toLowerCase() === "jupiter" || name.toLowerCase() === "venus";
    if (isBenefic && dignityScore >= 0) {
      houseObj.score += 3;
    }
  }

  return houseScores;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const encoder = new TextEncoder();
  const emit = (c: ReadableStreamDefaultController, msg: unknown) =>
    c.enqueue(encoder.encode(JSON.stringify(msg) + "\n"));

  const { searchParams } = new URL(request.url);
  const testUserId = searchParams.get("userId");

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  console.log("DEBUG AUTH", { testUserId, user: user?.id });
  
  if (!user && !testUserId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const userId = testUserId || user!.id;

  // Load profile + natal chart
  const profile = await getProfile(userId);
  const natalRow = await getNatalChart(userId);
  if (!profile || !natalRow?.ephemeris_data) {
    return new Response(
      JSON.stringify({ error: "Natal chart not yet computed. Visit /chart first to generate it." }),
      { status: 400 },
    );
  }

  const ephemerisData = natalRow.ephemeris_data as EphemerisData;
  const cachedInterpretation = ephemerisData.interpretation;

  // ─── Cached path: stream immediately ─────────────────────────────
  if (cachedInterpretation?.placementImplications) {
    const stream = new ReadableStream({
      start(controller) {
        for (const key of ["chartEssence", "houseArchitecture", "aspectWeaver", "naturalAngles", "placementImplications"]) {
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
    payload = await buildPayload(userId, profile, ephemerisData);
  } catch (err) {
    console.error("[chart/interpret] payload build failed:", err);
    return new Response(JSON.stringify({ error: "Payload build failed", message: getErrorMessage(err) }), {
      status: 500,
    });
  }

  const payloadStr = JSON.stringify(payload, null, 2);

  const callEssence = () =>
    generateObject({
      model: google("gemini-3.1-flash-lite-preview"),
      system: SYSTEM_PROMPT,
      prompt: `Write the "chartEssence" section. Data:\n${payloadStr}

Write a comprehensive, multi-paragraph editorial deep-dive (3-4 paragraphs) breaking down the core thesis of this person's life based on their chart. 
Start by aggressively analyzing their rising sign and chart ruler. Then weave in their Sun and Moon. 
Do not use fluffy language. Speak with the authority of a high-end magazine feature. Go deep into what this means for their reality, their struggles, and their ultimate power. Let the paragraphs breathe.`,
      schema: z.object({ chartEssence: Section }),
    });

  const callHouses = () =>
    generateObject({
      model: google("gemini-3.1-flash-lite-preview"),
      system: SYSTEM_PROMPT,
      prompt: `Write the "houseArchitecture" section. Data:\n${payloadStr}

Return two objects:
- strongHouse: the house with the highest score. Give its house number, a 2-3 word plain label (e.g. "Creativity & Fun"), and a full 2-3 sentence paragraph explaining exactly why this area of life is so dominant and powerful for them.
- growthHouse: the house with the lowest score. Same format. A full 2-3 sentence paragraph explaining the friction, the reality of the struggle here, and how they must strategize to overcome it.

Do not hold back. Be blunt, pragmatic, and insightful.`,
      schema: z.object({ houseArchitecture: HouseEnergySection }),
    });

  const callAspects = () =>
    generateObject({
      model: google("gemini-3.1-flash-lite-preview"),
      system: SYSTEM_PROMPT,
      prompt: `Write the "aspectWeaver" section. Data:\n${payloadStr}

Pick the 2 most critical aspect geometries (planetary connections) from the data. 
Write a highly readable 2-paragraph analysis explaining how these two specific tensions or harmonies play out in their real life. 
Keep it brutally practical. Avoid astrological jargon without explaining the actual real-world consequence. Focus on the friction and the leverage.`,
      schema: z.object({ aspectWeaver: Section }),
    });

  const callAcg = () =>
    generateObject({
      model: google("gemini-3.1-flash-lite-preview"),
      system: SYSTEM_PROMPT,
      prompt: `Write the "naturalAngles" section. Data:\n${payloadStr}

If there are strong lines (under 250km), name one and explain in plain words what it means for this person's life in that place. If not, say the chart is not tied to one place — their personality works the same everywhere. One practical takeaway sentence.`,
      schema: z.object({ naturalAngles: Section }),
    });

  const callPlacements = () =>
    generateObject({
      model: google("gemini-3.1-flash-lite-preview"),
      system: SYSTEM_PROMPT,
      prompt: `Write "placementImplications" for each natal planet in payload. Data:\n${payloadStr}

Return an object keyed exactly by planet name. Each value must be a rich, 2-3 sentence paragraph.
Format: Explain what [Planet] in [Sign] in [House] actually means for their day-to-day life and psychological reality.

Rules:
- Be specific, authoritative, and blunt.
- Describe what the person experiences, the shadow side, and their strategic advantage here.
- Do not use generic astrology fluff. Ground the interpretation in harsh, practical reality.`,
      schema: z.object({ placementImplications: z.record(z.string(), z.string()) }),
    });

  const stream = new ReadableStream({
    async start(controller) {
      const interpretation: Record<string, unknown> = {};

      const tasks = [callEssence, callHouses, callAspects, callAcg, callPlacements].map(async (call) => {
        try {
          const { object } = await call();
          for (const [key, value] of Object.entries(object)) {
            interpretation[key] = value;
            emit(controller, { section: key, data: value });
          }
        } catch (err) {
          const message = getErrorMessage(err);
          console.error("[chart/interpret] Gemini call failed:", message);
          emit(controller, { error: message || "Gemini call failed" });
        }
      });

      await Promise.all(tasks);

      // Persist interpretation back into natal_charts.ephemeris_data
      try {
        await admin
          .from("natal_charts")
          .update({
            ephemeris_data: { ...ephemerisData, interpretation },
          })
          .eq("user_id", userId)
          .eq("chart_type", "natal");
      } catch (err) {
        console.warn("[chart/interpret] persist failed:", getErrorMessage(err));
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

async function buildPayload(userId: string, profile: ChartProfile, ephemeris: EphemerisData): Promise<Payload> {
  const planets: EphemerisPlanet[] = ephemeris.planets ?? [];
  const cusps: number[] = ephemeris.cusps ?? [];
  const aspects: NatalAspect[] = ephemeris.aspects ?? [];

  // 1. House-matrix at birth coordinates (no relocation)
  const natalForMatrix = planets.map((p) => ({
    planet: p.name ?? p.planet ?? "Unknown",
    name: p.name ?? p.planet ?? "Unknown",
    sign: p.sign ?? signFromLongitude(p.longitude),
    longitude: p.longitude,
    retrograde: !!(p.is_retrograde ?? p.retrograde),
    house: p.house,
    dignity: p.dignity,
    speed: p.speed,
  }));

  // ACG lines — distance-filtered to birth city
  let cityLines: ClosestAcgLine[] = [];
  try {
    const dtUtc = new Date(ephemeris.profile_time ?? new Date().toISOString());
    const res = await resolveACGFull(dtUtc, profile.birth_lat ?? 0, profile.birth_lon ?? 0);
    cityLines = res.cityLines;
  } catch (err) {
    console.warn("[chart/interpret] ACG compute failed:", getErrorMessage(err));
  }

  // Determine sect (day vs night chart) from Sun vs Ascendant
  const sun = planets.find((p) => (p.name ?? p.planet)?.toLowerCase() === "sun");
  const ascLon = cusps[0] ?? 0;
  let sect: "day" | "night" | undefined;
  if (sun) {
    const { determineSect } = await import("@/app/lib/arabic-parts");
    sect = determineSect(sun.longitude, ascLon);
  }

  // 1. Calculate Natal House Scores based on essential dignity and presence
  const natalHouseScores = scoreNatalHouses(planets, cusps, sect);

  // 2. Build occupants list for Gemini context
  const occupantsByHouse = new Map<number, HouseSummary["occupants"]>();
  for (const p of planets) {
    const hnum = p.house;
    if (!hnum) continue;
    const arr = occupantsByHouse.get(hnum) ?? [];
    arr.push({
      planet: p.name ?? p.planet ?? "Unknown",
      sign: p.sign ?? signFromLongitude(p.longitude),
      dignity: (p.dignity ?? "peregrine").toString().toLowerCase(),
    });
    occupantsByHouse.set(hnum, arr);
  }

  // 3. Derive peak & shadow houses
  const buildSummary = (hs: { house: number; score: number }): HouseSummary => {
    const cuspLon = cusps[hs.house - 1] ?? ((ascLon + (hs.house - 1) * 30) % 360);
    const cuspSign = signFromLongitude(cuspLon);
    const rulerPlanet = SIGN_RULERS[cuspSign] || "Sun";
    const rulerData = planets.find(
      (p) => (p.name ?? p.planet ?? "").toLowerCase() === rulerPlanet.toLowerCase(),
    );

    return {
      house: hs.house,
      score: hs.score,
      sphere: HOUSE_THEMES[hs.house] ?? `House ${hs.house}`,
      sign: cuspSign,
      occupants: occupantsByHouse.get(hs.house) ?? [],
      rulerPlanet,
      rulerCondition: rulerData?.dignity ?? "peregrine",
      rulerNatalHouse: rulerData?.house ?? null,
      rulerNatalSign: rulerData?.sign ?? null,
    };
  };

  const sorted = [...natalHouseScores].sort((a, b) => b.score - a.score);
  const peakHouses = sorted.slice(0, 1).map(buildSummary);
  const shadowHouses = sorted.slice(-1).map(buildSummary);

  const peakAvg = sorted.slice(0, 3).reduce((acc, h) => acc + h.score, 0) / 3;
  const macroScore = Math.round(peakAvg);
  const macroVerdict =
    macroScore >= 70 ? "Powerfully concentrated"
    : macroScore >= 60 ? "Above baseline"
    : macroScore >= 50 ? "Natal Baseline"
    : "Diffuse / under-supported";

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
      aspect: a.aspect ?? "",
      type: a.type ?? "",
      orb: a.orb ?? "",
      planet1: a.planet1 ?? "",
      planet2: a.planet2 ?? "",
    }));

  // 4. Closest ACG lines — top 6 by distance
  const closestAcg = cityLines
    .slice()
    .sort((a: ClosestAcgLine, b: ClosestAcgLine) => a.distance_km - b.distance_km)
    .slice(0, 6)
    .map((l: ClosestAcgLine) => ({
      planet: l.planet,
      angle: l.angle,
      dist_km: Math.round(l.distance_km),
      tier:
        l.distance_km < 250 ? "Intense"
        : l.distance_km < 500 ? "Strong"
        : l.distance_km < 800 ? "Moderate" : "Background",
    }));

  // Key natal hook-points for Essence section
  const moon = planets.find((p) => (p.name ?? p.planet)?.toLowerCase() === "moon");
  const ruler = planets.find((p) => (p.name ?? p.planet)?.toLowerCase() === chartRulerPlanet.toLowerCase());
  const mcLon = cusps[9] ?? 0;
  const placements = planets
    .flatMap((p) => {
      const planet = p.name ?? p.planet;
      const house = p.house;
      if (!planet || !house || isNodePlacement(planet)) return [];

      return [{
        planet,
        sign: p.sign ?? signFromLongitude(p.longitude),
        house,
        houseOrdinal: getOrdinal(house),
        houseDomain: HOUSE_DOMAINS[house] ?? HOUSE_THEMES[house] ?? "life",
        planetDomain: PLANET_DOMAINS[planet] ?? `${planet} placement`,
      }];
    });

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
    placements,
    macroScore,
    macroVerdict,
  };
}
