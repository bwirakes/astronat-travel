/**
 * Client-safe deterministic copy helpers for the personal lens.
 *
 * Lives outside `lib/readings/personal-lens.ts` so the client bundle
 * doesn't transitively pull in Swiss Ephemeris (`@/lib/astro/relocate`),
 * which is Node-only and breaks the Turbopack browser build.
 *
 * Pure functions: take a structural slice of the lens, return a sentence.
 */

interface ImplicationLensFields {
    chartRulerPlanet: string;
    chartRulerNatalHouse: number;
    chartRulerRelocatedHouse: number;
}

// Compact noun for the ruler's natal house — the topic the user already carries.
const HOUSE_NATAL_NOUN: Record<number, string> = {
    1: "self-presentation",
    2: "resources and what you value",
    3: "conversations and short trips",
    4: "home and inner ground",
    5: "play, romance, and creative risk",
    6: "daily work and health rhythm",
    7: "partnerships and the public mirror",
    8: "intimacy and shared resources",
    9: "teaching and foreign ties",
    10: "career and public standing",
    11: "groups and long-term hopes",
    12: "the unseen and retreat",
};

// Verb phrase for the relocated house — what the trip tends to do.
const HOUSE_RELOCATED_VERB: Record<number, string> = {
    1: "concentrate into how you show up",
    2: "settle into resources and what you value",
    3: "scatter into conversations and short trips",
    4: "quiet into domestic ground",
    5: "spill into play, romance, and creative risk",
    6: "route into daily work and health rhythm",
    7: "pull toward partnerships and contracts",
    8: "deepen into intimacy and what's shared",
    9: "expand toward teaching, publishing, and foreign ground",
    10: "push into public visibility",
    11: "broaden into community and long-term hopes",
    12: "withdraw into the unseen",
};

/**
 * One-sentence "so what?" — names what the trip *does* to the chart ruler's
 * topic, not which house number it lands in. ≤20 words by construction.
 *
 * The PDF's Brandon/Jakarta example (p.3) implies this delta is the story
 * but doesn't compute it; this helper is that missing second sentence.
 */
export function chartRulerImplication(
    lens: ImplicationLensFields,
    city: string,
): string {
    const { chartRulerPlanet: ruler, chartRulerNatalHouse: nH, chartRulerRelocatedHouse: rH } = lens;
    if (nH === rH) {
        const noun = HOUSE_NATAL_NOUN[nH] ?? "the same themes";
        return `${city} doesn't shift the topic — it sharpens the ${noun} pressure you already carry.`;
    }
    const natal = HOUSE_NATAL_NOUN[nH] ?? "your usual themes";
    const verb = HOUSE_RELOCATED_VERB[rH] ?? "shift into new ground";
    return `Expect ${natal} to ${verb} here — same ${ruler}, new stage.`;
}
