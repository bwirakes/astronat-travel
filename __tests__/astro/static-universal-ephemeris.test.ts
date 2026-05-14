import { describe, expect, it } from "bun:test";

import { UNIVERSAL_SKY_BODIES, getComputedSkyForDateRange } from "@/lib/astro/ephemeris-cache";
import { computeRealtimePositions } from "@/lib/astro/transits";

const DATES = ["2024-01-01", "2025-09-15", "2026-07-15", "2029-12-31", "2032-12-31", "2035-12-31"];

describe("static universal ephemeris", () => {
  it("matches SwissEph daily positions for the generated range", async () => {
    const failures: string[] = [];

    for (const date of DATES) {
      const expected = await computeRealtimePositions(new Date(`${date}T00:00:00.000Z`));
      const actualByDate = await getComputedSkyForDateRange(new Date(`${date}T00:00:00.000Z`), 1, {
        bodies: UNIVERSAL_SKY_BODIES,
      });
      const actual = actualByDate.get(date) ?? [];

      for (const body of UNIVERSAL_SKY_BODIES) {
        const expectedPosition = expected.find((position) => position.name === body);
        const actualPosition = actual.find((position) => position.name === body);
        if (!expectedPosition || !actualPosition) {
          failures.push(`${date} ${body}: missing expected or actual position`);
          continue;
        }

        if (Math.abs(expectedPosition.longitude - actualPosition.longitude) > 0.000001) {
          failures.push(`${date} ${body}: longitude ${actualPosition.longitude} != ${expectedPosition.longitude}`);
        }
        if (Math.abs(expectedPosition.speed - actualPosition.speed) > 0.000001) {
          failures.push(`${date} ${body}: speed ${actualPosition.speed} != ${expectedPosition.speed}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });

  it("serves long date ranges without dropping days", async () => {
    const rows = await getComputedSkyForDateRange(new Date("2026-01-01T00:00:00.000Z"), 486, {
      bodies: UNIVERSAL_SKY_BODIES,
    });

    expect(rows.size).toBe(486);
    expect(rows.get("2026-01-01")?.length).toBe(UNIVERSAL_SKY_BODIES.length);
    expect(rows.get("2027-05-01")?.length).toBe(UNIVERSAL_SKY_BODIES.length);
  });
});
