/**
 * Astrocartography reading pipeline. Pure compute + AI synthesis — no DB I/O.
 * The route hands us the parsed input, we hand back the full `details` payload
 * ready to persist.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getNatalChart, getPartnerNatalChart, getProfile, saveNatalChart, savePartnerNatalChart } from "@/lib/db";
import { SwissEphSingleton, computeRealtimePositions } from "@/lib/astro/transits";
import { resolveACGFull, computeParans } from "@/lib/astro/acg-lines";
import { solve12MonthTransits, type TransitHit } from "@/lib/astro/transit-solver";
import { computeHouseMatrix, mapTransitsToMatrix, computeGlobalPenalty, acgLineRawScore } from "@/app/lib/house-matrix";
import { computeEventScores } from "@/app/lib/scoring-engine";
import { houseFromLongitude, signFromLongitude } from "@/app/lib/geodetic";
import { birthToUtc } from "@/lib/astro/birth-utc";
import { determineSect, computeLotOfFortune, computeLotOfSpirit } from "@/app/lib/arabic-parts";
import { GOAL_DEFINITIONS, buildEditorialEvidence, deriveScoreNarrative } from "@/app/lib/reading-tabs";

import { computeProgressedBands } from "@/app/lib/progressions";
import { writeTeacherReading, type TeacherReadingInput } from "@/lib/ai/prompts/teacher-reading";
import type { Tone } from "@/lib/ai/schemas";
import { houseTopic, spellAngle, closenessBand, houseVibe } from "./house-topics";
import { computeSynastryAspects, classifyHouseBucket, computeRecommendation } from "./synastry";
import type { AstrocartoReadingResult, RunAstrocartoInput } from "./types";

const GOAL_INDEX_MAP = Object.fromEntries(
  Object.entries(GOAL_DEFINITIONS)
    .filter(([, definition]) => definition.eventIndex != null)
    .map(([goalId, definition]) => [goalId, definition.eventIndex]),
) as Record<string, number>;

/** Parse ReadingFlow goal IDs (string or numeric) into matrix row indices. */
function parseGoals(goals: unknown[] | undefined): number[] | undefined {
  if (!Array.isArray(goals) || goals.length === 0) return undefined;
  const indices = goals
    .map((g) => (typeof g === "string" ? GOAL_INDEX_MAP[g] : g))
    .filter((i): i is number => typeof i === "number");
  return indices.length > 0 ? indices : undefined;
}

/** Cache-aside natal compute. Uses Swiss Ephemeris if no cached chart. */
async function loadOrComputeNatal(
  userId: string,
  profile: any,
): Promise<{ planets: any[]; cusps: number[]; dtUtc: Date }> {
  const dtUtc = await birthToUtc(
    profile.birth_date,
    profile.birth_time,
    profile.birth_lat,
    profile.birth_lon,
  );

  const cached = await getNatalChart(userId);
  if (cached?.ephemeris_data?.planets) {
    return { planets: cached.ephemeris_data.planets, cusps: cached.cusps_data?.cusps ?? [], dtUtc };
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
  const { essentialDignityLabel } = await import("@/app/lib/dignity");
  const planets = computed.map((p: any) => ({
    ...p,
    dignity: essentialDignityLabel(p.name, p.sign).toUpperCase(),
  }));

  await saveNatalChart(
    userId,
    { planets, cusps, asc: h.ascmc["0"], mc: h.ascmc["1"], profile_time: dtUtc.toISOString() },
    { cusps },
  );
  return { planets, cusps, dtUtc };
}

/** Cache-aside partner chart compute (synastry only). */
async function loadOrComputePartnerNatal(
  partnerId: string,
  partnerProfile: any,
): Promise<{ planets: any[]; cusps: number[]; dtUtc: Date }> {
  const dtUtc = await birthToUtc(
    partnerProfile.birth_date,
    partnerProfile.birth_time || "12:00:00",
    partnerProfile.birth_lat,
    partnerProfile.birth_lon,
  );

  const cached = await getPartnerNatalChart(partnerId);
  if (cached?.ephemeris_data?.planets) {
    return { planets: cached.ephemeris_data.planets, cusps: cached.cusps_data?.cusps ?? [], dtUtc };
  }

  const swe = await SwissEphSingleton.getInstance();
  const jd = swe.julday(
    dtUtc.getUTCFullYear(),
    dtUtc.getUTCMonth() + 1,
    dtUtc.getUTCDate(),
    dtUtc.getUTCHours() + dtUtc.getUTCMinutes() / 60.0,
  );
  const sys = Math.abs(partnerProfile.birth_lat) >= 66 ? "W" : "P";
  const h = swe.houses(jd, partnerProfile.birth_lat, partnerProfile.birth_lon, sys) as any;
  const cusps: number[] = [];
  for (let i = 1; i <= 12; i++) cusps.push(h.cusps[i.toString()]);

  const computed = await computeRealtimePositions(dtUtc, cusps);
  const { essentialDignityLabel } = await import("@/app/lib/dignity");
  const planets = computed.map((p: any) => ({
    ...p,
    dignity: essentialDignityLabel(p.name, p.sign).toUpperCase(),
  }));

  await savePartnerNatalChart(
    partnerId,
    { planets, cusps, profile_time: dtUtc.toISOString() },
    { cusps },
  );
  return { planets, cusps, dtUtc };
}

/** Compute relocated house cusps at a destination using Swiss Ephemeris. */
export async function relocatedCuspsAt(
  dtUtc: Date,
  targetLat: number,
  targetLon: number,
): Promise<number[]> {
  const swe = await SwissEphSingleton.getInstance();
  const jd = swe.julday(
    dtUtc.getUTCFullYear(),
    dtUtc.getUTCMonth() + 1,
    dtUtc.getUTCDate(),
    dtUtc.getUTCHours() + dtUtc.getUTCMinutes() / 60.0 + dtUtc.getUTCSeconds() / 3600.0,
  );
  const sys = Math.abs(targetLat) >= 66 ? "W" : "P";
  const h = swe.houses(jd, targetLat, targetLon, sys) as any;
  const cusps: number[] = [];
  for (let i = 1; i <= 12; i++) cusps.push(h.cusps[i.toString()]);
  return cusps;
}

/** Pretty-format a date range from a single ISO date (with ± window). */
function formatTransitDates(dateIso: string): string {
  const d = new Date(dateIso);
  const before = new Date(d);
  before.setUTCDate(before.getUTCDate() - 2);
  const after = new Date(d);
  after.setUTCDate(after.getUTCDate() + 2);
  const fmt = (x: Date) => x.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(before)} — ${fmt(after)}`;
}

const HARMONIOUS = new Set(["trine", "sextile"]);
const TENSE = new Set(["square", "opposition"]);

function transitTone(hit: TransitHit): Tone {
  const a = hit.aspect.toLowerCase();
  if (HARMONIOUS.has(a)) return "supportive";
  if (TENSE.has(a)) return "challenging";
  // Conjunctions: lean on benefic flag
  if (a === "conjunction") return hit.benefic ? "supportive" : "challenging";
  return "neutral";
}

function aspectSentence(hit: TransitHit, transitSign: string, natalSign: string): string {
  const aspectVerb: Record<string, string> = {
    trine: "trines",
    sextile: "sextiles",
    square: "squares",
    opposition: "opposes",
    conjunction: "joins",
  };
  const verb = aspectVerb[hit.aspect.toLowerCase()] ?? hit.aspect;
  return `${hit.transit_planet} in ${transitSign} ${verb} your ${hit.natal_planet} in ${natalSign}`;
}

/**
 * Build the pre-analyzed signal handed to the AI. The AI never sees orbs,
 * degrees, points, dignity labels, or km. Only the resolved facts.
 */
/** Sepharial geodetic zodiac band the destination longitude falls in.
 *  0°E (Greenwich) is 0° Aries; each 30° of longitude = one sign. */
function geodeticBandForLon(lon: number): { sign: string; longitudeRange: string } {
  const SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  // Walk forward from 0°E (Aries) through 360°. Wrap negative lons.
  const norm = ((lon % 360) + 360) % 360;
  const idx = Math.floor(norm / 30) % 12;
  const fromLon = idx * 30;
  const toLon = fromLon + 30;
  const fmt = (l: number) => {
    if (l === 0) return "0°";
    if (l <= 180) return `${l}°E`;
    return `${360 - l}°W`;
  };
  return { sign: SIGNS[idx], longitudeRange: `${fmt(fromLon)}–${fmt(toLon)}` };
}

/** Decompose macroScore into 3 honest buckets the user can read. Sums to
 *  macroScore (rounded). When per-house breakdowns are missing (cached or
 *  mock readings), fall back to a sensible split that still explains the
 *  number without lying about the math. */
function deriveScoreBreakdown(matrixResult: any, acgLines: any[], rawTransits: TransitHit[]):
  { place: number; timing: number; sky: number } {
  const total = Math.round(matrixResult?.macroScore ?? 0);
  const houses: any[] = Array.isArray(matrixResult?.houses) ? matrixResult.houses : [];

  // Sum the per-house bucket weights when present. These come from the v4
  // house-matrix and partition the score by mechanism.
  let placeRaw = 0, timingRaw = 0, skyRaw = 0;
  let haveBuckets = false;
  for (const h of houses) {
    const b = h?.breakdown;
    if (!b || typeof b !== "object") continue;
    const bn = b.bucketNatal, bo = b.bucketOccupants, bt = b.bucketTransit, bg = b.bucketGeodetic;
    if ([bn, bo, bt, bg].every(v => typeof v === "number")) {
      placeRaw += bn + bo;
      timingRaw += bt;
      skyRaw += bg;
      haveBuckets = true;
    }
  }

  if (haveBuckets) {
    const sum = placeRaw + timingRaw + skyRaw;
    if (sum > 0) {
      const place = Math.round((placeRaw / sum) * total);
      const sky = Math.round((skyRaw / sum) * total);
      const timing = Math.max(0, total - place - sky);
      return { place, timing, sky };
    }
  }

  // Fallback split — proportional to evidence we DO have. Lines and transits
  // are the date- and place-specific signal. World sky is residual.
  const lineWeight = Math.min(2.0, 0.4 + (acgLines?.length ?? 0) * 0.15);
  const transitWeight = Math.min(1.5, 0.3 + (rawTransits?.length ?? 0) * 0.05);
  const skyWeight = 0.7;
  const wSum = lineWeight + transitWeight + skyWeight;
  const place = Math.round((lineWeight / wSum) * total);
  const sky = Math.round((skyWeight / wSum) * total);
  const timing = Math.max(0, total - place - sky);
  return { place, timing, sky };
}

export function buildAIInput(args: {
  destination: string;
  destinationLat: number;
  destinationLon: number;
  travelDate: string | null;
  matrixResult: any;
  acgLines: any[];
  rawTransits: TransitHit[];
  eventScores: Array<{ eventName: string; finalScore: number }>;
  natalPlanets: any[];
  relocatedCusps: number[];
  natalAngles?: { ASC: number; IC: number; DSC: number; MC: number };
  travelType: "trip" | "relocation";
  goalIds: string[];
}): TeacherReadingInput {
  const { destination, destinationLat, destinationLon, travelDate, matrixResult, acgLines, rawTransits, eventScores, natalPlanets, relocatedCusps, natalAngles, travelType, goalIds } = args;

  // Window: travel date ± 10 days, default to today + 10
  const start = travelDate ? new Date(travelDate) : new Date();
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 10);
  const dateRange = {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };

  // Top transits — sorted by closeness to travelDate (relevance), then orb.
  const refTime = travelDate ? new Date(travelDate).getTime() : Date.now();
  const topTransits = [...rawTransits]
    .sort((a, b) => {
      const da = Math.abs(new Date(a.date).getTime() - refTime);
      const db = Math.abs(new Date(b.date).getTime() - refTime);
      return da !== db ? da - db : a.orb - b.orb;
    })
    .slice(0, 9)
    .map((hit, i) => {
      const transitNatal = natalPlanets.find(
        (p) => String(p.name || p.planet).toLowerCase() === hit.transit_planet.toLowerCase(),
      );
      const natalNatal = natalPlanets.find(
        (p) => String(p.name || p.planet).toLowerCase() === hit.natal_planet.toLowerCase(),
      );
      const transitSign = transitNatal?.sign ?? signFromLongitude(transitNatal?.longitude ?? 0);
      const natalSign = natalNatal?.sign ?? signFromLongitude(natalNatal?.longitude ?? 0);

      const ascLon = relocatedCusps[0] ?? 0;
      const targetHouse = natalNatal
        ? houseFromLongitude(natalNatal.longitude, ascLon)
        : null;
      const houseTopics = targetHouse ? [houseTopic(targetHouse)].filter(Boolean) : [];

      // Same shape the V4 view-model uses to key a chart aspect: month + index
      // + transit planet + natal target. Lets the AI tooltip prose line up
      // with the dot the user hovers on.
      const monthKey = (() => {
        const d = new Date(hit.date);
        return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()];
      })();
      const aspectKey = `${monthKey}-${i}-${hit.transit_planet}-${hit.natal_planet}`;

      return {
        aspect: aspectSentence(hit, transitSign, natalSign),
        planets: {
          a: `${hit.transit_planet} in ${transitSign}`,
          b: `${hit.natal_planet} in ${natalSign}`,
        },
        dateRange: formatTransitDates(hit.date),
        tone: transitTone(hit),
        houseTopics,
        aspectKey,
      };
    });

  // Nearby ACG lines — pass everything we render in §04 (cap matches the
  // schema's LineNoteSchema.max). Carry both the band shorthand and the raw
  // km so the prompt can write specific prose ("right on top of you" vs.
  // "barely brushing"), and include the per-line raw contribution so the
  // takeaway can name the dominant signal numerically.
  const nearbyLines = [...(acgLines || [])]
    .sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity))
    .slice(0, 8)
    .map((l: any) => ({
      planet: l.planet,
      angle: spellAngle(l.angle || l.line || ""),
      closeness: closenessBand(l.distance_km ?? 9999),
      distanceKm: Math.round(Number(l.distance_km ?? 9999)),
      contribution: acgLineRawScore({
        planet: l.planet,
        angle: (l.angle || l.line || "").toString().toUpperCase(),
        distance_km: Number(l.distance_km ?? 9999),
      }),
    }));

  // Active houses — top 3 by absolute deviation from neutral 50
  const activeHouses = [...(matrixResult.houses || [])]
    .sort((a: any, b: any) => Math.abs(b.score - 50) - Math.abs(a.score - 50))
    .slice(0, 3)
    .map((h: any) => ({
      topic: houseTopic(h.house),
      vibe: houseVibe(h.score),
    }))
    .filter((h) => h.topic);

  // Natal spotlight — Sun, Moon, plus the strongest other placement
  const pick = (name: string) =>
    natalPlanets.find((p) => String(p.name || p.planet).toLowerCase() === name);
  const sun = pick("sun");
  const moon = pick("moon");
  const otherCandidates = natalPlanets.filter((p) => {
    const n = String(p.name || p.planet).toLowerCase();
    return n !== "sun" && n !== "moon";
  });
  const other = otherCandidates[0];

  const natalSpotlight = [sun, moon, other]
    .filter(Boolean)
    .map((p: any) => ({
      planet: p.name || p.planet,
      sign: p.sign || signFromLongitude(p.longitude),
      role: "Doing real work",
    }));

  // V4 fields
  const ascLon = relocatedCusps[0] ?? 0;
  const angleShifts = natalAngles
    ? (["ASC", "IC", "DSC", "MC"] as const).map((angle) => {
        const natalLon = natalAngles[angle];
        const reloLon = angle === "ASC" ? relocatedCusps[0]
                       : angle === "IC"  ? relocatedCusps[3]
                       : angle === "DSC" ? relocatedCusps[6]
                       :                   relocatedCusps[9];
        return {
          angle,
          natalSign: signFromLongitude(natalLon),
          relocatedSign: signFromLongitude(reloLon),
        };
      })
    : undefined;

  // Per-planet house shifts. Need natal house — derived from natal ASC,
  // which we recover from natalAngles.ASC if present (else skip).
  const planetHouseShifts = natalAngles
    ? natalPlanets.slice(0, 7).map((p: any) => {
        const planet = p.name || p.planet;
        const lon = p.longitude;
        return {
          planet,
          natalHouse: houseFromLongitude(lon, natalAngles.ASC),
          relocatedHouse: houseFromLongitude(lon, ascLon),
        };
      })
    : undefined;

  // Aspects from natal planets to the relocated angles, tight orb only.
  const aspectsToAngles = natalPlanets
    .map((p: any) => {
      const planet = p.name || p.planet;
      const lon = p.longitude;
      if (typeof lon !== "number") return null;
      const angles: Array<{ k: "ASC"|"IC"|"DSC"|"MC"; lon: number }> = [
        { k: "ASC", lon: relocatedCusps[0] ?? 0 },
        { k: "IC",  lon: relocatedCusps[3] ?? 0 },
        { k: "DSC", lon: relocatedCusps[6] ?? 0 },
        { k: "MC",  lon: relocatedCusps[9] ?? 0 },
      ];
      let best: { k: "ASC"|"IC"|"DSC"|"MC"; aspect: string; orb: number } | null = null;
      for (const a of angles) {
        const sep = (() => {
          const d = ((lon - a.lon) % 360 + 360) % 360;
          return d > 180 ? 360 - d : d;
        })();
        const candidates = [
          { name: "conjunct",   angle:   0 },
          { name: "sextile",    angle:  60 },
          { name: "square",     angle:  90 },
          { name: "trine",      angle: 120 },
          { name: "opposition", angle: 180 },
        ];
        for (const c of candidates) {
          const orb = Math.abs(sep - c.angle);
          if (orb <= 8 && (!best || orb < best.orb)) {
            best = { k: a.k, aspect: c.name, orb };
          }
        }
      }
      return best ? { planet, angle: best.k, aspect: best.aspect, orb: best.orb } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 5);

  // Score breakdown — honest 3-bucket decomposition that sums to overallScore.
  const scoreBreakdown = deriveScoreBreakdown(matrixResult, acgLines, rawTransits);

  // Top line driver — the single closest line, surfaced as a ready-made
  // phrase so the prompt can refer to it without re-doing math.
  const closest = (acgLines || []).slice().sort(
    (a: any, b: any) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity),
  )[0];
  const topLineDriver = closest
    ? `${closest.planet} on your ${spellAngle(closest.angle || closest.line || "")}, ${Math.round(closest.distance_km)} km out`
    : undefined;

  // Geodetic band the destination falls in (Sepharial system).
  const geodeticBand = typeof destinationLon === "number"
    ? geodeticBandForLon(destinationLon)
    : undefined;
  const scoreNarrative = deriveScoreNarrative({
    destination,
    destinationLat,
    destinationLon,
    macroScore: matrixResult.macroScore,
    macroVerdict: matrixResult.macroVerdict,
    goalIds,
    houses: matrixResult.houses,
    eventScores,
    natalPlanets,
    geodeticBand: geodeticBand ?? null,
  });

  const editorialEvidence = buildEditorialEvidence({
    destination,
    scoreNarrative,
    macroScore: matrixResult.macroScore,
    macroVerdict: matrixResult.macroVerdict,
    acgLines: nearbyLines.map((line) => ({
      planet: line.planet,
      angle: line.angle,
      distanceKm: line.distanceKm,
      contribution: line.contribution,
    })),
    shiftDrivers: {
      relocatedAngles: angleShifts ?? [],
      relocatedHouses: planetHouseShifts ?? [],
      aspectsToAngles,
    },
    timingDrivers: {
      windows: [],
      transits: topTransits.map((transit) => ({
        label: transit.aspect,
        dateRange: transit.dateRange,
        tone: transit.tone,
      })),
    },
  });

  const ANGLE_LONG = {
    ASC: "Ascendant",
    IC: "Imum Coeli",
    DSC: "Descendant",
    MC: "Midheaven",
  } as const;
  const ANGLE_TOPIC = {
    ASC: "self",
    IC: "home",
    DSC: "partners",
    MC: "career",
  } as const;
  const personalGeodetic = scoreNarrative.geodetic.personal.flatMap((row) =>
    row.hits.map((hit) => ({
      planet: hit.planet,
      angle: ANGLE_LONG[row.anchor],
      angleTopic: ANGLE_TOPIC[row.anchor],
      closeness: hit.closeness,
      family: hit.family,
    })),
  );

  return {
    destination,
    dateRange,
    overallScore: matrixResult.macroScore,
    travelType,
    goalIds,
    scoreBreakdown,
    editorialEvidence,
    ...(topLineDriver ? { topLineDriver } : {}),
    ...(geodeticBand ? { geodeticBand } : {}),
    topTransits,
    nearbyLines,
    activeHouses,
    natalSpotlight,
    ...(angleShifts ? { angleShifts } : {}),
    ...(planetHouseShifts ? { planetHouseShifts } : {}),
    ...(aspectsToAngles.length ? { aspectsToAngles } : {}),
    ...(personalGeodetic.length ? { personalGeodetic } : {}),
  };
}

/**
 * Run the full astrocartography pipeline for one user × one destination.
 * Returns the `details` payload ready to persist. No DB writes here except
 * the natal-chart cache (which is incidental and idempotent).
 */
export async function runAstrocarto(
  input: RunAstrocartoInput,
): Promise<{ result: AstrocartoReadingResult; partnerId: string | null }> {
  const { user, destination, targetLat, targetLon, travelDate, travelType, goals, readingCategory, partnerId, supabase } = input;

  // 1. Profile + natal
  const profile = await getProfile(user.id);
  if (!profile?.birth_date || !profile.birth_time) {
    throw new Error("Incomplete birth data in profile. Please complete your profile first.");
  }
  if (profile.birth_lat == null || profile.birth_lon == null) {
    throw new Error("Birth city coordinates not found. Please re-save your profile with a valid birth city.");
  }

  const { planets: natalPlanets, dtUtc: dtUtcBirth } = await loadOrComputeNatal(user.id, profile);

  // 2. Optional partner chart for synastry
  let partnerNatalPlanets: any[] | null = null;
  let partnerProfile: any = null;
  let dtUtcPartner: Date | null = null;
  let synastryAspects: ReturnType<typeof computeSynastryAspects> = [];

  if (readingCategory === "synastry" && partnerId) {
    const { data: pp } = await supabase
      .from("partner_profiles")
      .select("*")
      .eq("id", partnerId)
      .eq("owner_id", user.id)
      .maybeSingle();
    partnerProfile = pp;

    if (!partnerProfile) {
      throw new Error("Partner profile not found.");
    }
    if (partnerProfile.birth_lat == null || partnerProfile.birth_lon == null) {
      throw new Error("Partner profile is missing birth coordinates. Please re-add the partner with a city from the dropdown.");
    }

    const partnerData = await loadOrComputePartnerNatal(partnerId, partnerProfile);
    partnerNatalPlanets = partnerData.planets;
    dtUtcPartner = partnerData.dtUtc;
    synastryAspects = computeSynastryAspects(natalPlanets, partnerNatalPlanets);
  }

  // 3. Relocated cusps + ACG lines + transits at destination
  const relocatedCusps = await relocatedCuspsAt(dtUtcBirth, targetLat, targetLon);
  // Natal cusps — same calculation but anchored at the birth coordinates. Used
  // to surface the real natal ASC/IC/DSC/MC alongside the relocated angles in
  // the V4 reading view's Step 7 ("the four angles change").
  const natalCusps = await relocatedCuspsAt(dtUtcBirth, profile.birth_lat, profile.birth_lon);
  const natalAngles = {
    ASC: natalCusps[0],
    IC:  natalCusps[3],
    DSC: natalCusps[6],
    MC:  natalCusps[9],
  };
  const { cityLines: acgLines, allLines: acgAllLines } = await resolveACGFull(dtUtcBirth, targetLat, targetLon);
  const refDate = travelDate ? new Date(travelDate) : new Date();
  const rawTransits = await solve12MonthTransits(natalPlanets, refDate);
  const mappedTransits = mapTransitsToMatrix(rawTransits, natalPlanets, relocatedCusps, profile.birth_lat ?? undefined);
  const globalPenalty = computeGlobalPenalty(mappedTransits);
  // A1: raw transit positions at refDate — feed Step 5b (transit-on-geodetic-angle).
  // computeHouseMatrix tolerates undefined; the cost is one extra SwissEph call.
  const transitPositionsAtRef = await computeRealtimePositions(refDate);
  // A5: progressed Sun/Moon bands at refDate (async, day-for-a-year).
  const progressedBands = await computeProgressedBands({
    birthDateUtc: dtUtcBirth,
    refDate,
    destLon: targetLon,
  });

  // 4. Sect, Arabic parts, parans
  const sunPlanet = natalPlanets.find((p: any) => (p.planet || p.name || "").toLowerCase() === "sun");
  const moonPlanet = natalPlanets.find((p: any) => (p.planet || p.name || "").toLowerCase() === "moon");
  const relocatedAsc = relocatedCusps[0] ?? 0;
  const sect = sunPlanet ? determineSect(sunPlanet.longitude, relocatedAsc) : undefined;
  const lotOfFortuneLon = sunPlanet && moonPlanet
    ? computeLotOfFortune(relocatedAsc, sunPlanet.longitude, moonPlanet.longitude, sect)
    : undefined;
  const lotOfSpiritLon = sunPlanet && moonPlanet
    ? computeLotOfSpirit(relocatedAsc, sunPlanet.longitude, moonPlanet.longitude, sect)
    : undefined;
  const parans = computeParans(acgAllLines, targetLat);

  // 5. House matrix + event scores
  const selectedGoals = parseGoals(goals);
  // Preserve the user's original goal-ID picks (string IDs from /reading/new).
  // parseGoals collapses these into matrix indices and drops "timing" — for the
  // V4 view we want the original ordered list intact.
  const goalIds: string[] | undefined = Array.isArray(goals)
    ? (goals.filter((g): g is string => typeof g === "string"))
    : undefined;
  const matrixResult = computeHouseMatrix({
    natalPlanets,
    relocatedCusps,
    acgLines,
    transits: mappedTransits,
    parans,
    destLat: targetLat,
    destLon: targetLon,
    globalPenalty,
    birthLat: profile.birth_lat ?? undefined,
    lotOfFortuneLon,
    lotOfSpiritLon,
    sect,
    selectedGoals,
    transitPositions: transitPositionsAtRef,
    refDate,
    progressedBands,
  });

  const ascLon = relocatedCusps[0] ?? 0;
  const activeLinePlanets = new Set(
    acgLines
      .filter((line: any) => Number(line.distance_km ?? Infinity) <= 2000)
      .map((line: any) => String(line.planet || "").toLowerCase())
      .filter(Boolean),
  );
  const relocatedPlanets = natalPlanets.map((p: any) => ({
    name: p.planet || p.name,
    house: houseFromLongitude(p.longitude, ascLon),
    dignityStatus: p.dignityStatus || p.dignity || p.essentialDignity,
    hasLine: activeLinePlanets.has(String(p.planet || p.name || "").toLowerCase()),
  }));
  const eventScores = computeEventScores(matrixResult, relocatedPlanets);

  // 6. Partner matrix (synastry only) — mirrors the user pipeline at the same destination
  let partnerMatrix: any = null;
  if (readingCategory === "synastry" && partnerNatalPlanets && partnerProfile && dtUtcPartner) {
    const pRelocatedCusps = await relocatedCuspsAt(dtUtcPartner, targetLat, targetLon);
    const { cityLines: pAcgLines, allLines: pAcgAllLines } = await resolveACGFull(dtUtcPartner, targetLat, targetLon);
    const pRawTransits = await solve12MonthTransits(partnerNatalPlanets, refDate);
    const pMappedTransits = mapTransitsToMatrix(pRawTransits, partnerNatalPlanets, pRelocatedCusps, partnerProfile.birth_lat ?? undefined);
    const pGlobalPenalty = computeGlobalPenalty(pMappedTransits);
    const pParans = computeParans(pAcgAllLines, targetLat);

    const pSun = partnerNatalPlanets.find((p: any) => (p.planet || p.name || "").toLowerCase() === "sun");
    const pMoon = partnerNatalPlanets.find((p: any) => (p.planet || p.name || "").toLowerCase() === "moon");
    const pRelocatedAsc = pRelocatedCusps[0] ?? 0;
    const pSect = pSun ? determineSect(pSun.longitude, pRelocatedAsc) : undefined;
    const pLotF = pSun && pMoon ? computeLotOfFortune(pRelocatedAsc, pSun.longitude, pMoon.longitude, pSect) : undefined;
    const pLotS = pSun && pMoon ? computeLotOfSpirit(pRelocatedAsc, pSun.longitude, pMoon.longitude, pSect) : undefined;

    const pMatrixResult = computeHouseMatrix({
      natalPlanets: partnerNatalPlanets,
      relocatedCusps: pRelocatedCusps,
      acgLines: pAcgLines,
      transits: pMappedTransits,
      parans: pParans,
      destLat: targetLat,
      destLon: targetLon,
      globalPenalty: pGlobalPenalty,
      birthLat: partnerProfile.birth_lat ?? undefined,
      lotOfFortuneLon: pLotF,
      lotOfSpiritLon: pLotS,
      sect: pSect,
      selectedGoals,
      transitPositions: transitPositionsAtRef,
      refDate,
    });

    partnerMatrix = {
      macroScore: pMatrixResult.macroScore,
      macroVerdict: pMatrixResult.macroVerdict,
      houses: pMatrixResult.houses.map((h) => ({ house: h.house, score: h.score })),
      acgLines: pAcgLines,
      relocatedCusps: pRelocatedCusps,
    };
  }

  // 7. Synastry derived (overlap / excitement / friction houses + recommendation)
  let synastryDerived: any = null;
  if (partnerMatrix) {
    const userHousesMap = new Map<number, number>(matrixResult.houses.map((h: any) => [h.house, h.score]));
    const partnerHousesMap = new Map<number, number>(partnerMatrix.houses.map((h: any) => [h.house, h.score]));
    const houseComparison = Array.from({ length: 12 }, (_, i) => {
      const houseNum = i + 1;
      const u = userHousesMap.get(houseNum) ?? 0;
      const p = partnerHousesMap.get(houseNum) ?? 0;
      return {
        house: houseNum,
        userScore: u,
        partnerScore: p,
        delta: Math.abs(u - p),
        avg: (u + p) / 2,
        bucket: classifyHouseBucket(u, p),
      };
    });
    const scoreDelta = Math.abs(matrixResult.macroScore - partnerMatrix.macroScore);
    const averageScore = (matrixResult.macroScore + partnerMatrix.macroScore) / 2;
    const recommendation = computeRecommendation(houseComparison, scoreDelta);
    synastryDerived = { houseComparison, scoreDelta, averageScore, recommendation };
  }

  // 8. Teacher AI synthesis — graceful fallback if Gemini fails
  const aiInput = buildAIInput({
    destination,
    destinationLat: targetLat,
    destinationLon: targetLon,
    travelDate: travelDate ?? null,
    matrixResult,
    acgLines,
    rawTransits,
    eventScores,
    natalPlanets,
    relocatedCusps,
    natalAngles,
    travelType: travelType === "relocation" ? "relocation" : "trip",
    goalIds: goalIds ?? [],
  });

  let teacherReading: any = undefined;
  try {
    teacherReading = await writeTeacherReading(aiInput);
  } catch (err: any) {
    console.warn("Teacher reading AI failed, persisting without it:", err?.message);
  }

  // 9. Assemble final details payload
  const result: AstrocartoReadingResult = {
    destination,
    destinationLat: targetLat,
    destinationLon: targetLon,
    travelType,
    travelDate: travelDate ?? null,
    goals: selectedGoals ?? [],
    ...(goalIds && goalIds.length ? { goalIds } : {}),
    macroScore: matrixResult.macroScore,
    macroVerdict: matrixResult.macroVerdict,
    scoreBreakdown: aiInput.scoreBreakdown,
    scoreNarrative: {
      selectedGoals: aiInput.editorialEvidence.selectedGoals,
      themes: aiInput.editorialEvidence.scoreDrivers.themes,
      strongestThemes: aiInput.editorialEvidence.scoreDrivers.strongestThemes,
      lessEmphasized: aiInput.editorialEvidence.scoreDrivers.lessEmphasized,
      leanIntoEvidence: aiInput.editorialEvidence.scoreDrivers.leanIntoEvidence,
      watchOutEvidence: aiInput.editorialEvidence.scoreDrivers.watchOutEvidence,
      geodetic: {
        overall: aiInput.editorialEvidence.placeDrivers.overallGeodetic,
        personal: aiInput.editorialEvidence.placeDrivers.personalGeodetic,
      },
    },
    geodeticBand: aiInput.geodeticBand,
    houses: matrixResult.houses,
    houseSystem: matrixResult.houseSystem,
    planetaryLines: acgLines,
    transitWindows: rawTransits,
    eventScores,
    natalPlanets,
    relocatedCusps,
    natalAngles,
    natalCusps,
    birth: {
      city: profile.birth_city,
      date: profile.birth_date,
      time: profile.birth_time,
      lat:  profile.birth_lat,
      lon:  profile.birth_lon,
    },
    ...(matrixResult.lotOfFortune ? { lotOfFortune: matrixResult.lotOfFortune } : {}),
    ...(matrixResult.lotOfSpirit ? { lotOfSpirit: matrixResult.lotOfSpirit } : {}),
    ...(matrixResult.activeGeoTransits && matrixResult.activeGeoTransits.length > 0
      ? { activeGeoTransits: matrixResult.activeGeoTransits }
      : {}),
    ...(matrixResult.natalWorldPoints && matrixResult.natalWorldPoints.hits.length > 0
      ? { natalWorldPoints: matrixResult.natalWorldPoints }
      : {}),
    ...(matrixResult.chartRuler ? { chartRuler: matrixResult.chartRuler } : {}),
    ...(matrixResult.personalEclipses && matrixResult.personalEclipses.hits.length > 0
      ? { personalEclipses: matrixResult.personalEclipses }
      : {}),
    ...(matrixResult.progressedBands ? { progressedBands: matrixResult.progressedBands } : {}),
    ...(matrixResult.midpointTriggers && matrixResult.midpointTriggers.length > 0
      ? { midpointTriggers: matrixResult.midpointTriggers }
      : {}),
    ...(matrixResult.harmonic45Hits && matrixResult.harmonic45Hits.length > 0
      ? { harmonic45Hits: matrixResult.harmonic45Hits }
      : {}),
    ...(matrixResult.geodeticHouseFrame && matrixResult.geodeticHouseFrame.cusps.length === 12
      ? { geodeticHouseFrame: matrixResult.geodeticHouseFrame }
      : {}),
    ...(matrixResult.personalLunations && matrixResult.personalLunations.hits.length > 0
      ? { personalLunations: matrixResult.personalLunations }
      : {}),
    ...(matrixResult.parans && matrixResult.parans.length > 0
      ? { parans: matrixResult.parans }
      : {}),
    // Marker: this reading was generated with the geodetic-extras pipeline
    // (activeGeoTransits, personalEclipses, personalLunations, parans,
    // geodeticHouseFrame). Used by PlaceFieldTab to distinguish a truly
    // quiet sky from an old reading whose engine outputs predate the field.
    geodeticEngineVersion: "2026-05-02",
    ...(matrixResult.modalityCohorts && matrixResult.modalityCohorts.length > 0
      ? { modalityCohorts: matrixResult.modalityCohorts }
      : {}),
    ...(teacherReading ? { teacherReading } : {}),
    ...(partnerNatalPlanets ? { partnerNatalPlanets, synastryAspects } : {}),
    ...(partnerMatrix && synastryDerived
      ? {
          userMacroScore: matrixResult.macroScore,
          userMacroVerdict: matrixResult.macroVerdict,
          userHouses: matrixResult.houses.map((h) => ({ house: h.house, score: h.score })),
          userPlanetaryLines: acgLines,
          userRelocatedCusps: relocatedCusps,
          partnerMacroScore: partnerMatrix.macroScore,
          partnerMacroVerdict: partnerMatrix.macroVerdict,
          partnerHouses: partnerMatrix.houses,
          partnerPlanetaryLines: partnerMatrix.acgLines,
          partnerRelocatedCusps: partnerMatrix.relocatedCusps,
          partnerName: partnerProfile?.first_name ?? "Partner",
          scoreDelta: synastryDerived.scoreDelta,
          averageScore: synastryDerived.averageScore,
          houseComparison: synastryDerived.houseComparison,
          recommendation: synastryDerived.recommendation,
        }
      : {}),
  };

  const persistedPartnerId = readingCategory === "synastry" && partnerId ? partnerId : null;
  return { result, partnerId: persistedPartnerId };
}
