import type { EditorialEvidence } from "@/app/lib/reading-tabs";
import type { TransitHit } from "@/lib/astro/transit-solver";
import type { Tone } from "@/lib/ai/schemas";
import { signFromLongitude, houseFromLongitude, houseFromCusps, geodeticMCLongitude, geodeticASCLongitude } from "@/app/lib/geodetic";
import { acgLineRawScore, acgLineStrengthBand, type AcgLineStrengthBand } from "@/app/lib/house-matrix";
import { houseTopic, spellAngle, closenessBand, houseVibe } from "./house-topics";
import { buildEditorialEvidence, deriveScoreNarrative } from "@/app/lib/reading-tabs";
import {
  buildScoredWindows,
  buildRangeHighlights,
  buildMonthlySeries,
  buildMonthlyHighlights,
  buildArrivalScores,
  pickArrivalWindowsToNarrate,
  type FusedWindowInputs,
  type MonthlyScore,
  type MonthlyHighlights,
  type ArrivalCandidate,
} from "@/app/lib/window-scoring";
import {
  buildNatalPlanetRelocatedHouseMap,
  buildOccupancyPlanets,
  type ScoreEvidenceProfile,
} from "@/app/lib/scoring-engine";
import { verdictBand, verdictTone } from "@/app/lib/verdict";
import { formatTransitDates, transitTone, aspectSentence } from "./ai-input-helpers";
import {
  computePersonalCycleContext,
  type PersonalCycleContext,
} from "@/app/lib/personal-cycles";
import { SIGN_RULERS } from "@/app/lib/astro-constants";
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
    /** User-facing headline score. This is the score prose may cite as "the score". */
    headlineScore: number;
    /** Place-only baseline before date-specific transit fusion. Evidence only. */
    placeBaselineScore?: number;
    overallScore: number;
    travelType: "trip" | "relocation";
    goalIds: string[];
    scoreBreakdown?: { place: number; timing: number; sky: number };
  };

  /** The core structured data for the AI to base its tabs on */
  editorialEvidence: EditorialEvidence;
  /** Scoring evidence classification from the fused engine. Confirmed warnings
   *  may govern the headline; cautions are narrative context only. */
  scoreEvidenceProfile?: ScoreEvidenceProfile;

  /** Deterministic low-score travel risks from the scoring engine. The AI
   *  should reuse these instead of deciding which weak areas matter. */
  riskSummary?: Array<{
    event: string;
    score: number;
    travelRisk: string;
    mitigation: string;
  }>;

  /** Extra raw data needed for generating specific sidebars and tooltips */
  sidebarsData: {
    /** Trip-only candidate windows (top hero + range highlights). Empty array
     *  for relocations — see top-level `relocation.arrivalCandidates` instead. */
    travelWindows: Array<{
      rank: number;
      dates: string;
      score: number;
      nights: string;
      drivers?: string[];
      topHits?: Array<{
        transitPlanet: string;
        aspect: string;
        natalPlanet: string;
        date: string;
        orb?: number;
        tone?: Tone;
      }>;
    }>;
    topLineDriver?: string;
    geodeticBand?: { sign: string; longitudeRange: string };
    natalSpotlight: Array<{ planet: string; sign: string; role: string }>;
    topTransits: Array<{ aspect: string; dateRange: string; tone: Tone; houseTopics: string[]; aspectKey: string }>;
    nearbyLines: Array<{ planet: string; angle: string; distanceKm: number; contribution: number; strength: AcgLineStrengthBand }>;
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
    chartRuler?: ChartRulerContext & {
      rulerSign?: string;
      dignity?: string;
      planetNature?: "benefic" | "malefic" | "luminary" | "neutral";
    };
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
    timingContext?: {
      annualProfection?: {
        age: number;
        house: number;
        houseTopic: string;
        sign?: string;
        timeLord?: string;
        timeLordRelocatedHouse?: number;
        summary: string;
      };
      progressions?: {
        bands: Array<{ planet: string; sign: string; longitudeRange: string; destinationInBand: boolean }>;
        angleHits: Array<{ planet: string; angle: string; orb: number; severity: number }>;
        summary: string;
      };
    };
    prioritySignals?: Array<{
      key: "mars-asc-body-risk" | "pluto-dsc-relief";
      planet: "Mars" | "Pluto";
      angle?: "ASC" | "DSC";
      orb?: number;
      natalHouse?: number;
      relocatedHouse?: number;
      priority: "high";
      summary: string;
      instruction: string;
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

export function travelRiskForEvent(eventName: string): { travelRisk: string; mitigation: string } {
  const key = eventName.toLowerCase();
  if (key.includes("wealth") || key.includes("financial")) {
    return {
      travelRisk: "money choices, shopping, contracts, or shared-resource decisions can feel heavier than expected",
      mitigation: "set a budget before arrival and avoid making financial commitments under pressure",
    };
  }
  if (key.includes("home") || key.includes("family") || key.includes("roots")) {
    return {
      travelRisk: "family repair, nesting, or emotional settling can feel unstable",
      mitigation: "treat the place as a field test before asking it to feel like home",
    };
  }
  if (key.includes("romance") || key.includes("love")) {
    return {
      travelRisk: "romance can turn performative, brittle, or harder to soften into",
      mitigation: "keep expectations light and do not make the trip prove the relationship",
    };
  }
  if (key.includes("health") || key.includes("routine") || key.includes("wellness")) {
    return {
      travelRisk: "sleep, digestion, recovery, and daily rhythm can wobble",
      mitigation: "book quieter lodging, protect rest, and keep the itinerary physically simple",
    };
  }
  if (key.includes("partnership") || key.includes("marriage")) {
    return {
      travelRisk: "one-to-one expectations can tighten into conflict or disappointment",
      mitigation: "name roles, pace, budget, and alone-time before the trip starts",
    };
  }
  if (key.includes("career") || key.includes("public")) {
    return {
      travelRisk: "work visibility or public-facing moves may demand more effort than payoff",
      mitigation: "use the place for research or preparation rather than forcing a launch",
    };
  }
  if (key.includes("friendship") || key.includes("network")) {
    return {
      travelRisk: "social plans can scatter, drain, or fail to become real belonging",
      mitigation: "choose smaller repeatable rooms over big networking pushes",
    };
  }
  if (key.includes("spiritual") || key.includes("inner")) {
    return {
      travelRisk: "quiet, perspective, or inner peace may be hard to access",
      mitigation: "schedule solitude deliberately instead of expecting the place to provide it",
    };
  }
  return {
    travelRisk: `${eventName} is not the easiest use of this place`,
    mitigation: "keep this domain low-stakes and design the trip around stronger signals",
  };
}

export function buildRiskSummary(eventScores: Array<{ eventName: string; finalScore: number }>) {
  return [...eventScores]
    .filter((event) => typeof event.finalScore === "number" && event.finalScore < 45)
    .sort((a, b) => a.finalScore - b.finalScore)
    .slice(0, 5)
    .map((event) => ({
      event: event.eventName,
      score: Math.round(event.finalScore),
      ...travelRiskForEvent(event.eventName),
    }));
}

function signedAngularDiff(a: number, b: number): number {
  return ((((a - b) % 360) + 540) % 360) - 180;
}

function angleOrb(a: number | undefined, b: number | undefined): number | null {
  if (typeof a !== "number" || typeof b !== "number") return null;
  return Math.round(Math.abs(signedAngularDiff(a, b)) * 100) / 100;
}

function ageAtDate(birthDateUtc: Date | undefined, refDate: Date): number | null {
  if (!birthDateUtc || Number.isNaN(birthDateUtc.getTime())) return null;
  let age = refDate.getUTCFullYear() - birthDateUtc.getUTCFullYear();
  const birthdayThisYear = Date.UTC(
    refDate.getUTCFullYear(),
    birthDateUtc.getUTCMonth(),
    birthDateUtc.getUTCDate(),
  );
  if (refDate.getTime() < birthdayThisYear) age -= 1;
  return age >= 0 ? age : null;
}

function buildAnnualProfectionContext(args: {
  birthDateUtc?: Date;
  refDate: Date;
  natalCusps?: number[];
  natalPlanets: any[];
  relocatedCusps: number[];
}) {
  const age = ageAtDate(args.birthDateUtc, args.refDate);
  if (age === null) return undefined;
  const house = (age % 12) + 1;
  const houseTopicLabel = houseTopic(house);
  const cuspLon = args.natalCusps?.[house - 1];
  const sign = typeof cuspLon === "number" ? signFromLongitude(cuspLon) : undefined;
  const timeLord = sign ? SIGN_RULERS[sign] : undefined;
  const timeLordPlanet = timeLord
    ? args.natalPlanets.find((p) => String(p.name || p.planet).toLowerCase() === timeLord.toLowerCase())
    : undefined;
  const timeLordRelocatedHouse = typeof timeLordPlanet?.longitude === "number"
    ? houseFromCusps(timeLordPlanet.longitude, args.relocatedCusps) ?? houseFromLongitude(timeLordPlanet.longitude, args.relocatedCusps[0] ?? 0)
    : undefined;

  return {
    age,
    house,
    houseTopic: houseTopicLabel,
    ...(sign ? { sign } : {}),
    ...(timeLord ? { timeLord } : {}),
    ...(timeLordRelocatedHouse ? { timeLordRelocatedHouse } : {}),
    summary: [
      `Age ${age} activates a ${house}${house === 1 ? "st" : house === 2 ? "nd" : house === 3 ? "rd" : "th"}-house profection year`,
      houseTopicLabel ? `focused on ${houseTopicLabel}` : "",
      timeLord ? `with ${timeLord} as time lord` : "",
      timeLordRelocatedHouse ? `showing through relocated house ${timeLordRelocatedHouse}` : "",
    ].filter(Boolean).join(", ") + ".",
  };
}

function buildProgressionTimingContext(progressedBands: ProgressionsResult | undefined) {
  if (!progressedBands) return undefined;
  const bands = progressedBands.bands.map((band) => ({
    planet: band.planet,
    sign: band.sign,
    longitudeRange: band.longitudeRange,
    destinationInBand: band.destinationInBand,
  }));
  const angleHits = progressedBands.angleHits.slice(0, 4).map((hit) => ({
    planet: hit.planet,
    angle: hit.angle,
    orb: hit.orb,
    severity: hit.severity,
  }));
  const activeBands = bands.filter((band) => band.destinationInBand);
  const summaryParts = [
    activeBands.length
      ? `${activeBands.map((band) => `progressed ${band.planet} in ${band.sign}`).join(" and ")} brackets this longitude`
      : "No progressed Sun or Moon sign-band directly brackets this longitude",
    angleHits.length
      ? `${angleHits[0].planet} is within ${angleHits[0].orb}° of the geodetic ${angleHits[0].angle}`
      : "",
  ].filter(Boolean);
  return {
    bands,
    angleHits,
    summary: summaryParts.join("; ") + ".",
  };
}

function buildPrioritySignals(args: {
  natalPlanets: any[];
  natalCusps?: number[];
  natalAngles?: { ASC: number; IC: number; DSC: number; MC: number };
  relocatedCusps: number[];
}) {
  const signals: NonNullable<TeacherReadingInput["sidebarsData"]["prioritySignals"]> = [];
  const findPlanet = (name: string) =>
    args.natalPlanets.find((p) => String(p.name || p.planet).toLowerCase() === name.toLowerCase());
  const mars = findPlanet("Mars");
  const pluto = findPlanet("Pluto");
  const relocatedAsc = args.relocatedCusps[0];
  const marsAscOrb = angleOrb(mars?.longitude, relocatedAsc);
  if (marsAscOrb !== null && marsAscOrb <= 2) {
    signals.push({
      key: "mars-asc-body-risk",
      planet: "Mars",
      angle: "ASC",
      orb: marsAscOrb,
      priority: "high",
      summary: `Mars sits within ${marsAscOrb}° of the relocated Ascendant, the body and first-impression point.`,
      instruction: "Surface physical pacing risk: accidents, cuts, scars, inflammation, impatience, workouts, driving, and rushed transitions. Make it practical, not doom-y.",
    });
  }

  const natalDsc = args.natalAngles?.DSC ?? args.natalCusps?.[6];
  const plutoDscOrb = angleOrb(pluto?.longitude, natalDsc);
  if (plutoDscOrb !== null && plutoDscOrb <= 3 && typeof pluto?.longitude === "number") {
    const natalHouse = houseFromCusps(pluto.longitude, args.natalCusps)
      ?? (args.natalAngles ? houseFromLongitude(pluto.longitude, args.natalAngles.ASC) : undefined);
    const relocatedHouse = houseFromCusps(pluto.longitude, args.relocatedCusps)
      ?? houseFromLongitude(pluto.longitude, args.relocatedCusps[0] ?? 0);
    if (relocatedHouse !== 7) {
      signals.push({
        key: "pluto-dsc-relief",
        planet: "Pluto",
        angle: "DSC",
        orb: plutoDscOrb,
        ...(natalHouse ? { natalHouse } : {}),
        relocatedHouse,
        priority: "high",
        summary: `Natal Pluto is within ${plutoDscOrb}° of the Descendant, but relocates into house ${relocatedHouse}.`,
        instruction: "Frame this as partial relief: Pluto does not disappear, but pressure moves away from close partners and into a more manageable life area. Say better, not easy.",
      });
    }
  }
  return signals;
}

function planetNatureForPrompt(planet: string): "benefic" | "malefic" | "luminary" | "neutral" {
  const key = planet.toLowerCase();
  if (key === "venus" || key === "jupiter") return "benefic";
  if (key === "mars" || key === "saturn") return "malefic";
  if (key === "sun" || key === "moon") return "luminary";
  return "neutral";
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
  /** Full 12-cusp Placidus array for the natal chart. Optional for back-compat
   *  with older callers; when present, planet-house and chart-ruler lookups
   *  use Placidus to match the UI. When absent, equal-house from natalAngles.ASC
   *  is the fallback. */
  natalCusps?: number[];
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
  scoreEvidenceProfile?: ScoreEvidenceProfile;
}): TeacherReadingInput {
  const { destination, destinationLat, destinationLon, travelDate, matrixResult, acgLines, rawTransits, eventScores, natalPlanets, relocatedCusps, natalCusps, natalAngles, travelType, goalIds, transitPositions, progressedBands, birthDateUtc, parans: paranInput, birthLat, birthLon, scoreEvidenceProfile } = args;

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
    .map((l: any) => {
      const lineAngle = (l.angle || l.line || "").toString().toUpperCase();
      const distanceKm = Number(l.distance_km ?? 9999);
      return {
        planet: l.planet,
        angle: spellAngle(lineAngle),
        closeness: closenessBand(l.distance_km ?? 9999),
        distanceKm: Math.round(distanceKm),
        contribution: acgLineRawScore({
          planet: l.planet,
          angle: lineAngle,
          distance_km: distanceKm,
        }),
        strength: acgLineStrengthBand({
          planet: l.planet,
          angle: lineAngle,
          distance_km: distanceKm,
        }),
      };
    });

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
    ? natalPlanets.slice(0, 10).map((p: any) => {
        const planet = p.name || p.planet;
        const lon = p.longitude;
        // Prefer Placidus from real cusps so this matches the UI's
        // PlanetShiftCard and the chart-ruler card. Fall back to equal-house
        // from ASC only when full cusps aren't available.
        const natalHouse = houseFromCusps(lon, natalCusps)
            ?? houseFromLongitude(lon, natalAngles.ASC);
        const relocatedHouse = houseFromCusps(lon, relocatedCusps)
            ?? houseFromLongitude(lon, ascLon);
        return { planet, natalHouse, relocatedHouse };
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
  // Single fused-engine input bundle reused across every per-window/day/month
  // helper invoked below — guarantees the AI prompt sees the same scores the
  // VM renders.
  const fusedInputs: FusedWindowInputs = {
    matrixResult,
    relocatedPlanets: buildOccupancyPlanets(natalPlanets, relocatedCusps, acgLines, birthLat),
    transits: rawTransits,
    goalIds,
    natalPlanetHouse: buildNatalPlanetRelocatedHouseMap(natalPlanets, relocatedCusps, birthLat),
  };

  const relocation = travelType === "relocation" && travelDate
    ? (() => {
        const monthlySeries = buildMonthlySeries(travelDate, fusedInputs, 12);
        const monthlyHighlights = buildMonthlyHighlights(monthlySeries);
        const arrivalCandidates = buildArrivalScores(travelDate, fusedInputs, 12);
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
        natalCusps ?? null,
      ) ?? undefined)
    : undefined;
  const chartRulerForPrompt = (() => {
    if (!chartRulerCtx) return undefined;
    const rulerPlanet = natalPlanets.find((p: any) =>
      String(p.name ?? p.planet).toLowerCase() === chartRulerCtx.chartRuler.toLowerCase(),
    );
    const planetNature = planetNatureForPrompt(chartRulerCtx.chartRuler);
    return {
      ...chartRulerCtx,
      ...(rulerPlanet?.sign ? { rulerSign: rulerPlanet.sign } : {}),
      ...(rulerPlanet?.dignity ? { dignity: String(rulerPlanet.dignity) } : {}),
      planetNature,
    };
  })();

  const timingContext = {
    annualProfection: buildAnnualProfectionContext({
      birthDateUtc,
      refDate: start,
      natalCusps,
      natalPlanets,
      relocatedCusps,
    }),
    progressions: buildProgressionTimingContext(progressedBands),
  };
  const prioritySignals = buildPrioritySignals({
    natalPlanets,
    natalCusps,
    natalAngles,
    relocatedCusps,
  });

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
      headlineScore: matrixResult.macroScore,
      placeBaselineScore: matrixResult.matrixMacroScore,
      overallScore: matrixResult.macroScore,
      travelType: travelType === "relocation" ? "relocation" : "trip",
      goalIds,
      scoreBreakdown,
    },
    editorialEvidence,
    ...(scoreEvidenceProfile ? { scoreEvidenceProfile } : {}),
    riskSummary: buildRiskSummary(eventScores),
    ...(relocation ? { relocation } : {}),
    ...(hasStructure ? { chartStructure } : {}),
    sidebarsData: {
      travelWindows: (() => {
        if (travelType === "relocation" || !travelDate) return [];
        // Every per-window score now flows through the fused engine via the
        // single `fusedInputs` bundle assembled above — sidebars, AI prompt,
        // and viewmodel can never disagree because they all share the same
        // engine call.
        const heroScored = buildScoredWindows(dateRange.start, fusedInputs)[0];
        const rangeHighlights = buildRangeHighlights(dateRange.start, fusedInputs);
        const tw = [];
        const shortDate = (iso: string) => {
          const d = new Date(iso);
          return `${d.toLocaleString("en-US", { month: "short" })} ${d.getUTCDate()}`;
        };
        const compactHits = (hits: TransitHit[] | undefined) =>
          (hits ?? []).slice(0, 3).map((hit) => ({
            transitPlanet: hit.transit_planet,
            aspect: hit.aspect,
            natalPlanet: hit.natal_planet,
            date: hit.date,
            orb: typeof hit.orb === "number" ? Number(hit.orb.toFixed(2)) : undefined,
            tone: transitTone(hit),
          }));
        if (heroScored) {
          tw.push({
            rank: 1,
            dates: `${shortDate(heroScored.startISO)} — ${shortDate(heroScored.endISO)}`,
            score: heroScored.score,
            nights: "10",
            drivers: heroScored.drivers?.slice(0, 3),
          });
        }
        rangeHighlights.good.slice(0, 2).forEach(g => {
          tw.push({
            rank: tw.length + 1,
            dates: `${shortDate(g.startISO)} — ${shortDate(g.endISO)}`,
            score: g.score,
            nights: "5",
            topHits: compactHits(g.topHits),
          });
        });
        if (rangeHighlights.bad[0]) {
          const hard = rangeHighlights.bad[0];
          tw.push({
            rank: tw.length + 1,
            dates: `${shortDate(hard.startISO)} — ${shortDate(hard.endISO)}`,
            score: hard.score,
            nights: "5",
            topHits: compactHits(hard.topHits),
          });
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
      ...(chartRulerForPrompt ? { chartRuler: chartRulerForPrompt } : {}),
      ...(modalityHitsForPrompt.length ? { modalityHits: modalityHitsForPrompt } : {}),
      ...(approachingGeoLines.length ? { approachingGeoLines } : {}),
      ...(timingContext.annualProfection || timingContext.progressions ? { timingContext } : {}),
      ...(prioritySignals.length ? { prioritySignals } : {}),
    }
  };
}
