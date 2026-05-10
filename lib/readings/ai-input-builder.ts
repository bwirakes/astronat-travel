import type { EditorialEvidence } from "@/app/lib/reading-tabs";
import type { TransitHit } from "@/lib/astro/transit-solver";
import type { Tone } from "@/lib/ai/schemas";
import { signFromLongitude, houseFromLongitude, geodeticMCLongitude, geodeticASCLongitude } from "@/app/lib/geodetic";
import { acgLineRawScore } from "@/app/lib/house-matrix";
import { houseTopic, spellAngle, closenessBand, houseVibe } from "./house-topics";
import { buildEditorialEvidence, deriveScoreNarrative } from "@/app/lib/reading-tabs";
import {
  buildScoredWindows,
  buildRangeHighlights,
  buildMonthlySeries,
  buildMonthlyHighlights,
  buildArrivalScores,
  pickArrivalWindowsToNarrate,
  type MonthlyScore,
  type MonthlyHighlights,
  type ArrivalCandidate,
} from "@/app/lib/window-scoring";
import { verdictBand, verdictTone } from "@/app/lib/verdict";
import { formatTransitDates, transitTone, aspectSentence } from "./ai-input-helpers";
import {
  computePersonalCycleContext,
  type PersonalCycleContext,
} from "@/app/lib/personal-cycles";
import type { ComputedPosition } from "@/lib/astro/transits";
import type { ProgressionsResult } from "@/app/lib/progressions";
import type { ParanResult } from "@/lib/astro/acg-lines";
import { computeChartRulerContext, type ChartRulerContext } from "@/app/lib/chart-ruler";
import { computeModalityCohorts, type ModalityCohort } from "@/app/lib/geodetic/harmonic-triggers";
import { buildChartStructure, type ChartStructure } from "./chart-structure";

export interface TeacherReadingInput {
  macro: {
    destination: string;
    dateRange: { start: string; end: string };
    overallScore: number;
    travelType: "trip" | "relocation";
    goalIds: string[];
    scoreBreakdown?: { place: number; timing: number; sky: number };
  };

  /** The core structured data for the AI to base its tabs on */
  editorialEvidence: EditorialEvidence;

  /** Extra raw data needed for generating specific sidebars and tooltips */
  sidebarsData: {
    /** Trip-only candidate windows (top hero + range highlights). Empty array
     *  for relocations — see top-level `relocation.arrivalCandidates` instead. */
    travelWindows: Array<{ rank: number; dates: string; score: number; nights: string }>;
    topLineDriver?: string;
    geodeticBand?: { sign: string; longitudeRange: string };
    natalSpotlight: Array<{ planet: string; sign: string; role: string }>;
    topTransits: Array<{ aspect: string; dateRange: string; tone: Tone; houseTopics: string[]; aspectKey: string }>;
    nearbyLines: Array<{ planet: string; angle: string; distanceKm: number; contribution: number }>;
    activeHouses: Array<{ topic: string; vibe: string }>;
    angleShifts?: Array<{ angle: "ASC" | "IC" | "DSC" | "MC"; natalSign: string; relocatedSign: string }>;
    planetHouseShifts?: Array<{ planet: string; natalHouse: number; relocatedHouse: number }>;
    aspectsToAngles?: Array<{ planet: string; angle: "ASC" | "IC" | "DSC" | "MC"; aspect: string; orb: number }>;
    personalGeodetic?: Array<{ planet: string; angle: string; angleTopic: string; closeness: string; family: string }>;
    /** Latitude paran intersections within ±5° of the destination latitude.
     *  Source for the geodetic tab's `placeCharacter.parans[]` teacher copy. */
    parans?: Array<{ p1: string; p2: string; lat: number; type?: string }>;
    /** Chart-ruler relocation context — natal vs relocated rising sign, the
     *  traditional ruler, and which house it sits in on each chart. Source
     *  for `chartRulerReframe` on what-shifts. Null when ruler isn't in the
     *  natal planet array (rare). */
    chartRuler?: ChartRulerContext;
    /** Late-degree modality cohorts triggered by an active hard-aspect pair
     *  of outer malefics, joined to natal planets at 20–29° in matching
     *  modality. Source for `modalityHits[]` on what-shifts. */
    modalityHits?: Array<{
      transitPair: string;          // "mars-uranus"
      modality: "cardinal" | "fixed" | "mutable";
      aspectAngle: 0 | 90 | 180;
      orb: number;
      natalPlanet: string;
      natalSign: string;
      natalDegree: number;          // 0–29.99 within sign
      hitKey: string;               // "<transitPair>-<natalPlanet-lowercase>"
    }>;
    /** Approaching geo-angle hits — derived from rawTransits by checking each
     *  sample's transit_planet_lon against the destination's four geodetic
     *  angles (geoMC, geoIC, geoASC, geoDSC). Includes hits OUTSIDE the
     *  3° activation orb so the LLM has narrative momentum even when the
     *  sky is currently quiet ("Saturn arrives at your geoMC on Aug 12,
     *  4 weeks after you leave"). Sorted by date, capped at 4. */
    approachingGeoLines?: Array<{
      planet: string;
      angle: "MC" | "IC" | "ASC" | "DSC";
      date: string;                 // ISO YYYY-MM-DD when planet is closest
      orbAtClosest: number;         // degrees, may exceed 3
      withinActivationOrb: boolean; // orbAtClosest ≤ 3
      daysFromTravel: number;       // signed; negative = before travel date
    }>;
  };

  /** Relocation-only timing block. Present iff `macro.travelType === "relocation"`.
   *  The prompt reads this to write copy in the relocation register (calendar
   *  months, first-90-days arrival arc, "year ahead") instead of the trip
   *  register (7-night windows, "during your stay"). Mirrors the four fields
   *  PR #47 added to the V4 viewmodel so prompt and UI consume the same data. */
  relocation?: {
    monthlySeries: MonthlyScore[];
    monthlyHighlights: MonthlyHighlights;
    arrivalCandidates: ArrivalCandidate[];
    /** Curated 4-window shortlist (anchor + top 3 alternates by arcScore) the
     *  AI MUST write `windows[]` notes for. This pins the AI's chosen set to
     *  the SAME 4 the V4 viewmodel renders, so every UI entry has matching
     *  AI prose instead of falling back to the raw drivers string. Always
     *  exactly 4 entries when candidates are available; ≤4 only on legacy
     *  readings without enough hit coverage. */
    windowsToNarrate: ArrivalCandidate[];
    /** True when even the strongest arrival arc lands in the "press" tone —
     *  no calendar month opens this place easily. The prompt's hard rule:
     *  do not write a peak narrative; recommend "reconsider" in the closing
     *  verdict and frame the strongest month as the least-rough door. */
    placeFloorTripped: boolean;
    /** Life-stage cycles active for the user at refDate (Saturn return,
     *  midlife band, progressed lunation phase). The prompt's banner rule:
     *  if `personalCycle.gateActive === true`, lead the relocation overview
     *  with the dominant cycle's framing before any place narrative. The
     *  cycle is person-stable — it doesn't change with destination — but
     *  reframes how the destination should be evaluated. */
    personalCycle: PersonalCycleContext;
  };

  /** Cluster + dispositor + aspect-pattern structure for the AI prompts to
   *  cite. Produced by `buildChartStructure(natalPlanets, houseOf)` from
   *  the engine output. Optional — present when the natal chart actually
   *  has stelliums or aspect patterns; omitted when the chart is
   *  structurally simple. House numbers are RELOCATED (anchored to the
   *  destination's relocated ASC) so cluster commentary lines up with the
   *  rest of the relocation reading. */
  chartStructure?: ChartStructure;
}

function geodeticBandForLon(lon: number): { sign: string; longitudeRange: string } {
  const SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
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

function deriveScoreBreakdown(matrixResult: any, acgLines: any[], rawTransits: TransitHit[]):
  { place: number; timing: number; sky: number } {
  const total = Math.round(matrixResult?.macroScore ?? 0);
  const houses: any[] = Array.isArray(matrixResult?.houses) ? matrixResult.houses : [];

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
  /** Optional inputs for personal-cycle compute. All three must be provided
   *  for `relocation.personalCycle` to populate. Trip readings ignore them.
   *  Older callers can omit; the relocation block falls back to a neutral
   *  PersonalCycleContext (dominant: "none", gateActive: false). */
  transitPositions?: ComputedPosition[];
  progressedBands?: ProgressionsResult;
  birthDateUtc?: Date;
  /** Paran intersections within ±5° of destLat — produced by computeParans()
   *  in astrocarto.ts. Threaded here so the geodetic tab's `placeCharacter`
   *  prose has source data instead of inventing latitude crossings. */
  parans?: ParanResult[];
  /** Birth coords — needed alongside relocatedCusps to call
   *  computeChartRulerContext() and produce the chart-ruler reframe block. */
  birthLat?: number;
  birthLon?: number;
}): TeacherReadingInput {
  const { destination, destinationLat, destinationLon, travelDate, matrixResult, acgLines, rawTransits, eventScores, natalPlanets, relocatedCusps, natalAngles, travelType, goalIds, transitPositions, progressedBands, birthDateUtc, parans: paranInput, birthLat, birthLon } = args;

  const start = travelDate ? new Date(travelDate) : new Date();
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 10);
  const dateRange = {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };

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

  const activeHouses = [...(matrixResult.houses || [])]
    .sort((a: any, b: any) => Math.abs(b.score - 50) - Math.abs(a.score - 50))
    .slice(0, 3)
    .map((h: any) => ({
      topic: houseTopic(h.house),
      vibe: houseVibe(h.score),
    }))
    .filter((h) => h.topic);

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

  const scoreBreakdown = deriveScoreBreakdown(matrixResult, acgLines, rawTransits);

  const closest = (acgLines || []).slice().sort(
    (a: any, b: any) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity),
  )[0];
  const topLineDriver = closest
    ? `${closest.planet} on your ${spellAngle(closest.angle || closest.line || "")}, ${Math.round(closest.distance_km)} km out`
    : undefined;

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

  // Relocation-only timing block. Same builders the V4 viewmodel runs in
  // reading-viewmodel.ts (PR #47), called here so the AI prompt sees the
  // exact data the UI renders. Floor-flag mirrors the VM's check —
  // `verdictTone(verdictBand(maxArc)) === "press"` — to keep prose and UI
  // honesty aligned. Skipped when no travelDate (no anchor → no monthly
  // series possible).
  //
  // PR-B addition: personal-cycle context (Saturn return / midlife /
  // progressed lunation) computed from natal planets + transit positions
  // + progressedBands. Falls back to a neutral context when birthDateUtc
  // or transitPositions aren't supplied — older call sites continue to
  // produce a valid relocation block, just without the cycle banner.
  const relocation = travelType === "relocation" && travelDate
    ? (() => {
        const macroScore = matrixResult.macroScore;
        const monthlySeries = buildMonthlySeries(travelDate, rawTransits, macroScore, goalIds, 12);
        const monthlyHighlights = buildMonthlyHighlights(monthlySeries);
        const arrivalCandidates = buildArrivalScores(travelDate, rawTransits, macroScore, goalIds, 12);
        // Same shortlist the V4 viewmodel renders — pinning the prompt to this
        // exact set means every UI entry has matching AI prose.
        const windowsToNarrate = pickArrivalWindowsToNarrate(arrivalCandidates, travelDate);
        const placeFloorTripped = arrivalCandidates.length > 0
          && verdictTone(verdictBand(Math.max(...arrivalCandidates.map((c) => c.arcScore)))) === "press";

        const refDate = new Date(travelDate);
        const personalCycle: PersonalCycleContext = (transitPositions && birthDateUtc)
          ? computePersonalCycleContext({
              natalPlanets,
              transitPositions,
              progressedBands,
              refDate,
              birthDateUtc,
            })
          : {
              progressedLunation: { phase: "gibbous", elongation: 0, valence: "transitional" },
              dominant: "none",
              gateActive: false,
              upliftActive: false,
              summary: "",
            };

        return { monthlySeries, monthlyHighlights, arrivalCandidates, windowsToNarrate, placeFloorTripped, personalCycle };
      })()
    : undefined;

  // ── Parans for placeCharacter ──────────────────────────────────────────
  // Cap at 8 — same cap as the existing `geodeticHits` array. Sorted by the
  // ParanResult source order (closest-to-destLat first via latWindow filter
  // upstream), so the AI sees the most relevant pairs first.
  const paransForPrompt = (paranInput ?? [])
    .slice(0, 8)
    .map((p) => ({ p1: p.p1, p2: p.p2, lat: Math.round(p.lat * 100) / 100, ...(p.type ? { type: p.type } : {}) }));

  // ── Chart ruler reframe ────────────────────────────────────────────────
  // Only emitted when birth coords are present — otherwise we'd fall back to
  // the geodetic ASC approximation, which is fine for the matrix but too
  // imprecise for the "your trip is about ___" headline. Builder caller
  // (astrocarto.ts) already has dtUtcBirth/birthLat/birthLon in scope.
  const chartRulerCtx: ChartRulerContext | undefined = (typeof birthLat === "number" && typeof birthLon === "number")
    ? (computeChartRulerContext(
        natalPlanets.map((p: any) => ({ planet: p.planet ?? p.name, longitude: p.longitude })),
        destinationLat,
        destinationLon,
        birthLat,
        birthLon,
        relocatedCusps,
        null,
      ) ?? undefined)
    : undefined;

  // ── Modality hits ──────────────────────────────────────────────────────
  // Cross-product: each ModalityCohort × natal planets at 20–29° in matching
  // modality. SIGN_MODALITY_MAP avoids re-deriving modality from longitude.
  const SIGN_MODALITY: Record<string, "cardinal" | "fixed" | "mutable"> = {
    Aries: "cardinal", Cancer: "cardinal", Libra: "cardinal", Capricorn: "cardinal",
    Taurus: "fixed", Leo: "fixed", Scorpio: "fixed", Aquarius: "fixed",
    Gemini: "mutable", Virgo: "mutable", Sagittarius: "mutable", Pisces: "mutable",
  };
  const cohorts: ModalityCohort[] = transitPositions
    ? computeModalityCohorts({
        transitPositions: transitPositions.map((t) => ({ name: t.name, longitude: t.longitude })),
      })
    : [];
  const modalityHitsForPrompt = cohorts.flatMap((c) => {
    const transitPair = `${c.planetA}-${c.planetB}`.toLowerCase();
    return natalPlanets
      .map((p: any) => {
        const lon = p.longitude;
        if (typeof lon !== "number") return null;
        const sign = p.sign ?? signFromLongitude(lon);
        if (SIGN_MODALITY[sign] !== c.modality) return null;
        const degInSign = lon - Math.floor(lon / 30) * 30;
        if (degInSign < 20) return null;
        const planet = String(p.name ?? p.planet);
        return {
          transitPair,
          modality: c.modality,
          aspectAngle: c.aspectAngle,
          orb: c.orb,
          natalPlanet: planet,
          natalSign: sign,
          natalDegree: Math.round(degInSign * 100) / 100,
          hitKey: `${transitPair}-${planet.toLowerCase()}`,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }).slice(0, 12);

  // ── Approaching geo-angle hits ────────────────────────────────────────
  // For each rawTransit sample, compute the planet's angular distance to
  // each of the destination's four geodetic angles. Keep the tightest hit
  // per planet within ±60 days of travelDate, regardless of whether it's
  // within the 3° activation orb. Lets the LLM say "Saturn arrives at your
  // geoMC on Aug 12 — 4 weeks after you leave" when the sky is currently
  // quiet, instead of leaving §02 stranded.
  const approachingGeoLines = (() => {
    if (typeof destinationLon !== "number" || typeof destinationLat !== "number") return [];
    const geoMC = geodeticMCLongitude(destinationLon);
    const geoASC = geodeticASCLongitude(destinationLon, destinationLat);
    const geoIC = (geoMC + 180) % 360;
    const geoDSC = (geoASC + 180) % 360;
    const ANGLES: Array<{ k: "MC" | "IC" | "ASC" | "DSC"; lon: number }> = [
      { k: "MC", lon: geoMC }, { k: "IC", lon: geoIC },
      { k: "ASC", lon: geoASC }, { k: "DSC", lon: geoDSC },
    ];
    const angularDiff = (a: number, b: number) => {
      let d = Math.abs(a - b) % 360;
      if (d > 180) d = 360 - d;
      return d;
    };
    const travelMs = travelDate ? new Date(travelDate).getTime() : refTime;
    const SIXTY_DAYS = 60 * 86_400_000;

    type Hit = { planet: string; angle: "MC" | "IC" | "ASC" | "DSC"; date: string; orbAtClosest: number; daysFromTravel: number };
    const tightestPerPlanet = new Map<string, Hit>();

    for (const t of rawTransits) {
      if (typeof t.transit_planet_lon !== "number") continue;
      const tDate = new Date(t.date).getTime();
      if (Math.abs(tDate - travelMs) > SIXTY_DAYS) continue;
      const planet = t.transit_planet;
      let best: { angle: "MC" | "IC" | "ASC" | "DSC"; orb: number } | null = null;
      for (const a of ANGLES) {
        const orb = angularDiff(t.transit_planet_lon, a.lon);
        if (!best || orb < best.orb) best = { angle: a.k, orb };
      }
      if (!best || best.orb > 8) continue; // 8° hard cap — beyond that it's noise
      const cur = tightestPerPlanet.get(planet);
      if (!cur || best.orb < cur.orbAtClosest) {
        tightestPerPlanet.set(planet, {
          planet,
          angle: best.angle,
          date: t.date,
          orbAtClosest: Math.round(best.orb * 100) / 100,
          daysFromTravel: Math.round((tDate - travelMs) / 86_400_000),
        });
      }
    }
    return [...tightestPerPlanet.values()]
      .sort((a, b) => a.orbAtClosest - b.orbAtClosest)
      .slice(0, 4)
      .map((h) => ({ ...h, withinActivationOrb: h.orbAtClosest <= 3 }));
  })();

  // Cluster + dispositor + aspect-pattern structure for the AI prompt's
  // chartStructure field. Houses are RELOCATED (anchored to relocatedCusps[0])
  // so the prompt's cluster commentary references the same house numbers as
  // the rest of the relocation reading. Omitted from the return when the
  // chart has neither stelliums nor patterns.
  const relocAscLon = relocatedCusps[0] ?? 0;
  const chartStructure: ChartStructure = buildChartStructure(
    natalPlanets.map((p: any) => ({
      name: p.name ?? p.planet ?? "",
      longitude: p.longitude ?? 0,
      sign: p.sign ?? signFromLongitude(p.longitude ?? 0),
    })),
    (lon: number) => houseFromLongitude(lon, relocAscLon),
  );
  const hasStructure = chartStructure.stelliums.length > 0
    || chartStructure.patterns.length > 0
    || !!chartStructure.finalDispositor;

  return {
    macro: {
      destination,
      dateRange,
      overallScore: matrixResult.macroScore,
      travelType: travelType === "relocation" ? "relocation" : "trip",
      goalIds,
      scoreBreakdown,
    },
    editorialEvidence,
    ...(relocation ? { relocation } : {}),
    ...(hasStructure ? { chartStructure } : {}),
    sidebarsData: {
      travelWindows: (() => {
        if (travelType === "relocation" || !travelDate) return [];
        const heroScored = buildScoredWindows(dateRange.start, rawTransits, matrixResult.macroScore, goalIds)[0];
        const rangeHighlights = buildRangeHighlights(dateRange.start, rawTransits, matrixResult.macroScore, goalIds);
        const tw = [];
        const shortDate = (iso: string) => {
          const d = new Date(iso);
          return `${d.toLocaleString("en-US", { month: "short" })} ${d.getUTCDate()}`;
        };
        if (heroScored) {
          tw.push({ rank: 1, dates: `${shortDate(heroScored.startISO)} — ${shortDate(heroScored.endISO)}`, score: heroScored.score, nights: "10" });
        }
        rangeHighlights.good.slice(0, 2).forEach(g => {
          tw.push({ rank: tw.length + 1, dates: `${shortDate(g.startISO)} — ${shortDate(g.endISO)}`, score: g.score, nights: "5" });
        });
        if (rangeHighlights.bad[0]) {
          tw.push({ rank: tw.length + 1, dates: `${shortDate(rangeHighlights.bad[0].startISO)} — ${shortDate(rangeHighlights.bad[0].endISO)}`, score: rangeHighlights.bad[0].score, nights: "5" });
        }
        return tw;
      })(),
      ...(topLineDriver ? { topLineDriver } : {}),
      ...(geodeticBand ? { geodeticBand } : {}),
      natalSpotlight,
      topTransits,
      nearbyLines,
      activeHouses,
      ...(angleShifts ? { angleShifts } : {}),
      ...(planetHouseShifts ? { planetHouseShifts } : {}),
      ...(aspectsToAngles.length ? { aspectsToAngles } : {}),
      ...(personalGeodetic.length ? { personalGeodetic } : {}),
      ...(paransForPrompt.length ? { parans: paransForPrompt } : {}),
      ...(chartRulerCtx ? { chartRuler: chartRulerCtx } : {}),
      ...(modalityHitsForPrompt.length ? { modalityHits: modalityHitsForPrompt } : {}),
      ...(approachingGeoLines.length ? { approachingGeoLines } : {}),
    }
  };
}
