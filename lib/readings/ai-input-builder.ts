import type { EditorialEvidence } from "@/app/lib/reading-tabs";
import type { TransitHit } from "@/lib/astro/transit-solver";
import type { Tone } from "@/lib/ai/schemas";
import { signFromLongitude, houseFromLongitude } from "@/app/lib/geodetic";
import { acgLineRawScore } from "@/app/lib/house-matrix";
import { houseTopic, spellAngle, closenessBand, houseVibe } from "./house-topics";
import { buildEditorialEvidence, deriveScoreNarrative } from "@/app/lib/reading-tabs";

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
  };
}

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
}): TeacherReadingInput {
  const { destination, destinationLat, destinationLon, travelDate, matrixResult, acgLines, rawTransits, eventScores, natalPlanets, relocatedCusps, natalAngles, travelType, goalIds } = args;

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
    sidebarsData: {
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
    }
  };
}
