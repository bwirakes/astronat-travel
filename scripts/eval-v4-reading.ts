#!/usr/bin/env bun
/**
 * eval-v4-reading.ts — quick audit of how much of the V4 reading view is
 * actually data-driven vs hardcoded.
 *
 * Each slot in the V4 view (a piece of user-facing content) is classified by
 * its source. The script totals up a score so we can see whether a refactor
 * actually moved the needle.
 *
 * Modes:
 *   bun scripts/eval-v4-reading.ts
 *     → Architectural ceiling: what's *possible* given the code.
 *
 *   bun scripts/eval-v4-reading.ts --reading path/to/details.json
 *     → Per-reading score: PROMPT_OR_FALLBACK slots are downgraded to
 *       HARDCODED when the actual JSON didn't populate them.
 *
 *   bun scripts/eval-v4-reading.ts --dir path/to/dir/
 *     → Run per-reading on every *.json in the dir, print summary.
 *
 * The slot catalogue is curated by hand because static analysis of JSX would
 * be brittle and would miss "this string is sometimes overridden by the
 * teacherReading prompt." When you change the view-model or the V4 view, just
 * edit the catalogue below.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

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
    { step: "1 hero", name: "Hero score",                            before: "HARDCODED",          after: "COMPUTED",  notes: "Goal-weighted scoreDate (love→Venus/Moon, etc.)" },
    { step: "1 hero", name: "Score context line",                    before: "HARDCODED",          after: "COMPUTED",  notes: "New: 'N points above your average for this place'" },
    { step: "1 hero", name: "Explainer paragraph",                   before: "PROMPT_OR_FALLBACK", after: "PROMPT_OR_FALLBACK" },
    { step: "1 hero", name: "Bar label 'how well it matches you'",   before: "HARDCODED",          after: "HARDCODED" },
    { step: "1 hero", name: "Scroll hint ('keep reading')",          before: "HARDCODED",          after: "HARDCODED" },

    // STEP 2 — alternate windows
    { step: "2 win",  name: "Section heading 'If you can shift your dates.'", before: "HARDCODED",          after: "HARDCODED" },
    { step: "2 win",  name: "Section intro paragraph",               before: "HARDCODED",          after: "HARDCODED" },
    { step: "2 win",  name: "Window flavor labels (now offset labels)", before: "HARDCODED",       after: "TEMPLATED",         notes: "'Two weeks earlier' / 'A month later' — derived from offset" },
    { step: "2 win",  name: "Window flavor titles",                  before: "PROMPT_OR_FALLBACK", after: "TEMPLATED",         notes: "Pulled from buildScoredWindows labels" },
    { step: "2 win",  name: "Window dates",                          before: "COMPUTED",           after: "COMPUTED" },
    { step: "2 win",  name: "Window scores",                         before: "HARDCODED",          after: "COMPUTED",          notes: "Goal-weighted per-date scores" },
    { step: "2 win",  name: "Window notes (drivers)",                before: "TEMPLATED",          after: "COMPUTED",          notes: "Top transits driving each window's score" },
    { step: "2 win",  name: "'Recommended' pill placement",          before: "HARDCODED",          after: "COMPUTED",          notes: "Now wins by score margin, not card 0" },
    { step: "2 win",  name: "Daily intensity strip",                 before: "HARDCODED",          after: "COMPUTED",          notes: "New: 57-day per-day score series" },

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
    { step: "4 chart",name: "Month score",                           before: "HARDCODED",          after: "COMPUTED",          notes: "Goal-weighted: love → Venus/Moon hits boost more" },
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
    { step: "6 astro",name: "Line notes",                            before: "TEMPLATED",          after: "PROMPT_OR_FALLBACK", notes: "Now teacherReading.lineNotes[lineKey]" },
    { step: "6 astro",name: "Weekly narrative",                      before: "PROMPT_OR_FALLBACK", after: "PROMPT_OR_FALLBACK" },

    // STEP 7 — relocated chart
    { step: "7 reloc",name: "Section heading 'Your chart, relocated to {city}.'", before: "TEMPLATED",          after: "TEMPLATED" },
    { step: "7 reloc",name: "Section intro paragraph",               before: "HARDCODED",          after: "PROMPT_OR_FALLBACK", notes: "Now chrome.step7Intro" },
    { step: "7 reloc",name: "Natal pole place",                      before: "BROKEN",             after: "COMPUTED",           notes: "Now reads reading.birth.city (persisted in Fix 3)" },
    { step: "7 reloc",name: "Natal pole coords",                     before: "BROKEN",             after: "COMPUTED",           notes: "Now reads reading.birth.lat/lon" },
    { step: "7 reloc",name: "Natal pole date + time",                before: "BROKEN",             after: "COMPUTED",           notes: "Now formats reading.birth.date + birth.time" },
    { step: "7 reloc",name: "Natal/relocated bi-wheel SVG",          before: "HARDCODED",          after: "COMPUTED",           notes: "New: RelocationBiWheel renders both wheels" },
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
    { step: "7 reloc",name: "Glossary entries (4) — definitions",    before: "HARDCODED",          after: "PROMPT_OR_FALLBACK", notes: "Now teacherReading.glossaryEntries[term]" },
    { step: "7 reloc",name: "Glossary entries — links to /learn",    before: "BROKEN",             after: "TEMPLATED",          notes: "Now <Link href='/learn/<slug>'>" },
    { step: "7 reloc",name: "Learn-more links (3)",                  before: "BROKEN",             after: "TEMPLATED",          notes: "Real /learn URLs (geodetic-astrology, astrocartography, /learn)" },

    // FOOTER
    { step: "foot",   name: "Footer paragraph",                      before: "HARDCODED",          after: "HARDCODED" },
    { step: "foot",   name: "Footer meta line",                      before: "TEMPLATED",          after: "TEMPLATED" },
];

// ─────────────────────────────────────────────────────────────────────
// Per-reading probes
//
// For each slot whose `after` is PROMPT_OR_FALLBACK, this map says how to
// check whether the prompt actually populated the field for a specific
// reading. If true → score as PROMPT (3 points); else → HARDCODED (0).
// Slots not in this map keep their architectural classification.
// ─────────────────────────────────────────────────────────────────────

type Probe = (reading: any) => boolean;

const PROBES: Record<string, Probe> = {
    "Explainer paragraph":              r => !!r?.teacherReading?.hero?.explainer,
    "Window flavor titles":             r => Array.isArray(r?.teacherReading?.windows) && r.teacherReading.windows.length > 0,
    "Section intro paragraph":          r => !!r?.teacherReading?.chrome?.step3Intro,
    "Vibe icons":                       r => Array.isArray(r?.teacherReading?.vibes) && r.teacherReading.vibes.some((v: any) => v?.icon),
    "Vibe titles":                      r => Array.isArray(r?.teacherReading?.vibes) && r.teacherReading.vibes.some((v: any) => v?.title),
    "Vibe bodies":                      r => Array.isArray(r?.teacherReading?.vibes) && r.teacherReading.vibes.some((v: any) => v?.body),
    "Aspect tooltip 'why' prose":       r => Array.isArray(r?.teacherReading?.monthAspects) && r.teacherReading.monthAspects.some((m: any) => m?.why),
    "Aspect tooltip 'timing' prose":    r => Array.isArray(r?.teacherReading?.monthAspects) && r.teacherReading.monthAspects.some((m: any) => m?.timing),
    "Goal/travelType todos (2-3)":      r => Array.isArray(r?.teacherReading?.todos) && r.teacherReading.todos.length >= 2,
    "Line notes":                       r => Array.isArray(r?.teacherReading?.lineNotes) && r.teacherReading.lineNotes.length > 0,
    "Weekly narrative":                 r => Array.isArray(r?.teacherReading?.weeks) && r.teacherReading.weeks.length > 0,
    "Section intro paragraph ":         r => !!r?.teacherReading?.chrome?.step7Intro, // step 7 (note trailing space — matches if used; otherwise add a Step 7 specific probe below)
    "Angle deltas prose":               r => Array.isArray(r?.teacherReading?.angleDeltas) && r.teacherReading.angleDeltas.length > 0,
    "Angles sub-heading":               r => !!r?.teacherReading?.chrome?.step7AnglesSub,
    "Houses sub-heading":               r => !!r?.teacherReading?.chrome?.step7HousesSub,
    "Planet shifts prose":              r => Array.isArray(r?.teacherReading?.planetShifts) && r.teacherReading.planetShifts.length > 0,
    "Aspects sub-heading + intro":      r => !!r?.teacherReading?.chrome?.step7AspectsSub,
    "Aspect plain prose":               r => Array.isArray(r?.teacherReading?.aspectPlains) && r.teacherReading.aspectPlains.length > 0,
    "Aspect 'wasNatal' prose":          r => Array.isArray(r?.teacherReading?.aspectPlains) && r.teacherReading.aspectPlains.some((a: any) => a?.wasNatal),
    "Glossary entries (4) — definitions": r => Array.isArray(r?.teacherReading?.glossaryEntries) && r.teacherReading.glossaryEntries.length > 0,
};

// Step 7 Section intro paragraph — disambiguated from step 3 by step prefix.
function applyProbes(reading: any): Slot[] {
    return SLOTS.map(s => {
        const cls = s.after ?? s.before;
        if (cls !== "PROMPT_OR_FALLBACK") return s;
        // Match step 7's "Section intro paragraph" by step prefix.
        let probe: Probe | undefined;
        if (s.step.startsWith("7") && s.name === "Section intro paragraph") {
            probe = r => !!r?.teacherReading?.chrome?.step7Intro;
        } else if (s.step.startsWith("3") && s.name === "Section intro paragraph") {
            probe = r => !!r?.teacherReading?.chrome?.step3Intro;
        } else {
            probe = PROBES[s.name];
        }
        const fired = probe ? probe(reading) : false;
        return { ...s, after: fired ? "PROMPT" : "HARDCODED" };
    });
}

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

function loadReading(path: string): any {
    const raw = readFileSync(path, "utf8");
    const obj = JSON.parse(raw);
    // Allow loading either a `details` object directly, or a wrapping
    // `{ details: {...} }` envelope (matches the DB row shape).
    return obj?.details ?? obj;
}

function printPerReading(filePath: string, reading: any) {
    const probedSlots = applyProbes(reading);
    const probed = score(probedSlots, "after");
    const ceiling = score(SLOTS, "after");
    const probedBuckets = bucketCounts(probedSlots, "after");

    const city = reading?.destination ?? reading?.location?.city ?? "?";
    // Floor = score with NO prompt fields firing (PROMPT_OR_FALLBACK → HARDCODED).
    // Ceiling = score with ALL prompt fields firing (PROMPT_OR_FALLBACK → PROMPT).
    const floor = (() => {
        const noneFired = SLOTS.map(s => {
            const cls = s.after ?? s.before;
            return cls === "PROMPT_OR_FALLBACK" ? { ...s, after: "HARDCODED" as Source } : s;
        });
        return score(noneFired, "after");
    })();
    const allFired = (() => {
        const allFire = SLOTS.map(s => {
            const cls = s.after ?? s.before;
            return cls === "PROMPT_OR_FALLBACK" ? { ...s, after: "PROMPT" as Source } : s;
        });
        return score(allFire, "after");
    })();
    console.log(`\n${filePath}  →  ${city}`);
    console.log(`  Score: ${probed.sum}/${probed.max} (${probed.pct}%)   Floor: ${floor.pct}%   Ceiling: ${allFired.pct}%`);
    const fired = probedBuckets.PROMPT;
    const stale = probedSlots.filter(s => {
        const archAfter = SLOTS.find(x => x.name === s.name && x.step === s.step)?.after;
        return archAfter === "PROMPT_OR_FALLBACK" && s.after === "HARDCODED";
    });
    console.log(`  Prompt fields fired: ${fired}   Falling back to hardcoded: ${stale.length}`);
    if (stale.length) {
        console.log(`  Stale slots: ${stale.slice(0, 6).map(s => s.name).join(", ")}${stale.length > 6 ? `, +${stale.length - 6} more` : ""}`);
    }
}

function printSummary(rows: Array<{ file: string; reading: any; probedScore: { pct: number; sum: number; max: number } }>) {
    if (rows.length === 0) return;
    console.log("\n┌─ Per-reading summary ──────────────────────────────────────────────────");
    for (const r of rows) {
        const city = r.reading?.destination ?? r.reading?.location?.city ?? "?";
        console.log(`│  ${pad(r.file.split("/").pop() ?? "", 32)}  ${pad(city, 28)}  ${pad(String(r.probedScore.pct) + "%", 5)}`);
    }
    const avg = Math.round(rows.reduce((s, r) => s + r.probedScore.pct, 0) / rows.length);
    const floor = score(SLOTS.map(s => {
        const cls = s.after ?? s.before;
        return cls === "PROMPT_OR_FALLBACK" ? { ...s, after: "HARDCODED" as Source } : s;
    }), "after").pct;
    const ceiling = score(SLOTS.map(s => {
        const cls = s.after ?? s.before;
        return cls === "PROMPT_OR_FALLBACK" ? { ...s, after: "PROMPT" as Source } : s;
    }), "after").pct;
    console.log("│");
    console.log(`│  Average: ${avg}%     Floor: ${floor}%     Ceiling: ${ceiling}%`);
    console.log("└────────────────────────────────────────────────────────────────────────\n");
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

// ─── CLI entry ──────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const readingFlag = argv.indexOf("--reading");
const dirFlag = argv.indexOf("--dir");

if (readingFlag !== -1 && argv[readingFlag + 1]) {
    const path = argv[readingFlag + 1];
    const reading = loadReading(path);
    printPerReading(path, reading);
} else if (dirFlag !== -1 && argv[dirFlag + 1]) {
    const dir = argv[dirFlag + 1];
    const files = readdirSync(dir)
        .filter(f => f.endsWith(".json"))
        .map(f => join(dir, f))
        .filter(p => statSync(p).isFile());
    const rows = files.map(file => {
        const reading = loadReading(file);
        const probedSlots = applyProbes(reading);
        const probedScore = score(probedSlots, "after");
        return { file, reading, probedScore };
    });
    for (const r of rows) printPerReading(r.file, r.reading);
    printSummary(rows);
} else {
    printReport();
}
