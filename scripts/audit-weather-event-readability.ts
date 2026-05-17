/**
 * audit-weather-event-readability.ts
 *
 * Pulls a diverse set of weather events and reports the concrete readability
 * issues each one would surface on the new banner detail page.
 *
 *   bun run scripts/audit-weather-event-readability.ts
 *
 * Per-event analysis:
 *   - title length / word count (mobile clip risk)
 *   - editorial body length + unicode astro-glyph count (emoji issue)
 *   - zone count + longest zone label (geodetic card density)
 *   - criteria string length (criteria checklist density)
 *   - stars count
 *   - whether the body opens with a quotable insight (pull-quote candidate)
 */
/* eslint-disable no-console */

import { ALL_GEODETIC_WEATHER_EVENTS } from "@/app/lib/geodetic/weather-predictions";

// Astrological glyphs that render as emoji-style (purple box) in body text.
const ZODIAC_GLYPHS = /[♈-♓]/g; // ♈♉♊♋♌♍♎♏♐♑♒♓
const PLANET_GLYPHS = /[☿-♇⯐-⯿⚷-⚸]/g; // mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto, chiron, eris
const ASPECT_GLYPHS = /[☊-☍⚝]/g; // ☌ ☍ □

interface Audit {
    id: string;
    title: string;
    type: string;
    pss: number;
    tier: string;
    titleChars: number;
    titleWords: number;
    bodyChars: number;
    bodyWords: number;
    bodyGlyphCount: number;
    bodyExample: string;
    zoneCount: number;
    longestZoneChars: number;
    starsCount: number;
    criteriaChars: number;
    pullQuoteCandidate: string | null;
}

function audit(event: typeof ALL_GEODETIC_WEATHER_EVENTS[0]): Audit {
    const body = event.editorialBody || "";
    const zodiacHits = (body.match(ZODIAC_GLYPHS) ?? []).length;
    const planetHits = (body.match(PLANET_GLYPHS) ?? []).length;
    const aspectHits = (body.match(ASPECT_GLYPHS) ?? []).length;
    const totalGlyphs = zodiacHits + planetHits + aspectHits;

    // Pull-quote candidate: first sentence that contains a superlative or rarity claim.
    const sentences = body.split(/(?<=[.!?])\s+/);
    const quoteCandidate = sentences.find((s) =>
        /rarest|first|deadliest|costliest|since|historic|extreme|worst|record|9,000|10,000|catastrophic/i.test(s),
    ) ?? null;

    return {
        id: event.id,
        title: event.title,
        type: event.type,
        pss: event.pss,
        tier: event.tier,
        titleChars: event.title.length,
        titleWords: event.title.split(/\s+/).length,
        bodyChars: body.length,
        bodyWords: body.split(/\s+/).length,
        bodyGlyphCount: totalGlyphs,
        bodyExample: body.slice(0, 240) + (body.length > 240 ? "…" : ""),
        zoneCount: event.zones.length,
        longestZoneChars: event.zones.reduce((max, z) => Math.max(max, z.length), 0),
        starsCount: event.stars.length,
        criteriaChars: event.criteria.key.length,
        pullQuoteCandidate: quoteCandidate ? quoteCandidate.trim() : null,
    };
}

const PICKS = [
    "forecast-2026-02-17-annular-eclipse-and-saturn-neptune-world-point", // user's screenshot
    "forecast-2026-08-12-pair-b-total-solar-eclipse-maximum",               // highest-PSS compound
    "historical-2024-09-26-hurricane-helene-cat-4-deadliest-us-since-katrina", // historical flood w/ deaths
    "historical-2025-01-07-la-palisades-eaton-fires-costliest-wildfires-in-world-history", // wildfire, long title
    "forecast-2026-06-30-jupiter-leo-wildfire-corridor-opens",              // short forecast
];

function bar(label: string, value: number, threshold: number, max: number = 80): string {
    const ratio = Math.min(1, value / max);
    const filled = Math.round(ratio * 24);
    const status = value > threshold ? "⚠ " : "  ";
    return `${status}${label.padEnd(22)} ${String(value).padStart(4)} ${"█".repeat(filled).padEnd(24)} ${value > threshold ? `(>${threshold} — issue)` : "(ok)"}`;
}

function main() {
    console.log("=".repeat(96));
    console.log(" WEATHER EVENT READABILITY AUDIT");
    console.log("=".repeat(96));
    console.log();

    for (const id of PICKS) {
        const event = ALL_GEODETIC_WEATHER_EVENTS.find((e) => e.id === id);
        if (!event) {
            console.log(`! Missing: ${id}\n`);
            continue;
        }
        const a = audit(event);
        console.log("─".repeat(96));
        console.log(` ${a.title}`);
        console.log(`   ${a.id}`);
        console.log(`   type=${a.type}  pss=${a.pss.toFixed(2)}  tier=${a.tier}`);
        console.log("─".repeat(96));
        console.log();
        console.log("  METRICS  (⚠ = readability issue threshold exceeded)");
        console.log("  " + bar("title chars",        a.titleChars,       50, 100));
        console.log("  " + bar("title words",        a.titleWords,        7, 20));
        console.log("  " + bar("body words",         a.bodyWords,        60, 120));
        console.log("  " + bar("body chars",         a.bodyChars,       400, 800));
        console.log("  " + bar("astro-glyph count",  a.bodyGlyphCount,    4, 20));
        console.log("  " + bar("zone count",         a.zoneCount,         4, 8));
        console.log("  " + bar("longest zone chars", a.longestZoneChars, 50, 100));
        console.log("  " + bar("stars count",        a.starsCount,        4, 8));
        console.log("  " + bar("criteria chars",     a.criteriaChars,   200, 400));
        console.log();
        console.log("  BODY OPENER (first 240 chars — what user sees first):");
        console.log(`    "${a.bodyExample}"`);
        console.log();
        if (a.pullQuoteCandidate) {
            console.log("  ✦ PULL-QUOTE CANDIDATE:");
            console.log(`    "${a.pullQuoteCandidate.slice(0, 160)}${a.pullQuoteCandidate.length > 160 ? "…" : ""}"`);
            console.log();
        }
        console.log("  PREDICTED ISSUES ON CURRENT BANNER (P0 fix targets):");
        if (a.titleChars > 50) console.log(`    ✗ Title clips behind PSS pill on mobile (${a.titleChars} chars > 50)`);
        if (a.bodyGlyphCount > 4) console.log(`    ✗ ${a.bodyGlyphCount} Unicode astro-glyphs render as emoji boxes`);
        if (a.bodyWords > 60) console.log(`    ✗ Body wall-of-text (${a.bodyWords} words) — needs pull quote + fact strip`);
        if (a.zoneCount > 4) console.log(`    ✗ ${a.zoneCount} zones flat-list — need cards with hierarchy`);
        if (a.longestZoneChars > 50) console.log(`    ✗ Zones are long parenthetical strings — need parse/split`);
        if (a.starsCount > 4) console.log(`    ✗ ${a.starsCount} stars in flat pill row — should be tagged card`);
        if (a.criteriaChars > 200) console.log(`    ✗ Criteria key string ${a.criteriaChars} chars — split into chips`);
        console.log();
    }

    console.log("=".repeat(96));
    console.log(" SUMMARY — Issue frequency across the 5 picks");
    console.log("=".repeat(96));
    const audits = PICKS
        .map((id) => ALL_GEODETIC_WEATHER_EVENTS.find((e) => e.id === id))
        .filter((e): e is typeof ALL_GEODETIC_WEATHER_EVENTS[0] => e !== undefined)
        .map(audit);

    const tally = {
        titleClipping:    audits.filter((a) => a.titleChars > 50).length,
        emojiGlyphs:      audits.filter((a) => a.bodyGlyphCount > 4).length,
        wallOfText:       audits.filter((a) => a.bodyWords > 60).length,
        zonesNeedCards:   audits.filter((a) => a.zoneCount > 4).length,
        longZoneStrings:  audits.filter((a) => a.longestZoneChars > 50).length,
        starsOverflow:    audits.filter((a) => a.starsCount > 4).length,
        criteriaOverflow: audits.filter((a) => a.criteriaChars > 200).length,
    };
    for (const [key, count] of Object.entries(tally)) {
        console.log(`  ${key.padEnd(20)} ${count}/${audits.length} events affected ${count > 0 ? "→ P0" : ""}`);
    }
}

main();
