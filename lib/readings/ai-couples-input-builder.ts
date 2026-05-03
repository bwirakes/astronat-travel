import type { CouplesVM } from "@/app/lib/couples-viewmodel";
import type { TransitHit } from "@/lib/astro/transit-solver";
import { signFromLongitude } from "@/app/lib/geodetic";

export interface CouplesReadingInput {
  viewmodel: CouplesVM;
  rawEvidence: {
    nearbyLinesYou: Array<{ planet: string; angle: string; distanceKm: number }>;
    nearbyLinesPartner: Array<{ planet: string; angle: string; distanceKm: number }>;
    topTransitsYou: Array<{ aspect: string; dateRange: string; tone: string; aspectKey: string; planets: { a: string; b: string } }>;
    topTransitsPartner: Array<{ aspect: string; dateRange: string; tone: string; aspectKey: string; planets: { a: string; b: string } }>;
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

function transitTone(hit: TransitHit): string {
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

export function buildCouplesAIInput(args: {
  viewmodel: CouplesVM;
  travelDate: string | null;
  acgLinesYou: any[];
  acgLinesPartner: any[];
  rawTransitsYou: TransitHit[];
  rawTransitsPartner: TransitHit[];
  natalPlanetsYou: any[];
  natalPlanetsPartner: any[];
}): CouplesReadingInput {
  const {
    viewmodel,
    travelDate,
    acgLinesYou,
    acgLinesPartner,
    rawTransitsYou,
    rawTransitsPartner,
    natalPlanetsYou,
    natalPlanetsPartner,
  } = args;

  const refTime = travelDate ? new Date(travelDate).getTime() : Date.now();

  const mapTransits = (transits: TransitHit[], natalPlanets: any[]) => {
    return [...transits]
      .sort((a, b) => {
        const da = Math.abs(new Date(a.date).getTime() - refTime);
        const db = Math.abs(new Date(b.date).getTime() - refTime);
        return da !== db ? da - db : a.orb - b.orb;
      })
      .slice(0, 5)
      .map((hit, i) => {
        const transitNatal = natalPlanets.find(
          (p) => String(p.name || p.planet).toLowerCase() === hit.transit_planet.toLowerCase(),
        );
        const natalNatal = natalPlanets.find(
          (p) => String(p.name || p.planet).toLowerCase() === hit.natal_planet.toLowerCase(),
        );
        const transitSign = transitNatal?.sign ?? signFromLongitude(transitNatal?.longitude ?? 0);
        const natalSign = natalNatal?.sign ?? signFromLongitude(natalNatal?.longitude ?? 0);

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
          aspectKey,
        };
      });
  };

  const topTransitsYou = mapTransits(rawTransitsYou || [], natalPlanetsYou || []);
  const topTransitsPartner = mapTransits(rawTransitsPartner || [], natalPlanetsPartner || []);

  const mapLines = (lines: any[]) => {
    return [...(lines || [])]
      .sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity))
      .slice(0, 5)
      .map((l: any) => ({
        planet: l.planet,
        angle: (l.angle || l.line || "").toString().toUpperCase(),
        distanceKm: Math.round(Number(l.distance_km ?? 9999)),
      }));
  };

  const nearbyLinesYou = mapLines(acgLinesYou);
  const nearbyLinesPartner = mapLines(acgLinesPartner);

  return {
    viewmodel,
    rawEvidence: {
      nearbyLinesYou,
      nearbyLinesPartner,
      topTransitsYou,
      topTransitsPartner,
    },
  };
}
