import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getNatalChart } from "@/lib/db";
import { computeRealtimePositions } from "@/lib/astro/transits";
import { calculateAspect } from "@/lib/astro/aspects";
import { signFromLongitude, houseFromLongitude } from "@/app/lib/geodetic";
import {
  SIGN_RULERS,
  BENEFIC_PLANETS,
  LUMINARIES,
  STRONG_MALEFICS,
} from "@/app/lib/astro-constants";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY,
});

const NarrativeSection = z.object({
  title: z.string(),
  content: z.string(),
});

const SYSTEM_PROMPT = `You are the principal astrologer for AstroNat — a premium, brutalist, Gen-Z/Millennial travel astrology platform.
Your voice is editorial, precise, and architectural. You avoid generic spiritual language ("universe", "vibrations", "manifesting").
Speak in terms of friction, leverage, angles, dominance, and mathematical pressure.
Each section should be 2–3 paragraphs. Be specific — name planets, aspects, and houses. No filler sentences.`;

const ANGLE_TO_HOUSE: Record<string, number> = { MC: 10, IC: 4, ASC: 1, DSC: 7 };
const ANGLE_STRENGTH: Record<string, number> = { ASC: 1.2, MC: 1.1, DSC: 0.95, IC: 0.9 };
const CONTRIBUTOR_LABELS: Record<string, string> = {
  base: "base house foundation",
  globalPenalty: "global timing penalty",
  dignity: "ruler dignity and accidental dignity",
  occupants: "relocated occupant planets",
  acgLine: "astrocartography line pressure",
  geodetic: "geodetic angle resonance",
  transits: "active transit pressure",
  retrograde: "ruler retrograde condition",
  transitRx: "transit ruler retrograde drag",
  paran: "paran interactions",
  natalBridge: "natal-to-relocated bridge",
  lotBonus: "Lot of Fortune/Spirit support",
};
const DRIVER_KEYS = [
  "base",
  "globalPenalty",
  "dignity",
  "occupants",
  "acgLine",
  "geodetic",
  "transits",
  "retrograde",
  "transitRx",
  "paran",
  "natalBridge",
  "lotBonus",
];

function normalizePlanetName(name: unknown): string {
  return String(name ?? "").trim().toLowerCase();
}

function acgTier(distanceKm: number): string {
  if (distanceKm < 250) return "Intense";
  if (distanceKm < 500) return "Strong";
  if (distanceKm < 800) return "Moderate";
  return "Background";
}

function estimateLineDelta(line: any): number {
  const pName = normalizePlanetName(line?.planet);
  const angle = String(line?.angle ?? "").toUpperCase();
  const distanceKm = Number(line?.distance_km ?? 0);
  const isBeneficLine = BENEFIC_PLANETS.includes(pName);
  const isLuminaryLine = LUMINARIES.includes(pName);
  const isMaleficLine = STRONG_MALEFICS.includes(pName);

  let baseInfluence = 10;
  if (isBeneficLine) baseInfluence = 30;
  else if (isLuminaryLine) baseInfluence = 18;
  else if (isMaleficLine) baseInfluence = -25;

  const sigmaSq2 = 2 * 250 * 250;
  const angleScale = ANGLE_STRENGTH[angle] ?? 1.0;
  return Math.round(
    baseInfluence * angleScale * Math.exp(-(distanceKm * distanceKm) / sigmaSq2)
  );
}

function parseTransitPlanetName(t: any, which: "transit" | "natal"): string {
  if (which === "transit") {
    return normalizePlanetName(
      t?.transit_planet || t?.p1 || (t?.planets ? String(t.planets).split(" ")[0] : "")
    );
  }
  return normalizePlanetName(
    t?.natal_planet ||
      t?.p2 ||
      (t?.planets && String(t.planets).includes("natal")
        ? String(t.planets).split("natal ")[1]
        : "")
  );
}

function parseTransitAspect(t: any): string {
  return String(t?.aspect || t?.type || "").toLowerCase();
}

function estimateTransitDelta(params: {
  benefic: boolean;
  aspect: string;
  orb: number;
  applying: boolean;
  transitRx: boolean;
}) {
  const { benefic, aspect, orb, applying, transitRx } = params;
  let aspectMult = 1.0;
  if (aspect.includes("conjunction")) aspectMult = 1.3;
  else if (aspect.includes("opposition")) aspectMult = 1.1;
  else if (aspect.includes("square")) aspectMult = 1.0;
  else if (aspect.includes("trine")) aspectMult = 0.8;
  else if (aspect.includes("sextile")) aspectMult = 0.6;

  const orbMult = Math.exp(-(orb * orb) / 12.5);
  const applyingMult = applying ? 1.0 : 0.4;
  let pts = (benefic ? 35 : -38) * orbMult * applyingMult * aspectMult;
  if (transitRx) pts *= 0.75;
  return Math.round(pts);
}

function getHouseBreakdownDrivers(house: any) {
  const breakdown = house?.breakdown ?? {};
  const contributors = DRIVER_KEYS
    .map((key) => {
      const raw = Number(breakdown?.[key] ?? 0);
      if (!Number.isFinite(raw)) return null;
      const contribution = key === "globalPenalty" ? -raw : raw;
      return {
        key,
        label: CONTRIBUTOR_LABELS[key] ?? key,
        contribution: Math.round(contribution),
      };
    })
    .filter((item): item is { key: string; label: string; contribution: number } => !!item)
    .filter((item) => Math.abs(item.contribution) >= 2);

  const boosts = [...contributors]
    .filter((c) => c.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution);
  const frictions = [...contributors]
    .filter((c) => c.contribution < 0)
    .sort((a, b) => a.contribution - b.contribution);

  return { boosts, frictions };
}

function summarizeLineDrivers(lines: any[]) {
  return [...(lines ?? [])]
    .filter((line: any) => line?.planet && line?.angle && Number.isFinite(line?.distance_km))
    .sort((a: any, b: any) => a.distance_km - b.distance_km)
    .slice(0, 8)
    .map((line: any) => {
      const angle = String(line.angle).toUpperCase();
      const estimatedDelta = estimateLineDelta(line);
      return {
        planet: line.planet,
        angle,
        house: ANGLE_TO_HOUSE[angle] ?? null,
        distanceKm: Math.round(line.distance_km),
        tier: acgTier(Number(line.distance_km)),
        estimatedDelta,
        direction: estimatedDelta >= 0 ? "boost" : "friction",
      };
    });
}

function summarizeTransitDrivers(
  transitWindows: any[],
  natalPlanets: any[],
  relocatedCusps: any[]
) {
  const ascLon = Number(relocatedCusps?.[0] ?? 0);
  const natalByName = new Map(
    (natalPlanets ?? []).map((p: any) => [
      normalizePlanetName(p?.planet || p?.name),
      Number(p?.longitude),
    ])
  );

  const drivers = (transitWindows ?? [])
    .map((t: any) => {
      const transitPlanet = parseTransitPlanetName(t, "transit");
      const natalPlanet = parseTransitPlanetName(t, "natal");
      const aspect = parseTransitAspect(t);
      const orb = Math.abs(Number(t?.orb ?? 3));
      const applying = t?.applying !== false;
      const transitRx = Boolean(t?.retrograde ?? t?.transitRx ?? false);
      const natalLon = natalByName.get(natalPlanet);
      const targetHouse = Number.isFinite(natalLon)
        ? houseFromLongitude(natalLon as number, ascLon)
        : null;
      const isSoft = ["trine", "sextile", "△", "⚹"].some((a) => aspect.includes(a));
      const isConj = ["conjunction", "☌"].some((a) => aspect.includes(a));
      const beneficPlanet = BENEFIC_PLANETS.includes(transitPlanet);
      const benefic = isSoft || (isConj && beneficPlanet);
      const estimatedDelta = estimateTransitDelta({
        benefic,
        aspect,
        orb,
        applying,
        transitRx,
      });

      return {
        transitPlanet: transitPlanet || null,
        natalPlanet: natalPlanet || null,
        aspect,
        orb: Number(orb.toFixed(2)),
        applying,
        transitRx,
        targetHouse,
        estimatedDelta,
        direction: estimatedDelta >= 0 ? "boost" : "friction",
      };
    })
    .filter((item: any) => item.aspect)
    .sort((a: any, b: any) => {
      const absDiff = Math.abs(b.estimatedDelta) - Math.abs(a.estimatedDelta);
      if (absDiff !== 0) return absDiff;
      return a.orb - b.orb;
    });

  return drivers.slice(0, 10);
}

function summarizeMacroDrivers(houses: any[]) {
  const boosts: any[] = [];
  const frictions: any[] = [];

  for (const house of houses ?? []) {
    const houseNo = Number(house?.house ?? 0);
    const houseScore = Number(house?.score ?? 0);
    const { boosts: houseBoosts, frictions: houseFrictions } = getHouseBreakdownDrivers(house);

    for (const driver of houseBoosts.slice(0, 3)) {
      boosts.push({ house: houseNo, houseScore, ...driver });
    }
    for (const driver of houseFrictions.slice(0, 3)) {
      frictions.push({ house: houseNo, houseScore, ...driver });
    }
  }

  boosts.sort((a, b) => b.contribution - a.contribution);
  frictions.sort((a, b) => a.contribution - b.contribution);

  return {
    boosts: boosts.slice(0, 8),
    frictions: frictions.slice(0, 8),
  };
}

function summarizeEventDrivers(eventScores: any[]) {
  const safeEvents = [...(eventScores ?? [])].filter((e: any) => e?.eventName);
  const sorted = [...safeEvents].sort(
    (a: any, b: any) => Number(b?.finalScore ?? 0) - Number(a?.finalScore ?? 0)
  );

  return {
    strongest: sorted.slice(0, 3).map((e: any) => ({
      eventName: e.eventName,
      finalScore: Number(e.finalScore ?? 0),
      verdict: e.verdict ?? null,
      baseVolume: Number(e.baseVolume ?? 0),
      affinityModifier: Number(e.affinityModifier ?? 0),
    })),
    weakest: sorted
      .slice(-2)
      .reverse()
      .map((e: any) => ({
        eventName: e.eventName,
        finalScore: Number(e.finalScore ?? 0),
        verdict: e.verdict ?? null,
        baseVolume: Number(e.baseVolume ?? 0),
        affinityModifier: Number(e.affinityModifier ?? 0),
      })),
  };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth guard
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch reading
  const { data: reading, error: readingError } = await supabase
    .from("readings")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (readingError || !reading) {
    return NextResponse.json(
      { error: "Reading not found" },
      { status: 404 }
    );
  }

  const details = reading.details || {};
  const encoder = new TextEncoder();
  const isSynastry = reading.category === "synastry";

  // Helper: emit one NDJSON line
  const emit = (controller: ReadableStreamDefaultController, msg: any) =>
    controller.enqueue(encoder.encode(JSON.stringify(msg) + "\n"));

  // ─── Cached narrative — stream all sections immediately ───────────
  if (details?.narrative) {
    const stream = new ReadableStream({
      start(controller) {
        const n = details.narrative;
        const keys = isSynastry
          ? ["verdict"]
          : ["permanentMap", "personalTiming", "collectiveClimate", "relocatedChart", "countryChart", "verdict"];
        for (const key of keys) {
          if (n[key]) emit(controller, { section: key, data: n[key] });
        }
        emit(controller, { done: true });
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "application/x-ndjson" },
    });
  }

  // ─── Synastry narrative branch — single verdict call with structured JSON ─
  if (isSynastry) {
    const partnerName = details.partnerName || "Partner";
    const houseComparison: any[] = Array.isArray(details.houseComparison) ? details.houseComparison : [];
    const overlapHouses = houseComparison.filter((h) => h.bucket === "overlap");
    const excitementHouses = houseComparison.filter((h) => h.bucket === "excitement");
    const frictionHouses = houseComparison.filter((h) => h.bucket === "friction");

    const synastryHighlights = Array.isArray(details.synastryAspects)
      ? [...details.synastryAspects]
          .filter((a: any) => a.orb <= 3)
          .sort((a: any, b: any) => a.orb - b.orb)
          .slice(0, 8)
      : [];

    const synastryPayload = {
      destination: details.destination,
      travelDate: details.travelDate,
      recommendation: details.recommendation || "caution",
      scoreDelta: details.scoreDelta,
      user: {
        name: "you",
        macroScore: details.userMacroScore,
        macroVerdict: details.userMacroVerdict,
        topHouses: [...(details.userHouses ?? [])]
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 3),
        topAcgLines: (details.userPlanetaryLines ?? []).slice(0, 3).map((l: any) => ({
          planet: l.planet,
          angle: l.angle,
          dist_km: Math.round(l.distance_km ?? 0),
        })),
      },
      partner: {
        name: partnerName,
        macroScore: details.partnerMacroScore,
        macroVerdict: details.partnerMacroVerdict,
        topHouses: [...(details.partnerHouses ?? [])]
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 3),
        topAcgLines: (details.partnerPlanetaryLines ?? []).slice(0, 3).map((l: any) => ({
          planet: l.planet,
          angle: l.angle,
          dist_km: Math.round(l.distance_km ?? 0),
        })),
      },
      comparison: {
        overlapHouses,
        excitementHouses,
        frictionHouses,
      },
      synastryHighlights,
    };

    const payloadStr = JSON.stringify(synastryPayload, null, 2);
    const SYNASTRY_SYSTEM = `${SYSTEM_PROMPT}

For couples readings: you are comparing two charts at a single destination. Write the verdict so the reader can see overlap, asymmetric excitement, and friction at a glance.

Rules for the structured output:
- Each overlap[] string MUST cite the house label AND both scores — e.g. "H7 Partnerships (you 88 / ${partnerName} 82) — shared social leverage".
- Each excitement[] string MUST name which partner peaks and their score — e.g. "H10 Career at 91 for you — a solo power move; ${partnerName} sits at 64".
- Each friction[] string MUST either (a) cite a diverging house with both scores, or (b) name a tense synastry aspect with its orb — never generic prose.
- Emit an empty array for any bucket with no qualifying entries. Do not invent entries.
- Keep content to 2–3 paragraphs. bestWindows[] should be 0–2 entries; omit if no timing signal is present.`;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const { object } = await generateObject({
            model: google("gemini-3.1-flash-lite-preview"),
            system: SYNASTRY_SYSTEM,
            prompt: `Couples/synastry reading payload:\n${payloadStr}`,
            schema: z.object({
              verdict: z.object({
                title: z.string(),
                content: z.string(),
                recommendation: z.enum(["go", "caution", "avoid"]),
                bestWindows: z.array(z.string()),
                overlap: z.array(z.string()).max(4),
                excitement: z.array(z.string()).max(4),
                friction: z.array(z.string()).max(4),
              }),
            }),
          });

          emit(controller, { section: "verdict", data: object.verdict });

          try {
            await supabase
              .from("readings")
              .update({ details: { ...reading.details, narrative: { verdict: object.verdict } } })
              .eq("id", id);
          } catch (err: any) {
            console.warn("Synastry narrative persist failed:", err?.message);
          }
        } catch (err: any) {
          console.error("Synastry Gemini call failed:", err?.message);
          emit(controller, { error: err?.message || "Synastry narrative failed" });
        }

        emit(controller, { done: true });
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
      },
    });
  }

  // ─── Pre-AI compute (Steps A–D) ────────────────────────────────────
  let narrativePayload: any;
  try {
    // Step A: ACG line orb tiers
    const acgLines = (details.planetaryLines || []).slice(0, 6).map((l: any) => ({
      planet: l.planet,
      angle: l.angle,
      dist_km: Math.round(l.distance_km),
      tier:
        l.distance_km < 250 ? "Intense"
          : l.distance_km < 500 ? "Strong"
          : l.distance_km < 800 ? "Moderate" : "Background",
    }));

    // Step B: World transits (sky-to-sky on travel date)
    const travelDate = details.travelDate ? new Date(details.travelDate) : new Date();
    const skyPositions = await computeRealtimePositions(travelDate);
    const worldTransits: any[] = [];
    for (let i = 0; i < skyPositions.length; i++) {
      for (let j = i + 1; j < skyPositions.length; j++) {
        const result = calculateAspect(
          skyPositions[i].longitude,
          skyPositions[j].longitude,
          skyPositions[i].name,
          skyPositions[j].name
        );
        if (result && result.orb <= 4) {
          const isTense = ["Square", "Opposition"].includes(result.aspect) &&
            ["Mars", "Saturn", "Pluto", "Uranus"].some((m) =>
              [skyPositions[i].name, skyPositions[j].name].includes(m)
            );
          worldTransits.push({
            p1: skyPositions[i].name,
            p2: skyPositions[j].name,
            aspect: result.aspect.toLowerCase(),
            orb: parseFloat(result.orb.toFixed(2)),
            applying: skyPositions[i].speed > 0,
            tense: isTense,
          });
        }
      }
    }

    // Step C: Chart ruler shift
    const natalChart = await getNatalChart(user.id);
    const natalAscLon = natalChart?.ephemeris_data?.cusps?.[0] ?? 0;
    const relocatedAscLon = (details.relocatedCusps ?? [])[0] ?? 0;
    const relocatedAscSign = signFromLongitude(relocatedAscLon);
    const natalAscSign = signFromLongitude(natalAscLon);
    const chartRulerPlanet = SIGN_RULERS[relocatedAscSign];
    const rulerPlanetData = (details.natalPlanets ?? []).find(
      (p: any) => (p.planet || p.name || "").toLowerCase() === chartRulerPlanet.toLowerCase()
    );
    const chart = {
      natalAscSign,
      relocatedAscSign,
      chartRuler: chartRulerPlanet,
      chartRulerNatalHouse: rulerPlanetData ? houseFromLongitude(rulerPlanetData.longitude, natalAscLon) : null,
      chartRulerRelocatedHouse: rulerPlanetData ? houseFromLongitude(rulerPlanetData.longitude, relocatedAscLon) : null,
    };

    // Step D: Final payload
    const sortedHousesDesc = [...(details.houses ?? [])].sort(
      (a: any, b: any) => Number(b?.score ?? 0) - Number(a?.score ?? 0)
    );
    const sortedHousesAsc = [...(details.houses ?? [])].sort(
      (a: any, b: any) => Number(a?.score ?? 0) - Number(b?.score ?? 0)
    );
    const strongestHouses = sortedHousesDesc.slice(0, 3);
    const weakestHouses = sortedHousesAsc.slice(0, 2);
    const lineDrivers = summarizeLineDrivers(details.planetaryLines ?? []);
    const transitDrivers = summarizeTransitDrivers(
      details.transitWindows ?? [],
      details.natalPlanets ?? [],
      details.relocatedCusps ?? []
    );
    const macroDrivers = summarizeMacroDrivers(details.houses ?? []);
    const eventDrivers = summarizeEventDrivers(details.eventScores ?? []);
    const houseDrivers = {
      strongest: strongestHouses.map((h: any) => ({
        house: h.house,
        score: h.score,
        status: h.status,
        ...getHouseBreakdownDrivers(h),
      })),
      weakest: weakestHouses.map((h: any) => ({
        house: h.house,
        score: h.score,
        status: h.status,
        ...getHouseBreakdownDrivers(h),
      })),
    };

    narrativePayload = {
      destination: details.destination,
      travelDate: details.travelDate,
      macroScore: details.macroScore,
      macroVerdict: details.macroVerdict,
      acgLines,
      transits: (details.transitWindows ?? []).slice(0, 8),
      worldTransits: worldTransits.slice(0, 8),
      chart,
      topHouses: strongestHouses.map((h: any) => ({ house: h.house, score: h.score })),
      worstHouses: weakestHouses.map((h: any) => ({ house: h.house, score: h.score })),
      scoreEvidence: {
        macroDrivers,
        lineDrivers,
        transitDrivers,
        eventDrivers,
        houseDrivers,
      },
    };
  } catch (err: any) {
    console.error("Narrative pre-AI compute failed:", err);
    return NextResponse.json({ error: "Compute failed", message: err.message }, { status: 500 });
  }

  // ─── Parallel Gemini calls (3 groups of sections) ──────────────────
  const payloadStr = JSON.stringify(narrativePayload, null, 2);

  const group1 = () =>
    generateObject({
      model: google("gemini-3.1-flash-lite-preview"),
      system: SYSTEM_PROMPT,
      prompt: `Generate 2 narrative sections for this relocation reading. Data:\n${payloadStr}

Hard constraints:
- Use ONLY the provided payload. Do not invent extra astrology facts.
- Every claim about score quality must include a because-chain with concrete evidence from scoreEvidence.
- Use numeric anchors where available (house number, contribution, distanceKm, orb, estimatedDelta).

1. "permanentMap" — Analyze ACG lines using scoreEvidence.lineDrivers and scoreEvidence.macroDrivers. Explain exactly which lines are boosting vs creating friction (planet, angle, house, tier, distanceKm, estimatedDelta).
2. "personalTiming" — Analyze personal transit pressure using scoreEvidence.transitDrivers and transits. Explicitly label applying vs separating, orb, and whether each transit acts as boost/friction. End with 1–2 specific recommended travel windows within 30 days of travelDate tied to these drivers.`,
      schema: z.object({
        permanentMap: NarrativeSection,
        personalTiming: NarrativeSection,
      }),
    });

  const group2 = () =>
    generateObject({
      model: google("gemini-3.1-flash-lite-preview"),
      system: SYSTEM_PROMPT,
      prompt: `Generate 2 narrative sections for this relocation reading. Data:\n${payloadStr}

Hard constraints:
- Use ONLY payload data; no unsupported claims.
- Link statements to scoreEvidence drivers and houses whenever discussing positive/negative outcomes.
- Include numbers (house score, contribution, orb, distanceKm) in causal claims.

1. "collectiveClimate" — Analyze world transits and explain collective risk/opportunity, then connect that context to scoreEvidence.macroDrivers and scoreEvidence.eventDrivers (which outcomes are mathematically reinforced vs suppressed).
2. "relocatedChart" — Analyze chart ruler shift with EXACT chart fields provided. Tie the interpretation to scoreEvidence.houseDrivers (which houses are strongest/weakest and why).`,
      schema: z.object({
        collectiveClimate: NarrativeSection,
        relocatedChart: NarrativeSection,
      }),
    });

  const group3 = () =>
    generateObject({
      model: google("gemini-3.1-flash-lite-preview"),
      system: SYSTEM_PROMPT,
      prompt: `Generate 2 narrative sections for this relocation reading. Data:\n${payloadStr}

Hard constraints:
- Use ONLY payload evidence. If data is missing, state that briefly and continue with available evidence.
- Make explicit because-chains for the final score, citing scoreEvidence fields.
- Include numeric anchors in the verdict (scores, contributions, orb, distanceKm, estimatedDelta).

1. "countryChart" — If country-level data is not explicit in payload, infer cautiously and prioritize payload-grounded collective signals (worldTransits + scoreEvidence drivers) affecting visitors.
2. "verdict" — Synthesize into a decisive explanation of why macroScore has its current value. Must cite at least 3 concrete drivers from scoreEvidence. Provide structured output: bestWindows (1–2 date ranges + reason), datesAvoid (any hard transits within ±7 days of travelDate + why), bestHouses (top 2–3 activated houses + what they enable).`,
      schema: z.object({
        countryChart: NarrativeSection,
        verdict: z.object({
          title: z.string(),
          content: z.string(),
          bestWindows: z.array(z.string()),
          datesAvoid: z.array(z.string()),
          bestHouses: z.array(z.string()),
        }),
      }),
    });

  // ─── Stream results as each parallel call completes ────────────────
  const stream = new ReadableStream({
    async start(controller) {
      const narrative: any = {};

      const tasks = [group1, group2, group3].map(async (call) => {
        try {
          const { object } = await call();
          for (const [key, value] of Object.entries(object)) {
            narrative[key] = value;
            emit(controller, { section: key, data: value });
          }
        } catch (err: any) {
          console.error("Gemini call failed:", err?.message);
          emit(controller, { error: err?.message || "Gemini call failed" });
        }
      });

      await Promise.all(tasks);

      // Persist complete narrative (merge into existing details JSONB)
      try {
        await supabase
          .from("readings")
          .update({ details: { ...reading.details, narrative } })
          .eq("id", id);
      } catch (err: any) {
        console.warn("Narrative persist failed:", err?.message);
      }

      emit(controller, { done: true });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
    },
  });
}
