/**
 * clusters.ts — Stellium, dispositor, and mutual-reception detection.
 *
 * Pure detector module. Given a list of natal planets, returns a ClusterSet
 * with three independently-detected stellium kinds (house / sign / orb), plus
 * derived metadata: dispositor of each sign cluster, mutual-reception pairs,
 * dignified-leader candidates inside each cluster, and the chart's final
 * dispositor (when the dispositor chain converges).
 *
 * No side effects. No reads of feature flags. Downstream consumers (house
 * matrix amplifier, AI input builders) are responsible for gating on
 * CLUSTER_SCORING_V1.
 *
 * Plan reference: docs/implementation_plans/cluster-scoring.md §3.
 */

import { SIGN_RULERS, ESSENTIAL_DIGNITY } from "./astro-constants";
import { essentialDignityScore, solarProximityModifier } from "./dignity";

// ── Public types ─────────────────────────────────────────────────────────

/** Outer planets — Uranus, Neptune, Pluto. Used to flag generational
 *  clusters where ≥2 members are outers. The members still participate at
 *  full weight in the descriptor; the flag lets downstream amplifiers (and
 *  the AI commentary layer) decide whether to suppress narrative for clusters
 *  that millions of people share. */
const OUTER_PLANETS = new Set(["uranus", "neptune", "pluto"]);

/** Per-sign orb (degrees) used for the orb-cluster detector. Members are
 *  considered part of the same orb cluster if their longitudes fit inside a
 *  10° window. Tighter than the traditional 13.3° "stellium orb" because
 *  cross-sign orb clusters that wide just recover sign-cluster behavior. */
const ORB_CLUSTER_WINDOW_DEG = 10;

export type ClusterKind = "house" | "sign" | "orb";

/** Input contract — the minimum a natal planet must carry for cluster
 *  detection. The `house` field must already be resolved against the relevant
 *  house cusps (house-matrix.ts owns that resolution; clusters.ts trusts it). */
export interface ClusterInputPlanet {
    name: string;        // case-insensitive; canonicalized to capitalized form internally
    longitude: number;   // ecliptic longitude, 0–360
    sign: string;        // capitalized zodiac sign, e.g. "Capricorn"
    house: number;       // 1–12
}

export interface ClusterMember {
    planet: string;       // canonical capitalized form (matches ESSENTIAL_DIGNITY keys)
    longitude: number;
    sign: string;
    house: number;
    dignityScore: number; // essentialDignityScore at this placement
    isCombust: boolean;
    isCazimi: boolean;
    isOuter: boolean;
}

export interface ClusterDescriptor {
    kind: ClusterKind;
    members: ClusterMember[];
    size: number;                       // raw member count (outers count fully)
    anchorHouse?: number;               // populated when kind === "house"
    anchorSign?: string;                // populated when kind === "sign"
    spreadDegrees?: number;             // populated when kind === "orb"
    dispositor?: string;                // ruler of anchorSign (sign clusters only)
    /** Members tied for highest essential dignity, after combust members are
     *  excluded and cazimi members are forced to the front. Multiple entries
     *  on a tie. Empty when every member is combust (rare). */
    dignifiedLeaders: string[];
    /** Pairs of cluster members in mutual reception (each in the other's
     *  domicile sign). Pairs are sorted alphabetically for stable equality. */
    mutualReceptionPairs: [string, string][];
    /** True when ≥2 members are outer planets (Uranus/Neptune/Pluto). Flags
     *  generational clusters that downstream layers may want to suppress. */
    generational: boolean;
}

export interface ClusterSet {
    houseClusters: ClusterDescriptor[];
    signClusters: ClusterDescriptor[];
    orbClusters: ClusterDescriptor[];
    /** Single planet name when every dispositor chain in the chart converges
     *  on one planet without cycles; undefined otherwise. The final dispositor
     *  is the chart's structural "master key" — every other planet's energy
     *  routes through it. */
    finalDispositor?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────

/** Canonicalize a planet name to its capitalized form so it matches the
 *  ESSENTIAL_DIGNITY / SIGN_RULERS tables, both of which use capitalized keys
 *  ("Sun", "Mars", "Jupiter"). Input may be any case. Multi-word planet names
 *  ("North Node") preserve their internal casing pattern. */
function canon(name: string): string {
    if (!name) return name;
    return name
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
}

/** Build a ClusterMember from an input planet. Combustion/cazimi flags are
 *  computed against the Sun's longitude in the same input set — when no Sun
 *  is present (defensive; should not happen in real charts), both flags are
 *  false. */
function buildMember(p: ClusterInputPlanet, sunLon: number | undefined): ClusterMember {
    const planet = canon(p.name);
    const isSun = planet === "Sun";
    const dignityScore = essentialDignityScore(planet, p.sign);
    let isCombust = false;
    let isCazimi = false;
    if (!isSun && sunLon !== undefined) {
        const solar = solarProximityModifier(planet, p.longitude, sunLon);
        // Only full combust excludes a planet from the leadership pool.
        // Under Beams (9–17° from Sun) is a milder dampener — the planet is
        // weakened but still capable of leading a cluster. Cazimi (≤17') is
        // the strongest possible state and forces leadership downstream.
        isCombust = solar.label === "Combust";
        isCazimi = solar.label === "Cazimi";
    }
    return {
        planet,
        longitude: p.longitude,
        sign: p.sign,
        house: p.house,
        dignityScore,
        isCombust,
        isCazimi,
        isOuter: OUTER_PLANETS.has(planet.toLowerCase()),
    };
}

/** Given a cluster's members, identify the dignified leader(s).
 *  Rules (plan §3.3):
 *    1. Cazimi members are guaranteed leaders (override dignity).
 *    2. Otherwise, exclude combust members from the candidate pool.
 *    3. Pick the highest-dignity non-combust member. Ties return all tied.
 *    4. If every member is combust, return [] (cluster has no leader).
 */
function pickDignifiedLeaders(members: ClusterMember[]): string[] {
    const cazimi = members.filter((m) => m.isCazimi);
    if (cazimi.length > 0) return cazimi.map((m) => m.planet);

    const eligible = members.filter((m) => !m.isCombust);
    if (eligible.length === 0) return [];

    let max = -Infinity;
    for (const m of eligible) if (m.dignityScore > max) max = m.dignityScore;
    return eligible.filter((m) => m.dignityScore === max).map((m) => m.planet);
}

/** Detect mutual-reception pairs inside a cluster — every pair (A, B) where
 *  A's planet rules B's sign AND vice versa. Pair tuples are sorted
 *  alphabetically for stable equality across runs. */
function findMutualReception(members: ClusterMember[]): [string, string][] {
    const pairs: [string, string][] = [];
    for (let i = 0; i < members.length; i++) {
        const a = members[i];
        const aTable = ESSENTIAL_DIGNITY[a.planet];
        if (!aTable) continue;
        for (let j = i + 1; j < members.length; j++) {
            const b = members[j];
            const bTable = ESSENTIAL_DIGNITY[b.planet];
            if (!bTable) continue;
            if (aTable.domicile.includes(b.sign) && bTable.domicile.includes(a.sign)) {
                const pair: [string, string] =
                    a.planet < b.planet ? [a.planet, b.planet] : [b.planet, a.planet];
                pairs.push(pair);
            }
        }
    }
    return pairs;
}

/** Count outer-planet members in a cluster. */
function outerCount(members: ClusterMember[]): number {
    return members.reduce((n, m) => n + (m.isOuter ? 1 : 0), 0);
}

/** Build the metadata fields shared by every descriptor: dignifiedLeaders,
 *  mutualReceptionPairs, and the generational flag. */
function decorateDescriptor(d: Omit<ClusterDescriptor, "dignifiedLeaders" | "mutualReceptionPairs" | "generational">): ClusterDescriptor {
    return {
        ...d,
        dignifiedLeaders: pickDignifiedLeaders(d.members),
        mutualReceptionPairs: findMutualReception(d.members),
        generational: outerCount(d.members) >= 2,
    };
}

// ── Detectors ────────────────────────────────────────────────────────────

function detectHouseClusters(members: ClusterMember[]): ClusterDescriptor[] {
    const byHouse = new Map<number, ClusterMember[]>();
    for (const m of members) {
        if (!byHouse.has(m.house)) byHouse.set(m.house, []);
        byHouse.get(m.house)!.push(m);
    }
    const out: ClusterDescriptor[] = [];
    for (const [house, ms] of byHouse) {
        if (ms.length < 3) continue;
        out.push(decorateDescriptor({
            kind: "house",
            members: ms,
            size: ms.length,
            anchorHouse: house,
        }));
    }
    return out.sort((a, b) => (a.anchorHouse ?? 0) - (b.anchorHouse ?? 0));
}

function detectSignClusters(members: ClusterMember[]): ClusterDescriptor[] {
    const bySign = new Map<string, ClusterMember[]>();
    for (const m of members) {
        if (!bySign.has(m.sign)) bySign.set(m.sign, []);
        bySign.get(m.sign)!.push(m);
    }
    const out: ClusterDescriptor[] = [];
    for (const [sign, ms] of bySign) {
        if (ms.length < 3) continue;
        out.push(decorateDescriptor({
            kind: "sign",
            members: ms,
            size: ms.length,
            anchorSign: sign,
            dispositor: SIGN_RULERS[sign],
        }));
    }
    return out;
}

/** Detect orb clusters by sliding a 10° window along the sorted ecliptic
 *  longitudes (with wrap-around at 0/360). For each maximal window containing
 *  ≥3 planets, emit one descriptor. We keep only the *largest* cluster
 *  centered on a given member set — overlapping sub-windows that are strict
 *  subsets are suppressed.
 *
 *  Wrap-around is handled by duplicating each longitude shifted by +360 and
 *  sliding through the 720°-long virtual ecliptic. We then dedupe by member
 *  identity (sorted longitudes within ORB_CLUSTER_WINDOW_DEG of each other,
 *  modulo 360, identify the same cluster regardless of how the window was
 *  found). */
function detectOrbClusters(members: ClusterMember[]): ClusterDescriptor[] {
    if (members.length < 3) return [];

    // Sort by longitude. Carry the original index so we can detect duplicates.
    const sorted = [...members].sort((a, b) => a.longitude - b.longitude);

    // Build a doubled ring [members @ lon, members @ lon+360] so a window
    // crossing 0° (e.g., 358°-2°) appears as a contiguous span.
    const doubled = [
        ...sorted.map((m) => ({ m, lon: m.longitude })),
        ...sorted.map((m) => ({ m, lon: m.longitude + 360 })),
    ];

    const seen = new Set<string>();
    const clusters: ClusterDescriptor[] = [];

    let left = 0;
    for (let right = 0; right < doubled.length; right++) {
        while (doubled[right].lon - doubled[left].lon > ORB_CLUSTER_WINDOW_DEG) left++;
        const span = right - left + 1;
        if (span < 3) continue;

        // Emit on RIGHT-edge — only when extending the window further would
        // either exceed the orb window or fall off the doubled array. This
        // guarantees we capture the maximal contiguous window for this set
        // of members.
        const nextWouldOverflow =
            right + 1 >= doubled.length ||
            doubled[right + 1].lon - doubled[left].lon > ORB_CLUSTER_WINDOW_DEG;
        if (!nextWouldOverflow) continue;

        const ms = doubled.slice(left, right + 1).map((d) => d.m);

        // Dedupe — a member may appear at both `lon` and `lon+360`. Because
        // we sort by longitude and the window is at most 10° wide, duplicates
        // of the same physical planet would only ever appear in windows that
        // happen to contain both halves of the doubled ring, which can't
        // happen for windows ≤10° on a 360° ring. Defensive uniq just in case.
        const uniq = Array.from(new Map(ms.map((m) => [m.planet + ":" + m.longitude, m])).values());
        if (uniq.length < 3) continue;

        const key = uniq.map((m) => m.planet).sort().join("|");
        if (seen.has(key)) continue;
        seen.add(key);

        const lons = uniq.map((m) => m.longitude);
        const spread = computeOrbSpread(lons);
        clusters.push(decorateDescriptor({
            kind: "orb",
            members: uniq,
            size: uniq.length,
            spreadDegrees: spread,
        }));
    }
    return clusters;
}

/** Smallest arc (in degrees) containing all longitudes, accounting for
 *  the 0/360° wrap. */
function computeOrbSpread(lons: number[]): number {
    if (lons.length < 2) return 0;
    const sorted = [...lons].sort((a, b) => a - b);
    let maxGap = 0;
    for (let i = 0; i < sorted.length; i++) {
        const next = sorted[(i + 1) % sorted.length];
        const here = sorted[i];
        const gap = i === sorted.length - 1 ? 360 - here + next : next - here;
        if (gap > maxGap) maxGap = gap;
    }
    return 360 - maxGap;
}

// ── Final dispositor walk ────────────────────────────────────────────────

/**
 * Compute the chart's final dispositor — the planet at the terminus of every
 * dispositor chain. Returns undefined when:
 *   - any chain hits a cycle that does not contain a self-disposited planet
 *   - chains converge to multiple planets
 *   - the input is missing planet/sign data
 *
 * A planet is "self-disposited" when it sits in one of its own domicile signs
 * (Saturn in Capricorn or Aquarius, Mars in Aries or Scorpio, etc.). A
 * self-disposited planet is the terminus of its own chain.
 */
function computeFinalDispositor(members: ClusterMember[]): string | undefined {
    if (members.length === 0) return undefined;

    // signOf: planet name → sign currently occupied
    const signOf = new Map<string, string>();
    for (const m of members) signOf.set(m.planet, m.sign);

    const termini = new Set<string>();
    for (const m of members) {
        const t = walkChain(m.planet, signOf);
        if (!t) return undefined;
        termini.add(t);
        if (termini.size > 1) return undefined;
    }
    return termini.size === 1 ? [...termini][0] : undefined;
}

function walkChain(start: string, signOf: Map<string, string>): string | undefined {
    let current = start;
    const seen = new Set<string>();
    while (true) {
        if (seen.has(current)) {
            // Cycle. Acceptable only if the cycle is a self-loop on a
            // self-disposited planet — handled by the early-return below.
            return undefined;
        }
        seen.add(current);

        const sign = signOf.get(current);
        if (!sign) return undefined;

        const ruler = SIGN_RULERS[sign];
        if (!ruler) return undefined;
        if (ruler === current) return current; // self-disposited terminus

        // If the ruler is not present in our planet set, treat the ruler
        // itself as the terminus (we have no further information).
        if (!signOf.has(ruler)) return ruler;

        current = ruler;
    }
}

// ── Public entry point ───────────────────────────────────────────────────

/**
 * Detect every cluster in the natal chart. Pure function — same input always
 * produces same output, no globals read, no flags consulted.
 *
 * Cazimi/combust flags on individual members are computed against the Sun's
 * longitude in the same input list. If no Sun is present (e.g., a partial
 * chart for testing), those flags will all be false and the dignified-leader
 * rules degrade gracefully to "highest dignity wins."
 */
export function detectClusters(planets: ClusterInputPlanet[]): ClusterSet {
    const sun = planets.find((p) => canon(p.name) === "Sun");
    const sunLon = sun?.longitude;
    const members = planets.map((p) => buildMember(p, sunLon));

    return {
        houseClusters: detectHouseClusters(members),
        signClusters: detectSignClusters(members),
        orbClusters: detectOrbClusters(members),
        finalDispositor: computeFinalDispositor(members),
    };
}
