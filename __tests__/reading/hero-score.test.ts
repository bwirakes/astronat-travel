import { describe, expect, it } from "bun:test";
import { computeHeroScore } from "@/app/lib/hero-score";

describe("computeHeroScore", () => {
  it("returns macroScore with macro-fallback when details is null", () => {
    expect(computeHeroScore(null, "2026-05-01T00:00:00Z")).toEqual({
      score: 50,
      source: "macro-fallback",
    });
  });

  it("returns macroScore with macro-fallback when no usable inputs are present", () => {
    const result = computeHeroScore({ macroScore: 72 }, null);
    expect(result).toEqual({ score: 72, source: "macro-fallback" });
  });

  it("returns macroScore with relocation source for relocation readings", () => {
    const result = computeHeroScore(
      { macroScore: 80, travelType: "relocation", transitWindows: [{ transit_planet: "venus" }] },
      "2026-05-01T00:00:00Z",
    );
    expect(result).toEqual({ score: 80, source: "relocation" });
  });

  it("prefers weather-forecast window score when present", () => {
    const details = {
      macroScore: 58,
      travelType: "trip",
      weatherForecast: {
        interpretation: {
          travelWindows: [
            { score: 49, startDate: "2026-05-12", endDate: "2026-05-19" },
            { score: 41, startDate: "2026-05-26", endDate: "2026-06-02" },
          ],
        },
      },
    };
    expect(computeHeroScore(details, "2026-05-12T00:00:00Z")).toEqual({
      score: 49,
      source: "weather-window",
    });
  });

  it("falls back to macroScore when weatherForecast windows have no numeric score", () => {
    const details = {
      macroScore: 58,
      travelType: "trip",
      weatherForecast: { interpretation: { travelWindows: [{ note: "meh" }] } },
    };
    expect(computeHeroScore(details, "2026-05-12T00:00:00Z")).toEqual({
      score: 58,
      source: "macro-fallback",
    });
  });

  it("derives transit-window score when transitWindows are hit-shape and travelDate is present", () => {
    const details = {
      macroScore: 58,
      travelType: "trip",
      goalIds: ["love"],
      // Two beneficial Venus transits clustered tight on the travel date
      // should pull the score above macroScore.
      transitWindows: [
        {
          transit_planet: "venus",
          natal_planet: "venus",
          aspect: "trine",
          benefic: true,
          retrograde: false,
          orb: 0.2,
          date: "2026-05-12T00:00:00Z",
        },
        {
          transit_planet: "jupiter",
          natal_planet: "moon",
          aspect: "sextile",
          benefic: true,
          retrograde: false,
          orb: 0.5,
          date: "2026-05-13T00:00:00Z",
        },
      ],
    };
    const result = computeHeroScore(details, "2026-05-12T00:00:00Z");
    expect(result.source).toBe("transit-window");
    expect(result.score).toBeGreaterThan(58);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("falls back to macroScore when transitWindows are not hit-shape", () => {
    const details = {
      macroScore: 60,
      travelType: "trip",
      transitWindows: [{ start: "2026-05-01", end: "2026-05-08", note: "mock" }],
    };
    expect(computeHeroScore(details, "2026-05-01T00:00:00Z")).toEqual({
      score: 60,
      source: "macro-fallback",
    });
  });

  it("uses fused scoring engine when full chart payload is present", () => {
    const houses = Array.from({ length: 12 }, (_, i) => ({ house: i + 1, score: 60 }));
    const natalPlanets = [
      { planet: "Sun", longitude: 100 },
      { planet: "Moon", longitude: 200 },
      { planet: "Venus", longitude: 110 },
      { planet: "Mars", longitude: 250 },
      { planet: "Jupiter", longitude: 50 },
      { planet: "Mercury", longitude: 80 },
      { planet: "Saturn", longitude: 300 },
    ];
    const relocatedCusps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    const planetaryLines = [{ planet: "Venus", distance_km: 1500 }];
    const details = {
      macroScore: 58,
      matrixMacroScore: 58,
      travelType: "trip",
      goalIds: ["love"],
      houses,
      natalPlanets,
      relocatedCusps,
      planetaryLines,
      transitWindows: [
        {
          transit_planet: "venus", natal_planet: "venus", aspect: "trine",
          benefic: true, retrograde: false, orb: 0.2,
          date: "2026-05-12T00:00:00Z",
        },
        {
          transit_planet: "jupiter", natal_planet: "moon", aspect: "sextile",
          benefic: true, retrograde: false, orb: 0.5,
          date: "2026-05-13T00:00:00Z",
        },
      ],
    };
    const result = computeHeroScore(details, "2026-05-12T00:00:00Z");
    expect(result.source).toBe("transit-window");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("rounds non-integer scores", () => {
    const details = {
      macroScore: 58.7,
      travelType: "trip",
      weatherForecast: {
        interpretation: { travelWindows: [{ score: 49.4 }] },
      },
    };
    expect(computeHeroScore(details, "2026-05-12T00:00:00Z").score).toBe(49);
  });
});
