/**
 * chart-structure.ts — Build the cluster + pattern payload that downstream
 * AI prompts read. Pure transform: given a list of planets, returns the
 * `ChartStructure` shape consumed by `TeacherReadingInput` and
 * `CouplesReadingInput`.
 *
 * Filters per plan §8.4 (`docs/implementation_plans/cluster-scoring.md`):
 *   - Orb clusters that overlap a house+sign cluster of the same membership
 *     are dropped (pick one register; house phrasing reads more concretely).
 *   - Generational clusters (≥2 outer planets) are surfaced with a
 *     `generational: true` flag so the prompts can suppress narrative for
 *     things millions of people share.
 *   - T-Squares where Moon is a non-apex member are dropped (loose-orb
 *     Moon T-Squares are unstable signal — surface only when Moon IS the
 *     apex).
 *
 * Each surfaced item carries a pre-baked `livedTheme` string. This is
 * engine-generated boilerplate that gives the LLM a starting register so
 * the prose stays anchored to canonical interpretations rather than
 * drifting into invented astrology. The prompt's job is to riff on the
 * theme, not invent the framing from scratch.
 */

import { detectClusters, type ClusterDescriptor } from "@/app/lib/clusters";
import { detectAspectPatterns, type AspectPattern } from "@/app/lib/aspect-patterns";

// ── Types — matches the field shape on TeacherReadingInput / CouplesReadingInput

export interface ChartStructureStellium {
    /** Stable lookup key. Format depends on kind:
     *    house  → "house-<n>"           (e.g. "house-10")
     *    sign   → "sign-<lowername>"    (e.g. "sign-capricorn")
     *    orb    → "orb-<sortedmembers>" (e.g. "orb-mercury-sun-venus") */
    key: string;
    kind: "house" | "sign" | "orb";
    /** Human-readable location, used in headlines:
     *    "Capricorn 10th house" | "Capricorn" | "tight conjunction in Capricorn" */
    location: string;
    /** Canonical title-case planet names ("Sun", "Mercury"). */
    members: string[];
    /** Sole dignified leader, when the cluster has one. Plural-leader
     *  (tied) clusters omit this so the prompt doesn't promote one
     *  arbitrarily. */
    leader?: string;
    /** Sign cluster's dispositor planet — the ruler of the anchor sign.
     *  Format: "Saturn (in Pisces, 12th)" so the prompt has full placement
     *  context without re-deriving it. */
    dispositor?: string;
    /** Mutual-reception pair (alphabetical) when both members of the pair
     *  are inside this cluster. Only the first detected pair is surfaced —
     *  rare for a single cluster to hold more than one. */
    mutualReceptionPair?: [string, string];
    /** True when ≥2 outer planets (Uranus/Neptune/Pluto) are members.
     *  The plan §8.4 directs prompts to skip narrative for these — they
     *  describe a generational cohort, not the individual reader. */
    generational: boolean;
    /** Engine-generated boilerplate gist. The prompt should rewrite this
     *  in Astro-Nat voice, not quote it verbatim. */
    livedTheme: string;
}

export interface ChartStructureFinalDispositor {
    planet: string;
    placement: string; // "Pisces, 12th house"
}

export interface ChartStructurePattern {
    /** Stable lookup key:
     *    grand-trine  → "grand-trine-<element>"
     *    t-square     → "t-square-<focal-lower>"  */
    key: string;
    type: "grand-trine" | "t-square";
    members: string[];
    element?: "Fire" | "Earth" | "Air" | "Water";
    focal?: string;
    /** Tightness in [0, 1] — pass-through from the detector. Prompts may
     *  ignore this; it's available for future "downplay loose-orb patterns"
     *  rules. */
    tightness: number;
    livedTheme: string;
}

export interface ChartStructure {
    stelliums: ChartStructureStellium[];
    finalDispositor?: ChartStructureFinalDispositor;
    patterns: ChartStructurePattern[];
}

// ── Input contract — minimum a planet must carry to feed both detectors.

export interface ChartStructurePlanetInput {
    name: string;        // any case; canonicalized internally
    longitude: number;
    sign: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────

const HOUSE_THEME_HINT: Record<number, string> = {
    1: "identity and how the world meets you",
    2: "money, possessions, and what you value",
    3: "communication, siblings, short trips",
    4: "home, roots, family of origin",
    5: "creativity, romance, play",
    6: "daily routines, work, health habits",
    7: "partnerships and one-on-one relationships",
    8: "shared resources, intimacy, transformation",
    9: "long journeys, philosophy, higher learning",
    10: "career, public reputation, vocation",
    11: "friendships, community, the future",
    12: "the unconscious, retreat, the hidden",
};

function canon(name: string): string {
    return name
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
}

function ordinal(n: number): string {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function houseStellumLivedTheme(houseNum: number, count: number): string {
    const theme = HOUSE_THEME_HINT[houseNum] ?? "this area of life";
    return `${count} planets pile into your ${ordinal(houseNum)} house — ${theme} stops being one thing among many and becomes a dominant theme that organises the chart around it.`;
}
function signStellumLivedTheme(sign: string, count: number, dispositor: string | undefined): string {
    const dispText = dispositor
        ? ` The whole pile-up runs through ${dispositor}, so wherever ${dispositor} sits is where the cluster's energy actually plays out.`
        : "";
    return `${count} planets share ${sign}, which over-saturates that sign's mode of operation.${dispText}`;
}
function orbStellumLivedTheme(count: number): string {
    return `${count} planets sit within a tight 10° band, fusing their themes into a single integrated voice rather than independent influences.`;
}
function finalDispositorLivedTheme(planet: string): string {
    return `${planet} is the chart's final dispositor — every other planet's energy chains back to it, so ${planet}'s placement is the chart's master key. What ${planet} does, the whole chart does.`;
}
function grandTrineLivedTheme(element: string): string {
    return `A sealed triangle of ${element.toLowerCase()} energy — gifts that arrive without effort, rarely tested, sometimes underused because nothing forces them to be exercised.`;
}
function tSquareLivedTheme(focal: string): string {
    return `${focal} is the pressure point where an opposition forces a choice. The friction here doesn't dissolve — it gets channelled into output.`;
}

/** Drop orb clusters whose member set is a subset of an existing house or
 *  sign cluster. Per plan §8.4, the orb register reads less concretely than
 *  house/sign and isn't worth surfacing twice. */
function dedupeRedundantOrbClusters(
    house: ClusterDescriptor[],
    sign: ClusterDescriptor[],
    orb: ClusterDescriptor[],
): ClusterDescriptor[] {
    const memberKey = (c: ClusterDescriptor) => c.members.map((m) => m.planet).sort().join("|");
    const covered = new Set<string>();
    for (const c of house) covered.add(memberKey(c));
    for (const c of sign) covered.add(memberKey(c));
    return orb.filter((c) => !covered.has(memberKey(c)));
}

/** Skip T-Squares where Moon is a non-apex member. The Moon's natural
 *  fluctuation makes loose-orb Moon T-Squares unstable signal. */
function suppressMoonNonApexTSquares(patterns: AspectPattern[]): AspectPattern[] {
    return patterns.filter((p) => {
        if (p.type !== "t-square") return true;
        if (p.focal === "Moon") return true; // Moon as apex IS surfaced
        return !p.members.includes("Moon");
    });
}

// ── Public entry point ───────────────────────────────────────────────────

/**
 * Build the chartStructure payload for the AI prompts.
 *
 * @param planets       Natal planets with name/longitude/sign already resolved.
 * @param houseOf       Maps an ecliptic longitude to a 1–12 house number.
 *                      Caller decides whether to use natal or relocated houses;
 *                      for teacher-reading pass the relocated house function,
 *                      for natal-interpret pass the natal house function.
 */
export function buildChartStructure(
    planets: ChartStructurePlanetInput[],
    houseOf: (lon: number) => number,
): ChartStructure {
    if (planets.length === 0) {
        return { stelliums: [], patterns: [] };
    }

    const planetsForDetect = planets.map((p) => ({
        name: p.name,
        longitude: p.longitude,
        sign: p.sign,
        house: houseOf(p.longitude),
    }));

    const clusterSet = detectClusters(planetsForDetect);
    const rawPatterns = detectAspectPatterns(planetsForDetect);

    // Build a map of planet → "Sign, Hth house" for placement strings.
    const placementOf: Record<string, string> = {};
    for (const p of planetsForDetect) {
        placementOf[canon(p.name)] = `${p.sign}, ${ordinal(p.house)} house`;
    }

    // Helper: render a single descriptor into the AI-payload shape.
    function renderCluster(c: ClusterDescriptor, kind: "house" | "sign" | "orb"): ChartStructureStellium {
        const members = c.members.map((m) => m.planet).sort();
        const leader = c.dignifiedLeaders.length === 1 ? c.dignifiedLeaders[0] : undefined;

        let key: string;
        let location: string;
        let livedTheme: string;
        let dispositor: string | undefined;

        if (kind === "house") {
            key = `house-${c.anchorHouse}`;
            const sign = c.members[0]?.sign ?? "";
            location = sign
                ? `${sign} ${ordinal(c.anchorHouse!)} house`
                : `${ordinal(c.anchorHouse!)} house`;
            livedTheme = houseStellumLivedTheme(c.anchorHouse!, members.length);
        } else if (kind === "sign") {
            key = `sign-${c.anchorSign!.toLowerCase()}`;
            location = c.anchorSign!;
            const dispositorPlanet = c.dispositor;
            if (dispositorPlanet) {
                const where = placementOf[dispositorPlanet];
                dispositor = where ? `${dispositorPlanet} (in ${where})` : dispositorPlanet;
            }
            livedTheme = signStellumLivedTheme(c.anchorSign!, members.length, c.dispositor);
        } else {
            key = `orb-${members.map((m) => m.toLowerCase()).join("-")}`;
            const sign = c.members[0]?.sign ?? "";
            location = sign ? `tight conjunction in ${sign}` : `tight conjunction`;
            livedTheme = orbStellumLivedTheme(members.length);
        }

        return {
            key,
            kind,
            location,
            members,
            leader,
            dispositor,
            mutualReceptionPair: c.mutualReceptionPairs[0],
            generational: c.generational,
            livedTheme,
        };
    }

    const dedupedOrb = dedupeRedundantOrbClusters(
        clusterSet.houseClusters,
        clusterSet.signClusters,
        clusterSet.orbClusters,
    );

    const stelliums: ChartStructureStellium[] = [
        ...clusterSet.houseClusters.map((c) => renderCluster(c, "house")),
        ...clusterSet.signClusters.map((c) => renderCluster(c, "sign")),
        ...dedupedOrb.map((c) => renderCluster(c, "orb")),
    ];

    const finalDispositor: ChartStructureFinalDispositor | undefined = clusterSet.finalDispositor
        ? {
              planet: clusterSet.finalDispositor,
              placement: placementOf[clusterSet.finalDispositor] ?? "",
          }
        : undefined;

    const patterns: ChartStructurePattern[] = suppressMoonNonApexTSquares(rawPatterns).map((p) => {
        let key: string;
        let livedTheme: string;
        if (p.type === "grand-trine") {
            key = `grand-trine-${(p.element ?? "unknown").toLowerCase()}`;
            livedTheme = grandTrineLivedTheme(p.element ?? "elemental");
        } else {
            key = `t-square-${(p.focal ?? "unknown").toLowerCase()}`;
            livedTheme = tSquareLivedTheme(p.focal ?? "the focal planet");
        }
        return {
            key,
            type: p.type,
            members: p.members,
            element: p.element,
            focal: p.focal,
            tightness: p.tightness,
            livedTheme,
        };
    });

    return { stelliums, finalDispositor, patterns };
}
