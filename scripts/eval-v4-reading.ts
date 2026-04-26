#!/usr/bin/env bun
/**
 * eval-v4-reading.ts — quick audit of how much of the V4 reading view is
 * actually data-driven vs hardcoded.
 *
 * Each slot in the V4 view (a piece of user-facing content) is classified by
 * its source. The script totals up a score so we can see whether a refactor
 * actually moved the needle.
 *
 * Usage:  bun scripts/eval-v4-reading.ts
 *
 * The slot catalogue is curated by hand because static analysis of JSX would
 * be brittle and would miss "this string is sometimes overridden by the
 * teacherReading prompt." When you change the view-model or the V4 view, just
 * edit the catalogue below.
 */

type Source =
    | "HARDCODED"          // Always the same string regardless of input
    | "TEMPLATED"          // Slot-filled string (data-aware, but not AI)
    | "PROMPT_OR_FALLBACK" // Prompt-driven when present, hardcoded fallback
    | "PROMPT"             // Prompt-driven only (no fallback)
    | "COMPUTED"           // Derived from chart math
    | "BROKEN";            // Currently renders "—" / placeholder

const WEIGHT: Record<Source, number> = {
    HARDCODED: 0,
    TEMPLATED: 1,
    PROMPT_OR_FALLBACK: 2,
    PROMPT: 3,
    COMPUTED: 3,
    BROKEN: -1, // visible regression — counts against the score
};

interface Slot {
    step: string;
    name: string;
    before: Source;
    after?: Source;
    notes?: string;
}

// ─────────────────────────────────────────────────────────────────────
// Slot catalogue — edit `before` to record baseline, `after` to record
// post-fix. Anything without `after` set is read as "unchanged."
// ─────────────────────────────────────────────────────────────────────

const SLOTS: Slot[] = [
    // STEP 1 — hero
    { step: "1 hero", name: "Kicker 'A reading for {city}'",        before: "TEMPLATED",          after: "TEMPLATED" },
    { step: "1 hero", name: "Headline copy ('Your dates: X')",       before: "TEMPLATED",          after: "TEMPLATED" },
    { step: "1 hero", name: "Hero dates",                            before: "COMPUTED",           after: "COMPUTED",  notes: "Now anchored on user's travelDate (Fix 1)" },
    { step: "1 hero", name: "Hero score",                            before: "HARDCODED",          after: "COMPUTED",  notes: "Now scoreDate(travelDate, transits, baselineMacro)" },
    { step: "1 hero", name: "Explainer paragraph",                   before: "PROMPT_OR_FALLBACK", after: "PROMPT_OR_FALLBACK" },
    { step: "1 hero", name: "Bar label 'how well it matches you'",   before: "HARDCODED",          after: "HARDCODED" },
    { step: "1 hero", name: "Scroll hint ('keep reading')",          before: "HARDCODED",          after: "HARDCODED" },

    // STEP 2 — alternate windows
    { step: "2 win",  name: "Section heading 'If you can shift your dates.'", before: "HARDCODED",          after: "HARDCODED" },
    { step: "2 win",  name: "Section intro paragraph",               before: "HARDCODED",          after: "HARDCODED" },
    { step: "2 win",  name: "Window flavor labels (now offset labels)", before: "HARDCODED",       after: "TEMPLATED",         notes: "'Two weeks earlier' / 'A month later' — derived from offset" },
    { step: "2 win",  name: "Window flavor titles",                  before: "PROMPT_OR_FALLBACK", after: "TEMPLATED",         notes: "Pulled from buildScoredWindows labels" },
    { step: "2 win",  name: "Window dates",                          before: "COMPUTED",           after: "COMPUTED" },
    { step: "2 win",  name: "Window scores",                         before: "HARDCODED",          after: "COMPUTED",          notes: "Real per-date scores from window-scoring.ts" },
    { step: "2 win",  name: "Window notes (drivers)",                before: "TEMPLATED",          after: "COMPUTED",          notes: "Top transits driving each window's score" },

    // STEP 3 — vibes
    { step: "3 vibes",name: "Section heading 'Why {city}, for you.'",before: "TEMPLATED",          after: "TEMPLATED" },
    { step: "3 vibes",name: "Section intro paragraph",               before: "HARDCODED",          after: "PROMPT_OR_FALLBACK", notes: "Now chrome.step3Intro" },
    { step: "3 vibes",name: "Vibe icons",                            before: "HARDCODED",          after: "PROMPT_OR_FALLBACK", notes: "Prompt can override; goal preset fallback" },
    { step: "3 vibes",name: "Vibe titles",                           before: "PROMPT_OR_FALLBACK", after: "PROMPT_OR_FALLBACK" },
    { step: "3 vibes",name: "Vibe bodies",                           before: "PROMPT_OR_FALLBACK", after: "PROMPT_OR_FALLBACK" },
    { step: "3 vibes",name: "Vibe score (when shown)",               before: "COMPUTED",           after: "COMPUTED",           notes: "Now derived from matrixResult.houses[] directly" },
    { step: "3 vibes",name: "House attribution shown to user",       before: "HARDCODED",          after: "COMPUTED",           notes: "New row: '5th: 78 · 7th: 81' under each vibe" },

    // STEP 4 — chart
    { step: "4 chart",name: "Section heading 'Month by month.'",     before: "HARDCODED",          after: "HARDCODED" },
    { step: "4 chart",name: "Section intro paragraph",               before: "HARDCODED",          after: "HARDCODED" },
    { step: "4 chart",name: "Chart angles (positions)",              before: "COMPUTED",           after: "COMPUTED" },
    { step: "4 chart",name: "Natal planet positions",                before: "COMPUTED",           after: "COMPUTED" },
    { step: "4 chart",name: "Transit planet positions (post fix)",   before: "COMPUTED",           after: "COMPUTED" },
    { step: "4 chart",name: "Aspect tooltip 'why' prose",            before: "PROMPT_OR_FALLBACK", after: "PROMPT_OR_FALLBACK" },
    { step: "4 chart",name: "Aspect tooltip 'timing' prose",         before: "PROMPT_OR_FALLBACK", after: "PROMPT_OR_FALLBACK" },
    { step: "4 chart",name: "How-to-read hint",                      before: "HARDCODED",          after: "HARDCODED" },
    { step: "4 chart",name: "Six legend rows",                       before: "HARDCODED",          after: "HARDCODED" },
    { step: "4 chart",name: "Callout under chart",                   before: "HARDCODED",          after: "HARDCODED" },

    // STEP 5 — todos
    { step: "5 todo", name: "Section heading 'What to do with this.'", before: "HARDCODED",        after: "HARDCODED" },
    { step: "5 todo", name: "Headline todo",                         before: "TEMPLATED",          after: "TEMPLATED" },
    { step: "5 todo", name: "Goal/travelType todos (2-3)",           before: "PROMPT_OR_FALLBACK", after: "PROMPT_OR_FALLBACK" },

    // STEP 6 — disclosure
    { step: "6 astro",name: "Disclosure label + sub",                before: "HARDCODED",          after: "HARDCODED" },
    { step: "6 astro",name: "Lines list (data)",                     before: "COMPUTED",           after: "COMPUTED" },
    { step: "6 astro",name: "Line notes",                            before: "TEMPLATED",          after: "TEMPLATED" },
    { step: "6 astro",name: "Weekly narrative",                      before: "PROMPT_OR_FALLBACK", after: "PROMPT_OR_FALLBACK" },

    // STEP 7 — relocated chart
    { step: "7 reloc",name: "Section heading 'Your chart, relocated to {city}.'", before: "TEMPLATED",          after: "TEMPLATED" },
    { step: "7 reloc",name: "Section intro paragraph",               before: "HARDCODED",          after: "PROMPT_OR_FALLBACK", notes: "Now chrome.step7Intro" },
    { step: "7 reloc",name: "Natal pole place",                      before: "BROKEN",             after: "COMPUTED",           notes: "Now reads reading.birth.city (persisted in Fix 3)" },
    { step: "7 reloc",name: "Natal pole coords",                     before: "BROKEN",             after: "COMPUTED",           notes: "Now reads reading.birth.lat/lon" },
    { step: "7 reloc",name: "Natal pole date",                       before: "BROKEN",             after: "COMPUTED",           notes: "Now reads reading.birth.date" },
    { step: "7 reloc",name: "Travel pole place/coords/window",       before: "COMPUTED",           after: "COMPUTED" },
    { step: "7 reloc",name: "Angles natal sign/deg",                 before: "COMPUTED",           after: "COMPUTED" },
    { step: "7 reloc",name: "Angles relocated sign/deg",             before: "COMPUTED",           after: "COMPUTED" },
    { step: "7 reloc",name: "Angle deltas prose",                    before: "PROMPT_OR_FALLBACK", after: "PROMPT_OR_FALLBACK" },
    { step: "7 reloc",name: "Angle plain labels ('How you come across')", before: "HARDCODED",     after: "HARDCODED" },
    { step: "7 reloc",name: "Angles sub-heading",                    before: "HARDCODED",          after: "PROMPT_OR_FALLBACK", notes: "Now chrome.step7AnglesSub" },
    { step: "7 reloc",name: "Planets-in-houses table headers",       before: "HARDCODED",          after: "HARDCODED" },
    { step: "7 reloc",name: "Natal house column",                    before: "BROKEN",             after: "COMPUTED",           notes: "Derived from natalAngles.ASC + planet longitude" },
    { step: "7 reloc",name: "Relocated house column",                before: "COMPUTED",           after: "COMPUTED" },
    { step: "7 reloc",name: "Houses sub-heading",                    before: "HARDCODED",          after: "PROMPT_OR_FALLBACK", notes: "Now chrome.step7HousesSub" },
    { step: "7 reloc",name: "Planet shifts prose",                   before: "PROMPT_OR_FALLBACK", after: "PROMPT_OR_FALLBACK" },
    { step: "7 reloc",name: "Aspects sub-heading + intro",           before: "HARDCODED",          after: "PROMPT_OR_FALLBACK", notes: "Now chrome.step7AspectsSub" },
    { step: "7 reloc",name: "Aspect orbs",                           before: "COMPUTED",           after: "COMPUTED" },
    { step: "7 reloc",name: "Aspect plain prose",                    before: "PROMPT_OR_FALLBACK", after: "PROMPT_OR_FALLBACK" },
    { step: "7 reloc",name: "Aspect 'wasNatal' prose",               before: "PROMPT_OR_FALLBACK", after: "PROMPT_OR_FALLBACK" },
    { step: "7 reloc",name: "Glossary entries (4) — definitions",    before: "HARDCODED",          after: "HARDCODED" },
    { step: "7 reloc",name: "Glossary entries — links to /learn",    before: "BROKEN",             after: "TEMPLATED",          notes: "Now <Link href='/learn/<slug>'>" },
    { step: "7 reloc",name: "Learn-more links (3)",                  before: "BROKEN",             after: "TEMPLATED",          notes: "Real /learn URLs (geodetic-astrology, astrocartography, /learn)" },

    // FOOTER
    { step: "foot",   name: "Footer paragraph",                      before: "HARDCODED",          after: "HARDCODED" },
    { step: "foot",   name: "Footer meta line",                      before: "TEMPLATED",          after: "TEMPLATED" },
];

// ─────────────────────────────────────────────────────────────────────
// Reporting
// ─────────────────────────────────────────────────────────────────────

function pad(s: string, n: number): string {
    return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
}

function colourFor(src: Source): string {
    if (src === "HARDCODED")          return "\x1b[31m"; // red
    if (src === "BROKEN")             return "\x1b[31m\x1b[1m"; // bold red
    if (src === "TEMPLATED")          return "\x1b[33m"; // yellow
    if (src === "PROMPT_OR_FALLBACK") return "\x1b[36m"; // cyan
    if (src === "PROMPT")             return "\x1b[32m"; // green
    if (src === "COMPUTED")           return "\x1b[32m"; // green
    return "\x1b[0m";
}
const RESET = "\x1b[0m";

function score(slots: Slot[], col: "before" | "after"): { sum: number; max: number; pct: number } {
    const max = slots.length * 3;
    let sum = 0;
    for (const s of slots) {
        const src = (col === "after" ? s.after : s.before) ?? s.before;
        sum += WEIGHT[src];
    }
    return { sum, max, pct: Math.round((sum / max) * 100) };
}

function bucketCounts(slots: Slot[], col: "before" | "after"): Record<Source, number> {
    const counts: Record<Source, number> = { HARDCODED: 0, TEMPLATED: 0, PROMPT_OR_FALLBACK: 0, PROMPT: 0, COMPUTED: 0, BROKEN: 0 };
    for (const s of slots) {
        const src = (col === "after" ? s.after : s.before) ?? s.before;
        counts[src]++;
    }
    return counts;
}

function printReport() {
    const showAfter = SLOTS.some(s => s.after);

    console.log("\n┌─ V4 Reading audit ─────────────────────────────────────────────────────");
    console.log("│");

    let prev = "";
    for (const s of SLOTS) {
        if (s.step !== prev) {
            console.log(`│  · ${s.step}`);
            prev = s.step;
        }
        const before = s.before;
        const after = s.after ?? s.before;
        const beforeStr = `${colourFor(before)}${pad(before, 18)}${RESET}`;
        const arrow = s.after ? (s.after !== s.before ? "→" : " ") : " ";
        const afterStr = showAfter ? `${arrow} ${colourFor(after)}${pad(after, 18)}${RESET}` : "";
        console.log(`│      ${pad(s.name, 56)} ${beforeStr} ${afterStr}${s.notes ? `  // ${s.notes}` : ""}`);
    }

    const before = score(SLOTS, "before");
    const after  = score(SLOTS, "after");
    const beforeBuckets = bucketCounts(SLOTS, "before");
    const afterBuckets  = bucketCounts(SLOTS, "after");

    console.log("│");
    console.log("├─ Bucket counts ───────────────────────────────────────────────────────");
    for (const k of ["HARDCODED", "BROKEN", "TEMPLATED", "PROMPT_OR_FALLBACK", "PROMPT", "COMPUTED"] as Source[]) {
        const b = beforeBuckets[k];
        const a = afterBuckets[k];
        const delta = a - b;
        const deltaStr = !showAfter ? "" : delta === 0 ? "  (same)" : ` (${delta > 0 ? "+" : ""}${delta})`;
        console.log(`│      ${colourFor(k)}${pad(k, 20)}${RESET}  before: ${pad(String(b), 3)}  ${showAfter ? `after: ${pad(String(a), 3)}${deltaStr}` : ""}`);
    }

    console.log("│");
    console.log("├─ Score ───────────────────────────────────────────────────────────────");
    console.log(`│   Slots:        ${SLOTS.length}`);
    console.log(`│   Max possible: ${before.max} (3 points per slot)`);
    console.log(`│   Before:       ${before.sum} / ${before.max}  (${before.pct}%)`);
    if (showAfter) {
        const delta = after.pct - before.pct;
        console.log(`│   After:        ${after.sum} / ${after.max}  (${after.pct}%)  ${delta >= 0 ? "+" : ""}${delta}pp`);
    }
    console.log("└────────────────────────────────────────────────────────────────────────\n");
}

printReport();
