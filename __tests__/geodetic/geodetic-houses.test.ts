import { describe, expect, it } from "bun:test";
import {
    geodeticHouseCusps,
    geodeticHouseFromLongitude,
    geodeticASCLongitude,
} from "@/app/lib/geodetic";

describe("geodeticHouseCusps", () => {
    it("returns 12 cusps spaced 30° apart (whole-sign)", () => {
        const cusps = geodeticHouseCusps(35.7, 139.7); // Tokyo
        expect(cusps).toHaveLength(12);
        for (let i = 1; i < 12; i++) {
            const step = (cusps[i] - cusps[i - 1] + 360) % 360;
            expect(step).toBeCloseTo(30, 5);
        }
    });

    it("anchors cusp 1 to the start of the geo-ASC sign", () => {
        const lat = 51.5;
        const lon = -0.1; // London
        const ascLon = geodeticASCLongitude(lon, lat);
        const ascSignStart = Math.floor(ascLon / 30) * 30;
        const cusps = geodeticHouseCusps(lat, lon);
        expect(cusps[0]).toBeCloseTo(ascSignStart, 6);
    });

    it("normalizes wrap-around so all cusps are in [0, 360)", () => {
        // ASC near 350° forces house 2-12 to cross the 0° boundary.
        const cusps = geodeticHouseCusps(0, 350);
        for (const c of cusps) {
            expect(c).toBeGreaterThanOrEqual(0);
            expect(c).toBeLessThan(360);
        }
    });
});

describe("geodeticHouseFromLongitude", () => {
    it("places a planet on the geo-ASC into house 1", () => {
        const lat = 35.7;
        const lon = 139.7;
        const ascLon = geodeticASCLongitude(lon, lat);
        expect(geodeticHouseFromLongitude(ascLon, lat, lon)).toBe(1);
    });

    it("places a planet 30° past the ASC sign-start into house 2", () => {
        const lat = 35.7;
        const lon = 139.7;
        const ascLon = geodeticASCLongitude(lon, lat);
        const ascSignStart = Math.floor(ascLon / 30) * 30;
        const inHouse2 = (ascSignStart + 30 + 5) % 360;
        expect(geodeticHouseFromLongitude(inHouse2, lat, lon)).toBe(2);
    });

    it("returns a house number in [1, 12] for any longitude", () => {
        const lat = 51.5;
        const lon = -0.1;
        for (let p = 0; p < 360; p += 17) {
            const h = geodeticHouseFromLongitude(p, lat, lon);
            expect(h).toBeGreaterThanOrEqual(1);
            expect(h).toBeLessThanOrEqual(12);
        }
    });
});
