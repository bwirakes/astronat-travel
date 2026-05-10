/**
 * chart-structure-backfill.ts — defensive synthesis for clusterCommentary +
 * patternCommentary entries that the LLM was supposed to emit but skipped.
 *
 * Why this exists: Gemini 3.x ignores absolute prompt directives ("REQUIRED",
 * "MUST emit") for nested-array fields when the schema marks them optional.
 * The chart structure block uses optional() to allow for the case where the
 * input has no structure to comment on, but when the engine surfaces patterns
 * or clusters and the LLM returns null, the reader sees terms like "Grand
 * Trine" mentioned without ever learning which planets compose it.
 *
 * The backfill walks the LLM output and synthesizes a deterministic entry
 * (using the engine's structured data — members, element, focal, dispositor)
 * for every input pattern/cluster the LLM forgot. The synthesized prose is
 * plain but accurate; it names the planets and binds the term to the data.
 * Better dull and correct than absent and hand-wavy.
 */

import type { ChartStructure, ChartStructureStellium, ChartStructurePattern } from "./chart-structure";

export interface BackfillablePartial {
    clusterCommentary?: Array<{ clusterKey: string; headline: string; body: string }>;
    patternCommentary?: Array<{ patternKey: string; headline: string; body: string }>;
}

const ELEMENT_FLAVOR: Record<string, { medium: string; gift: string; risk: string }> = {
    Fire:  { medium: "fire", gift: "instinct, drive, and the heat to start things",         risk: "burning out before the work pays off" },
    Earth: { medium: "earth", gift: "follow-through, material results, and steady progress", risk: "complacency — the gift hardens into routine" },
    Air:   { medium: "air", gift: "ideas, conversation, and quick pattern-recognition",     risk: "drifting in talk without ever moving the work" },
    Water: { medium: "water", gift: "emotional reading, intuition, and timing",              risk: "coasting on a sense you forget other people had to learn" },
};

function joinList(items: string[]): string {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function backfillPattern(p: ChartStructurePattern): { patternKey: string; headline: string; body: string } {
    const members = joinList(p.members);

    if (p.type === "grand-trine") {
        const flavor = (p.element && ELEMENT_FLAVOR[p.element]) || ELEMENT_FLAVOR.Water;
        const elementLabel = p.element ? p.element.toLowerCase() : "shared element";
        return {
            patternKey: p.key,
            headline: `${p.element ?? "A"} Grand Trine — ${p.members.join(", ")} run as one closed circuit`,
            body: `A Grand Trine is a sealed triangle between three planets in the same element — energy flows on its own, no friction to interrupt it. Yours runs in ${elementLabel}, with ${members} as the three vertices, which means ${flavor.gift} land effortlessly for you. The risk is not failure — it's ${flavor.risk}. Push into the gift on purpose; the closed circuit will not push you.`,
        };
    }

    // T-Square
    const focal = p.focal ?? p.members[0];
    const opposing = p.members.filter((m) => m !== focal);
    const oppositionPair = opposing.length >= 2 ? `${opposing[0]} and ${opposing[1]}` : joinList(opposing);
    return {
        patternKey: p.key,
        headline: `T-Square with ${focal} at the apex — ${oppositionPair} pull against each other through it`,
        body: `A T-Square is a tense triangle: two planets in opposition pulling against each other, with a third caught at the apex squaring both. Yours has ${focal} as the apex, with ${oppositionPair} as the opposition. Every pull between ${oppositionPair} ends up channeled through ${focal} — output, action, or visible effort is the pressure release. Do the work, or the work does you.`,
    };
}

function backfillCluster(c: ChartStructureStellium): { clusterKey: string; headline: string; body: string } {
    const members = joinList(c.members);
    const memberCount = c.members.length;
    const dispositorClause = c.dispositor
        ? ` The cluster's dispositor — ${c.dispositor} — is where the whole pile-up actually runs through.`
        : "";
    const mrClause = c.mutualReceptionPair
        ? ` ${c.mutualReceptionPair[0]} and ${c.mutualReceptionPair[1]} are in mutual reception, sitting in each other's signs and tightening the cluster's coherence.`
        : "";

    return {
        clusterKey: c.key,
        headline: `${memberCount} planets in ${c.location} — ${members}`,
        body: `A stellium — three or more planets crammed into one zone of the chart — forces that area to dominate. Yours sits in ${c.location} with ${members}.${dispositorClause}${mrClause}`,
    };
}

/**
 * Backfill missing clusterCommentary / patternCommentary entries on the AI
 * output, in place. Mutates and returns the same object for caller convenience.
 *
 * The LLM's entries (when present) are kept verbatim — the backfill only fills
 * gaps. An entry counts as "present" if its key matches a chartStructure entry.
 *
 * Returns a small report describing what was filled, for telemetry.
 */
export function backfillChartStructureCommentary<T extends BackfillablePartial>(
    output: T,
    chartStructure: ChartStructure | undefined,
): { clustersBackfilled: string[]; patternsBackfilled: string[] } {
    const report = { clustersBackfilled: [] as string[], patternsBackfilled: [] as string[] };
    if (!chartStructure) return report;

    // Patterns
    const inputPatternKeys = chartStructure.patterns.map((p) => p.key);
    if (inputPatternKeys.length > 0) {
        const have = new Set((output.patternCommentary ?? []).map((e) => e.patternKey));
        const missing = chartStructure.patterns.filter((p) => !have.has(p.key));
        if (missing.length > 0) {
            const synthesized = missing.map(backfillPattern);
            output.patternCommentary = [...(output.patternCommentary ?? []), ...synthesized];
            report.patternsBackfilled = missing.map((p) => p.key);
        }
    }

    // Clusters — note the engine pre-filters generational clusters out of
    // chartStructure.stelliums, so anything left is reader-relevant.
    const inputClusterKeys = chartStructure.stelliums.map((c) => c.key);
    if (inputClusterKeys.length > 0) {
        const have = new Set((output.clusterCommentary ?? []).map((e) => e.clusterKey));
        const missing = chartStructure.stelliums.filter((c) => !have.has(c.key));
        if (missing.length > 0) {
            const synthesized = missing.map(backfillCluster);
            output.clusterCommentary = [...(output.clusterCommentary ?? []), ...synthesized];
            report.clustersBackfilled = missing.map((c) => c.key);
        }
    }

    return report;
}
