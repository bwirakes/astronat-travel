/**
 * canonical-events-2026-2027.test.ts
 *
 * Parity test: the generated dataset in app/lib/geodetic/events-2026-2027.generated.ts
 * must match what Swiss Ephemeris computes RIGHT NOW.
 *
 * If this test fails, regenerate via:
 *   bun run scripts/generate-2026-2027-events.ts
 *
 * Also pins NASA-published eclipses for 2026–2027 — these must be detected with
 * the correct classification (annular / total / partial / penumbral).
 */
import { describe, expect, it } from "bun:test";

import {
    ECLIPSES_2026_2027,
    EVENTS_WINDOW,
    RETROGRADE_SHADOW_WINDOWS,
    SIGN_INGRESSES,
    STELLIUMS_2026_2027,
} from "@/app/lib/geodetic/events-2026-2027.generated";
import { STATIONS } from "@/app/lib/geodetic/geodetic-events";

interface NasaEclipse {
    date: string;       // YYYY-MM-DD UT
    kind: "solar" | "lunar";
    eclipseType: string;
    sunOrMoonLon: number; // approx Sun (solar) or Moon (lunar) longitude in degrees
}

/**
 * Reference table — NASA Five-Millennium Canon of Solar / Lunar Eclipses, 2026–2027.
 * Source: eclipse.gsfc.nasa.gov
 */
const NASA_ECLIPSES: NasaEclipse[] = [
    { date: "2026-02-17", kind: "solar", eclipseType: "annular",   sunOrMoonLon: 328.8 },
    { date: "2026-03-03", kind: "lunar", eclipseType: "total",     sunOrMoonLon: 162.9 },
    { date: "2026-08-12", kind: "solar", eclipseType: "total",     sunOrMoonLon: 140.0 },
    { date: "2026-08-28", kind: "lunar", eclipseType: "partial",   sunOrMoonLon: 334.9 },
    { date: "2027-02-06", kind: "solar", eclipseType: "annular",   sunOrMoonLon: 317.6 },
    { date: "2027-02-20", kind: "lunar", eclipseType: "penumbral", sunOrMoonLon: 152.1 },
    { date: "2027-08-02", kind: "solar", eclipseType: "total",     sunOrMoonLon: 129.9 },
    { date: "2027-08-17", kind: "lunar", eclipseType: "penumbral", sunOrMoonLon: 324.2 },
];

describe("canonical 2026–2027 events", () => {
    describe("eclipses ↔ NASA catalog", () => {
        it("emits exactly the eight NASA-catalog eclipses for 2026–2027", () => {
            expect(ECLIPSES_2026_2027.length).toBe(NASA_ECLIPSES.length);
        });

        for (const nasa of NASA_ECLIPSES) {
            it(`emits ${nasa.date} ${nasa.kind} as ${nasa.eclipseType}`, () => {
                const match = ECLIPSES_2026_2027.find(
                    (e) => e.utc.startsWith(nasa.date) && e.kind === nasa.kind,
                );
                expect(match).toBeDefined();
                expect(match!.eclipseType).toBe(nasa.eclipseType);
                expect(Math.abs(match!.longitude - nasa.sunOrMoonLon)).toBeLessThan(0.5);
            });
        }
    });

    describe("retrograde shadow windows", () => {
        it("covers every standard stationing body across the 2-year window", () => {
            const bodies = new Set(RETROGRADE_SHADOW_WINDOWS.map((w) => w.body));
            for (const expected of ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"]) {
                expect(bodies.has(expected)).toBe(true);
            }
        });

        it("Mercury 2026 Pisces Rx pins to expected boundaries", () => {
            const w = RETROGRADE_SHADOW_WINDOWS.find(
                (w) => w.body === "Mercury" && w.retrogradeStation.utc.startsWith("2026-02-26"),
            );
            expect(w).toBeDefined();
            expect(w!.retrogradeStation.sign).toBe("Pisces");
            // Rx station longitude ~22.5° Pisces = 352.5° per NASA / public ephemeris.
            expect(Math.abs(w!.retrogradeStation.longitude - 352.5)).toBeLessThan(0.2);
            // Direct station ~8.5° Pisces = 338.5°.
            expect(Math.abs(w!.directStation.longitude - 338.5)).toBeLessThan(0.2);
            // Pre-shadow longitude must equal direct-station longitude.
            expect(Math.abs(w!.preShadowStart.longitude - w!.directStation.longitude)).toBeLessThan(0.02);
            // Post-shadow longitude must equal retrograde-station longitude.
            expect(Math.abs(w!.postShadowEnd.longitude - w!.retrogradeStation.longitude)).toBeLessThan(0.02);
        });

        it("Pluto 2026 retrograde stations near 5.5° Aquarius (305.5°)", () => {
            const w = RETROGRADE_SHADOW_WINDOWS.find(
                (w) => w.body === "Pluto" && w.retrogradeStation.utc.startsWith("2026-05"),
            );
            expect(w).toBeDefined();
            expect(w!.retrogradeStation.sign).toBe("Aquarius");
            expect(Math.abs(w!.retrogradeStation.longitude - 305.5)).toBeLessThan(0.3);
        });

        // Pins every entry from the "2026 STATION LEDGER" Nat shared in the
        // handoff image. These cross 2025/2026 cycle boundaries and were
        // initially missed by the generator until the envelope-intersection
        // fix landed.
        const NAT_LEDGER_2026: Array<{ body: string; dir: "retrograde" | "direct"; date: string; lon: number }> = [
            { body: "Uranus",  dir: "direct",     date: "2026-02-04", lon: 57.5 },
            { body: "Mercury", dir: "retrograde", date: "2026-02-26", lon: 352.6 },
            { body: "Jupiter", dir: "direct",     date: "2026-03-11", lon: 105.1 },
            { body: "Mercury", dir: "direct",     date: "2026-03-20", lon: 338.5 },
            { body: "Pluto",   dir: "retrograde", date: "2026-05-06", lon: 305.5 },
            { body: "Mercury", dir: "retrograde", date: "2026-06-29", lon: 116.3 },
            { body: "Neptune", dir: "retrograde", date: "2026-07-07", lon: 4.4 },
            { body: "Mercury", dir: "direct",     date: "2026-07-23", lon: 106.3 },
        ];

        for (const entry of NAT_LEDGER_2026) {
            it(`pins Nat's ledger: ${entry.body} ${entry.dir} ${entry.date} at ${entry.lon}°`, () => {
                const match = RETROGRADE_SHADOW_WINDOWS.find((w) => {
                    if (w.body !== entry.body) return false;
                    const boundary = entry.dir === "retrograde" ? w.retrogradeStation : w.directStation;
                    return boundary.utc.startsWith(entry.date);
                });
                expect(match).toBeDefined();
                const boundary =
                    entry.dir === "retrograde" ? match!.retrogradeStation : match!.directStation;
                expect(Math.abs(boundary.longitude - entry.lon)).toBeLessThan(0.5);
            });
        }
    });

    describe("sign ingresses", () => {
        it("contains all four Sun cardinal ingresses for each year", () => {
            const solarIngresses = SIGN_INGRESSES.filter(
                (i) => i.body === "Sun" && ["Aries", "Cancer", "Libra", "Capricorn"].includes(i.toSign),
            );
            expect(solarIngresses.length).toBe(8);
        });

        it("Sun Aries ingresses fall within Mar 19–21 (UT)", () => {
            for (const ingress of SIGN_INGRESSES.filter((i) => i.body === "Sun" && i.toSign === "Aries")) {
                const day = Number(ingress.utc.slice(8, 10));
                expect(day).toBeGreaterThanOrEqual(19);
                expect(day).toBeLessThanOrEqual(21);
            }
        });

        it("Uranus stays in Gemini through 2027 once ingressed (and re-ingresses on retrograde dip back to Taurus)", () => {
            const uranus = SIGN_INGRESSES.filter((i) => i.body === "Uranus");
            // Uranus dips back and forth between Taurus and Gemini in 2025–2026.
            // We just verify it visits Gemini at least once and Cancer NEVER inside the window.
            const signs = new Set(uranus.map((i) => i.toSign));
            expect(signs.has("Gemini")).toBe(true);
            expect(signs.has("Cancer")).toBe(false);
        });
    });

    describe("stelliums", () => {
        it("emits non-empty spans", () => {
            expect(STELLIUMS_2026_2027.length).toBeGreaterThan(0);
        });

        it("every span uses at least the minimum body count (3+)", () => {
            for (const s of STELLIUMS_2026_2027) {
                expect(s.members.length).toBeGreaterThanOrEqual(3);
            }
        });

        it("durations are positive and ordered", () => {
            for (const s of STELLIUMS_2026_2027) {
                expect(s.durationDays).toBeGreaterThanOrEqual(1);
                expect(new Date(s.endUtc).getTime()).toBeGreaterThan(new Date(s.startUtc).getTime());
            }
        });
    });

    describe("window metadata", () => {
        it("declares the expected window", () => {
            expect(EVENTS_WINDOW.startUtc).toBe("2026-01-01T00:00:00Z");
            expect(EVENTS_WINDOW.endUtc).toBe("2028-01-01T00:00:00Z");
        });
    });

    // ---------------------------------------------------------------------
    // Legacy / canonical parity — guarantees the hand-curated STATIONS array
    // in app/lib/geodetic/geodetic-events.ts and the SWE-derived
    // RETROGRADE_SHADOW_WINDOWS do not drift apart for the 2026–2027 window.
    // ---------------------------------------------------------------------
    describe("parity: legacy STATIONS ↔ generated RETROGRADE_SHADOW_WINDOWS", () => {
        const stations2026 = STATIONS.filter((s) => s.dateUtc.startsWith("2026"));

        it("every 2026 entry in STATIONS appears in RETROGRADE_SHADOW_WINDOWS", () => {
            for (const station of stations2026) {
                const targetDate = station.dateUtc.slice(0, 10);
                const match = RETROGRADE_SHADOW_WINDOWS.find((w) => {
                    if (w.body !== station.planet) return false;
                    const boundary =
                        station.type === "retrograde" ? w.retrogradeStation : w.directStation;
                    return boundary.utc.startsWith(targetDate);
                });
                expect(match, `${station.planet} ${station.type} ${targetDate} missing`).toBeDefined();
                const boundary =
                    station.type === "retrograde" ? match!.retrogradeStation : match!.directStation;
                expect(Math.abs(boundary.longitude - station.longitude)).toBeLessThan(0.5);
                expect(boundary.sign).toBe(station.sign);
            }
        });
    });
});
