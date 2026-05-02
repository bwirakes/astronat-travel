#!/usr/bin/env bun
/**
 * backfill-geodetic-house-frame.ts — patch existing readings with the
 * `geodeticHouseFrame` field that the engine started computing in PR #33
 * but only began persisting in PR #34. Pure function from already-persisted
 * data: needs only `details.natalPlanets`, `details.destinationLat`,
 * `details.destinationLon`. No Swiss Ephemeris calls, no AI, no profile
 * lookups. One pass over the readings table.
 *
 * What this DOESN'T backfill:
 *   - activeGeoTransits, personalEclipses, personalLunations, parans
 *     (timing-bound; require re-running the full astrocarto pipeline with
 *      Swiss Ephemeris). For those, the empty-state copy in PlaceFieldTab
 *     now distinguishes "old reading without engine" from "engine ran, sky
 *     truly quiet" via the `geodeticEngineVersion` marker — old readings
 *     stay readable without misleading the user, and a fresh-generate is
 *     the right path to see them.
 *
 * Idempotent — re-running on an already-backfilled row computes the same
 * value and skips the update.
 *
 * Usage:    bun scripts/backfill-geodetic-house-frame.ts          # dry run
 *           bun scripts/backfill-geodetic-house-frame.ts --apply  # writes
 *
 * Env:      NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *           (Bun loads .env.local automatically.)
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { geodeticASCLongitude, geodeticHouseCusps, signFromLongitude } from "@/app/lib/geodetic";

const APPLY = process.argv.includes("--apply");
const PAGE_SIZE = 200;

interface ReadingRow {
    id: string;
    details: any;
}

interface NatalAssignment {
    planet: string;
    longitude: number;
    house: number;
}

interface GeodeticHouseFrame {
    cusps: number[];
    natalAssignments: NatalAssignment[];
}

function computeGeodeticHouseFrame(details: any): GeodeticHouseFrame | null {
    const lat = Number(details?.destinationLat);
    const lon = Number(details?.destinationLon);
    const natalPlanets = Array.isArray(details?.natalPlanets) ? details.natalPlanets : null;
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !natalPlanets || natalPlanets.length === 0) {
        return null;
    }

    const cusps = geodeticHouseCusps(lat, lon);
    if (cusps.length !== 12) return null;

    const ascLon = geodeticASCLongitude(lon, lat);
    const ascSignStart = Math.floor(ascLon / 30) * 30;

    const natalAssignments: NatalAssignment[] = [];
    for (const p of natalPlanets) {
        const longitude = Number(p?.longitude);
        const planet = String(p?.name ?? p?.planet ?? "").trim();
        if (!planet || !Number.isFinite(longitude)) continue;
        const offset = ((longitude - ascSignStart) % 360 + 360) % 360;
        const house = Math.floor(offset / 30) + 1;
        natalAssignments.push({ planet, longitude, house });
    }

    return { cusps, natalAssignments };
}

function frameEqual(a: GeodeticHouseFrame | undefined, b: GeodeticHouseFrame): boolean {
    if (!a || !Array.isArray(a.cusps) || a.cusps.length !== 12) return false;
    if (!Array.isArray(a.natalAssignments) || a.natalAssignments.length !== b.natalAssignments.length) return false;
    for (let i = 0; i < 12; i++) {
        if (Math.abs((a.cusps[i] ?? 0) - b.cusps[i]) > 0.001) return false;
    }
    const aSorted = [...a.natalAssignments].sort((x, y) => x.planet.localeCompare(y.planet));
    const bSorted = [...b.natalAssignments].sort((x, y) => x.planet.localeCompare(y.planet));
    for (let i = 0; i < bSorted.length; i++) {
        if (aSorted[i]?.planet !== bSorted[i].planet) return false;
        if (aSorted[i]?.house !== bSorted[i].house) return false;
    }
    return true;
}

async function main() {
    const supabase = createAdminClient();
    const counts = {
        total: 0,
        patched: 0,
        upToDate: 0,
        skippedMissingInputs: 0,
        errors: 0,
    };

    let from = 0;
    while (true) {
        const { data, error } = await supabase
            .from("readings")
            .select("id, details")
            .order("created_at", { ascending: true })
            .range(from, from + PAGE_SIZE - 1);

        if (error) {
            console.error("Failed to fetch readings page:", error.message);
            process.exit(1);
        }
        if (!data || data.length === 0) break;

        for (const row of data as ReadingRow[]) {
            counts.total++;
            const fresh = computeGeodeticHouseFrame(row.details);
            if (!fresh) {
                counts.skippedMissingInputs++;
                continue;
            }

            const existing = row.details?.geodeticHouseFrame;
            const hasMarker = !!row.details?.geodeticEngineVersion;
            if (frameEqual(existing, fresh) && hasMarker) {
                counts.upToDate++;
                continue;
            }

            counts.patched++;
            const ascSign = signFromLongitude(geodeticASCLongitude(row.details.destinationLon, row.details.destinationLat));
            console.log(
                `[${APPLY ? "apply" : "dry"}] ${row.id} → ${fresh.natalAssignments.length} planets in geodetic frame (asc ${ascSign})`,
            );

            if (APPLY) {
                const newDetails = {
                    ...(row.details ?? {}),
                    geodeticHouseFrame: fresh,
                    geodeticEngineVersion: row.details?.geodeticEngineVersion ?? "2026-05-02-backfill",
                };
                const { error: updErr } = await supabase
                    .from("readings")
                    .update({ details: newDetails })
                    .eq("id", row.id);
                if (updErr) {
                    counts.errors++;
                    console.error(`  update failed: ${updErr.message}`);
                }
            }
        }

        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
    }

    console.log("\n── Summary ──────────────────────────────");
    console.log(`Total rows scanned:        ${counts.total}`);
    console.log(`Patched (frame written):   ${counts.patched}`);
    console.log(`Already up to date:        ${counts.upToDate}`);
    console.log(`Skipped (missing inputs):  ${counts.skippedMissingInputs}`);
    console.log(`Update errors:             ${counts.errors}`);
    if (!APPLY) console.log(`\nDry run only — re-run with --apply to write.`);
    else console.log(`\nDone. Note: live-transit / eclipse / lunation / paran fields are NOT backfilled — those require fresh Swiss Ephemeris and a full reading regenerate.`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
