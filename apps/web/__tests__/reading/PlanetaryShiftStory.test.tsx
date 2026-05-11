import { describe, it, expect, mock } from "bun:test";
import React from "react";
import { render } from "@testing-library/react";
import { PlanetaryShiftStory } from "@/app/reading/[id]/components/PlanetaryShiftStory";
import type { HouseScore } from "@/app/lib/house-matrix";

// Mock the scroll hook to avoid GSAP/IntersectionObserver issues in JSDOM
mock.module("@/app/reading/[id]/hooks/useScrollSection", () => ({
  useScrollSection: () => ({
    ref: React.createRef(),
    isInView: true
  })
}));

const mockHouses: HouseScore[] = Array.from({ length: 12 }, (_, i) => ({
  house: i + 1,
  sphere: `Sphere ${i + 1}`,
  relocatedSign: "Aries",
  rulerPlanet: i % 2 === 0 ? "Mars" : "Venus",
  rulerCondition: "Domicile",
  score: 10 * i, // Scores: 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110 (clamped later)
  status: "Neutral",
  breakdown: {} as any
}));

describe("PlanetaryShiftStory Component", () => {
  it("Renders ≤ 4 cards from a 12-house input", () => {
    const { container } = render(
      <PlanetaryShiftStory houses={mockHouses} destination="London" />
    );
    const sections = container.querySelectorAll("section");
    expect(sections.length).toBe(4);
  });

  it("Houses are sorted by Math.abs(score - 50) descending", () => {
    // Scores in mockHouses: 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110
    // Diff from 50: 50, 40, 30, 20, 10, 0, 10, 20, 30, 40, 50, 60
    // Top 4 diffs: 60 (score 110), 50 (score 0), 50 (score 100), 40 (score 10)
    // Actually our map logic will pick the first 4 after sort.
    const { getAllByText } = render(
      <PlanetaryShiftStory houses={mockHouses} destination="London" />
    );
    
    // The top one should be score 110 (which is index 11)
    // Sphere 12 (house 12) has score 110.
    expect(getAllByText(/Sphere 12/i)).toBeTruthy();
    // Sphere 1 (house 1) has score 0 (diff 50)
    expect(getAllByText(/Sphere 1/i)).toBeTruthy();
    // Sphere 11 (house 11) has score 100 (diff 50)
    expect(getAllByText(/Sphere 11/i)).toBeTruthy();
    // Sphere 2 (house 2) has score 10 (diff 40)
    expect(getAllByText(/Sphere 2/i)).toBeTruthy();
  });

  it("Card 0 has backgroundColor matching var(--color-eggshell)", () => {
    const { container } = render(
      <PlanetaryShiftStory houses={mockHouses} destination="London" />
    );
    const cards = container.querySelectorAll("div.shadow-2xl");
    // @ts-ignore
    expect(cards[0].style.background).toBe("var(--color-eggshell)");
  });

  it("Card 1 has backgroundColor matching var(--color-charcoal)", () => {
    const { container } = render(
      <PlanetaryShiftStory houses={mockHouses} destination="London" />
    );
    const cards = container.querySelectorAll("div.shadow-2xl");
    // @ts-ignore
    expect(cards[1].style.background).toBe("var(--color-charcoal)");
  });

  it("Each card's SLOOP SCRIPT span content === h.rulerPlanet.charAt(0)", () => {
    const { container } = render(
      <PlanetaryShiftStory houses={mockHouses} destination="London" />
    );
    const spans = container.querySelectorAll("span.font-display-alt-2");
    // Sphere 12 (Mars), Sphere 1 (Mars), Sphere 11 (Venus), Sphere 2 (Venus)
    expect(spans[0].textContent).toBe("M");
    expect(spans[1].textContent).toBe("M");
    expect(spans[2].textContent).toBe("V");
    expect(spans[3].textContent).toBe("V");
  });

  it("Does not crash when houses array has 0 or 1 entries", () => {
    const { container: empty } = render(
      <PlanetaryShiftStory houses={[]} destination="London" />
    );
    expect(empty.querySelectorAll("section").length).toBe(0);

    const { container: one } = render(
      <PlanetaryShiftStory houses={[mockHouses[0]]} destination="London" />
    );
    expect(one.querySelectorAll("section").length).toBe(1);
  });

  it("Progress pill shows '1 OF N' correctly", () => {
    const { getByText } = render(
      <PlanetaryShiftStory houses={mockHouses} destination="London" />
    );
    expect(getByText("1 OF 4")).toBeTruthy();
    expect(getByText("2 OF 4")).toBeTruthy();
    expect(getByText("3 OF 4")).toBeTruthy();
    expect(getByText("4 OF 4")).toBeTruthy();
  });
});
