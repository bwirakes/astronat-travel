/**
 * Synastry math — pulled out of route.ts so the route stays a thin
 * dispatcher. Pure functions, no I/O.
 */

const ASPECTS = [
  { name: "conjunction", angle: 0,   orb: 8, tone: "neutral" as const },
  { name: "opposition",  angle: 180, orb: 8, tone: "tense"   as const },
  { name: "trine",       angle: 120, orb: 6, tone: "harmonious" as const },
  { name: "square",      angle: 90,  orb: 6, tone: "tense"   as const },
  { name: "sextile",     angle: 60,  orb: 4, tone: "harmonious" as const },
];

export interface SynastryAspect {
  planet1: string;
  planet2: string;
  aspect: string;
  orb: number;
  tone: "harmonious" | "tense" | "neutral";
}

export function computeSynastryAspects(
  planetsA: any[],
  planetsB: any[],
): SynastryAspect[] {
  const results: SynastryAspect[] = [];
  for (const pA of planetsA) {
    for (const pB of planetsB) {
      const diff = Math.abs((pA.longitude - pB.longitude + 360) % 360);
      const angle = diff > 180 ? 360 - diff : diff;
      for (const asp of ASPECTS) {
        const orb = Math.abs(angle - asp.angle);
        if (orb <= asp.orb) {
          results.push({
            planet1: pA.planet || pA.name,
            planet2: pB.planet || pB.name,
            aspect: asp.name,
            orb: parseFloat(orb.toFixed(2)),
            tone: asp.tone,
          });
        }
      }
    }
  }
  return results;
}

export type HouseBucket = "overlap" | "excitement" | "friction" | "neutral";

export function classifyHouseBucket(
  userScore: number,
  partnerScore: number,
): HouseBucket {
  const delta = Math.abs(userScore - partnerScore);
  const avg = (userScore + partnerScore) / 2;
  const max = Math.max(userScore, partnerScore);
  const min = Math.min(userScore, partnerScore);
  if (avg >= 70 && delta < 15) return "overlap";
  if (max >= 80 && delta >= 15) return "excitement";
  if (delta >= 20 && min <= 55) return "friction";
  return "neutral";
}

export function computeRecommendation(
  houseComparison: { bucket: string }[],
  scoreDelta: number,
): "go" | "caution" | "avoid" {
  const overlap = houseComparison.filter((h) => h.bucket === "overlap").length;
  const friction = houseComparison.filter((h) => h.bucket === "friction").length;
  if (overlap >= 3 && friction <= 1) return "go";
  if (friction >= 3 || (friction >= 2 && scoreDelta > 25)) return "avoid";
  return "caution";
}
