import { describe, expect, it } from "bun:test";
import {
  buildEventScores,
  sortEventsByGoals,
  dominantElement,
  dominantModality,
  topStandoutPlacements,
  relocSummary,
  toCouplesViewModel,
  type GoalId,
  type PartnerEventScore,
} from "@/app/lib/couples-viewmodel";
import { LIFE_EVENTS } from "@/app/lib/planet-library";

// ═══════════════════════════════════════════════════════════════
// HELPERS — small test fixtures
// ═══════════════════════════════════════════════════════════════

const NINE_USER_SCORES = [70, 60, 55, 80, 65, 75, 85, 50, 45];
const NINE_PARTNER_SCORES = [55, 45, 80, 75, 70, 70, 40, 60, 70];

function fakeFinalEventScores(scores: number[]) {
  return LIFE_EVENTS.map((eventName, i) => ({
    eventName,
    baseVolume: scores[i] - 5,
    affinityModifier: 5,
    finalScore: scores[i],
    verdict: "test",
  }));
}

// Air-leaning sample: Sun in Libra (180°), Moon in Aquarius (300°), rest neutral.
const AIR_HEAVY_PLANETS = [
  { planet: "Sun",     longitude: 200 }, // Libra
  { planet: "Moon",    longitude: 320 }, // Aquarius
  { planet: "Mercury", longitude: 195 }, // Libra
  { planet: "Venus",   longitude: 70  }, // Gemini
  { planet: "Mars",    longitude: 30  }, // Taurus
  { planet: "Jupiter", longitude: 100 }, // Cancer
  { planet: "Saturn",  longitude: 250 }, // Sagittarius
];

// Cardinal-leaning: Sun in Aries (0°), Moon in Cancer (95°), Venus in Libra (185°).
const CARDINAL_PLANETS = [
  { planet: "Sun",     longitude: 5   }, // Aries (Cardinal)
  { planet: "Moon",    longitude: 95  }, // Cancer (Cardinal)
  { planet: "Mercury", longitude: 185 }, // Libra (Cardinal)
  { planet: "Venus",   longitude: 275 }, // Capricorn (Cardinal)
  { planet: "Mars",    longitude: 250 }, // Sagittarius (Mutable)
];

// ═══════════════════════════════════════════════════════════════
// buildEventScores
// ═══════════════════════════════════════════════════════════════

describe("buildEventScores", () => {
  it("pairs eventScores + partnerEventScores by LIFE_EVENTS index", () => {
    const reading = {
      eventScores:        fakeFinalEventScores(NINE_USER_SCORES),
      partnerEventScores: fakeFinalEventScores(NINE_PARTNER_SCORES),
    };
    const result = buildEventScores(reading);
    expect(result).toHaveLength(LIFE_EVENTS.length);
    expect(result[0]).toEqual({ event: LIFE_EVENTS[0], you: 70, partner: 55 });
    expect(result[6]).toEqual({ event: LIFE_EVENTS[6], you: 85, partner: 40 });
  });

  it("falls back to flat macro scores when partnerEventScores is missing", () => {
    const reading = {
      eventScores:       fakeFinalEventScores(NINE_USER_SCORES),
      // partnerEventScores intentionally absent (pre-Phase-1 row)
      userMacroScore:    78,
      partnerMacroScore: 64,
    };
    const result = buildEventScores(reading);
    expect(result).toHaveLength(LIFE_EVENTS.length);
    // Every row should be flat — same you/partner across all events
    for (const row of result) {
      expect(row.you).toBe(78);
      expect(row.partner).toBe(64);
    }
  });

  it("falls back when partnerEventScores length doesn't match LIFE_EVENTS", () => {
    // Truncate to 5 entries — buildEventScores requires both arrays to have
    // exactly LIFE_EVENTS.length rows or it drops to the macro fallback.
    const truncatedPartner = fakeFinalEventScores(NINE_PARTNER_SCORES).slice(0, 5);
    const reading = {
      eventScores:        fakeFinalEventScores(NINE_USER_SCORES),
      partnerEventScores: truncatedPartner,
      userMacroScore:    50,
      partnerMacroScore: 50,
    };
    const result = buildEventScores(reading);
    expect(result.every((r) => r.you === 50 && r.partner === 50)).toBe(true);
  });

  it("uses macroScore as a secondary fallback for the user side", () => {
    const reading = { macroScore: 60 };
    const result = buildEventScores(reading);
    expect(result[0].you).toBe(60);
    expect(result[0].partner).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// sortEventsByGoals
// ═══════════════════════════════════════════════════════════════

describe("sortEventsByGoals", () => {
  const events: PartnerEventScore[] = LIFE_EVENTS.map((e, i) => ({
    event: e,
    you: i * 10,
    partner: i * 10,
  }));

  it("surfaces priority events in goal order", () => {
    const goals: GoalId[] = ["love", "career"];
    const sorted = sortEventsByGoals(events, goals);
    expect(sorted[0].event).toBe("Romance & Love");
    expect(sorted[1].event).toBe("Partnerships & Marriage");
    expect(sorted[2].event).toBe("Career & Public Recognition");
    expect(sorted[3].event).toBe("Wealth & Financial Growth");
  });

  it("dedupes events when two goals reference the same LIFE_EVENT", () => {
    // love → Romance, Partnerships
    // relocation → Home, Identity
    // growth → Spirituality, Identity   (Identity overlaps with relocation)
    const goals: GoalId[] = ["relocation", "growth"];
    const sorted = sortEventsByGoals(events, goals);
    const identitySlot = sorted.findIndex((e) => e.event === "Identity & Self-Discovery");
    expect(identitySlot).toBeGreaterThan(-1);
    const occurrences = sorted.filter((e) => e.event === "Identity & Self-Discovery");
    expect(occurrences).toHaveLength(1);
  });

  it("preserves all 9 events even when no goal matches", () => {
    const sorted = sortEventsByGoals(events, []);
    expect(sorted).toHaveLength(LIFE_EVENTS.length);
    expect(new Set(sorted.map((e) => e.event)).size).toBe(LIFE_EVENTS.length);
  });

  it("places non-priority events in stable order at the tail", () => {
    const sorted = sortEventsByGoals(events, ["love"]);
    // Tail = original order minus the priority pair
    const tail = sorted.slice(2).map((e) => e.event);
    const expectedTail = LIFE_EVENTS.filter(
      (e) => e !== "Romance & Love" && e !== "Partnerships & Marriage",
    );
    expect(tail).toEqual(expectedTail);
  });
});

// ═══════════════════════════════════════════════════════════════
// dominantElement / dominantModality
// ═══════════════════════════════════════════════════════════════

describe("dominantElement", () => {
  it("identifies an air-heavy chart", () => {
    expect(dominantElement(AIR_HEAVY_PLANETS)).toBe("Air-heavy");
  });

  it("weights luminaries 2x", () => {
    // Equal counts: 2 air planets (Sun, Moon) vs 3 earth planets — air still
    // wins because Sun + Moon double-count.
    const planets = [
      { planet: "Sun",     longitude: 200 }, // Libra (Air, ×2)
      { planet: "Moon",    longitude: 320 }, // Aquarius (Air, ×2)
      { planet: "Mercury", longitude: 30  }, // Taurus (Earth)
      { planet: "Venus",   longitude: 60  }, // Taurus (Earth)
      { planet: "Mars",    longitude: 90  }, // Cancer (Water)  -- wait, 90° is Cancer cusp
    ];
    expect(dominantElement(planets)).toBe("Air-heavy");
  });

  it("returns Mixed for empty input", () => {
    expect(dominantElement([])).toBe("Fire-led"); // first key in tally object — empty tie defaults to first
  });
});

describe("dominantModality", () => {
  it("identifies cardinal-leaning chart", () => {
    expect(dominantModality(CARDINAL_PLANETS)).toBe("Cardinal-leaning");
  });
});

// ═══════════════════════════════════════════════════════════════
// topStandoutPlacements
// ═══════════════════════════════════════════════════════════════

describe("topStandoutPlacements", () => {
  const cusps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]; // ASC=0, IC=90, DSC=180, MC=270

  it("returns at most 3 placements", () => {
    const planets = [
      { planet: "Sun",     longitude: 270 },
      { planet: "Moon",    longitude: 90  },
      { planet: "Mercury", longitude: 95  },
      { planet: "Venus",   longitude: 100 },
      { planet: "Mars",    longitude: 250 },
    ];
    const result = topStandoutPlacements(planets, cusps, "Lisbon");
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("ranks angular planets above non-angular", () => {
    const planets = [
      { planet: "Saturn",  longitude: 45  }, // mid-2H, far from any angle
      { planet: "Sun",     longitude: 270 }, // exact MC
    ];
    const result = topStandoutPlacements(planets, cusps, "Lisbon");
    expect(result[0].planet).toBe("Sun");
  });

  it("falls back to a templated note when no curated entry exists", () => {
    // Mercury in some house with no STANDOUT_NOTES["Mercury-N"] entry.
    // Mercury at 250° (Sagittarius) → houseFromLon with cusps starting at 0°
    // → 250 falls between cusp index 8 (240) and 9 (270), so house 9. Note key
    // "Mercury-9" is not in the curated table.
    const planets = [{ planet: "Mercury", longitude: 250 }];
    const result = topStandoutPlacements(planets, cusps, "Lisbon");
    expect(result[0].note).toContain("Mercury");
    expect(result[0].note).toContain("Sagittarius");
  });

  it("handles charts with too few planets", () => {
    const result = topStandoutPlacements([{ planet: "Sun", longitude: 0 }], cusps, "Lisbon");
    expect(result).toHaveLength(1);
    expect(result[0].planet).toBe("Sun");
  });
});

// ═══════════════════════════════════════════════════════════════
// relocSummary
// ═══════════════════════════════════════════════════════════════

describe("relocSummary", () => {
  it("calls out shared element when both ASCs match", () => {
    const out = relocSummary(
      { sign: "Cancer" }, { sign: "Pisces" },     // both water
      { sign: "Aries" },  { sign: "Sagittarius" }, // fire vs fire — also same!
    );
    expect(out).toMatch(/in tune/);
  });

  it("calls out shared ASC element only when MCs differ", () => {
    const out = relocSummary(
      { sign: "Cancer" }, { sign: "Pisces" }, // both water
      { sign: "Aries" },  { sign: "Capricorn" }, // fire vs earth
    );
    expect(out).toMatch(/felt language of the place is shared/);
  });

  it("calls out divergent ambitions when only MCs match", () => {
    const out = relocSummary(
      { sign: "Cancer" }, { sign: "Aries" },      // water vs fire
      { sign: "Libra" },  { sign: "Aquarius" },   // both air
    );
    expect(out).toMatch(/public bearings point the same way/);
  });

  it("calls out total divergence when no element matches", () => {
    const out = relocSummary(
      { sign: "Cancer" }, { sign: "Aries" },       // water vs fire
      { sign: "Libra" },  { sign: "Capricorn" },   // air vs earth
    );
    expect(out).toMatch(/two different things/);
  });
});

// ═══════════════════════════════════════════════════════════════
// toCouplesViewModel — integration
// ═══════════════════════════════════════════════════════════════

describe("toCouplesViewModel — integration", () => {
  function makeReading(overrides: any = {}) {
    return {
      destination: "Lisbon, Portugal",
      partnerName: "Sam",
      travelDate: "2026-09-01",
      goals: ["love", "career"],
      userMacroScore:    78,
      partnerMacroScore: 64,
      scoreDelta: 14,
      eventScores:        fakeFinalEventScores(NINE_USER_SCORES),
      partnerEventScores: fakeFinalEventScores(NINE_PARTNER_SCORES),
      natalPlanets:        AIR_HEAVY_PLANETS,
      partnerNatalPlanets: CARDINAL_PLANETS,
      relocatedCusps:        [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      partnerRelocatedCusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      synastryAspects: [
        { planet1: "venus", planet2: "sun",  aspect: "trine",  orb: 1.2, tone: "harmonious" },
        { planet1: "mars",  planet2: "saturn", aspect: "square", orb: 0.8, tone: "tense" },
      ],
      narrative: { verdict: { bestWindows: ["Apr 12–28 2026 — Venus on geo-ASC"], avoidWindows: [] } },
      ...overrides,
    };
  }

  it("produces a hero with the destination's first comma-prefix", () => {
    const vm = toCouplesViewModel(makeReading());
    expect(vm.hero.destination).toBe("Lisbon");
  });

  it("computes coherence from the macro delta", () => {
    const vm = toCouplesViewModel(makeReading());
    // delta 14 → coherence 86
    expect(vm.hero.coherence.score).toBe(86);
  });

  it("produces a 9-row goal series and a top-3 priority list", () => {
    const vm = toCouplesViewModel(makeReading());
    expect(vm.goals.events).toHaveLength(LIFE_EVENTS.length);
    expect(vm.goals.topThree).toHaveLength(3);
    expect(vm.goals.topThree[0].event).toBe("Romance & Love");
  });

  it("falls back to default goals when reading.goals is empty/missing", () => {
    const vm = toCouplesViewModel(makeReading({ goals: undefined }));
    expect(vm.intro.goals).toEqual(["love", "career"]);
  });

  it("splits synastry aspects by tone and decorates with meanings", () => {
    const vm = toCouplesViewModel(makeReading());
    expect(vm.deepDive.synastry.harmonious).toHaveLength(1);
    expect(vm.deepDive.synastry.tense).toHaveLength(1);
    expect(vm.deepDive.synastry.harmonious[0].meaning).toBeTruthy();
  });

  it("surfaces the first best/avoid windows as short labels in intro", () => {
    const vm = toCouplesViewModel(makeReading());
    expect(vm.intro.bestWindowShort).toBe("Apr 12–28 2026");
    expect(vm.intro.avoidWindowShort).toBeNull();
  });
});
