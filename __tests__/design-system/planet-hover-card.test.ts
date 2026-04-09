import { describe, it, expect } from "bun:test";
import { PLANET_DOMAINS, HOUSE_DOMAINS, getOrdinal } from "@/app/lib/astro-wording";

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

  it("Body sentence for Jupiter in Sagittarius in 9th house is correct", () => {
    const planet = "Jupiter";
    const sign = "Sagittarius";
    const house = 9;
    const sentence = `${planet} in ${sign} in the ${getOrdinal(house)} House of ${HOUSE_DOMAINS[house]}.`;
    expect(sentence).toBe(
      "Jupiter in Sagittarius in the 9th House of travel, education, publishing, religion, astrology, and philosophy."
    );
  });
});

// ── UI rendering contract (requires @testing-library/react) ──
// The following are documented specs for when the testing library is installed:
//
// ✓ Renders trigger with cursor: zoom-in and 1px dashed {planetColor} bottom border
// ✓ On hover open: displays PLANET_DOMAINS[planet] wording
// ✓ On hover open: displays "{planet} in {sign} in the Nth House of {domain}." sentence
// ✓ context="relocated" shows rulerCondition in position subtitle
// ✓ Content panel has NO box-shadow style (brand rule)
// ✓ Content width is 300px
// ✓ Planet title uses var(--font-primary) at 1.2rem uppercase
