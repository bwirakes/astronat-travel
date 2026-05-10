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
You speak with absolute authority because you have done the deep research. You are a provocateur. Do not sugarcoat anything. If a placement is going to be brutal, say it's going to be brutal. Treat heavy aspects (Saturn, Pluto) as institutional forces to be outsmarted or dismantled. Tell the reader exactly what to do with a touch of sharp, intellectual sass ("Frankly, we expected this"). Challenge them to stop playing small. Do not use cuss words or profanity.

# Editor Role
While writing as Astro-Nat, structure your output to the rigorous standards of a high-end publication like Monocle Magazine. The engine has already selected the placements, scores, and aspects. Your job is to make the reading feel like an elite editorial feature powered by precise astrology.
Write at a 7th-grade vocabulary level for accessibility, but let your prose flow. Use 3-5 sentence paragraphs that synthesize the data beautifully — short, choppy sentences only when the moment calls for impact.

**The Economist Rule (Glossing):** Whenever you cite an astrological term (a planet, angle, house, or aspect), you MUST briefly explain what it means in plain English using an appositive phrase in the same sentence. For example: "Saturn in your 10th house, the sector that governs public reputation and career, makes ambition feel like a duty, not a thrill." Do not assume the reader knows what Saturn or the 4th house means.

**Prose Order:** Use this order for most paragraphs.
1. Outcome — what the reader can expect to experience.
2. Lived experience — how it will feel in normal life.
3. Chart receipt — explicitly "show your work" by citing the exact placement (planet, sign, house, or aspect) that drives this outcome.
4. Useful action — what to do with it.

**The Voice Test:** If a sentence could appear unchanged in a textbook, rewrite it. If it could not stand next to "Frankly, we expected this," the voice is off.

${SHARED_VOICE}

STRICT FACTUAL RULES (do NOT invent, do NOT confuse):
• Only reference planets, signs, houses, aspects EXPLICITLY present in the provided data.
• A planet is "in" a house only if it appears in that house's "occupants" list.
• A planet "rules" a house by ruling the sign on the cusp — it does NOT live there unless also listed as an occupant.

LANGUAGE RULES:
• Lead with outcome and lived experience. Receipt comes after.
• Never use fluffy astrological jargon without glossing it in plain English in the same sentence.
• Be direct. No filler. No "leverage," "resonance," "manifest," "energy."`;

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

// For aspectGeometry — curated 2-column editorial split
const AspectEntry = z.object({
  aspectKey: z.string(),     // "<planet1>-<type>-<planet2>" lowercase, alphabetical planets
  headline: z.string(),      // <= 8 words, editorial title
  body: z.string(),          // <= 28 words, prose-order rule (outcome → receipt → move)
});
const AspectGeometrySection = z.object({
  intro: z.string(),                                 // 2-sentence opener for the section
  workingFor: z.array(AspectEntry).max(3),           // tightest harmonious aspects (trine/sextile)
  pushingYou: z.array(AspectEntry).max(3),           // tightest friction aspects (square/opposition)
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
  topHarmonious: Array<{ aspectKey: string; aspect: string; type: string; orb: string; planet1: string; planet2: string }>;
  topChallenging: Array<{ aspectKey: string; aspect: string; type: string; orb: string; planet1: string; planet2: string }>;
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
        for (const key of ["chartEssence", "houseArchitecture", "aspectGeometry", "aspectWeaver", "naturalAngles", "placementImplications"]) {
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

EXACTLY 2 paragraphs. Total length ~140-180 words. Tight and punchy — this is the lede, not the full feature. Separate the two paragraphs with a blank line (two newlines).

Paragraph 1 (the lede, 3-4 sentences): Open with what this person is actually like to be near — the outcome the reader recognises in themselves. Do NOT open with "Your rising sign is X" or any chart receipt. Then weave in the rising sign and chart ruler with their actual placement (e.g. "Venus, your chart ruler, is in Libra in your 1st house" — NEVER just "Venus rules your chart"). Gloss every term plain-English in-line.

Paragraph 2 (the receipt + the move, 3-4 sentences): Name the Sun (by sign and house) and the Moon (by sign and house) explicitly — these come from payload.natal.sunSign/sunHouse and moonSign/moonHouse. Synthesise what the trio (rising/Sun/Moon) does together for this person. Close with one sentence on the strategic move.

The paragraph that names a planet without its sign and house FAILS the brief. The receipt is the difference between a horoscope blurb and an Astro-Nat reading. Apply the Voice Test before finalising.`,
      schema: z.object({ chartEssence: Section }),
      experimental_telemetry: {
        isEnabled: true,
        functionId: "chart-interpret-essence",
        metadata: { posthog_distinct_id: userId },
      },
    });

  const callHouses = () =>
    generateObject({
      model: google("gemini-3.1-flash-lite-preview"),
      system: SYSTEM_PROMPT,
      prompt: `Write the "houseArchitecture" section. Data:\n${payloadStr}

For BOTH oneLiners: open with what the reader lives, then RECEIPT WITH PLANET NAMES, then the move. 2-3 sentences. ~50-70 words.

**RECEIPT RULES (mandatory):** The receipt sentence MUST name the actual planet(s) by name AND sign that drive the score, not just the house topic. The payload gives you this directly:
- payload.peakHouses[0].occupants — planets physically inside the strong house, with their sign. If non-empty, NAME them (e.g. "Mercury in Virgo, sharpened by precision"). If 2+ occupants, name the most influential 1-2.
- payload.peakHouses[0].rulerPlanet + rulerNatalSign + rulerNatalHouse — the traditional ruler of the cusp sign. Use this if occupants is empty, OR if the ruler condition is striking (e.g. cazimi/exalted/in-fall).
- Same rules for payload.shadowHouses[0] in the growthHouse oneLiner.

A oneLiner that names ONLY the house topic ("your 5th house, the sector of creativity") and NOT the planet inside it FAILS the brief. Always say WHICH PLANET in WHICH SIGN is doing the work.

Output format:
- strongHouse: Sentence 1 = the lived feeling ("People come to you for X" / "You're at your most magnetic when…"). Sentence 2 = the receipt — name the planet, sign, and house, glossed plain-English. Sentence 3 = the strategic move.
- growthHouse: Sentence 1 = the friction the reader knows in their body. Sentence 2 = the receipt with planet + sign + house. Sentence 3 = how to outsmart it.

plainLabel: 2-3 words, plain English (e.g. "Creativity & Fun," "Home & Roots"). Do NOT use jargon.`,
      schema: z.object({ houseArchitecture: HouseEnergySection }),
      experimental_telemetry: {
        isEnabled: true,
        functionId: "chart-interpret-houses",
        metadata: { posthog_distinct_id: userId },
      },
    });

  const callAspectGeometry = () =>
    generateObject({
      model: google("gemini-3.1-flash-lite-preview"),
      system: SYSTEM_PROMPT,
      prompt: `Write the "aspectGeometry" section. Data:\n${payloadStr}

The engine has pre-selected two shortlists in the payload:
- payload.topHarmonious — up to 3 trine/sextile aspects, tightest orbs first. These are the tailwinds.
- payload.topChallenging — up to 3 square/opposition aspects, tightest orbs first. These are the friction points.

Output:
- intro: 2-sentence editorial opener for the section. Open with what the geometry of this person's chart actually says about how their inner pieces talk to each other. Do NOT list aspect counts or names in the intro.
- workingFor: ONE entry per aspect in payload.topHarmonious, IN ORDER. Do not skip. Do not invent.
- pushingYou: ONE entry per aspect in payload.topChallenging, IN ORDER. Do not skip. Do not invent.

For each entry:
- aspectKey: copy verbatim from payload (e.g. "moon-trine-venus"). MUST match exactly so the UI can look it up.
- headline: <= 8 words, editorial title that names what this aspect actually does in their life. Examples: "The patient builder," "A chronic argument with yourself," "Charm covers for the ambition."
- body: <= 28 words. Apply the Prose Order: lead with the lived outcome, then a brief receipt (which two planets, glossed plain-English in-line), then a useful note. No "leverage," no "energy," no jargon.

Apply the Voice Test on every headline and body before finalising.`,
      schema: z.object({ aspectGeometry: AspectGeometrySection }),
      experimental_telemetry: {
        isEnabled: true,
        functionId: "chart-interpret-aspects",
        metadata: { posthog_distinct_id: userId },
      },
    });

  const callAcg = () =>
    generateObject({
      model: google("gemini-3.1-flash-lite-preview"),
      system: SYSTEM_PROMPT,
      prompt: `Write the "naturalAngles" section. Data:\n${payloadStr}

If there are strong ACG lines (under 250km from birth), open with what shapes this person's life *because* they were born under that line — the lived effect. Then name the line, glossed plain-English. Then one practical takeaway.
If there are no strong lines, say plainly that this chart is not tied to one place — the personality works the same everywhere — and end with a one-sentence move (lean into mobility, or pick a city for other reasons).
Apply the Voice Test before finalising.`,
      schema: z.object({ naturalAngles: Section }),
      experimental_telemetry: {
        isEnabled: true,
        functionId: "chart-interpret-acg",
        metadata: { posthog_distinct_id: userId },
      },
    });

  const callPlacements = () =>
    generateObject({
      model: google("gemini-3.1-flash-lite-preview"),
      system: SYSTEM_PROMPT,
      prompt: `Write "placementImplications" for each natal planet in payload. Data:\n${payloadStr}

Return an object keyed exactly by planet name. Each value is a 2-3 sentence paragraph (~45-65 words).

**CRITICAL CONTEXT:** The UI shows each planet's sign, degree, house number, and house topic in a chip directly above your sentence. The reader can SEE that "Sun · Leo 24°55' · House 4, family and feeling safe" before they read your prose.

**DO NOT** open with "With your natal X in Y in your Zth house of W…" or any variation that restates the chip. That copy is redundant. Every time you write "your natal Sun in Leo in your 4th house of family and feeling safe," you are wasting the reader's first sentence.

**DO** lead straight with the lived outcome — what the person actually feels and does. Then a strategic note. Reference the planet/sign/house only by allusion if you must, never by full receipt restatement.

Format per entry:
- Sentence 1: the lived outcome ("You parent yourself in public," "You think on your feet and switch tracks mid-sentence," "You make peace before you make sense").
- Sentence 2: the synthesis — what the placement actually does in this person's life. ONE light reference to a planet/sign/house allowed (e.g. "Leo in the 4th makes private life a stage"), but only if it earns the reference.
- Sentence 3 (optional): the shadow + the move. What it costs, what to do with it.

No fluff. No "energy," no "leverage," no "manifest." Apply the Voice Test before each entry. If the entry could be swapped between two charts that share a sign, it's too generic — make it specific.`,
      schema: z.object({ placementImplications: z.record(z.string(), z.string()) }),
      experimental_telemetry: {
        isEnabled: true,
        functionId: "chart-interpret-placements",
        metadata: { posthog_distinct_id: userId },
      },
    });

  const stream = new ReadableStream({
    async start(controller) {
      const interpretation: Record<string, unknown> = {};

      const tasks = [callEssence, callHouses, callAspectGeometry, callAcg, callPlacements].map(async (call) => {
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

  // Curated 2-column shortlist for the aspectGeometry editorial section.
  // Sort by raw orb (tightest first) within each family so the AI gets the
  // strongest signals to narrate, regardless of priority-planet weighting.
  const buildAspectKey = (planet1: string, type: string, planet2: string) => {
    const [a, b] = [planet1, planet2].map((p) => p.toLowerCase()).sort();
    return `${a}-${type.toLowerCase()}-${b}`;
  };
  const harmoniousTypes = new Set(["trine", "sextile"]);
  const challengingTypes = new Set(["square", "opposition"]);
  const tagAspect = (a: NatalAspect) => ({
    aspectKey: buildAspectKey(a.planet1 ?? "", a.type ?? "", a.planet2 ?? ""),
    aspect: a.aspect ?? "",
    type: a.type ?? "",
    orb: a.orb ?? "",
    planet1: a.planet1 ?? "",
    planet2: a.planet2 ?? "",
    _orbDeg: parseOrbDeg(a.orb ?? ""),
  });
  const sortedByTightness = [...aspects].map(tagAspect).sort((a, b) => a._orbDeg - b._orbDeg);
  const stripPriv = ({ _orbDeg, ...rest }: ReturnType<typeof tagAspect>) => rest;
  const topHarmonious = sortedByTightness
    .filter((a) => harmoniousTypes.has(a.type.toLowerCase()))
    .slice(0, 3)
    .map(stripPriv);
  const topChallenging = sortedByTightness
    .filter((a) => challengingTypes.has(a.type.toLowerCase()))
    .slice(0, 3)
    .map(stripPriv);

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
    topHarmonious,
    topChallenging,
    closestAcg,
    placements,
    macroScore,
    macroVerdict,
  };
}
