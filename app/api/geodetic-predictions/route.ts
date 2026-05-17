/**
 * GET /api/geodetic-predictions
 *
 * Returns the global geodetic prediction catalog from
 * public.geodetic_predictions. Cached at the Next.js layer with the
 * `geodetic-predictions` tag — bust via POST /api/geodetic-predictions/revalidate
 * after editing rows in the Supabase dashboard.
 *
 * Query params (all optional):
 *   ?type=flood|wildfire|storm_cyclone|earthquake|heatwave|tornado|winter_storm|compound
 *   ?kind=forecast|historical
 *   ?from=YYYY-MM-DD
 *   ?to=YYYY-MM-DD
 *
 * No personalization — same response for every caller.
 */

import { NextResponse, type NextRequest } from "next/server";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic"; // route runs on every request — caching is handled by unstable_cache inside
export const runtime = "nodejs";

const CACHE_TAG = "geodetic-predictions";
const CACHE_REVALIDATE_SECONDS = 3600; // 1h

const VALID_EVENT_TYPES = new Set([
    "flood",
    "wildfire",
    "storm_cyclone",
    "earthquake",
    "heatwave",
    "tornado",
    "winter_storm",
    "compound",
]);

const VALID_KINDS = new Set(["forecast", "historical"]);

export interface GeodeticPredictionRow {
    id: string;
    prediction_date: string;
    date_label: string | null;
    title: string;
    event_type: string;
    kind: "forecast" | "historical";
    pss: number;
    tier: "critical" | "high" | "moderate" | "watch" | "low";
    model_version: string | null;
    area_label: string | null;
    zones: string[];
    bbox_lat_min: number | null;
    bbox_lat_max: number | null;
    bbox_lon_min: number | null;
    bbox_lon_max: number | null;
    stars: string[];
    pair: string | null;
    geostress: string | null;
    criteria: { met: number; total: number; key: string };
    combo: string | null;
    notes: string | null;
    editorial_body: string | null;
    severity: number | null;
    deaths: number | null;
    damage_billions: number | null;
    source: string | null;
    source_note: string | null;
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Cached catalog fetch. Cache is shared across all callers because there is no
 * per-user data in this table. Key is empty — every request gets the same row set.
 */
const fetchCatalog = unstable_cache(
    async (): Promise<GeodeticPredictionRow[]> => {
        const admin = createAdminClient();
        const { data, error } = await admin
            .from("geodetic_predictions")
            .select("*")
            .eq("is_published", true)
            .order("prediction_date", { ascending: false });
        if (error) throw new Error(`geodetic_predictions read failed: ${error.message}`);
        return (data ?? []) as GeodeticPredictionRow[];
    },
    ["geodetic-predictions-all"],
    { tags: [CACHE_TAG], revalidate: CACHE_REVALIDATE_SECONDS },
);

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type");
    const kind = searchParams.get("kind");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Validate query params FIRST so bad input fails fast without touching the DB.
    if (type && !VALID_EVENT_TYPES.has(type)) {
        return NextResponse.json({ error: `invalid type=${type}` }, { status: 400 });
    }
    if (kind && !VALID_KINDS.has(kind)) {
        return NextResponse.json({ error: `invalid kind=${kind}` }, { status: 400 });
    }
    if (from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) {
        return NextResponse.json({ error: `invalid from=${from} (expected YYYY-MM-DD)` }, { status: 400 });
    }
    if (to && !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
        return NextResponse.json({ error: `invalid to=${to} (expected YYYY-MM-DD)` }, { status: 400 });
    }

    try {
        const all = await fetchCatalog();
        let rows = all;
        if (type) rows = rows.filter((r) => r.event_type === type);
        if (kind) rows = rows.filter((r) => r.kind === kind);
        if (from) rows = rows.filter((r) => r.prediction_date >= from);
        if (to)   rows = rows.filter((r) => r.prediction_date <= to);

        return NextResponse.json({
            count: rows.length,
            totalCatalogSize: all.length,
            rows,
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "unknown error" },
            { status: 500 },
        );
    }
}
