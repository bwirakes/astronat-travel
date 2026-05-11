import { normalizeLongitude, haversineDistance } from "@/app/lib/astro/astrocartography";

// Simple direct test mocking for astrocartography logic to verify edge cases
// (Unit tests for spherical geometry and map antimeridian handling)

describe("Astrocartography Mathematics Verification", () => {
    
    describe("Antimeridian Handling (Map Streaking)", () => {
        // Reproducing the splitAtAntiMeridian logic directly here for test validation since it's internal
        function splitAtAntiMeridian(points: {lat: number, lon: number}[], threshold: number = 180) {
            if (points.length === 0) return [];
            const segments = [];
            let currentSegment = [points[0]];

            for (let i = 1; i < points.length; i++) {
                const prevLon = points[i - 1].lon;
                const currLon = points[i].lon;

                if (Math.abs(currLon - prevLon) > threshold) {
                    segments.push(currentSegment);
                    currentSegment = [];
                }
                currentSegment.push(points[i]);
            }
            if (currentSegment.length > 0) segments.push(currentSegment);
            return segments;
        }

        it("safely splits curves across the International Date Line", () => {
            const wrapCurve = [
                { lat: 10, lon: 178 },
                { lat: 12, lon: 179 },
                { lat: 14, lon: -179 }, // Crossed the dateline!
                { lat: 16, lon: -178 }
            ];
            
            const segments = splitAtAntiMeridian(wrapCurve);
            
            expect(segments.length).toBe(2);
            expect(segments[0]).toEqual([ { lat: 10, lon: 178 }, { lat: 12, lon: 179 } ]);
            expect(segments[1]).toEqual([ { lat: 14, lon: -179 }, { lat: 16, lon: -178 } ]);
        });

        it("does not split normal curves", () => {
            const normalCurve = [
                { lat: 10, lon: 20 },
                { lat: 12, lon: 21 },
                { lat: 14, lon: 22 }
            ];
            const segments = splitAtAntiMeridian(normalCurve);
            expect(segments.length).toBe(1);
        });
    });

    describe("Geographical Equator Alignment", () => {
        it("returns purely vertical logic when a planet is exactly at declination 0 (on the equator)", () => {
            // At declination 0: 
            // ASC formula: cos(LHA) = -tan(Lat) * tan(0) = 0.
            // When cos(LHA) = 0, LHA is always exactly 90 degrees or 270 degrees.
            // This means an Equator-positioned planet will rise exactly 90 degrees East of the MC and set exactly 90 degrees West.
            
            const latDeg = 45;
            const decDeg = 0;
            const mcLon = 100;
            
            const latRad = latDeg * Math.PI / 180;
            const decRad = decDeg * Math.PI / 180;
            const cosLha = -Math.tan(latRad) * Math.tan(decRad);
            
            expect(Math.abs(cosLha)).toBeCloseTo(0);
            
            const LHA = Math.acos(cosLha) * 180 / Math.PI; // Should be exactly 90
            expect(LHA).toBe(90);
            
            const dscLon = (mcLon + LHA) % 360;
            const ascLon = (mcLon - LHA) % 360;
            
            expect(dscLon).toBe(190);
            expect(ascLon).toBe(10);
        });
    });
    
    describe("normalizeLongitude", () => {
        it("correctly normalizes bounds to -180 / 180", () => {
            expect(normalizeLongitude(190)).toBe(-170);
            expect(normalizeLongitude(-190)).toBe(170);
            expect(normalizeLongitude(360)).toBe(0);
        });
    });
});
