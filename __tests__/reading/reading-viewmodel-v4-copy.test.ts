import { describe, expect, it } from "bun:test";
import { hasV4TeacherReading, toV4ViewModel } from "@/app/lib/reading-viewmodel";
import { READING_TAB_IDS, type ReadingTabId } from "@/app/lib/reading-tabs";

function baseReading(teacherReading?: unknown) {
  return {
    destination: "Singapore, SG",
    destinationLat: 1.3521,
    destinationLon: 103.8198,
    travelDate: "2026-05-01",
    travelType: "trip",
    goalIds: ["career"],
    macroScore: 72,
    macroVerdict: "Solid",
    houses: [
      { house: 10, sphere: "Career", score: 88 },
      { house: 7, sphere: "Partnership", score: 52 },
      { house: 4, sphere: "Home", score: 46 },
    ],
    transitWindows: [
      {
        start: "2026-05-01",
        end: "2026-05-10",
        score: 76,
        note: "Selected dates keep the place usable.",
      },
      {
        start: "2026-05-16",
        end: "2026-05-24",
        score: 82,
        note: "Alternate dates add more lift.",
      },
    ],
    natalPlanets: [],
    planetaryLines: [],
    relocatedCusps: [],
    ...(teacherReading ? { teacherReading } : {}),
  };
}

const legacyTeacherReading = {
  summary: {
    headline: "Legacy read",
    theRead: "Legacy body.",
    leanInto: ["Legacy lean"],
    goEasy: ["Legacy easy"],
    whereYoullFeelIt: ["Legacy place"],
  },
  signals: {
    weather: [],
    moments: [],
    chart: [],
  },
  longRead: {
    thePlace: { title: "Place", content: "Legacy place." },
    yourTiming: { title: "Timing", content: "Legacy timing." },
    biggerPicture: { title: "Picture", content: "Legacy picture." },
    howYouChangeHere: { title: "Change", content: "Legacy change." },
    theCall: { title: "Call", content: "Legacy call." },
  },
};

function completeTeacherReading() {
  const tabs = READING_TAB_IDS.reduce((acc, id, index) => {
    acc[id] = {
      lead: `${id} lead`,
      plainEnglishSummary: `${id} summary`,
      guideRows: [
        { label: "Best Used For", body: `${id} best use.` },
        { label: "Move Carefully With", body: `${id} watch point.` },
        { label: "Your Next Move", body: `${id} next move.` },
      ],
      evidenceCaption: `${id} evidence`,
      ...(index < READING_TAB_IDS.length - 1 ? { nextTabBridge: `${id} bridge` } : {}),
    };
    return acc;
  }, {} as Record<ReadingTabId, {
    lead: string;
    plainEnglishSummary: string;
    guideRows: Array<{ label: "Best Used For" | "Move Carefully With" | "Your Next Move"; body: string }>;
    evidenceCaption: string;
    nextTabBridge?: string;
  }>);

  return {
    ...legacyTeacherReading,
    hero: { explainer: "Teacher hero explainer." },
    tabs,
    overview: {
      scoreExplanation: "Teacher score explanation.",
      goalExplanation: "Teacher goal explanation.",
      leanInto: ["Teacher lean into."],
      watchOut: ["Teacher watch out."],
    },
    timing: {
      activationAdvice: ["Teacher activation advice."],
      closingVerdict: "Teacher timing verdict.",
    },
  };
}

describe("V4 teacherReading completeness", () => {
  it("rejects legacy teacherReading and uses deterministic overview copy", () => {
    expect(hasV4TeacherReading(legacyTeacherReading)).toBe(false);

    const vm = toV4ViewModel(baseReading(legacyTeacherReading));

    expect(vm.copy.hasCompleteV4TeacherReading).toBe(false);
    expect(vm.copy.overviewSource).toBe("deterministic");
    expect(vm.tabs.copy).toEqual({});
    expect(vm.tabs.overview?.leanInto?.[0]).toContain("Career");
    expect(vm.tabs.overview?.leanInto?.[0]).toContain("house-score driver");
    expect(vm.tabs.overview?.leanInto?.[0]).toContain("88/100");
    expect(vm.tabs.overview?.leanInto?.[0]).not.toBe("Career is one of the clearest outcomes this place supports.");
  });

  it("rejects partial V4 teacherReading when required blocks are missing", () => {
    const partial = {
      ...legacyTeacherReading,
      hero: { explainer: "Partial hero." },
      overview: {
        leanInto: ["Partial lean."],
        watchOut: ["Partial watch."],
      },
    };

    expect(hasV4TeacherReading(partial)).toBe(false);

    const vm = toV4ViewModel(baseReading(partial));
    expect(vm.copy.hasCompleteV4TeacherReading).toBe(false);
    expect(vm.copy.overviewSource).toBe("deterministic");
    expect(vm.hero.explainer).not.toBe("Partial hero.");
    expect(vm.tabs.overview?.leanInto).not.toEqual(["Partial lean."]);
  });

  it("accepts complete V4 teacherReading and lets teacher overview and timing win", () => {
    const teacherReading = completeTeacherReading();

    expect(hasV4TeacherReading(teacherReading)).toBe(true);

    const vm = toV4ViewModel(baseReading(teacherReading));

    expect(vm.copy.hasCompleteV4TeacherReading).toBe(true);
    expect(vm.copy.overviewSource).toBe("teacher");
    expect(vm.copy.timingSource).toBe("teacher");
    expect(vm.hero.explainer).toBe("Teacher hero explainer.");
    expect(vm.tabs.overview?.leanInto).toEqual(["Teacher lean into."]);
    expect(vm.tabs.timing?.closingVerdict).toBe("Teacher timing verdict.");
    expect(Object.keys(vm.tabs.copy)).toEqual([...READING_TAB_IDS]);
  });

  it("accepts cached V4 tab copy written before guide rows existed", () => {
    const teacherReading = completeTeacherReading();
    for (const tab of Object.values(teacherReading.tabs)) {
      delete tab.guideRows;
    }

    expect(hasV4TeacherReading(teacherReading)).toBe(true);

    const vm = toV4ViewModel(baseReading(teacherReading));

    expect(vm.copy.hasCompleteV4TeacherReading).toBe(true);
    expect(vm.tabs.copy.overview?.lead).toBe("overview lead");
    expect(vm.tabs.copy.overview?.guideRows).toBeUndefined();
  });

  it("shortens what-shifts summary copy to three sentences while preserving the intro beats", () => {
    const teacherReading = completeTeacherReading();
    teacherReading.tabs["what-shifts"].plainEnglishSummary = [
      "Capricorn rises here, with Saturn running the chart instead of natal Taurus's Venus.",
      "People read you as more contained and deliberate in the first thirty seconds.",
      "Work is the concrete domain at stake, especially how quickly you accept responsibility.",
      "For your career goal, this helps if you want authority and strains you if you wanted ease.",
      "Watch how your shoulders feel on arrival day.",
      "The payoff is real, but only if you pace yourself.",
    ].join(" ");

    const vm = toV4ViewModel(baseReading(teacherReading));
    const summary = vm.tabs.copy["what-shifts"]?.plainEnglishSummary ?? "";

    expect(summary).toContain("Capricorn rises here");
    expect(summary).toContain("Work is the concrete domain");
    expect(summary).not.toContain("For your career goal");
    expect((summary.match(/[.!?](?=\s|$)/g) ?? []).length).toBe(3);
  });

  it("writes planet-house fallback shifts as practical consequences, not generic movement labels", () => {
    const vm = toV4ViewModel({
      ...baseReading(),
      natalPlanets: [
        { name: "Mars", longitude: 330, house: 12 },
      ],
      relocatedCusps: [300, 330, 0, 30, 60, 90, 120, 150, 180, 210, 240, 270],
      natalCusps: Array.from({ length: 12 }, (_, i) => i * 30),
      natalAngles: { ASC: 0, IC: 90, DSC: 180, MC: 270 },
    });

    const mars = vm.relocated.planetsInHouses.find((p) => p.planet === "Mars");

    expect(mars?.shift).toContain("Your Mars placement shifts from the 12th house");
    expect(mars?.shift).toContain("private recovery, hidden pressure");
    expect(mars?.shift).toContain("2nd house");
    expect(mars?.shift).toContain("earning");
    expect(mars?.shift).not.toContain("moves from private recovery into money & resources here");
  });

  it("exposes structured relocated angle fields for stable UI matching", () => {
    const vm = toV4ViewModel({
      ...baseReading(),
      natalAngles: { ASC: 30, IC: 120, DSC: 210, MC: 300 },
      relocatedCusps: [60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 0, 30],
    });

    expect(vm.relocated.angles.map((angle) => angle.k)).toEqual(["ASC", "IC", "DSC", "MC"]);
    expect(vm.relocated.angles.find((angle) => angle.k === "ASC")?.natal).toBe("0° Taurus");
    expect(vm.relocated.angles.find((angle) => angle.k === "ASC")?.relocated).toBe("0° Gemini");
    expect(vm.relocated.angles.find((angle) => angle.k === "ASC")?.signChanged).toBe(true);
  });

  it("exposes numeric planet-house fields so compact grouping does not parse labels", () => {
    const vm = toV4ViewModel({
      ...baseReading(),
      natalPlanets: [
        { name: "Sun", longitude: 10, house: 1 },
        { name: "Venus", longitude: 190, house: 7 },
      ],
      relocatedCusps: [180, 210, 240, 270, 300, 330, 0, 30, 60, 90, 120, 150],
      natalCusps: Array.from({ length: 12 }, (_, i) => i * 30),
      natalAngles: { ASC: 0, IC: 90, DSC: 180, MC: 270 },
    });

    const sun = vm.relocated.planetsInHouses.find((row) => row.planet === "Sun");
    const venus = vm.relocated.planetsInHouses.find((row) => row.planet === "Venus");

    expect(sun?.natalHouseNum).toBe(1);
    expect(sun?.reloHouseNum).toBe(7);
    expect(sun?.changed).toBe(true);
    expect(venus?.natalHouseNum).toBe(7);
    expect(venus?.reloHouseNum).toBe(1);
    expect(venus?.changed).toBe(true);
  });

  it("normalizes stale teacher headline-score mentions to the hero score", () => {
    const teacherReading = completeTeacherReading();
    teacherReading.overview.scoreExplanation = "This trip carries a score of 73 because it has potential.";
    teacherReading.tabs.overview.lead = "This trip has a score of 71, okay, so keep it focused.";

    const vm = toV4ViewModel({
      ...baseReading(teacherReading),
      heroWindowScore: 81,
    });

    expect(vm.hero.bestWindow.score).toBe(81);
    expect(vm.tabs.overview?.scoreExplanation).toContain("score of 81");
    expect(vm.tabs.overview?.scoreExplanation).not.toContain("73");
    expect(vm.tabs.copy.overview?.lead).toContain("score of 81");
    expect(vm.tabs.copy.overview?.lead).not.toContain("71");
  });

  it("frames fallback overview around the user's goals instead of internal scoring terms", () => {
    const vm = toV4ViewModel({
      ...baseReading(legacyTeacherReading),
      destination: "Istanbul, Fatih, Istanbul, Turkey",
      goalIds: ["love", "timing"],
      macroScore: 57,
      eventScores: [
        { eventName: "Identity & Self-Discovery", finalScore: 58 },
        { eventName: "Wealth & Financial Growth", finalScore: 72 },
        { eventName: "Home, Family & Roots", finalScore: 60 },
        { eventName: "Romance & Love", finalScore: 40 },
        { eventName: "Health, Routine & Wellness", finalScore: 38 },
        { eventName: "Creativity & Pleasure", finalScore: 50 },
        { eventName: "Career & Public Recognition", finalScore: 29 },
        { eventName: "Networks & Community", finalScore: 45 },
        { eventName: "Travel & Expansion", finalScore: 55 },
      ],
      transitWindows: [
        {
          start: "2026-08-10",
          end: "2026-08-20",
          score: 55,
          note: "Selected dates are workable but mixed.",
        },
      ],
    });

    expect(vm.tabs.overview?.scoreExplanation).toContain("You asked whether Istanbul works for Love and Timing.");
    expect(vm.tabs.overview?.scoreExplanation).toContain("Your dates land at 55/100");
    expect(vm.tabs.overview?.scoreExplanation).toContain("Love is a stretch at 40/100");
    expect(vm.tabs.overview?.scoreExplanation).not.toContain("being scored as a place baseline");
    expect(vm.tabs.overview?.scoreExplanation).not.toContain("engine");
    expect(vm.tabs.overview?.watchOut?.[0]).toContain("Romance & Love");
    expect(vm.tabs.overview?.watchOut?.[0]).toContain("40/100");
  });
});
