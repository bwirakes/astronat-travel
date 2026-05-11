import { describe, expect, it } from "bun:test";
import { deriveGoalScores, deriveScoreNarrative, READING_TABS, READING_TAB_IDS } from "@/app/lib/reading-tabs";

describe("reading tab score narrative", () => {
  it("keeps tab definitions as the shared source of tab IDs and labels", () => {
    expect(READING_TABS.map((tab) => tab.id)).toEqual([
      "overview",
      "life-themes",
      "place-field",
      "what-shifts",
      "timing",
    ]);
    expect(READING_TAB_IDS).toEqual(READING_TABS.map((tab) => tab.id));
    expect(READING_TABS.every((tab) => tab.label && tab.question)).toBe(true);
  });

  it("computes selected career score from event scores when available", () => {
    const goals = deriveGoalScores({
      goalIds: ["career"],
      macroScore: 42,
      eventScores: [
        { eventName: "Career & Public Recognition", finalScore: 87 },
      ],
    });

    expect(goals[0]).toMatchObject({
      goalId: "career",
      label: "Career",
      score: 87,
      eventName: "Career & Public Recognition",
    });
    expect(goals[0].outcome).toContain("visible work");
  });

  it("falls back to W_EVENTS house weighting for selected goals", () => {
    const goals = deriveGoalScores({
      goalIds: ["career"],
      houses: [
        { house: 2, score: 60 },
        { house: 6, score: 70 },
        { house: 10, score: 90 },
      ],
    });

    expect(goals[0].score).toBe(81);
  });

  it("separates overall and personal geodetic evidence", () => {
    const narrative = deriveScoreNarrative({
      destination: "Singapore",
      destinationLat: 1.3521,
      destinationLon: 103.8198,
      goalIds: ["relocation"],
      macroScore: 75,
      geodeticBand: { sign: "Cancer", longitudeRange: "90°E–120°E" },
      houses: [
        { house: 1, sphere: "Identity", score: 71, breakdown: { geodetic: 10, bucketGeodetic: 65 } },
        { house: 4, sphere: "Home", score: 82, breakdown: { geodetic: 0, bucketGeodetic: 50 } },
        { house: 7, sphere: "Partnership", score: 44, breakdown: { geodetic: -8, bucketGeodetic: 42 } },
        { house: 10, sphere: "Career", score: 68, breakdown: { geodetic: 0, bucketGeodetic: 50 } },
      ],
      natalPlanets: [],
    });

    expect(narrative.geodetic.overall).toEqual({ sign: "Cancer", longitudeRange: "90°E–120°E" });
    expect(narrative.geodetic.personal.map((entry) => entry.anchor)).toEqual(["ASC", "DSC"]);
    expect(narrative.strongestThemes[0].label).toBe("Home");
    expect(narrative.lessEmphasized[0].label).toBe("Partnership");
  });
});
