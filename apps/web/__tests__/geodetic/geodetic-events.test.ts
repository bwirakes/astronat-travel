import { describe, expect, it } from "bun:test";
import { ECLIPSES, LUNATIONS } from "@/app/lib/geodetic/geodetic-events";

describe("LUNATIONS table", () => {
    // Eclipses are scored by `scorePersonalEclipses`; lunations by
    // `scorePersonalLunations`. Both route to the same per-house bucket on
    // the same date, so a duplicated date would double-count against the
    // user's score. Keep the two tables disjoint.
    it("contains no eclipse-grade lunations", () => {
        const ONE_DAY_MS = 86400000;
        const collisions = LUNATIONS.flatMap((l) => {
            const lt = new Date(l.dateUtc).getTime();
            return ECLIPSES.filter(
                (e) => Math.abs(new Date(e.dateUtc).getTime() - lt) < ONE_DAY_MS,
            ).map((e) => `${l.dateUtc} ↔ ${e.dateUtc}`);
        });
        expect(collisions).toEqual([]);
    });
});
