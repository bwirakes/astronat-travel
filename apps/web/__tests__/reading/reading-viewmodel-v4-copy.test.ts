import { describe, expect, it } from "bun:test";
import { hasV4TeacherReading, toV4ViewModel } from "@/app/lib/reading-viewmodel";
import { READING_TAB_IDS, type ReadingTabId } from "@/app/lib/reading-tabs";

function baseReading(teacherReading?: any) {
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
      evidenceCaption: `${id} evidence`,
      ...(index < READING_TAB_IDS.length - 1 ? { nextTabBridge: `${id} bridge` } : {}),
    };
    return acc;
  }, {} as Record<ReadingTabId, { lead: string; plainEnglishSummary: string; evidenceCaption: string; nextTabBridge?: string }>);

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
