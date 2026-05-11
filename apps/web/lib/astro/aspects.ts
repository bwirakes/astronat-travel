/**
 * aspects.ts — Astrological Geometry Engine (TS Port)
 * 
 * Calculates geometric relationships (aspects) between two ecliptic longitudes
 * using the shortest-arc formula on a 360° wheel.
 */

export const ASPECTS = {
  0: "Conjunction",
  60: "Sextile",
  90: "Square",
  120: "Trine",
  180: "Opposition",
} as const;

export type AspectType = typeof ASPECTS[keyof typeof ASPECTS];

export const DEFAULT_ORBS: Record<number, number> = {
  0: 6.0,
  60: 4.0,
  90: 5.0,
  120: 5.0,
  180: 6.0,
};

export const LUMINARY_ORBS: Record<number, number> = {
  0: 8.0,
  60: 5.0,
  90: 7.0,
  120: 7.0,
  180: 8.0,
};

export const LUMINARIES = new Set(["Sun", "Moon"]);

/**
 * Compute the shortest angular distance on a 360° circle.
 * Returns a value in [0, 180].
 */
export function angularDistance(lonA: number, lonB: number): number {
  const diff = Math.abs(lonA - lonB) % 360.0;
  return Math.min(diff, 360.0 - diff);
}

export interface AspectResult {
  aspect: AspectType;
  angle: number;
  orb: number;
  isExact: boolean;
}

export function calculateAspect(
  transitLon: number,
  natalLon: number,
  transitPlanet: string = "",
  natalPlanet: string = "",
  orbOverrides?: Record<number, number>
): AspectResult | null {
  const distance = angularDistance(transitLon, natalLon);

  const isLuminary = LUMINARIES.has(transitPlanet) || LUMINARIES.has(natalPlanet);
  const orbTable = isLuminary ? LUMINARY_ORBS : DEFAULT_ORBS;

  const activeOrbs = orbOverrides ? { ...orbTable, ...orbOverrides } : orbTable;

  let bestMatch: AspectResult | null = null;
  let bestOrb = Infinity;

  for (const [angleStr, aspectName] of Object.entries(ASPECTS)) {
    const exactAngle = parseInt(angleStr);
    const maxOrb = activeOrbs[exactAngle] ?? DEFAULT_ORBS[exactAngle];
    const orb = Math.abs(distance - exactAngle);

    if (orb <= maxOrb && orb < bestOrb) {
      bestOrb = orb;
      bestMatch = {
        aspect: aspectName as AspectType,
        angle: exactAngle,
        orb: Number(orb.toFixed(4)),
        isExact: orb < 0.5, // Within 0.5° = "exact" aspect
      };
    }
  }

  return bestMatch;
}

export interface PlanetPosition {
  name: string;
  longitude: number;
  [key: string]: any;
}

export interface AspectHit {
  transit_planet: string;
  natal_planet: string;
  aspect: AspectType;
  angle: number;
  orb: number;
  isExact: boolean;
}

export function findAllAspects(
  transitPositions: PlanetPosition[],
  natalPositions: PlanetPosition[]
): AspectHit[] {
  const hits: AspectHit[] = [];

  for (const t of transitPositions) {
    for (const n of natalPositions) {
      const result = calculateAspect(
        t.longitude,
        n.longitude,
        t.name,
        n.name
      );
      if (result) {
        hits.push({
          transit_planet: t.name,
          natal_planet: n.name,
          aspect: result.aspect,
          angle: result.angle,
          orb: result.orb,
          isExact: result.isExact,
        });
      }
    }
  }

  return hits.sort((a, b) => a.orb - b.orb);
}
