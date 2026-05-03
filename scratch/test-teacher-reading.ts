#!/usr/bin/env bun
/**
 * Calls writeTeacherReading() directly with a minimal but type-correct
 * TeacherReadingInput. Goal: verify the AI call + Zod schema parse work
 * end-to-end, independent of the chart-computation pipeline.
 *
 * Run: bun run scratch/test-teacher-reading.ts
 */
import "dotenv/config";
import { writeTeacherReading } from "@/lib/ai/prompts/teacher-reading";
import type { TeacherReadingInput } from "@/lib/readings/ai-input-builder";

const aiInput: TeacherReadingInput = {
  macro: {
    destination: "Tokyo, Japan",
    dateRange: { start: "2026-08-12", end: "2026-08-19" },
    overallScore: 72,
    travelType: "trip",
    goalIds: ["career"],
    scoreBreakdown: { place: 35, timing: 22, sky: 15 },
  },
  editorialEvidence: {
    tabs: [
      { id: "overview", label: "Overview", question: "Why this place, for you?", order: 1 },
      { id: "life-themes", label: "Life Themes", question: "Where life gets louder?", order: 2 },
      { id: "place-field", label: "Place Field", question: "How do I fit in?", order: 3 },
      { id: "what-shifts", label: "What Shifts", question: "How am I perceived here?", order: 4 },
      { id: "timing", label: "Timing", question: "When to go?", order: 5 },
    ] as any,
    selectedGoals: [{ id: "career", label: "Career growth" }],
    pageThesis: {
      destination: "Tokyo, Japan",
      primaryGoalLabel: "Career growth",
      overallScore: 72,
      verdict: "solid",
      topHumanTheme: "Career & Public Image",
      cautionHumanTheme: "Personal Foundations",
    },
    scoreDrivers: {
      themes: [
        { themeId: "career", label: "Career & Public Image", score: 78 } as any,
        { themeId: "growth", label: "Travel & Learning", score: 65 } as any,
        { themeId: "home", label: "Home & Roots", score: 42 } as any,
      ],
      strongestThemes: [
        { themeId: "career", label: "Career & Public Image", score: 78 } as any,
      ],
      lessEmphasized: [
        { themeId: "home", label: "Home & Roots", score: 42 } as any,
      ],
      leanIntoEvidence: [
        { kind: "line", planet: "Jupiter", angle: "MC", distanceKm: 124 } as any,
      ],
      watchOutEvidence: [
        { kind: "transit", aspect: "Saturn square Sun", dateRange: "Aug 14 — Aug 18" } as any,
      ],
    },
    placeDrivers: {
      overallGeodetic: { sign: "Capricorn", longitudeRange: "120°E–150°E" } as any,
      personalGeodetic: [],
      acgLines: [
        { planet: "Jupiter", angle: "MC", distanceKm: 124, contribution: 0.6 } as any,
      ],
    },
    shiftDrivers: {
      relocatedAngles: [
        { angle: "ASC", natalSign: "Pisces", relocatedSign: "Cancer" } as any,
      ],
      relocatedHouses: [],
      aspectsToAngles: [],
    },
    timingDrivers: {
      windows: [
        { dates: "Aug 12 — Aug 14", score: 75, nights: "2" } as any,
      ],
      transits: [
        { aspect: "Jupiter trine Sun", dateRange: "Aug 13 — Aug 15", tone: "supportive" } as any,
      ],
    },
  } as any,
  sidebarsData: {
    natalSpotlight: [
      { planet: "Sun", sign: "Pisces", role: "core identity" },
      { planet: "Moon", sign: "Libra", role: "emotional baseline" },
    ],
    topTransits: Array.from({ length: 10 }, (_, i) => ({
      aspect: ["Jupiter trine Sun", "Saturn square Mars", "Venus conjunction Moon", "Mars sextile Mercury", "Pluto trine Venus", "Neptune square Sun", "Uranus opposition Saturn", "Mercury trine Jupiter", "Sun conjunction Pluto", "Moon trine Saturn"][i],
      dateRange: `Aug ${10 + i} — Aug ${12 + i}`,
      tone: (i % 2 === 0 ? "supportive" : "challenging") as any,
      houseTopics: ["career", "love", "growth"].slice(0, (i % 3) + 1),
      aspectKey: `aug-aspect-${i}`,
    })),
    nearbyLines: Array.from({ length: 6 }, (_, i) => ({
      planet: ["Jupiter", "Venus", "Saturn", "Mars", "Pluto", "Uranus"][i],
      angle: ["MC", "ASC", "DSC", "IC", "MC", "ASC"][i],
      distanceKm: 120 + i * 50,
      contribution: 0.6 - i * 0.08,
    })),
    activeHouses: Array.from({ length: 5 }, (_, i) => ({
      topic: ["career", "love", "home", "money", "growth"][i],
      vibe: ["amplified", "tested", "softened", "energised", "magnetised"][i],
    })),
    angleShifts: [
      { angle: "ASC", natalSign: "Pisces", relocatedSign: "Cancer" },
      { angle: "MC", natalSign: "Sagittarius", relocatedSign: "Aries" },
      { angle: "IC", natalSign: "Gemini", relocatedSign: "Libra" },
    ] as any,
    planetHouseShifts: Array.from({ length: 8 }, (_, i) => ({
      planet: ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Pluto"][i],
      natalHouse: ((i + 1) % 12) + 1,
      relocatedHouse: ((i + 4) % 12) + 1,
    })),
    aspectsToAngles: Array.from({ length: 4 }, (_, i) => ({
      planet: ["Jupiter", "Saturn", "Venus", "Mars"][i],
      angle: ["MC", "ASC", "DSC", "IC"][i] as any,
      aspect: ["trine", "square", "conjunction", "sextile"][i],
      orb: 1 + i * 0.5,
    })),
    personalGeodetic: Array.from({ length: 3 }, (_, i) => ({
      planet: ["Pluto", "Saturn", "Jupiter"][i],
      angle: ["ASC", "MC", "DSC"][i],
      angleTopic: ["self-image", "career path", "partnerships"][i],
      closeness: ["close", "medium", "distant"][i],
      family: ["transformation", "structure", "expansion"][i],
    })),
  },
};

console.log("aiInput JSON size:", JSON.stringify(aiInput).length, "chars");

console.log("Calling writeTeacherReading...");
const t0 = Date.now();
try {
  const result = await writeTeacherReading(aiInput);
  console.log(`✓ AI call + schema parse succeeded in ${Date.now() - t0}ms`);
  console.log("\n--- tabs keys:", Object.keys(result.tabs ?? {}));
  console.log("--- overview present:", !!result.overview);
  console.log("--- timing present:", !!result.timing);
  console.log("--- summary (legacy) present:", !!(result as any).summary);
  console.log("\n--- overview.scoreExplanation:");
  console.log((result.overview as any)?.scoreExplanation ?? "(missing)");
  console.log("\n--- tabs.overview.lead:");
  console.log((result.tabs as any)?.overview?.lead ?? "(missing)");
} catch (err: any) {
  console.error(`✗ Failed in ${Date.now() - t0}ms:`, err?.message);
  if (err?.cause?.issues) {
    console.error("Zod issues:", JSON.stringify(err.cause.issues, null, 2));
  }
  if (err?.text) {
    console.error("Raw text (first 3000 chars):", err.text.slice(0, 3000));
  }
}
