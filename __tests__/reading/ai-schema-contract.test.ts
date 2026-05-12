import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { CouplesReadingSchema, TeacherReadingSchema } from "@/lib/ai/schemas";
import { buildRiskSummary, travelRiskForEvent } from "@/lib/readings/ai-input-builder";
import { couplesRiskForEvent } from "@/lib/readings/ai-couples-input-builder";

const teacherTabs = {
  overview: {
    lead: "This is the main verdict, with the score translated into a practical travel decision.",
    plainEnglishSummary: "The place is useful, but the reason matters more than the number.",
    evidenceCaption: "Score, goal match, and timing evidence are read together.",
  },
  "life-themes": {
    lead: "The strongest life themes are named in plain English before any astrology jargon.",
    plainEnglishSummary: "This section tells the reader which parts of life the place supports.",
    evidenceCaption: "Goal-stratified event scores and house themes anchor the claim.",
  },
  "place-field": {
    lead: "The location has its own field, separate from the reader's personal chart.",
    plainEnglishSummary: "This is what the destination asks of most visitors.",
    evidenceCaption: "Geodetic and paran evidence explain the local weather of the place.",
  },
  "what-shifts": {
    lead: "The relocated chart explains what changes in the reader's lived experience.",
    plainEnglishSummary: "This section answers how the place changes their daily posture.",
    evidenceCaption: "Rising sign, ruler, houses, and line contacts carry the explanation.",
  },
  timing: {
    lead: "Timing turns the destination score into a go, wait, or redesign decision.",
    plainEnglishSummary: "The calendar matters because a good place can still have rough windows.",
    evidenceCaption: "Monthly scoring and transit pressure explain the recommendation.",
  },
};

describe("AI reading schema contracts", () => {
  it("keeps what-shifts intro shorter than the other tab summaries in the teacher prompt", () => {
    const prompt = readFileSync("lib/ai/prompts/teacher-reading.ts", "utf8");

    expect(prompt).toContain('tabs["what-shifts"].plainEnglishSummary');
    expect(prompt).toContain("which must be exactly 4 concise sentences");
    expect(prompt).toContain('Do not add a fifth sentence');
  });

  it("accepts the current teacher reading contract required by the V4 tabs", () => {
    const parsed = TeacherReadingSchema.safeParse({
      tabs: teacherTabs,
      overview: {
        scoreExplanation: "A score in the seventies is supportive, but not automatic.",
        goalExplanation: "For a career trip, the destination is good when visibility has a concrete use.",
        leanInto: [
          "Use this place for visible work, targeted meetings, and practical momentum rather than vague exploration.",
        ],
        watchOut: [
          "Do not make the trip carry every goal at once; weaker domains still need pacing and boundaries.",
        ],
      },
      timing: {
        activationAdvice: [
          "Arrive during the stronger window and keep the first two days simple.",
        ],
        closingVerdict: "Good travel if the goal is focused; mixed if the trip needs to do everything.",
      },
      chartRulerReframe: {
        relocatedRising: "Libra",
        ruler: "Venus",
        fromHouse: 2,
        toHouse: 10,
        headline: "Your charm becomes more public here",
        body: "The place moves Venus from private values into visible contribution, so the opportunity is real when you show the work.",
      },
    });

    expect(parsed.success).toBe(true);
  });

  it("keeps deterministic so-what fields outside the teacher structured-output schema", () => {
    const parsed = TeacherReadingSchema.parse({
      tabs: teacherTabs,
      overview: {
        scoreExplanation: "A score below forty is a redesign signal, not a romantic mystery.",
        goalExplanation: "For health travel, this is a harder destination unless the itinerary is quiet.",
        leanInto: [
          "Use the place carefully, with fewer obligations and a clearer reason than ordinary vacation mode.",
        ],
        watchOut: [
          "Sleep, recovery, and daily rhythm need protection because the weak score has practical consequences.",
        ],
      },
      timing: {
        activationAdvice: ["Build rest into arrival day before any demanding social plan."],
        closingVerdict: "Not ideal for restorative travel unless the trip is deliberately simplified.",
      },
      chartRulerReframe: {
        relocatedRising: "Cancer",
        ruler: "Moon",
        fromHouse: 6,
        toHouse: 12,
        headline: "Your body asks for quieter pacing",
        body: "The relocated chart makes recovery less optional, so the trip works only when rest is part of the plan.",
      },
      soWhat: {
        verdict: "This is difficult health travel.",
        beginner: "The score is low, so make the trip quieter.",
        experienced: "The score pressure concentrates in routine and recovery.",
      },
    });

    expect("soWhat" in parsed).toBe(false);
  });

  it("requires the fixed couples takeaway trio", () => {
    const baseCouples = {
      theRead: {
        lead: "The city works when the couple treats it as a focused trip, not a blank slate.",
      },
      goalScores: {
        eventNotes: [
          {
            event: "Romance & Love",
            note: "Good chemistry is present, but it needs simple plans to land well.",
          },
        ],
      },
      timings: {
        rationale: "The best windows cluster before the pressure transits tighten.",
        bestWindowNotes: [{ windowDate: "2026-06-01", note: "Best for ease and shared pace." }],
        avoidWindowNotes: [{ windowDate: "2026-08-01", note: "More likely to expose fatigue." }],
      },
      deepDive: {
        youLead: "You get the cleaner public signal from the destination.",
        partnerLead: "Your partner gets more private pressure and needs downtime.",
        synastryLead: "The relationship improves when the itinerary gives both rhythms room.",
        aspectMeanings: [{ aspectKey: "June-0-Venus-Moon", meaning: "Softens affection." }],
      },
      geodetic: {
        summary: "The place field is social, but not equally restful for both people.",
      },
    };

    expect(CouplesReadingSchema.safeParse({
      ...baseCouples,
      takeaways: [
        "Choose the city for focused connection, not nonstop novelty.",
        "Keep the best window simple and protect sleep.",
        "The relationship score improves when one partner is not forced to match the other's pace.",
      ],
    }).success).toBe(true);

    expect(CouplesReadingSchema.safeParse({
      ...baseCouples,
      takeaways: ["One useful point.", "A second useful point."],
    }).success).toBe(false);
  });
});

describe("deterministic score-to-risk helpers", () => {
  it("sorts weak teacher events by score and attaches practical travel risks", () => {
    const risks = buildRiskSummary([
      { eventName: "Career & Public Recognition", finalScore: 62 },
      { eventName: "Health, Routine & Wellness", finalScore: 31.4 },
      { eventName: "Wealth & Financial Growth", finalScore: 42.8 },
      { eventName: "Romance & Love", finalScore: 18.2 },
      { eventName: "Friendship & Networks", finalScore: 44.2 },
      { eventName: "Home, Family & Roots", finalScore: 39.7 },
      { eventName: "Spirituality & Inner Growth", finalScore: 23.9 },
    ]);

    expect(risks.map((risk) => risk.event)).toEqual([
      "Romance & Love",
      "Spirituality & Inner Growth",
      "Health, Routine & Wellness",
      "Home, Family & Roots",
      "Wealth & Financial Growth",
    ]);
    expect(risks[0]).toMatchObject({
      score: 18,
      travelRisk: expect.stringContaining("romance"),
    });
    expect(risks.every((risk) => risk.mitigation.length > 20)).toBe(true);
  });

  it("maps health and partnership scores to different solo versus couples so-what language", () => {
    expect(travelRiskForEvent("Health, Routine & Wellness")).toMatchObject({
      travelRisk: expect.stringContaining("sleep"),
      mitigation: expect.stringContaining("itinerary"),
    });
    expect(couplesRiskForEvent("Partnerships & Marriage")).toMatchObject({
      travelRisk: expect.stringContaining("decision rights"),
      mitigation: expect.stringContaining("veto power"),
    });
  });
});
