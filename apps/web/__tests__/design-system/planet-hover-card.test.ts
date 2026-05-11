import { describe, it, expect } from "bun:test";
import {
  PLANET_DOMAINS,
  HOUSE_DOMAINS,
  getOrdinal,
  buildPlacementImplicationSentence,
  resolvePlacementImplication,
} from "@/app/lib/astro-wording";

// PlanetHoverCard contract tests
// (UI rendering tests require @testing-library/react — spec documented here)

describe("planet-hover-card — content contract", () => {
  // These tests verify the wording logic the component depends on

  it("PLANET_DOMAINS contains wording for all planets in the hover card", () => {
    const planetsUsedInHoverCard = [
      "Sun", "Moon", "Mercury", "Venus", "Mars",
      "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
      "Chiron", "North Node", "South Node", "Ascendant", "MC",
    ];
    for (const p of planetsUsedInHoverCard) {
      expect(PLANET_DOMAINS[p]).toBeDefined();
      expect(PLANET_DOMAINS[p].length).toBeGreaterThan(0);
    }
  });

  it("getOrdinal produces correct ordinal for house numbers 1–12", () => {
    const expected: Record<number, string> = {
      1: "1st", 2: "2nd", 3: "3rd", 4: "4th",
      5: "5th", 6: "6th", 7: "7th", 8: "8th",
      9: "9th", 10: "10th", 11: "11th", 12: "12th",
    };
    for (const [n, suffix] of Object.entries(expected)) {
      expect(getOrdinal(Number(n))).toBe(suffix);
    }
  });

  it("HOUSE_DOMAINS[house] is defined for all 12 houses used in body sentence", () => {
    for (let i = 1; i <= 12; i++) {
      const domain = HOUSE_DOMAINS[i];
      expect(domain).toBeDefined();
      expect(domain.length).toBeGreaterThan(0);
    }
  });

  it("fallback implication sentence names planet, sign, house, and expression", () => {
    const planet = "Jupiter";
    const sign = "Sagittarius";
    const house = 9;
    const sentence = buildPlacementImplicationSentence({ planet, sign, house });

    expect(sentence).toBe(
      "With your natal Jupiter in Sagittarius in your 9th house of beliefs and big adventures, your growth instinct is expressed through belief, range, and truth-seeking in that area of life."
    );
  });

  it("resolvePlacementImplication uses API string when provided", () => {
    const custom = "Custom placement copy from stream.";
    expect(
      resolvePlacementImplication({
        planet: "Sun",
        sign: "Leo",
        house: 5,
        implication: custom,
      })
    ).toBe(custom);
  });

  it("resolvePlacementImplication falls back like buildPlacementImplicationSentence when implication absent", () => {
    const planet = "Jupiter";
    const sign = "Sagittarius";
    const house = 9;
    expect(resolvePlacementImplication({ planet, sign, house })).toBe(
      buildPlacementImplicationSentence({ planet, sign, house })
    );
  });
});

// ── UI rendering contract (requires @testing-library/react) ──
// The following are documented specs for when the testing library is installed:
//
// ✓ Renders trigger with cursor: zoom-in and 1px dashed {planetColor} bottom border
// ✓ On hover open: displays PLANET_DOMAINS[planet] wording
// ✓ On hover open: displays implication copy naming natal planet, sign, house, and expression
// ✓ context="relocated" shows rulerCondition in position subtitle
// ✓ Content panel has NO box-shadow style (brand rule)
// ✓ Content width is 300px
// ✓ Planet title uses var(--font-primary) at 1.2rem uppercase
