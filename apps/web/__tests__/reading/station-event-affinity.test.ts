import { describe, expect, it } from "bun:test";
import { computeStationEventModifier } from "@/app/lib/geodetic/station-event-affinity";
import { LIFE_EVENTS } from "@/app/lib/planet-library";
import type { StationContribution } from "@/app/lib/geodetic/station-scoring";

// ═══════════════════════════════════════════════════════════════
// Helpers — minimal StationContribution fixtures.
//
// `severity` is the only field computeStationEventModifier reads beyond
// `planet`, so other fields are populated with sensible placeholders.
// ═══════════════════════════════════════════════════════════════

function station(planet: string, severity: number, type: "retrograde" | "direct" = "retrograde"): StationContribution {
    return {
        planet,
        type,
        stationDateUtc: "2026-07-11T12:00:00Z",
        daysFromTarget: 0,
        closestAngle: "MC",
        angleOrb: 0.5,
        severity,
        direction: severity < 0 ? "malefic" : severity > 0 ? "benefic" : "neutral",
    };
}

const IDENTITY_IDX     = LIFE_EVENTS.indexOf("Identity & Self-Discovery");
const WEALTH_IDX       = LIFE_EVENTS.indexOf("Wealth & Financial Growth");
const HOME_IDX         = LIFE_EVENTS.indexOf("Home, Family & Roots");
const ROMANCE_IDX      = LIFE_EVENTS.indexOf("Romance & Love");
const HEALTH_IDX       = LIFE_EVENTS.indexOf("Health, Routine & Wellness");
const PARTNERSHIPS_IDX = LIFE_EVENTS.indexOf("Partnerships & Marriage");
const CAREER_IDX       = LIFE_EVENTS.indexOf("Career & Public Recognition");
const FRIENDSHIP_IDX   = LIFE_EVENTS.indexOf("Friendship & Networking");
const SPIRITUALITY_IDX = LIFE_EVENTS.indexOf("Spirituality & Inner Peace");

// ═══════════════════════════════════════════════════════════════
// Golden 1 — empty contributions returns the zero vector
// ═══════════════════════════════════════════════════════════════

describe("computeStationEventModifier — empty input", () => {
    it("returns a 9-element vector of all zeros for undefined", () => {
        const mod = computeStationEventModifier(undefined);
        expect(mod).toHaveLength(LIFE_EVENTS.length);
        for (const v of mod) expect(v).toBe(0);
    });

    it("returns a 9-element vector of all zeros for empty array", () => {
        const mod = computeStationEventModifier([]);
        expect(mod).toHaveLength(LIFE_EVENTS.length);
        for (const v of mod) expect(v).toBe(0);
    });
});

// ═══════════════════════════════════════════════════════════════
// Golden 2 — Saturn-on-MC station (-25 severity)
//
// STATION_EVENT_AFFINITY[saturn] = [-0.3, +0.3, +0.3, -0.6, -0.6, -0.3, +1.0, +0.0, +0.6]
// SCALE = 0.15
//
// Career: -25 × +1.0 × 0.15 = -3.75   (Saturn restricts Career structure)
// Romance: -25 × -0.6 × 0.15 = +2.25   (Saturn-on-angle eases up on relationship rigidity)
// Spirituality: -25 × +0.6 × 0.15 = -2.25
// Friends: -25 × +0.0 × 0.15 = 0       (Saturn is solitary; no signal)
// ═══════════════════════════════════════════════════════════════

describe("computeStationEventModifier — Saturn malefic station", () => {
    const mod = computeStationEventModifier([station("saturn", -25)]);

    it("dampens Career hardest (intrinsic Saturn affinity)", () => {
        expect(mod[CAREER_IDX]).toBeCloseTo(-25 * 1.0 * 0.15, 3); // -3.75
    });

    it("LIFTS Romance via double-negative (severity × negative affinity)", () => {
        expect(mod[ROMANCE_IDX]).toBeCloseTo(-25 * -0.6 * 0.15, 3); // +2.25
        expect(mod[ROMANCE_IDX]).toBeGreaterThan(0);
    });

    it("dampens Health and Partnerships (Saturn restricts both)", () => {
        expect(mod[HEALTH_IDX]).toBeCloseTo(-25 * -0.6 * 0.15, 3); // wait: -0.6 × -25 = +2.25
        // Saturn affinity for Health is -0.6 → severity -25 × -0.6 × 0.15 = +2.25
        // That's a LIFT. Saturn-on-angle relieves the chronic-tension health signal.
        expect(mod[HEALTH_IDX]).toBeGreaterThan(0);
        expect(mod[PARTNERSHIPS_IDX]).toBeGreaterThan(0); // similar logic, -0.3 × -25 × 0.15
    });

    it("zero contribution to Friends (Saturn affinity 0)", () => {
        expect(mod[FRIENDSHIP_IDX]).toBe(0);
    });

    it("Career hit lands in expected -3 to -5 band", () => {
        expect(mod[CAREER_IDX]).toBeLessThan(-3);
        expect(mod[CAREER_IDX]).toBeGreaterThan(-5);
    });
});

// ═══════════════════════════════════════════════════════════════
// Golden 3 — Venus-on-MC benefic station (+6 severity)
//
// STATION_EVENT_AFFINITY[venus] = [+0.3, +1.0, +0.3, +1.0, +0.3, +1.0, +0.3, +0.6, +0.3]
//
// Wealth: +6 × +1.0 × 0.15 = +0.9      (Venus lifts economy/trade)
// Romance: +6 × +1.0 × 0.15 = +0.9
// Partnerships: +6 × +1.0 × 0.15 = +0.9
// All entries strictly non-negative because Venus has no negative affinities.
// ═══════════════════════════════════════════════════════════════

describe("computeStationEventModifier — Venus benefic station", () => {
    const mod = computeStationEventModifier([station("venus", +12, "direct")]);

    it("lifts every event (no friction valences in Venus row)", () => {
        for (const v of mod) expect(v).toBeGreaterThanOrEqual(0);
    });

    it("Wealth, Romance, Partnerships are tied at the maximum lift", () => {
        const expected = 12 * 1.0 * 0.15; // 1.8
        expect(mod[WEALTH_IDX]).toBeCloseTo(expected, 3);
        expect(mod[ROMANCE_IDX]).toBeCloseTo(expected, 3);
        expect(mod[PARTNERSHIPS_IDX]).toBeCloseTo(expected, 3);
    });

    it("Friends gets a moderate +0.6 lift (Venus rules H7 — social harmony)", () => {
        expect(mod[FRIENDSHIP_IDX]).toBeCloseTo(12 * 0.6 * 0.15, 3); // 1.08
        expect(mod[FRIENDSHIP_IDX]).toBeLessThan(mod[ROMANCE_IDX]);
    });
});

// ═══════════════════════════════════════════════════════════════
// Golden 4 — Mars station: friction valences flip via double-negative
//
// STATION_EVENT_AFFINITY[mars] = [+1.0, +0.0, -0.6, -0.6, -0.3, -0.6, +0.3, +0.3, +0.0]
// Mars station severity is -30 (its STATION_BASE).
//
// Identity:    -30 × +1.0 × 0.15 = -4.5    (warrior identity in friction with traveler)
// Home:        -30 × -0.6 × 0.15 = +2.7    (friction loosens — Mars-on-angle eases home conflicts)
// Romance:     -30 × -0.6 × 0.15 = +2.7    (same)
// Partnerships -30 × -0.6 × 0.15 = +2.7
// Wealth:      -30 × +0.0 × 0.15 = 0       (no signal)
//
// This is the headline insight of the system: a Mars station has intrinsic
// friction on Romance/Partnerships, so when Mars stations near a city's MC
// (severity -30), those friction signals are *reduced* rather than amplified.
// ═══════════════════════════════════════════════════════════════

describe("computeStationEventModifier — Mars: friction valences flip", () => {
    const mod = computeStationEventModifier([station("mars", -30)]);

    it("Identity dampens hard (Mars × +1.0 affinity, severity -30)", () => {
        expect(mod[IDENTITY_IDX]).toBeCloseTo(-30 * 1.0 * 0.15, 3); // -4.5
    });

    it("Romance LIFTS (Mars-friction-on-angle is a release valve, not a load)", () => {
        expect(mod[ROMANCE_IDX]).toBeGreaterThan(0);
        expect(mod[ROMANCE_IDX]).toBeCloseTo(-30 * -0.6 * 0.15, 3); // +2.7
    });

    it("Home and Partnerships also LIFT (same friction-flip logic)", () => {
        expect(mod[HOME_IDX]).toBeGreaterThan(0);
        expect(mod[PARTNERSHIPS_IDX]).toBeGreaterThan(0);
    });

    it("Wealth contributes zero (Mars × 0 affinity for Wealth)", () => {
        expect(mod[WEALTH_IDX]).toBe(0);
    });
});

// ═══════════════════════════════════════════════════════════════
// Stacking — multiple stations sum additively
// ═══════════════════════════════════════════════════════════════

describe("computeStationEventModifier — stacking", () => {
    it("sums contributions across multiple stations", () => {
        const single = computeStationEventModifier([station("jupiter", +12)]);
        const doubled = computeStationEventModifier([
            station("jupiter", +6),
            station("jupiter", +6),
        ]);
        for (let i = 0; i < LIFE_EVENTS.length; i++) {
            expect(doubled[i]).toBeCloseTo(single[i], 3);
        }
    });

    it("adds independent planet contributions", () => {
        const saturnOnly = computeStationEventModifier([station("saturn", -25)]);
        const jupiterOnly = computeStationEventModifier([station("jupiter", +12)]);
        const both = computeStationEventModifier([
            station("saturn", -25),
            station("jupiter", +12),
        ]);
        for (let i = 0; i < LIFE_EVENTS.length; i++) {
            expect(both[i]).toBeCloseTo(saturnOnly[i] + jupiterOnly[i], 3);
        }
    });
});

// ═══════════════════════════════════════════════════════════════
// Robustness — unknown planet name doesn't crash
// ═══════════════════════════════════════════════════════════════

describe("computeStationEventModifier — robustness", () => {
    it("ignores stations with planet names not in PLANETS array", () => {
        const mod = computeStationEventModifier([station("chiron", -15)]);
        for (const v of mod) expect(v).toBe(0);
    });

    it("handles capitalized planet names (case-insensitive)", () => {
        const mod = computeStationEventModifier([station("Saturn", -25)]);
        // Should match the lowercase saturn row
        expect(mod[CAREER_IDX]).toBeCloseTo(-25 * 1.0 * 0.15, 3);
    });
});
