/**
 * Shared helpers used by both `ai-input-builder.ts` (teacher reading) and
 * `ai-couples-input-builder.ts` (couples reading). Extracted from the v4
 * builder so the couples pipeline can reuse the same date framing, tone
 * classification, and aspect-sentence shaping the v4 reading uses — keeps
 * the two pipelines from drifting on these primitives.
 */

import type { TransitHit } from "@/lib/astro/transit-solver";
import type { Tone } from "@/lib/ai/schemas";

/** Frame a transit's exact date as a ±2 day window string ("Apr 12 — Apr 16"). */
export function formatTransitDates(dateIso: string): string {
    const d = new Date(dateIso);
    const before = new Date(d);
    before.setUTCDate(before.getUTCDate() - 2);
    const after = new Date(d);
    after.setUTCDate(after.getUTCDate() + 2);
    const fmt = (x: Date) => x.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${fmt(before)} — ${fmt(after)}`;
}

const HARMONIOUS = new Set(["trine", "sextile"]);
const TENSE = new Set(["square", "opposition"]);

/** Classify a transit's tone for the AI to colour copy by. Conjunctions
 *  defer to whether the transiting planet is benefic or malefic. */
export function transitTone(hit: TransitHit): Tone {
    const a = hit.aspect.toLowerCase();
    if (HARMONIOUS.has(a)) return "supportive";
    if (TENSE.has(a)) return "challenging";
    if (a === "conjunction") return hit.benefic ? "supportive" : "challenging";
    return "neutral";
}

/** Plain-English aspect sentence ("Mars in Aries squares your Sun in Cancer"). */
export function aspectSentence(hit: TransitHit, transitSign: string, natalSign: string): string {
    const aspectVerb: Record<string, string> = {
        trine: "trines",
        sextile: "sextiles",
        square: "squares",
        opposition: "opposes",
        conjunction: "joins",
    };
    const verb = aspectVerb[hit.aspect.toLowerCase()] ?? hit.aspect;
    return `${hit.transit_planet} in ${transitSign} ${verb} your ${hit.natal_planet} in ${natalSign}`;
}
