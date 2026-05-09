# Cluster Scoring Plan — Stelliums, Dispositors & Aspect Patterns

**Status:** Draft for review
**Owner:** scoring engine
**Scope:** scoring math + AI commentary; UI/UX explicitly out of scope

---

## 1. Background — what exists today

The pipeline is layered:

1. **`app/lib/house-matrix.ts`** — produces a per-house score for all 12 houses.
   - Step 1 baseline by house type (angular/succedent/cadent) minus a global timing penalty.
   - Step 2 ruler dignity: looks up the sign on the cusp → its traditional ruler → that ruler's natal sign/degree → essential dignity score via Lilly's 5-tier system. **The cusp ruler's dignity already feeds the house score**, so a Capricorn-on-the-4th chart already gets credit (or penalty) from Saturn's natal placement.
   - Step 3 occupants: each planet sitting in the house contributes a `mod` value, modulated by sect, **combustion/cazimi/under-the-beams** (`solarProximityModifier` in [`dignity.ts:52`](app/lib/dignity.ts#L52)), planetary joys, hayz, and degree theory. Sums into `occupants`, clamped at ±100.
   - Step 4 ACG line proximity.
   - Steps 5+ aggregate per-event narrative material.

2. **`app/lib/scoring-engine.ts`** — projects per-house scores onto 9 life events via `W_EVENTS`, adds an affinity layer over `S_global` (planet × house × dignity × ACG bits), and an optional sky-modifier layer for current transits.

### What's already handled

- Combustion / cazimi / under-the-beams (per occupant).
- Cusp-ruler dignity (per house, via Step 2).
- Sect, joys, hayz, accidental dignity, ACG lines.
- Current-sky retrograde / aspects / eclipses (`computeSkyModifier`).

### What's missing (this plan addresses)

- **No clustering.** Three planets in one house stack linearly; no synergy term, no leader arbitration beyond the cusp-ruler path.
- **No dispositor chains.** Cusp ruler dignity is scored, but the *dispositor of the stellium itself* (the ruler of the sign holding the cluster) gets no extra signal when 3 planets route their energy through it.
- **No mutual reception.** Mars-in-Libra + Venus-in-Aries is a known amplifier; not detected.
- **No multi-planet aspect patterns.** Grand Trine, T-Square, Yod, Grand Cross, Kite, Mystic Rectangle are invisible to the engine.
- **No combustion arbitration inside clusters.** Combustion already fires for a Sun-Mercury conjunction, but the engine doesn't treat the surviving planet differently from any other co-located planet.

---

## 2. Decisions baked in (per user direction)

| Decision | Choice | Rationale |
|---|---|---|
| Stellium boundary | All three: house, sign, orb-cluster | Captures cusp-straddling clusters and gives downstream layers maximum flexibility |
| Outer planets | Counted at full weight | User intent — outer-heavy clusters do shape charts; we'll dampen via the dignified-leader logic instead of the count |
| Dignified-leader gap | Investigate cusp-ruler overlap first; only add new logic for cases the cusp-ruler path misses | Cusp ruler already scores ruler dignity at the house level; we shouldn't double-count |
| Phase 4 patterns | In scope (Grand Trine, T-Square, Yod, Grand Cross, Kite, Mystic Rectangle) | User explicitly asked |
| UI/UX | Out of scope | Engine + AI commentary only |
| Feature flag | `CLUSTER_SCORING_V1`, default off | Matches the [`scoring-flags.ts:30`](app/lib/scoring-flags.ts#L30) pattern; lets eval scripts A/B |

---

## 3. New module — `app/lib/clusters.ts`

Pure detector module. No mutations to existing scorers; just produces descriptors that downstream code consumes.

### 3.1 Types

```ts
export type ClusterKind = "house" | "sign" | "orb";

export interface ClusterMember {
  planet: string;       // lowercase
  longitude: number;    // 0–360
  sign: string;
  house: number;        // 1–12
  dignityScore: number; // from essentialDignityScore at this placement
  isCombust?: boolean;  // for downstream leader arbitration
  isCazimi?: boolean;
}

export interface ClusterDescriptor {
  kind: ClusterKind;
  members: ClusterMember[];
  size: number;                       // raw member count (outers count fully)
  anchorHouse?: number;               // populated for kind === "house"
  anchorSign?: string;                // populated for kind === "sign"
  spreadDegrees?: number;             // populated for kind === "orb"
  dispositor?: string;                // ruler of anchorSign (sign clusters)
  dignifiedLeader?: string;           // member with highest dignityScore
  mutualReceptionPairs?: [string, string][]; // detected within members
}

export interface ClusterSet {
  houseClusters: ClusterDescriptor[];
  signClusters: ClusterDescriptor[];
  orbClusters: ClusterDescriptor[];
}
```

### 3.2 Detection rules

- **House cluster:** ≥3 planets share `house` value. Anchor = the house number.
- **Sign cluster:** ≥3 planets share `sign`. Anchor = the sign. Dispositor = `SIGN_RULERS[anchorSign]`.
- **Orb cluster:** ≥3 planets within a contiguous 10° span on the ecliptic. Anchor not always meaningful; carry `spreadDegrees`. Computed by sorting by longitude, sliding a 10° window, and emitting any window with ≥3 members. Wraps around 0°/360°.

A planet may appear in multiple cluster kinds (e.g., a tight Capricorn stellium in the 10th house registers as house + sign + orb). Each layer applies its own multiplier; downstream consumers decide which to use.

### 3.3 Dignified-leader determination

Within each cluster:
1. Score each member's essential dignity at its actual placement (already imported).
2. Skip combust members entirely from the leadership candidate pool — combustion already weakened them; they cannot lead.
3. **Cazimi members are guaranteed leaders** (cazimi is the strongest possible state — overrides everything else, ×2.5 multiplier already applied).
4. Otherwise, pick the highest-dignity non-combust member. Ties split the bonus equally.

### 3.4 Mutual reception detection

For each pair of members A, B in the same cluster: if `ESSENTIAL_DIGNITY[A].domicile.includes(B.sign) && ESSENTIAL_DIGNITY[B].domicile.includes(A.sign)`, record the pair. Used by Phase 2 to apply a small additive bonus to both members' contributions.

---

## 4. Phase 1 — Stellium amplifier (house-matrix)

**Goal:** reflect "cluster is more than the sum of its parts" without rebuilding the matrix.

**Change:** in [`house-matrix.ts:813-880`](app/lib/house-matrix.ts#L813-L880), wrap the existing `occupants += mod` accumulation:

1. Pre-compute `houseCluster = clusterSet.houseClusters.find(c => c.anchorHouse === h)` once per house.
2. After the loop, if `houseCluster && houseCluster.size >= 3`:
   ```
   stelliumMult = 1 + 0.10 * (size - 2)   // 3 → ×1.10, 4 → ×1.20, 5 → ×1.30
   stelliumMult = min(stelliumMult, 1.5)  // hard cap
   occupants = occupants * stelliumMult
   ```
3. Existing ±100 clamp at [L882](app/lib/house-matrix.ts#L882) keeps the amplifier bounded.
4. Gate the entire amplifier behind `CLUSTER_SCORING_V1`. When off, behavior is identical to current.

**Sign-stellium parallel:** sign clusters don't anchor to a single house, but their members' houses each receive a smaller proportional lift (×1.05 per member if the sign cluster has ≥3 members in that sign, applied per-house to the members' individual contributions). This is gentler than the house amplifier because sign-stelliums are often spread across multiple houses.

**Orb-cluster:** treated identically to sign-cluster but tighter — ×1.07 per member.

When all three kinds overlap (the common case for tight stelliums), apply the **max** multiplier among the matching kinds, not the product. Multiplying would double-count.

---

## 5. Phase 2 — Dignity-arbitration gap analysis & leader/combust amplifier

**Question to answer first:** does the cusp-ruler dignity in [`house-matrix.ts:787-797`](app/lib/house-matrix.ts#L787-L797) already cover what we need?

**Answer:** partially. The cusp ruler's dignity affects the *house baseline*. That's enough when the dignified planet is also the cusp ruler. It misses the case where:

- A non-cusp-ruler planet sitting in a stellium is the most dignified member (e.g., Capricorn on H10, but Sun is exalted in Aries elsewhere — wait, that's not a stellium scenario; better example: Mars on H1 in Aries with Sun also there in Aries — Sun is the most dignified by exaltation, but Aries' cusp ruler is Mars).
- The dignified planet sits in a *different* house than the cusp it rules (cusp-ruler dignity affects the house ruled; doesn't amplify the dignified planet's *own* occupant contribution wherever it actually sits).

**Net:** the cusp-ruler path solves the "house-as-ruled" half. Phase 2 adds the missing "occupant-as-leader" half.

**Implementation:** in the occupant loop, after the existing combustion path:

1. Look up `cluster = houseClusters[h]` (or sign cluster matching this planet's sign).
2. If the planet is `cluster.dignifiedLeader`, multiply its `mod` by 1.25.
3. If the planet is a non-leader member of a cluster, multiply its `mod` by 0.92 (mild dampening so the cluster total is approximately preserved while distribution shifts toward the leader).
4. Cazimi members already get ×2.5 from `solarProximityModifier`; the leader bonus stacks on top. Combust members are *excluded* from leader-eligibility but still get their existing ×0.30 dampening.
5. **Mutual reception:** if a cluster has `mutualReceptionPairs`, add a flat +8 to each participating member's `mod` (mutual reception is a small but meaningful traditional amplifier).

**Why this doesn't double-count cusp-ruler dignity:** cusp-ruler dignity affects the *baseline* (Step 2). Leader arbitration affects the *occupant contribution* (Step 3). They're additive layers on different bases.

---

## 6. Phase 3 — Dispositor / domicile section in house-matrix

**Goal:** when 3+ planets cluster in a sign, the *ruler of that sign* becomes proxy-significant — the cluster routes its energy through the dispositor wherever it sits.

**Change:** new Step 2.5 inserted between existing Steps 2 (cusp ruler dignity) and 3 (occupants):

```
// ── Step 2.5: Dispositor amplification (CLUSTER_SCORING_V1) ──
//
// For each sign-stellium in the chart, the dispositor (sign ruler) carries
// the cluster's themes wherever it sits. If the dispositor is ALSO this
// house's cusp ruler, the cusp-ruler dignity bonus from Step 2 is amplified.
// Separately, the dispositor planet — wherever it sits as an occupant — gets
// a small bonus in Step 3 via the dispositor-of channel.
```

Implementation:

1. Pre-compute (once per chart, before the per-house loop): for each sign cluster, store `dispositorOf: Map<planet, ClusterDescriptor[]>` — which planet disposits which clusters.
2. In Step 2, if the cusp ruler is in `dispositorOf`, add `+5 × clusterCount` to `dignityPts` (clusters disposited add weight). Cap at +15 to avoid runaway.
3. In Step 3 (occupant loop), if a planet appears in `dispositorOf`, multiply its `mod` by `1 + 0.08 × clusterCount` (caps at ×1.24). This applies *wherever* the dispositor sits, regardless of whether it's in a cluster itself.

**Edge case — chained dispositors:** if Sun in Capricorn (Saturn-disposited) and Saturn in Aquarius (also Saturn-disposited — Saturn rules both), don't double-count Saturn's bonus. Track the *unique* set of clusters Saturn disposits.

**Edge case — final dispositor:** if the entire chart's dispositor chain converges on one planet (e.g., Saturn rules Capricorn+Aquarius, every other planet's sign chains back to Saturn), that planet is the **final dispositor** and gets an additional +10 to its occupant `mod`. Detection: walk the chain from each planet; if all chains terminate at the same planet without cycles, that planet is final.

---

## 7. Phase 4 — Multi-planet aspect patterns

**New module:** `app/lib/aspect-patterns.ts`. Pure detector, similar shape to `clusters.ts`.

### 7.1 Patterns to detect

| Pattern | Definition | Effect |
|---|---|---|
| **Grand Trine** | 3 planets at ~120° from each other, all in same element | +6 uniform lift to events tied to that element (fire→Identity/Career, earth→Wealth/Health, air→Friendship/Partnership, water→Home/Spirit/Romance) |
| **T-Square** | 2 planets in opposition + 1 squaring both (focal planet) | -4 to focal planet's house score; +2 to the focal planet's *occupant* mod (forced productivity). Net: friction with payoff |
| **Grand Cross** | 4 planets in mutual squares & oppositions | -3 broad dampener applied to all 4 implicated houses; high-friction signal |
| **Yod** | 2 planets in sextile + both quincunx a third (apex) | +5 to the apex planet's occupant mod (the "fated" focal) |
| **Kite** | Grand Trine + 1 planet opposite one trine member | Grand Trine lift + an opportunistic +3 to the opposing planet's house (the channel) |
| **Mystic Rectangle** | 2 oppositions connected by 2 sextiles + 2 trines | +4 uniform across 4 implicated houses (rare, harmonious) |

### 7.2 Orb tolerances

| Aspect type | Tight orb (full effect) | Loose orb (tapered) |
|---|---|---|
| Conjunction | 5° | 8° |
| Opposition | 6° | 9° |
| Trine | 5° | 8° |
| Square | 5° | 8° |
| Sextile | 3° | 5° |
| Quincunx | 2° | 4° |

Effects scale linearly from full (tight) → 0 (beyond loose). Patterns with all members at tight orbs land at full strength; mixed-orb patterns get a proportional discount.

### 7.3 Integration

Patterns produce an `AspectPattern[]` consumed at two layers:

1. **House-matrix:** inside Step 3, after the cluster-leader bonus, look up patterns this planet participates in and apply the per-pattern `mod` adjustment.
2. **Scoring-engine:** extend `S_global` past index 169 with a new "patterns" channel (indices 170+, one bit per (pattern type × element/quality) combination). Add a new column block to `M_AFFINITY` for these. This lets per-event weights be learned/tuned per pattern.

**Scope discipline:** Phase 4 ships in its own PR per pattern, not all-at-once. Suggested order: Grand Trine → T-Square → Yod → Grand Cross → Kite → Mystic Rectangle. The first two cover the common cases; the rest are rare and can wait.

---

## 8. AI commentary plan

The cluster/pattern detectors produce structured data; the AI prompts need three things:

1. **Engine output** must surface clusters and patterns alongside existing fields.
2. **Schemas** ([`lib/ai/schemas.ts`](lib/ai/schemas.ts)) must define optional commentary slots so the AI has a place to put cluster prose.
3. **Prompts** must instruct the AI when to cite clusters/patterns and how — including the Economist gloss rule for terms like "stellium" and "dispositor" that lay readers won't know.

### 8.1 Engine → AI input changes

In whichever module assembles the AI input payload (`lib/readings/ai-input-builder.ts` for teacher reading, `lib/readings/ai-couples-input-builder.ts` for couples), add a new field:

```ts
chartStructure?: {
  stelliums: Array<{
    kind: "house" | "sign" | "orb";
    location: string;        // "Capricorn 10th house" | "Capricorn" | "Cap-Aqua cusp"
    members: string[];       // ["Sun", "Mercury", "Venus"]
    leader: string;          // "Mercury — exalted, leads the cluster"
    dispositor?: string;     // "Saturn (in Pisces, 12th)"
    livedTheme: string;      // pre-baked plain-English gist for the AI to riff on
  }>;
  finalDispositor?: string;  // when chain converges
  aspectPatterns: Array<{
    type: "grand-trine" | "t-square" | ...;
    members: string[];
    apex?: string;
    element?: "fire" | "earth" | "air" | "water";
    livedTheme: string;
  }>;
};
```

The `livedTheme` field is **engine-generated boilerplate**, not AI-written. It exists to give the model a starting register so its output stays anchored to canonical interpretations. Examples:
- House stellium: "Three planets clustered in [house] turn this area of life into a dominant theme — what happens here outweighs everything else."
- Final dispositor: "[Planet]'s placement is the chart's final answer — every other planet routes through it."
- Grand Trine: "A sealed triangle of [element] energy — gifts that arrive without effort, rarely tested, sometimes underused."

### 8.2 Schema updates — `lib/ai/schemas.ts`

Add to `TeacherReadingSchema`:

```ts
clusterCommentary: z.array(z.object({
  clusterKey: z.string(),    // matches a stellium "key" from input
  headline: z.string(),      // ≤ 80 chars
  body: z.string(),          // 2-4 sentences
})).optional(),

patternCommentary: z.array(z.object({
  patternKey: z.string(),    // matches a pattern "key" from input
  headline: z.string(),
  body: z.string(),
})).optional(),
```

Add equivalent fields to `CouplesReadingSchema` — patterns matter even more in synastry where two charts intermingle.

### 8.3 Prompt block additions

#### `lib/ai/prompts/teacher-reading.ts`

New block, inserted after `BLOCK_GEODETIC_PLACE_CHARACTER`:

```
const BLOCK_CHART_STRUCTURE = `# Chart Structure (Stelliums, Dispositors, Patterns)

When `chartStructure.stelliums` is non-empty, you MUST emit `clusterCommentary` — one entry per stellium, keyed by the stellium's `key` field verbatim.
- Lead with the lived theme, not the astrology jargon. "Three planets pile up in your career sector — work isn't a thing you do, it's the room you live in" beats "You have a stellium in the 10th house."
- ALWAYS gloss "stellium" the first time it appears in a tab: "a stellium — three or more planets crammed into one zone of the chart, which forces that area to dominate."
- Name the dispositor when present: "and Saturn — the planet that rules the sign holding the cluster — is sitting in your 12th, which means the whole pile-up runs through your private inner work before it shows up publicly."
- If `chartStructure.finalDispositor` is set, mention it explicitly: "Your chart has a final dispositor — every planet's energy chains back to [planet]. That makes [planet]'s placement the master key."

When `chartStructure.aspectPatterns` is non-empty, emit `patternCommentary` — one entry per pattern.
- Grand Trine: name the element and the "gift you might underuse" register.
- T-Square: name the apex planet as the pressure point and the opposition pair as the tug-of-war.
- Yod: name the apex planet as the "fated focus" — heavy framing acceptable here.
- Grand Cross / Kite / Mystic Rectangle: gloss carefully (these are rare and unfamiliar to most readers).

Hard constraints:
- Never invent stelliums or patterns absent from `chartStructure`.
- Never describe a stellium that has only 2 members — the engine guarantees ≥3 before it surfaces one.
- Patterns and clusters described in `clusterCommentary`/`patternCommentary` should be referenced in the relevant tab's lead too (e.g., a 10th-house stellium gets a callout in the `life-themes` or `place-field` tab lead).
`
```

#### `lib/ai/prompts/couples-reading.ts`

In synastry context, clusters in one chart create predictable interaction patterns when contacted by the partner's planets. Add to `TASK_INSTRUCTIONS`:

```
**Cluster contact (synastry):** When `chartStructure.stelliums` is present for either partner AND the partner has a planet aspecting the stellium tightly (orb ≤ 4°), the partner is *activating* the stellium. This is a major synastry signal — name it explicitly in `deepDive.synastryLead` or `deepDive.youLead`/`partnerLead` as appropriate. Examples:
- "Sam's Mars hits your Capricorn stellium — every time you're together, the work ambition the cluster represents either ignites or grinds, never sits still."
- "Your Venus lands square Sam's Aries pile-up — affection becomes the friction surface for a chart that wants to assert."

When `chartStructure.aspectPatterns` is present in either partner, name how the pattern shapes the dynamic:
- Grand Trine in one chart + a planet from the other touching the trine = Kite formation between charts (rare and noteworthy).
- T-Square in one chart + the partner's planet sitting on the apex = the partner becomes the relief valve (or the trigger).
```

#### `app/api/chart/interpret/route.ts`

This is the natal chart reading (4-section narrative: chartEssence, houseArchitecture, aspectWeaver, naturalAngles). Add cluster awareness in three sections:

1. **chartEssence** — if `finalDispositor` is set, include it as a major interpretive anchor alongside ASC/Sun/Moon/chart ruler.
2. **houseArchitecture** — if a stellium sits in the strongHouse or growthHouse, mention it in the oneLiner ("This area dominates because three planets pile up here").
3. **aspectWeaver** — if `aspectPatterns` is non-empty, the 5 surfaced aspects should preferentially come from pattern members rather than isolated aspects (patterns are structurally more important than scattered aspects).

Add a new optional section `chartStructureNote` (zod-schema'd) that fires only when stelliums or final dispositor exist — keeps the 4-section structure when the chart is structurally simple.

#### `lib/ai/prompts/natal-script.ts` (oral video script)

Add a structural cue between sections 2 and 3:

```
**Optional: Structural Anchors (insert after Core Identity, before Power Centers)**
If `chartStructure.stelliums.length > 0` OR `chartStructure.finalDispositor` is set, spend 30–60 seconds on it before moving to Power Centers. The pile-up or final dispositor IS the chart's organizing principle and should be named explicitly in the oral register: "Now here's what most readers would miss — you've got three planets stacked in your [house]. That's a stellium. It means [register]."
```

### 8.4 What NOT to surface

- **Orb clusters that are also house+sign clusters** — pick one register. Default to house, since house phrasing reads more concretely to lay readers ("three planets in your career sector" beats "three planets in Capricorn").
- **Generational outer-only clusters** — even though we count outers in the score, don't write personal narrative about a Saturn-Uranus-Pluto cluster that millions share. The `chartStructure` payload should flag these with a `generational: true` field; prompts skip them.
- **T-Squares with Moon as a member when the Moon is not the apex** — the Moon's natural fluctuation makes loose-orb Moon T-Squares unstable; surface only when the Moon IS the apex (rarely) or when all three members are at tight orbs.

---

## 9. Validation strategy

1. **Unit tests** — `__tests__/cluster-detection.test.ts`. Hand-built fixture charts:
   - Known triple-Capricorn-stellium: assert all three detectors fire with the right anchors and members.
   - Mutual reception case (Mars-Libra + Venus-Aries): assert the pair is detected.
   - Final dispositor case: assert the chain converges and the right planet is flagged.
   - No-cluster baseline: assert empty detector output, and assert house scores are bit-for-bit identical to pre-change output (regression guard via flag-off comparison).

2. **Pattern tests** — `__tests__/aspect-patterns.test.ts`. Hand-built fixture charts:
   - Known Grand Trine in earth: assert detection + correct element + correct uniform lift to earth-tied events.
   - Known T-Square: assert apex identification + correct house-of-apex penalty/bonus split.
   - Tight-vs-loose orb: assert tapering math.

3. **Integration** — extend the existing eval/sweep scripts that toggle `WIDE_SCORING_V1` to also toggle `CLUSTER_SCORING_V1`. Compare:
   - Variance of event scores across the chart corpus (expect modest widening — clusters add signal).
   - Distribution of "Career" scores in known-10th-house-stellium charts (expect upward shift).
   - Distribution of `finalDispositor` planets across the corpus (sanity check — should not be uniformly one planet).

4. **AI snapshot tests** — for a fixture chart with a known stellium, run `writeTeacherReading` with `CLUSTER_SCORING_V1=on` and assert `clusterCommentary` is non-empty and references the right house/sign. Use the existing test harness pattern (LLM output is non-deterministic, so assert on schema-level presence + key references rather than exact prose).

---

## 10. PR sequencing

| PR | Scope | Lines (est.) | Depends on |
|---|---|---|---|
| **#1** | `clusters.ts` module + tests + flag plumbing. No integration yet. | ~250 | — |
| **#2** | Phase 1 — house/sign/orb amplifier in `house-matrix.ts`. Behind flag. | ~120 | #1 |
| **#3** | Phase 2 — leader arbitration + mutual reception. | ~150 | #1, #2 |
| **#4** | Phase 3 — dispositor section (Step 2.5 + occupant amplifier). | ~180 | #1 |
| **#5a** | Phase 4 — `aspect-patterns.ts` module + Grand Trine + T-Square. | ~300 | — |
| **#5b** | Phase 4 — Yod + Grand Cross + Kite + Mystic Rectangle. | ~250 | #5a |
| **#6** | Engine → AI input plumbing. Adds `chartStructure` to input builders. | ~150 | #1, #5a |
| **#7** | Schema updates + prompt block additions for `teacher-reading`, `couples-reading`, `natal-script`, and `app/api/chart/interpret/route.ts`. | ~200 | #6 |

**Total:** ~1,600 lines across 8 PRs. Each PR independently revertable behind the flag.

---

## 11. Open questions / things to sanity-check before implementing

1. **Outer-planet cluster magnitude.** User chose to count outers fully. After Phase 1 lands, sanity-check that Saturn-Uranus-Pluto generational clusters don't dominate scores. If they do, the cleanest fix is to add a `generational: true` flag in detection (≥2 outer members) and apply a 0.5× count discount only at the amplifier step, not in the descriptor.

2. **Cusp-ruler + dispositor stacking.** When the cusp ruler IS the dispositor of a stellium in that house, both Step 2 and Step 2.5 fire on the same planet. Verify the combined boost is reasonable and not double-counting. May need to subtract one of them or take the max.

3. **Pattern element mapping for events.** The proposed Grand Trine → element → events mapping is a first cut. Worth checking against the existing `M_AFFINITY` matrix to see whether the affinity weights already imply a different element-to-event mapping than the one proposed here.

4. **AI prompt token budget.** Adding cluster + pattern commentary expands the schema. Check that `maxOutputTokens: 32768` in [`teacher-reading.ts:224`](lib/ai/prompts/teacher-reading.ts#L224) and `couples-reading.ts:106` is still sufficient. Likely fine but worth measuring after #7.

5. **Backwards compatibility.** `chartStructure` as an optional field on existing schemas means old cached readings keep working. But the cache key for natal interpretations may need a version bump to invalidate stale cached readings once cluster prose is being generated.
