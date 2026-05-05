import { describe, expect, it } from "bun:test";
import { toV4ViewModel } from "@/app/lib/reading-viewmodel";
import type { TransitHit } from "@/lib/astro/transit-solver";

// ─── Fixtures ─────────────────────────────────────────────────────────────
//
// Integration test seam: the unit tests in window-scoring-monthly.test.ts pin
// the math. These tests pin the VM contract — that toV4ViewModel correctly
// branches on travelType and populates the relocation-shape fields the Timing
// tab and the future prompt change both depend on.

function hit(date: string, opts: Partial<TransitHit> = {}): TransitHit {
    return {
        date,
        transit_planet: "Jupiter",
        natal_planet: "Sun",
        aspect: "Trine",
        orb: 0.5,
        applying: true,
        benefic: true,
        retrograde: false,
        ...opts,
    };
}

function malefic(date: string, opts: Partial<TransitHit> = {}): TransitHit {
    return {
        date,
        transit_planet: "Saturn",
        natal_planet: "Moon",
        aspect: "Square",
        orb: 0.5,
        applying: true,
        benefic: false,
        retrograde: false,
        ...opts,
    };
}

/** Synthetic 12-month forward hit set — at least one hit per calendar month
 *  starting from May 2026 so every arrival candidate has full M+2 coverage. */
function fullYearHits(): TransitHit[] {
    return Array.from({ length: 14 }, (_, i) => {
        const monthStart = new Date(Date.UTC(2026, 4 + i, 15));
        return hit(monthStart.toISOString().slice(0, 10));
    });
}

function relocationReading(overrides: Partial<any> = {}) {
    return {
        destination: "Bali, Indonesia",
        destinationLat: -8.65,
        destinationLon: 115.22,
        travelDate: "2026-05-01",
        travelType: "relocation",
        goalIds: ["relocation"],
        macroScore: 60,
        macroVerdict: "Mixed",
        houses: [],
        natalPlanets: [],
        planetaryLines: [],
        relocatedCusps: [],
        transitWindows: fullYearHits(),
        ...overrides,
    };
}

describe("toV4ViewModel · relocation grain", () => {
    it("sets timeline.grain to 'month' for relocation readings", () => {
        const vm = toV4ViewModel(relocationReading());
        expect(vm.travelType).toBe("relocation");
        expect(vm.timeline.grain).toBe("month");
    });

    it("populates monthlySeries with 12 calendar months", () => {
        const vm = toV4ViewModel(relocationReading());
        expect(vm.monthlySeries).toHaveLength(12);
        expect(vm.monthlySeries[0].monthLabel).toBe("May 2026");
        expect(vm.monthlySeries[11].monthLabel).toBe("April 2027");
    });

    it("populates arrivalCandidates ranked through the 12-month horizon", () => {
        const vm = toV4ViewModel(relocationReading());
        // With 14 months of forward hit coverage and candidateCount=12, every
        // candidate's M+2 lookahead is covered, so all 12 survive the cutoff.
        expect(vm.arrivalCandidates.length).toBe(12);
        expect(vm.arrivalCandidates[0].monthLabel).toBe("May 2026");
    });

    it("rebuilds travelWindows as anchor + top arrival alternates", () => {
        const vm = toV4ViewModel(relocationReading());
        // Index 0 = the user's tentative move month (preserves hero pinning).
        // Indices 1-3 = top arrival alternates by arc score.
        expect(vm.travelWindows.length).toBeGreaterThanOrEqual(1);
        expect(vm.travelWindows.length).toBeLessThanOrEqual(4);
        expect(vm.travelWindows[0].flavor).toBe("Your move month");
        expect(vm.travelWindows[0].dates).toBe("May 2026");
    });

    it("leaves trip-shape series empty", () => {
        const vm = toV4ViewModel(relocationReading());
        // Relocation uses monthlySeries / monthlyHighlights; the trip-shape
        // dailySeries + rangeHighlights stay empty so trip-only consumers
        // either short-circuit or are explicitly grain-aware.
        expect(vm.dailySeries).toHaveLength(0);
        expect(vm.rangeHighlights.good).toHaveLength(0);
        expect(vm.rangeHighlights.bad).toHaveLength(0);
    });

    it("populates transitSpans over the 365-day relocation horizon", () => {
        const vm = toV4ViewModel(relocationReading());
        // With 14 months of monthly-spaced hits, the gantt should pick up
        // multiple slow-transit spans.
        expect(vm.transitSpans.length).toBeGreaterThan(0);
        const maxExitDay = Math.max(...vm.transitSpans.map(s => s.exitDay));
        // Spans extend well past the 90-day trip horizon.
        expect(maxExitDay).toBeGreaterThan(90);
    });

    // Two cases that disambiguate baseline vs transit signal: the floor is
    // computed from arrival-arc scores (baseline + transit delta), so a test
    // that varies both at once can't prove the flag actually consumes the
    // arc rather than the macro alone. Each baseline is parked just on the
    // *opposite* side of the 50 (mixed/press) boundary from where the
    // transit-modulated arc lands — so the flag's value is determined by
    // the arc, not the baseline:
    //
    //   Case A: baseline 55 (mixed, neutral tone) + goal-malefic transits →
    //     arc 47 (tight, press) → flag trips. Proves transits push it in.
    //   Case B: baseline 49 (tight, press tone) + goal-benefic transits →
    //     arc 57 (mixed, neutral) → flag doesn't trip. Proves transits
    //     pull it out.
    //
    // (Goal mul: relocation goal targets natal Moon/IC; we use Saturn-Square-
    //  Moon and Jupiter-Trine-Moon so the 1.6× boost applies.)
    it("trips placeFloorTripped when transits push a mixed-baseline arc into press", () => {
        const allMalefic = Array.from({ length: 14 }, (_, i) => {
            const monthStart = new Date(Date.UTC(2026, 4 + i, 15));
            return malefic(monthStart.toISOString().slice(0, 10));
        });
        const vm = toV4ViewModel(relocationReading({
            macroScore: 55,
            transitWindows: allMalefic,
        }));
        expect(vm.placeFloorTripped).toBe(true);
    });

    it("does not trip placeFloorTripped when transits pull a press-baseline arc out of press", () => {
        const allBenefic = Array.from({ length: 14 }, (_, i) => {
            const monthStart = new Date(Date.UTC(2026, 4 + i, 15));
            return hit(monthStart.toISOString().slice(0, 10), {
                transit_planet: "Jupiter",
                natal_planet: "Moon",
                aspect: "Trine",
            });
        });
        const vm = toV4ViewModel(relocationReading({
            macroScore: 49,
            transitWindows: allBenefic,
        }));
        expect(vm.placeFloorTripped).toBe(false);
    });

    it("does not trip placeFloorTripped on a healthy place", () => {
        const vm = toV4ViewModel(relocationReading({ macroScore: 70 }));
        expect(vm.placeFloorTripped).toBe(false);
    });
});

describe("toV4ViewModel · trip grain (regression)", () => {
    function tripReading() {
        return {
            destination: "Singapore, SG",
            destinationLat: 1.3521,
            destinationLon: 103.8198,
            travelDate: "2026-05-01",
            travelType: "trip",
            goalIds: ["career"],
            macroScore: 72,
            macroVerdict: "Solid",
            houses: [],
            natalPlanets: [],
            planetaryLines: [],
            relocatedCusps: [],
            transitWindows: [
                hit("2026-05-05"),
                hit("2026-05-12", { transit_planet: "Venus", natal_planet: "Moon", aspect: "Sextile" }),
            ],
        };
    }

    it("sets timeline.grain to 'week' for trip readings", () => {
        const vm = toV4ViewModel(tripReading());
        expect(vm.timeline.grain).toBe("week");
    });

    it("leaves relocation-shape fields empty for trips", () => {
        const vm = toV4ViewModel(tripReading());
        expect(vm.monthlySeries).toHaveLength(0);
        expect(vm.monthlyHighlights.strongest).toHaveLength(0);
        expect(vm.arrivalCandidates).toHaveLength(0);
        expect(vm.placeFloorTripped).toBe(false);
    });

    it("populates trip-shape series", () => {
        const vm = toV4ViewModel(tripReading());
        // Trip path still drives dailySeries / transitSpans / rangeHighlights —
        // the existing Timing tab consumers all read these and should be
        // unaffected by the relocation branch.
        expect(vm.dailySeries.length).toBeGreaterThan(0);
        expect(vm.transitSpans.length).toBeGreaterThan(0);
    });

    it("pins hero.bestWindow.score to the persisted heroWindowScore for trips", () => {
        // Hero-pin invariant: the relocation branch rewrites travelWindows
        // before the hero-pin block runs (`reading-viewmodel.ts:1935-1940`),
        // so a refactor that accidentally routes trips through the
        // relocation branch — or moves the pin block earlier — would
        // silently break the readings list ↔ detail page consistency
        // (both surfaces read this score and have to agree).
        const vm = toV4ViewModel({ ...tripReading(), heroWindowScore: 88 });
        expect(vm.hero.bestWindow.score).toBe(88);
    });
});
