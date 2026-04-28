#!/usr/bin/env bun
/**
 * backfill-hero-score.ts — recompute readings.reading_score using the same
 * fallback ladder app/lib/hero-score.ts uses at write time.
 *
 * Existing rows have reading_score = details.macroScore (place fit), but the
 * reading detail page derives a date+goal-adjusted score live, so the list
 * and the detail page disagree. This script writes the date+goal score back
 * to the column once so every surface reads the same number.
 *
 * Idempotent — re-running on an already-backfilled row computes the same
 * value and skips the update.
 *
 * Usage:    bun scripts/backfill-hero-score.ts          # dry run, prints diff
 *           bun scripts/backfill-hero-score.ts --apply  # writes to Supabase
 *
 * Env:      NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *           (Bun loads .env.local automatically.)
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { computeHeroScore } from "@/app/lib/hero-score";

const APPLY = process.argv.includes("--apply");
const PAGE_SIZE = 200;

interface ReadingRow {
    id: string;
    reading_date: string | null;
    reading_score: number | null;
    details: any;
}

async function main() {
    const supabase = createAdminClient();
    const counts = { total: 0, changed: 0, unchanged: 0, missingInputs: 0, errors: 0 };
    const sourceCounts: Record<string, number> = {};

    let from = 0;
    while (true) {
        const { data, error } = await supabase
            .from("readings")
            .select("id, reading_date, reading_score, details")
            .order("created_at", { ascending: true })
            .range(from, from + PAGE_SIZE - 1);

        if (error) {
            console.error("Failed to fetch readings page:", error.message);
            process.exit(1);
        }
        if (!data || data.length === 0) break;

        for (const row of data as ReadingRow[]) {
            counts.total++;
            const hero = computeHeroScore(row.details, row.reading_date);
            sourceCounts[hero.source] = (sourceCounts[hero.source] ?? 0) + 1;

            const persistedSource = row.details?.heroScoreSource;
            const persistedScore = row.details?.heroWindowScore;
            const isAlreadyCorrect =
                row.reading_score === hero.score &&
                persistedScore === hero.score &&
                persistedSource === hero.source;

            if (isAlreadyCorrect) {
                counts.unchanged++;
                continue;
            }

            if (hero.source === "macro-fallback" && hero.score === row.reading_score) {
                // Same headline number, but details fields are missing the
                // provenance markers. Worth backfilling provenance so the
                // detail page can read them, but mark separately.
                counts.missingInputs++;
            } else {
                counts.changed++;
            }

            const newDetails = {
                ...(row.details ?? {}),
                heroWindowScore: hero.score,
                heroScoreSource: hero.source,
            };

            console.log(
                `[${APPLY ? "apply" : "dry"}] ${row.id} ${row.reading_score} → ${hero.score} (${hero.source})`,
            );

            if (APPLY) {
                const { error: updErr } = await supabase
                    .from("readings")
                    .update({ reading_score: hero.score, details: newDetails })
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
    console.log(`Total rows scanned:     ${counts.total}`);
    console.log(`Score changed:          ${counts.changed}`);
    console.log(`Provenance only:        ${counts.missingInputs}`);
    console.log(`Already up to date:     ${counts.unchanged}`);
    console.log(`Update errors:          ${counts.errors}`);
    console.log(`\nBy source:`);
    Object.entries(sourceCounts)
        .sort(([, a], [, b]) => b - a)
        .forEach(([k, v]) => console.log(`  ${k.padEnd(20)} ${v}`));
    if (!APPLY) console.log(`\nDry run only — re-run with --apply to write.`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
