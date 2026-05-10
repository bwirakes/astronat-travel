/**
 * cross-surface-consistency.test.ts — pin the post-fusion guarantee.
 *
 * The point of routing every surface through `computeFusedReadingPackage` is
 * that the hero score, the corresponding sidebar window, and the daily-series
 * entry for the same date all read the same number. Before this PR, the hero
 * used the fused engine while the sidebar/daily helpers used a separate
 * `baselineMacro + transit-delta` formula — they could (and did) disagree.
 *
 * This test reconstructs all three for a fixture chart at a single travel
 * date and asserts they're within 1pt of each other (rounding only).
 * Without it, a future refactor could silently reintroduce the gap.
 */
import { describe, expect, it } from "bun:test";
import {
    buildScoredWindows,
    buildDailySeries,
    type FusedWindowInputs,
} from "@/app/lib/window-scoring";
import {
    computeFusedReadingPackage,
    buildNatalPlanetRelocatedHouseMap,
} from "@/app/lib/scoring-engine";
import type { TransitHit } from "@/lib/astro/transit-solver";

function inputs(): FusedWindowInputs {
    const houses = Array.from({ length: 12 }, (_, i) => ({ house: i + 1, score: 55 }));
    const natalPlanets = [
        { planet: "sun",     longitude:  10 },
        { planet: "moon",    longitude:  40 },
        { planet: "mercury", longitude:  70 },
        { planet: "venus",   longitude: 100 },
        { planet: "mars",    longitude: 130 },
        { planet: "jupiter", longitude: 160 },
        { planet: "saturn",  longitude: 190 },
        { planet: "uranus",  longitude: 220 },
        { planet: "neptune", longitude: 250 },
        { planet: "pluto",   longitude: 280 },
    ];
    const relocatedCusps = Array.from({ length: 12 }, (_, i) => i * 30);
    const transits: TransitHit[] = [
        {
            date: "2026-05-12T00:00:00Z",
            transit_planet: "Jupiter", natal_planet: "Sun", aspect: "Trine",
            orb: 0.3, applying: true, benefic: true, retrograde: false,
        },
        {
            date: "2026-05-14T00:00:00Z",
            transit_planet: "Venus", natal_planet: "Moon", aspect: "Sextile",
            orb: 0.5, applying: true, benefic: true, retrograde: false,
        },
        {
            date: "2026-05-13T00:00:00Z",
            transit_planet: "Saturn", natal_planet: "Mars", aspect: "Square",
            orb: 1.0, applying: false, benefic: false, retrograde: false,
        },
    ];
    return {
        matrixResult: { houses } as any,
        relocatedPlanets: natalPlanets.map((p, i) => ({
            name: p.planet,
            house: (i % 12) + 1,
        })),
        transits,
        goalIds: ["career"],
        natalPlanetHouse: buildNatalPlanetRelocatedHouseMap(natalPlanets, relocatedCusps),
    };
}

describe("cross-surface consistency", () => {
    it("hero score, sidebar window score, and daily series score agree for the same date", () => {
        const fused = inputs();
        const travelDateISO = "2026-05-13T00:00:00.000Z";

        // (a) Hero / macro path — what the headline reads.
        const hero = computeFusedReadingPackage({
            matrixResult: fused.matrixResult,
            relocatedPlanets: fused.relocatedPlanets,
            transits: fused.transits,
            centerISO: travelDateISO,
            goalIds: fused.goalIds,
            natalPlanetHouse: fused.natalPlanetHouse,
            selectedGoalIndices: null,
        });

        // (b) Sidebar window path — `buildScoredWindows[0]` is "Your dates".
        const windows = buildScoredWindows(travelDateISO, fused);
        const sidebar = windows[0];

        // (c) Daily series — find the entry whose ISO matches travelDate.
        const daily = buildDailySeries(travelDateISO, fused, 7, 7);
        const dailyAnchor = daily.find(d => d.isAnchor);

        expect(sidebar).toBeDefined();
        expect(dailyAnchor).toBeDefined();

        // All three pull from `computePlaceAffinityLayers` + the same transit
        // window via `computeTransitModifiersAtAnchor`. Differences (if any)
        // come only from the daily helper's narrower halfWidth (2 vs 5 days),
        // which can change which transits sample into the window. For a
        // travel date with all hits clustered ±1d, the windows coincide.
        // Allow 1pt tolerance for rounding.
        const heroScore = Math.round(hero.readingScore);
        const sidebarScore = Math.round(sidebar.score);
        const dailyScore = Math.round(dailyAnchor!.score);

        expect(Math.abs(heroScore - sidebarScore)).toBeLessThanOrEqual(1);
        // Daily uses halfWidth=2 instead of 5, so it can legitimately differ
        // when transits sit in the 3-5 day band. Our fixture clusters all
        // hits within ±1 day of the anchor, so the windows coincide exactly.
        expect(Math.abs(heroScore - dailyScore)).toBeLessThanOrEqual(1);
    });
});
