import { describe, expect, it } from "bun:test";
import {
  computeFusedReadingHeadline,
  computeTransitModifiersAtAnchor,
  finalizeEventScoresFromLayers,
  computePlaceAffinityLayers,
  buildNatalPlanetRelocatedHouseMap,
  buildOccupancyPlanets,
  MAX_TRANSIT_MODIFIER,
  type FinalEventScore,
} from "@/app/lib/scoring-engine";

const mkScores = (vals: number[]): FinalEventScore[] =>
  vals.map((v, i) => ({
    eventName: `e${i}`,
    baseVolume: 0,
    affinityModifier: 0,
    finalScore: v,
    verdict: "x",
  }));

describe("computeFusedReadingHeadline", () => {
  it("returns 50 for empty input", () => {
    expect(computeFusedReadingHeadline([])).toBe(50);
  });

  it("is bounded 0..100", () => {
    expect(computeFusedReadingHeadline(mkScores(Array(9).fill(100)))).toBeLessThanOrEqual(100);
    expect(computeFusedReadingHeadline(mkScores(Array(9).fill(0)))).toBeGreaterThanOrEqual(0);
  });

  it("monotonic — higher inputs produce higher (or equal) headline", () => {
    const lo = computeFusedReadingHeadline(mkScores([40, 40, 40, 40, 40, 40, 40, 40, 40]));
    const hi = computeFusedReadingHeadline(mkScores([60, 60, 60, 60, 60, 60, 60, 60, 60]));
    expect(hi).toBeGreaterThanOrEqual(lo);
  });

  it("single goal selects that row's finalScore", () => {
    const scores = mkScores([10, 90, 50, 50, 50, 50, 50, 50, 50]);
    expect(computeFusedReadingHeadline(scores, [1])).toBeGreaterThan(
      computeFusedReadingHeadline(scores, [0])
    );
  });

  it("3+ goals sorts desc and weights 50/30/20", () => {
    const scores = mkScores([90, 80, 70, 0, 0, 0, 0, 0, 0]);
    const fused = computeFusedReadingHeadline(scores, [0, 1, 2]);
    // raw = 0.5*90+0.3*80+0.2*70 = 83; stretched = 50 + 33*1.4 = 96.2 -> capped
    expect(fused).toBeGreaterThan(80);
    expect(fused).toBeLessThanOrEqual(100);
  });
});

describe("computeTransitModifiersAtAnchor", () => {
  it("returns zero vector for empty/invalid inputs", () => {
    const zero = Array(9).fill(0);
    expect(computeTransitModifiersAtAnchor([], null, [], new Map())).toEqual(zero);
    expect(computeTransitModifiersAtAnchor([], "2026-05-01T00:00:00Z", [], new Map())).toEqual(zero);
  });

  it("caps each row at ±MAX_TRANSIT_MODIFIER", () => {
    const houseMap = new Map<string, number>([["venus", 7], ["moon", 4], ["sun", 10]]);
    const hits = Array.from({ length: 30 }, (_, i) => ({
      transit_planet: "jupiter",
      natal_planet: ["venus", "moon", "sun"][i % 3],
      aspect: "trine",
      benefic: true,
      retrograde: false,
      orb: 0.1,
      date: "2026-05-12T00:00:00Z",
    })) as any;
    const out = computeTransitModifiersAtAnchor(hits, "2026-05-12T00:00:00Z", ["love"], houseMap);
    for (const v of out) {
      expect(Math.abs(v)).toBeLessThanOrEqual(MAX_TRANSIT_MODIFIER + 1e-9);
    }
  });

  it("ignores hits outside ±5d window", () => {
    const houseMap = new Map<string, number>([["venus", 7]]);
    const far = [{
      transit_planet: "jupiter", natal_planet: "venus", aspect: "trine",
      benefic: true, retrograde: false, orb: 0.1,
      date: "2026-06-01T00:00:00Z",
    }] as any;
    const out = computeTransitModifiersAtAnchor(far, "2026-05-01T00:00:00Z", [], houseMap);
    expect(out).toEqual(Array(9).fill(0));
  });
});

describe("finalizeEventScoresFromLayers", () => {
  it("produces 9 rows; finalScore is bounded", () => {
    const layers = { baseVolumes: Array(9).fill(40), affinityModifiers: Array(9).fill(10) };
    const out = finalizeEventScoresFromLayers(layers, null);
    expect(out).toHaveLength(9);
    for (const r of out) {
      expect(r.finalScore).toBeGreaterThanOrEqual(0);
      expect(r.finalScore).toBeLessThanOrEqual(100);
    }
  });

  it("transitModifier omitted when zero", () => {
    const layers = { baseVolumes: Array(9).fill(40), affinityModifiers: Array(9).fill(10) };
    const out = finalizeEventScoresFromLayers(layers, Array(9).fill(0));
    expect(out[0].transitModifier).toBeUndefined();
  });
});

describe("buildNatalPlanetRelocatedHouseMap / buildOccupancyPlanets", () => {
  it("maps natal planets to houses 1-12", () => {
    const cusps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    const planets = [
      { planet: "Sun", longitude: 15 },
      { planet: "Moon", longitude: 200 },
    ];
    const map = buildNatalPlanetRelocatedHouseMap(planets, cusps);
    expect(map.get("sun")).toBeGreaterThanOrEqual(1);
    expect(map.get("sun")).toBeLessThanOrEqual(12);
    expect(map.size).toBe(2);
  });

  it("buildOccupancyPlanets flags hasLine when ACG line ≤2000km", () => {
    const cusps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    const natal = [{ planet: "Venus", longitude: 100, dignity: "Domicile" }];
    const acg = [{ planet: "Venus", distance_km: 1500 }];
    const occ = buildOccupancyPlanets(natal, cusps, acg);
    expect(occ[0].hasLine).toBe(true);
    const occFar = buildOccupancyPlanets(natal, cusps, [{ planet: "Venus", distance_km: 5000 }]);
    expect(occFar[0].hasLine).toBe(false);
  });
});

describe("computePlaceAffinityLayers", () => {
  it("returns 9-vectors", () => {
    const matrix = {
      houses: Array.from({ length: 12 }, (_, i) => ({ house: i + 1, score: 50 })),
    } as any;
    const occ = [{ name: "venus", house: 5, dignityStatus: "Domicile", hasLine: false }];
    const layers = computePlaceAffinityLayers(matrix, occ);
    expect(layers.baseVolumes).toHaveLength(9);
    expect(layers.affinityModifiers).toHaveLength(9);
  });
});
