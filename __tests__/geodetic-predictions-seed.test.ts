/**
 * geodetic-predictions-seed.test.ts
 *
 * Schema-shape parity between the in-memory TS catalog (weather-predictions.ts)
 * and the generated SQL seed file. If anyone edits the catalog without
 * regenerating, this test fails and points them at the script.
 *
 * Pure file-IO + string parsing — no Supabase connection required.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import { ALL_GEODETIC_WEATHER_EVENTS } from "@/app/lib/geodetic/weather-predictions";

const SCHEMA_PATH = resolve(
    process.cwd(),
    "supabase/migrations/20260516000000_geodetic_predictions.sql",
);
const SEED_PATH = resolve(
    process.cwd(),
    "supabase/migrations/20260516000100_geodetic_predictions_seed.sql",
);

const ALLOWED_TYPES = new Set([
    "flood", "wildfire", "storm_cyclone", "earthquake",
    "heatwave", "tornado", "winter_storm", "compound",
]);
const ALLOWED_TIERS = new Set(["critical", "high", "moderate", "watch", "low"]);
const ALLOWED_KINDS = new Set(["forecast", "historical"]);

describe("geodetic_predictions schema migration", () => {
    it("schema migration file exists", () => {
        expect(existsSync(SCHEMA_PATH)).toBe(true);
    });

    it("declares the geodetic_predictions table", () => {
        const sql = readFileSync(SCHEMA_PATH, "utf8");
        expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.geodetic_predictions");
    });

    it("enforces pss range, event_type, tier, and kind via CHECK constraints", () => {
        const sql = readFileSync(SCHEMA_PATH, "utf8");
        expect(sql).toContain("geodetic_predictions_pss_range");
        expect(sql).toContain("geodetic_predictions_kind_valid");
        expect(sql).toContain("geodetic_predictions_tier_valid");
        expect(sql).toContain("geodetic_predictions_event_type_valid");
    });

    it("enables RLS and gates SELECT by is_published", () => {
        const sql = readFileSync(SCHEMA_PATH, "utf8");
        expect(sql).toContain("ALTER TABLE public.geodetic_predictions ENABLE ROW LEVEL SECURITY");
        expect(sql).toContain("is_published = true");
        expect(sql).toContain("FOR SELECT");
    });

    it("does NOT grant INSERT/UPDATE/DELETE to anon or authenticated", () => {
        const sql = readFileSync(SCHEMA_PATH, "utf8");
        // Only an explicit SELECT grant should be present.
        expect(sql).toContain("GRANT SELECT ON public.geodetic_predictions TO anon, authenticated");
        expect(sql).not.toMatch(/GRANT\s+(INSERT|UPDATE|DELETE)/i);
    });
});

describe("geodetic_predictions seed migration", () => {
    it("seed migration file exists", () => {
        expect(existsSync(SEED_PATH)).toBe(true);
    });

    it("uses INSERT ... ON CONFLICT (id) DO UPDATE for idempotency", () => {
        const sql = readFileSync(SEED_PATH, "utf8");
        expect(sql).toContain("INSERT INTO public.geodetic_predictions");
        expect(sql).toContain("ON CONFLICT (id) DO UPDATE");
    });

    it("contains one row per event in the in-memory catalog", () => {
        const sql = readFileSync(SEED_PATH, "utf8");
        // Count rows by counting standalone "('forecast-" + "('historical-" prefixes — each row begins this way.
        const forecastCount = (sql.match(/'forecast-/g) ?? []).length;
        const historicalCount = (sql.match(/'historical-/g) ?? []).length;
        // Every event id appears once in the row tuple (the row uses it as PRIMARY KEY).
        const expectedForecast = ALL_GEODETIC_WEATHER_EVENTS.filter((e) => e.kind === "forecast").length;
        const expectedHistorical = ALL_GEODETIC_WEATHER_EVENTS.filter((e) => e.kind === "historical").length;
        expect(forecastCount).toBeGreaterThanOrEqual(expectedForecast);
        expect(historicalCount).toBeGreaterThanOrEqual(expectedHistorical);
    });

    it("every catalog id appears in the seed SQL", () => {
        const sql = readFileSync(SEED_PATH, "utf8");
        const missing = ALL_GEODETIC_WEATHER_EVENTS.filter((e) => !sql.includes(`'${e.id}'`));
        expect(missing.map((e) => e.id)).toEqual([]);
    });
});

describe("source catalog respects enum constraints", () => {
    it("every event has a valid event_type", () => {
        for (const event of ALL_GEODETIC_WEATHER_EVENTS) {
            expect(ALLOWED_TYPES.has(event.type)).toBe(true);
        }
    });

    it("every event has a valid tier", () => {
        for (const event of ALL_GEODETIC_WEATHER_EVENTS) {
            expect(ALLOWED_TIERS.has(event.tier)).toBe(true);
        }
    });

    it("every event has a valid kind", () => {
        for (const event of ALL_GEODETIC_WEATHER_EVENTS) {
            expect(ALLOWED_KINDS.has(event.kind)).toBe(true);
        }
    });

    it("every PSS is within [0, 1]", () => {
        for (const event of ALL_GEODETIC_WEATHER_EVENTS) {
            expect(event.pss).toBeGreaterThanOrEqual(0);
            expect(event.pss).toBeLessThanOrEqual(1);
        }
    });

    it("every event has a non-empty unique id", () => {
        const ids = new Set<string>();
        for (const event of ALL_GEODETIC_WEATHER_EVENTS) {
            expect(event.id.length).toBeGreaterThan(0);
            expect(ids.has(event.id)).toBe(false);
            ids.add(event.id);
        }
    });
});
