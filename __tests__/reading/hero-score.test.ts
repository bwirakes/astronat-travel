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
