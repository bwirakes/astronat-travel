import { describe, it, expect } from "bun:test";
import { PLANET_DOMAINS, HOUSE_DOMAINS, getOrdinal } from "@/app/lib/astro-wording";

describe("astro-wording", () => {
  it('PLANET_DOMAINS["Sun"] === "YOUR IDENTITY AND WHERE YOU SHINE"', () => {
    expect(PLANET_DOMAINS["Sun"]).toBe("YOUR IDENTITY AND WHERE YOU SHINE");
  });

  it('HOUSE_DOMAINS[9] === "travel, education, publishing, religion, astrology, and philosophy"', () => {
    expect(HOUSE_DOMAINS[9]).toBe(
      "travel, education, publishing, religion, astrology, and philosophy"
    );
  });

  it('getOrdinal(1) === "1st"', () => {
    expect(getOrdinal(1)).toBe("1st");
  });

  it('getOrdinal(12) === "12th"', () => {
    expect(getOrdinal(12)).toBe("12th");
  });

  it('getOrdinal(22) === "22nd"', () => {
    expect(getOrdinal(22)).toBe("22nd");
  });

  it("All 17 planet domains are defined", () => {
    const planets = [
      "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter",
      "Saturn", "Uranus", "Neptune", "Pluto", "Chiron",
      "North Node", "South Node", "Ascendant", "MC", "DC", "IC",
    ];
    for (const p of planets) {
      expect(PLANET_DOMAINS[p]).toBeDefined();
    }
  });

  it("All 12 house domains are defined", () => {
    for (let i = 1; i <= 12; i++) {
      expect(HOUSE_DOMAINS[i]).toBeDefined();
    }
  });
});
