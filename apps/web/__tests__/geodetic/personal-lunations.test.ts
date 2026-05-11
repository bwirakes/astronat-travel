import { describe, expect, it } from "bun:test";
import { scorePersonalLunations } from "@/app/lib/geodetic/personal-lunations";
import type { LunationEvent } from "@/app/lib/geodetic/geodetic-events";

// Tokyo: lon ~139.7°E. Geo-MC = 139.7° (Leo 19.7°).
// Geo-ASC at lat 35.7° depends on obliquity; we just inject lunations at
// known geo-MC degrees here so tests stay independent of the ASC formula.
const TOKYO = { destLat: 35.7, destLon: 139.7 };
// London: lon -0.1°. Geo-MC ~ 359.9° (Pisces).
const LONDON = { destLat: 51.5, destLon: -0.1 };

const REF = new Date("2026-04-15T12:00:00Z");

describe("scorePersonalLunations", () => {
    it("returns zero when no lunations are in window", () => {
        const lunations: LunationEvent[] = [
            { kind: "new-moon", dateUtc: "2027-06-15T00:00:00Z", degree: 80, sign: "Gemini" },
        ];
        const r = scorePersonalLunations({
            refDate: REF, ...TOKYO,
            natalPlanets: [{ name: "Sun", longitude: 139.7 }],
            lunations,
        });
        expect(r.aggregate).toBe(0);
        expect(r.hits).toEqual([]);
    });

    it("requires BOTH zone activation AND natal contact", () => {
        // Lunation in window, ON Tokyo's geo-MC, but no natal contact.
        const lunations: LunationEvent[] = [
            { kind: "new-moon", dateUtc: REF.toISOString(), degree: 139.7, sign: "Leo" },
        ];
        const noNatal = scorePersonalLunations({
            refDate: REF, ...TOKYO,
            natalPlanets: [{ name: "Sun", longitude: 200 }],
            lunations,
        });
        expect(noNatal.hits.length).toBe(0);

        // Same lunation, now natal Sun is right on it.
        const withNatal = scorePersonalLunations({
            refDate: REF, ...TOKYO,
            natalPlanets: [{ name: "Sun", longitude: 139.7 }],
            lunations,
        });
        expect(withNatal.hits.length).toBe(1);
        expect(withNatal.hits[0].kind).toBe("new-moon");
        expect(withNatal.hits[0].activatedAngle).toBe("geoMC");
        expect(withNatal.hits[0].natalContact).toBe("Sun");
    });

    it("scores new-moons positive and full-moons negative", () => {
        const lunNew: LunationEvent = { kind: "new-moon", dateUtc: REF.toISOString(), degree: 139.7, sign: "Leo" };
        const lunFull: LunationEvent = { kind: "full-moon", dateUtc: REF.toISOString(), degree: 139.7, sign: "Leo" };
        const planets = [{ name: "Sun", longitude: 139.7 }];

        const newR = scorePersonalLunations({ refDate: REF, ...TOKYO, natalPlanets: planets, lunations: [lunNew] });
        const fullR = scorePersonalLunations({ refDate: REF, ...TOKYO, natalPlanets: planets, lunations: [lunFull] });
        expect(newR.aggregate).toBeGreaterThan(0);
        expect(fullR.aggregate).toBeLessThan(0);
    });

    it("decays with both angle and natal orb", () => {
        const tight: LunationEvent = { kind: "new-moon", dateUtc: REF.toISOString(), degree: 139.7, sign: "Leo" };
        const loose: LunationEvent = { kind: "new-moon", dateUtc: REF.toISOString(), degree: 142.5, sign: "Leo" };

        const planetsTight = [{ name: "Sun", longitude: 139.7 }];
        const planetsLoose = [{ name: "Sun", longitude: 142.0 }];

        const r1 = scorePersonalLunations({ refDate: REF, ...TOKYO, natalPlanets: planetsTight, lunations: [tight] });
        const r2 = scorePersonalLunations({ refDate: REF, ...TOKYO, natalPlanets: planetsLoose, lunations: [loose] });
        // Tighter orb on both axes → larger absolute severity
        expect(Math.abs(r1.aggregate)).toBeGreaterThanOrEqual(Math.abs(r2.aggregate));
    });

    it("caps aggregate to ±12 (= 2× per-house cap)", () => {
        // Five hits all on geo-MC + natal Sun, all new moons. Even with
        // heavy stacking the aggregate must clamp to +12.
        const lunations: LunationEvent[] = Array.from({ length: 5 }).map((_, i) => ({
            kind: "new-moon" as const,
            dateUtc: new Date(REF.getTime() + i * 86400000).toISOString(),
            degree: 139.7,
            sign: "Leo",
        }));
        const r = scorePersonalLunations({
            refDate: REF, ...TOKYO,
            natalPlanets: [{ name: "Sun", longitude: 139.7 }],
            lunations,
        });
        expect(r.aggregate).toBeLessThanOrEqual(12);
        expect(r.aggregate).toBeGreaterThan(0);
    });

    it("respects window boundary", () => {
        // 60-day-old lunation outside default 30-day window.
        const lunation: LunationEvent = {
            kind: "new-moon",
            dateUtc: new Date(REF.getTime() - 60 * 86400000).toISOString(),
            degree: 139.7,
            sign: "Leo",
        };
        const r = scorePersonalLunations({
            refDate: REF, ...TOKYO,
            natalPlanets: [{ name: "Sun", longitude: 139.7 }],
            lunations: [lunation],
        });
        expect(r.hits.length).toBe(0);
    });

    it("activates the correct angle (MC vs ASC vs IC vs DSC)", () => {
        // London geo-MC ~ 0°. Lunation at 0°, natal Saturn at 0° → MC hit.
        const lunation: LunationEvent = { kind: "full-moon", dateUtc: REF.toISOString(), degree: 0, sign: "Aries" };
        const r = scorePersonalLunations({
            refDate: REF, ...LONDON,
            natalPlanets: [{ name: "Saturn", longitude: 0 }],
            lunations: [lunation],
        });
        expect(r.hits.length).toBe(1);
        expect(r.hits[0].activatedAngle).toBe("geoMC");

        // Same lunation but at 180° (geo-IC).
        const ic: LunationEvent = { kind: "full-moon", dateUtc: REF.toISOString(), degree: 180, sign: "Libra" };
        const rIc = scorePersonalLunations({
            refDate: REF, ...LONDON,
            natalPlanets: [{ name: "Saturn", longitude: 180 }],
            lunations: [ic],
        });
        expect(rIc.hits.length).toBe(1);
        expect(rIc.hits[0].activatedAngle).toBe("geoIC");
    });
});
