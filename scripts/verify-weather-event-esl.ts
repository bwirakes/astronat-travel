/**
 * verify-weather-event-esl.ts — confirms the ESL-friendly redesign emits
 * sensible plain-English output for each of the 5 audited events. Replays
 * the helper functions from the page component.
 *
 *   bun run scripts/verify-weather-event-esl.ts
 */
/* eslint-disable no-console */

import { ALL_GEODETIC_WEATHER_EVENTS } from "@/app/lib/geodetic/weather-predictions";

const TYPE_PLAIN: Record<string, { word: string; verbose: string; icon: string }> = {
    flood:          { word: "Flood",        verbose: "heavy rain and flooding",         icon: "💧" },
    wildfire:       { word: "Wildfire",     verbose: "wildfire risk",                    icon: "🔥" },
    storm_cyclone:  { word: "Big Storm",    verbose: "a big storm or cyclone",           icon: "💨" },
    earthquake:     { word: "Earthquake",   verbose: "earthquake or seismic activity",   icon: "🪨" },
    heatwave:       { word: "Heat Wave",    verbose: "very hot weather",                 icon: "☀️" },
    tornado:        { word: "Tornado",      verbose: "tornado risk",                     icon: "🌪" },
    winter_storm:   { word: "Winter Storm", verbose: "snow, ice, or freezing weather",   icon: "❄️" },
    compound:       { word: "Compound",     verbose: "many weather problems together",   icon: "🌐" },
};
const TIER_PLAIN: Record<string, { word: string; sentence: string }> = {
    critical: { word: "Very High Pressure", sentence: "The chance of trouble is very high. Watch closely." },
    high:     { word: "High Pressure",      sentence: "The chance of trouble is high. Pay attention." },
    moderate: { word: "Some Pressure",      sentence: "There is some risk. Stay aware." },
    watch:    { word: "Watch",              sentence: "Worth watching, but pressure is low." },
    low:      { word: "Low Pressure",       sentence: "Low risk for this event." },
};

const TODAY = new Date("2026-05-17T00:00:00Z");

function daysFromToday(dateStr: string): string {
    const target = new Date(`${dateStr}T00:00:00Z`);
    const days = Math.round((target.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days === -1) return "Yesterday";
    if (days > 0)   return `In ${days} days`;
    return `${Math.abs(days)} days ago`;
}

function friendlyDate(dateStr: string): string {
    return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
    });
}

function listWithAnd(items: string[]): string {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function parseZonePrimary(raw: string): string {
    const m = raw.match(/^(.*?)\s*\(/);
    return m ? m[1].trim() : raw;
}

const PICKS = [
    "forecast-2026-02-17-annular-eclipse-and-saturn-neptune-world-point",
    "forecast-2026-08-12-pair-b-total-solar-eclipse-maximum",
    "historical-2024-09-26-hurricane-helene-cat-4-deadliest-us-since-katrina",
    "historical-2025-01-07-la-palisades-eaton-fires-costliest-wildfires-in-world-history",
    "forecast-2026-06-30-jupiter-leo-wildfire-corridor-opens",
];

// Flesch-Kincaid Grade Level approximation for plain-English text.
// Aim: ≤ 7 for ESL friendliness.
function fkgl(text: string): number {
    const sentences = Math.max(1, (text.match(/[.!?]+/g) ?? []).length);
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordCount = Math.max(1, words.length);
    const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
    return 0.39 * (wordCount / sentences) + 11.8 * (syllables / wordCount) - 15.59;
}

function countSyllables(word: string): number {
    const w = word.toLowerCase().replace(/[^a-z]/g, "");
    if (w.length === 0) return 0;
    const groups = w.replace(/e$/, "").match(/[aeiouy]+/g);
    return Math.max(1, groups ? groups.length : 1);
}

console.log("=".repeat(96));
console.log(" ESL READABILITY VERIFICATION (7th grade target = FKGL ≤ 7)");
console.log("=".repeat(96));

for (const id of PICKS) {
    const event = ALL_GEODETIC_WEATHER_EVENTS.find((e) => e.id === id);
    if (!event) continue;
    console.log();
    console.log("─".repeat(96));
    console.log(` ${event.title}`);
    console.log(`   ${event.type}  pss=${event.pss.toFixed(2)}  tier=${event.tier}`);
    console.log("─".repeat(96));

    const typeInfo = TYPE_PLAIN[event.type] ?? { word: event.type, verbose: event.type, icon: "·" };
    const tierInfo = TIER_PLAIN[event.tier] ?? { word: event.tier, sentence: "" };
    const dayLabel = daysFromToday(event.date);
    const zonesPrimary = event.zones.map(parseZonePrimary);

    console.log("\n  [BANNER]");
    console.log(`    Type chip:  ${typeInfo.icon} ${typeInfo.word.toUpperCase()}`);
    console.log(`    Title:      ${event.title}`);
    console.log(`    Meta:       ${friendlyDate(event.date).toUpperCase()}`);
    console.log(`    PSS pill:   PSS / ${event.pss.toFixed(2)}`);
    console.log(`    Verdict:    ${event.tier.toUpperCase()}`);
    console.log(`    Big icon:   ${typeInfo.icon}  (background watermark)`);

    console.log("\n  [AT-A-GLANCE CARDS]");
    console.log(`    📅 When:     ${dayLabel}`);
    console.log(`                 ${friendlyDate(event.date)}`);
    console.log(`    ${typeInfo.icon} Type:     ${typeInfo.word}`);
    console.log(`                 ${typeInfo.verbose}`);
    console.log(`    📍 Where:    ${zonesPrimary.length === 0 ? "Worldwide" : `${zonesPrimary.length} ${zonesPrimary.length === 1 ? "area" : "areas"}`}`);
    console.log(`                 ${zonesPrimary.length === 0 ? "Global / historical row" : "See map below"}`);
    console.log(`    📈 Pressure: ${tierInfo.word}`);
    console.log(`                 PSS ${event.pss.toFixed(2)} of 1.00`);

    console.log("\n  [PLAIN ENGLISH SUMMARY]");
    const tenseVerb = dayLabel.includes("ago") || dayLabel === "Yesterday" ? "happened" : "is expected";
    const areaSummary = zonesPrimary.length === 0
        ? "This event applies worldwide or to a historical case."
        : `Main areas: ${listWithAnd(zonesPrimary.slice(0, 3))}${zonesPrimary.length > 3 ? `, plus ${zonesPrimary.length - 3} more` : ""}.`;
    const summary = [
        `This ${tenseVerb} on ${friendlyDate(event.date)} (${dayLabel.toLowerCase()}).`,
        `It is a ${typeInfo.verbose} event.`,
        tierInfo.sentence,
        areaSummary,
    ].join(" ");
    console.log(`    "${summary}"`);
    const grade = fkgl(summary);
    const verdict = grade <= 7 ? "✓ ESL OK" : grade <= 9 ? "△ Borderline" : "✗ Too complex";
    console.log(`\n    Flesch-Kincaid Grade Level: ${grade.toFixed(1)}  ${verdict}`);

    console.log("\n  [VISIBLE SECTIONS BELOW]");
    console.log("    1. Map + Zone cards");
    console.log("    2. Timeline (Phase 1 → Phase 2)");

    console.log("\n  [HARDCORE — collapsed by default at the END]");
    console.log("    ▸ The full astrology read           (full editorial body)");
    console.log(`    ▸ Why this scored what it did       (${event.criteria.met} of ${event.criteria.total} criteria)`);
    console.log(`    ▸ Stars and sensitizers             (${[...event.stars, event.pair, event.geostress].filter(Boolean).length} items)`);
    console.log("    ▸ Trigger calendar                  (nearby aspects/moons)");
    console.log("    ▸ How the model works               (method notes)");
}

console.log("\n" + "=".repeat(96));
console.log(" SUMMARY");
console.log("=".repeat(96));
const grades = PICKS.map((id) => {
    const event = ALL_GEODETIC_WEATHER_EVENTS.find((e) => e.id === id);
    if (!event) return null;
    const typeInfo = TYPE_PLAIN[event.type] ?? { word: event.type, verbose: event.type, icon: "·" };
    const tierInfo = TIER_PLAIN[event.tier] ?? { word: event.tier, sentence: "" };
    const dayLabel = daysFromToday(event.date);
    const tenseVerb = dayLabel.includes("ago") || dayLabel === "Yesterday" ? "happened" : "is expected";
    const zonesPrimary = event.zones.map(parseZonePrimary);
    const areaSummary = zonesPrimary.length === 0
        ? "This event applies worldwide or to a historical case."
        : `Main areas: ${listWithAnd(zonesPrimary.slice(0, 3))}.`;
    return fkgl([
        `This ${tenseVerb} on ${friendlyDate(event.date)} (${dayLabel.toLowerCase()}).`,
        `It is a ${typeInfo.verbose} event.`,
        tierInfo.sentence,
        areaSummary,
    ].join(" "));
}).filter((g): g is number => g !== null);

const avg = grades.reduce((s, g) => s + g, 0) / grades.length;
const max = Math.max(...grades);
console.log(`  Average plain-English summary FKGL: ${avg.toFixed(1)} (target ≤ 7)`);
console.log(`  Worst case FKGL:                    ${max.toFixed(1)}`);
console.log(`  All summaries ESL-friendly:         ${max <= 7 ? "✓" : `△ (${PICKS.length - grades.filter((g) => g <= 7).length} over threshold)`}`);
