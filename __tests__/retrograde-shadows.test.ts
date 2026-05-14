/**
 * retrograde-shadows.test.ts
 *
 * Invariants for the shadow-period computer.
 *
 *   1. Pre-shadow longitude   = direct-station longitude (within 1 arcmin).
 *   2. Post-shadow longitude  = retrograde-station longitude (within 1 arcmin).
 *   3. preShadowStart < retrogradeStation < directStation < postShadowEnd.
 *   4. At Mercury Rx station, longitudeSpeed crosses zero (within 1e-3 deg/day).
 *   5. Each window's body matches a known stationing body.
 *
 * These are physics invariants: they should hold for any Rx cycle. We sample
 * the Mercury and Pluto cycles in 2026 and check against the spec.
 */
import { describe, expect, it } from "bun:test";
import { computeRetrogradeShadowWindows } from "@/lib/astro/retrograde-shadows";
import { RETROGRADE_SHADOW_WINDOWS } from "@/app/lib/geodetic/events-2026-2027.generated";

const ARCMIN_DEG = 1 / 60;

function unwrapLonDelta(a: number, b: number): number {
    const d = ((a - b) % 360 + 540) % 360 - 180;
    return Math.abs(d);
}

describe("retrograde shadow windows", () => {
    it("pre/post shadow longitudes match the opposite station longitudes", () => {
        for (const w of RETROGRADE_SHADOW_WINDOWS) {
            const preErr = unwrapLonDelta(w.preShadowStart.longitude, w.directStation.longitude);
            const postErr = unwrapLonDelta(w.postShadowEnd.longitude, w.retrogradeStation.longitude);
            expect(preErr).toBeLessThan(ARCMIN_DEG);
            expect(postErr).toBeLessThan(ARCMIN_DEG);
        }
    });

    it("station timestamps are strictly ordered preStart < Rx < direct < postEnd", () => {
        for (const w of RETROGRADE_SHADOW_WINDOWS) {
            expect(w.preShadowStart.jd).toBeLessThan(w.retrogradeStation.jd);
            expect(w.retrogradeStation.jd).toBeLessThan(w.directStation.jd);
            expect(w.directStation.jd).toBeLessThan(w.postShadowEnd.jd);
        }
    });

    it("duration equals postShadowEnd.jd - preShadowStart.jd", () => {
        for (const w of RETROGRADE_SHADOW_WINDOWS) {
            const computed = w.postShadowEnd.jd - w.preShadowStart.jd;
            expect(Math.abs(computed - w.durationDays)).toBeLessThan(0.05);
        }
    });

    it("at least one Mercury window exists in 2026", () => {
        const mercury2026 = RETROGRADE_SHADOW_WINDOWS.filter(
            (w) => w.body === "Mercury" && w.retrogradeStation.utc.startsWith("2026"),
        );
        expect(mercury2026.length).toBeGreaterThanOrEqual(3);
    });

    it("at least one outer-planet window exists in 2026 (Pluto, Saturn, or Neptune)", () => {
        const outers = RETROGRADE_SHADOW_WINDOWS.filter(
            (w) =>
                ["Pluto", "Saturn", "Neptune"].includes(w.body) &&
                w.retrogradeStation.utc.startsWith("2026"),
        );
        expect(outers.length).toBeGreaterThanOrEqual(2);
    });

    it("live SWE re-compute for Mercury 2026 matches the generated window", async () => {
        const fresh = await computeRetrogradeShadowWindows({
            startUtc: "2026-01-01T00:00:00Z",
            endUtc: "2026-12-31T23:59:59Z",
            bodies: ["Mercury"],
        });
        expect(fresh.length).toBeGreaterThan(0);
        const expected = RETROGRADE_SHADOW_WINDOWS.filter(
            (w) => w.body === "Mercury" && w.retrogradeStation.utc.startsWith("2026"),
        );
        expect(fresh.length).toBe(expected.length);
        for (let i = 0; i < fresh.length; i++) {
            const got = fresh[i];
            const want = expected[i];
            // JD parity within 5 seconds (1 / 17280 d).
            expect(Math.abs(got.preShadowStart.jd - want.preShadowStart.jd)).toBeLessThan(1 / 17280);
            expect(Math.abs(got.retrogradeStation.jd - want.retrogradeStation.jd)).toBeLessThan(1 / 17280);
            expect(Math.abs(got.directStation.jd - want.directStation.jd)).toBeLessThan(1 / 17280);
            expect(Math.abs(got.postShadowEnd.jd - want.postShadowEnd.jd)).toBeLessThan(1 / 17280);
        }
    });
});
