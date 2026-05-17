/**
 * seed-geodetic-predictions.ts
 *
 * Generates `supabase/migrations/20260516000100_geodetic_predictions_seed.sql`
 * from the in-memory TypeScript catalog (`weather-predictions.ts`).
 *
 *   bun run scripts/seed-geodetic-predictions.ts
 *
 * The output is idempotent — uses INSERT … ON CONFLICT (id) DO UPDATE — so
 * re-running it overwrites the existing row content while preserving any DB-only
 * columns (timestamps, is_published if a curator toggled it).
 *
 * After regenerating, `supabase db push` (or whatever your deploy flow is) will
 * upsert the catalog into the public.geodetic_predictions table.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
    ALL_GEODETIC_WEATHER_EVENTS,
} from "@/app/lib/geodetic/weather-predictions";

const OUT_PATH = resolve(
    process.cwd(),
    "supabase/migrations/20260516000100_geodetic_predictions_seed.sql",
);

function sqlString(value: string | null | undefined): string {
    if (value == null) return "NULL";
    return `'${value.replace(/'/g, "''")}'`;
}

function sqlJson(value: unknown): string {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
}

function sqlNumber(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return "NULL";
    return String(value);
}

function sqlInt(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return "NULL";
    return String(Math.trunc(value));
}

/** Picks the first "Area" mentioned for an event — uses the first zone label as a friendly area string. */
function deriveAreaLabel(zones: string[], notes: string | undefined, combo: string | undefined): string | null {
    if (zones.length > 0) {
        // Zone strings look like: "UK / Ghana / Nigeria (0°E — Sa☌Ne world point)".
        // Strip the parenthetical to get "UK / Ghana / Nigeria".
        const first = zones[0];
        const paren = first.indexOf("(");
        return paren > 0 ? first.slice(0, paren).trim() : first.trim();
    }
    // Historical events sometimes have area in the title (after "—") or in notes.
    const fromCombo = combo ?? notes ?? "";
    const match = fromCombo.match(/\b(US|UK|Europe|Asia|Atlantic|Pacific|Caribbean|Mediterranean|SE Asia|Indonesia|Philippines|Spain|Italy|Greece|Germany|Japan|China|India|Pakistan|Sri Lanka|Thailand|Vietnam|Mexico|Florida|Texas|California|Australia|New Zealand)\b/);
    return match ? match[0] : null;
}

function rowValues(row: {
    id: string;
    date: string;
    title: string;
    type: string;
    kind: string;
    pss: number;
    tier: string;
    stars: string[];
    zones: string[];
    pair: string | null;
    geostress: string | null;
    criteria: unknown;
    combo: string | null | undefined;
    editorialBody: string;
    notes: string | undefined;
    severity: number | undefined;
    deaths: number | undefined;
    damageBillions: number | undefined;
    source: string | undefined;
    sourceNote: string | undefined;
}): string {
    const areaLabel = deriveAreaLabel(row.zones, row.notes, row.combo ?? undefined);
    return [
        sqlString(row.id),
        sqlString(row.date),               // prediction_date (DATE — Postgres parses ISO string)
        sqlString(row.date),               // date_label
        sqlString(row.title),
        sqlString(row.type),
        sqlString(row.kind),
        sqlNumber(Number(row.pss.toFixed(3))),
        sqlString(row.tier),
        "NULL",                            // model_version — leave NULL until scoring engine writes it
        sqlString(areaLabel),
        sqlJson(row.zones),
        "NULL", "NULL", "NULL", "NULL",    // bbox lat/lon — defer to compute step
        sqlJson(row.stars),
        sqlString(row.pair),
        sqlString(row.geostress),
        sqlJson(row.criteria),
        sqlString(row.combo ?? null),
        sqlString(row.notes ?? null),
        sqlString(row.editorialBody),
        sqlInt(row.severity ?? null),
        sqlInt(row.deaths ?? null),
        sqlNumber(row.damageBillions ?? null),
        sqlString(row.source ?? null),
        sqlString(row.sourceNote ?? null),
    ].join(", ");
}

function main() {
    const header = `-- AUTO-GENERATED — do not hand-edit.
-- Source: scripts/seed-geodetic-predictions.ts
-- Catalog: app/lib/geodetic/weather-predictions.ts
-- Generated: ${new Date().toISOString()}
--
-- Regenerate with: bun run scripts/seed-geodetic-predictions.ts
--
-- Uses ON CONFLICT (id) DO UPDATE so re-running this migration is safe and
-- updates row content from the latest TS source.

`;

    const columns = [
        "id",
        "prediction_date",
        "date_label",
        "title",
        "event_type",
        "kind",
        "pss",
        "tier",
        "model_version",
        "area_label",
        "zones",
        "bbox_lat_min",
        "bbox_lat_max",
        "bbox_lon_min",
        "bbox_lon_max",
        "stars",
        "pair",
        "geostress",
        "criteria",
        "combo",
        "notes",
        "editorial_body",
        "severity",
        "deaths",
        "damage_billions",
        "source",
        "source_note",
    ];

    const updateSet = columns
        .filter((c) => c !== "id")
        .map((c) => `  ${c} = EXCLUDED.${c}`)
        .join(",\n");

    const rows = ALL_GEODETIC_WEATHER_EVENTS.map((event) => {
        return `(${rowValues({
            id: event.id,
            date: event.date,
            title: event.title,
            type: event.type,
            kind: event.kind,
            pss: event.pss,
            tier: event.tier,
            stars: event.stars,
            zones: event.zones,
            pair: event.pair,
            geostress: event.geostress,
            criteria: event.criteria,
            combo: event.combo ?? null,
            editorialBody: event.editorialBody,
            notes: event.notes,
            severity: event.severity,
            deaths: event.deaths,
            damageBillions: event.damageBillions,
            source: event.source,
            sourceNote: event.sourceNote,
        })})`;
    });

    const body = `INSERT INTO public.geodetic_predictions (
  ${columns.join(",\n  ")}
) VALUES
${rows.join(",\n")}
ON CONFLICT (id) DO UPDATE SET
${updateSet};
`;

    writeFileSync(OUT_PATH, header + body);
    console.log(`✓ Wrote ${OUT_PATH} (${rows.length} rows)`);
}

main();
