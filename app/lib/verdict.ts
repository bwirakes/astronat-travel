/**
 * verdict.ts — single source of truth for score → semantic-band classification.
 *
 * The reading product surfaces verdicts in three places (whole-place hero,
 * per-event scoring engine, per-window timing). Before this module existed
 * each surface defined its own thresholds and label vocabulary, so the same
 * 74/100 score could read as "Solid window" in one panel and "Productive"
 * with different cut-offs in another.
 *
 * All three surfaces now derive their bands from {@link verdictBand} and
 * pick their public-facing label from one of the dictionaries below.
 */

export type VerdictBand = "peak" | "solid" | "mixed" | "tight" | "hard";

export type VerdictTone = "lift" | "neutral" | "press";

/** Score → band cuts. Used by the hero, scoring engine, and TimingTab. */
export function verdictBand(score: number): VerdictBand {
    if (score >= 80) return "peak";
    if (score >= 65) return "solid";
    if (score >= 50) return "mixed";
    if (score >= 35) return "tight";
    return "hard";
}

export function verdictTone(band: VerdictBand): VerdictTone {
    if (band === "peak" || band === "solid") return "lift";
    if (band === "mixed") return "neutral";
    return "press";
}

/** Whole-place hero label (city × chart fit). Hero collapses the two
 *  press-band labels into a single "Tough match" — the hero only has room
 *  for four bands of nuance. */
export const HERO_LABELS: Record<VerdictBand, string> = {
    peak:  "Peak alignment",
    solid: "Solid window",
    mixed: "Mixed",
    tight: "Tough match",
    hard:  "Tough match",
};

/** Per-event label produced by the scoring engine for each LIFE_EVENT. */
export const EVENT_LABELS: Record<VerdictBand, string> = {
    peak:  "Highly Productive",
    solid: "Productive",
    mixed: "Mixed",
    tight: "Challenging",
    hard:  "Hostile",
};

/** Travel-window label used by TimingTab for the user's selected dates. */
export const WINDOW_LABELS: Record<VerdictBand, string> = {
    peak:  "Strong window",
    solid: "Open window",
    mixed: "Mixed window",
    tight: "Tight window",
    hard:  "Challenging window",
};

/** One-line rationales for the timing-window verdict, keyed by tone so the
 *  copy stays accurate even as labels evolve. */
export const WINDOW_RATIONALES: Record<VerdictBand, string> = {
    peak:  "the sky is broadly supportive of what you're going there to do",
    solid: "more support than friction across this stretch",
    mixed: "real potential, but it'll need some care to land cleanly",
    tight: "more friction than support — bring patience and right-size your asks",
    hard:  "the sky is pressing hard against this date — better windows exist nearby",
};

/** Hero verdict band collapsed to the 4-band shape the hero already
 *  exposes via `vm.hero.verdict.band`. Kept narrow so the existing
 *  discriminator unions in reading-viewmodel.ts continue to typecheck. */
export type HeroBand = "tough" | "mixed" | "solid" | "peak";

export function heroBand(score: number): HeroBand {
    const band = verdictBand(score);
    return band === "tight" || band === "hard" ? "tough" : band;
}

export const HERO_BAND_LABEL: Record<HeroBand, string> = {
    peak:  "Peak alignment",
    solid: "Solid window",
    mixed: "Mixed",
    tough: "Tough match",
};

/**
 * Couples coherence — single number expressing how aligned the two partners'
 * macro scores are at this destination. Derived from the absolute delta:
 *
 *   delta = 0    → coherence = 100   (identical readings)
 *   delta = 50   → coherence = 50    (one peak, one mid)
 *   delta = 100  → coherence = 0     (one peak, one hostile)
 *
 * Floored at 0. Intentionally NOT a function of either partner's absolute
 * score — two partners both at 30/100 is a *coherent* "tough match", not an
 * incoherent one. The hero pill still surfaces the underlying band so the
 * reader sees both signals.
 */
export function computeCoherence(userScore: number, partnerScore: number): number {
    const delta = Math.abs(userScore - partnerScore);
    return Math.max(0, Math.round(100 - delta));
}
