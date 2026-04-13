# 01c — Goals, Houses, and Per-Goal Evaluation Labels

**Status:** Draft for review
**Owner:** TBD
**Depends on:** [docs/prd/onboarding-flow.md](../prd/onboarding-flow.md) (canonical goal list), [docs/prd/scoring-rubric.md](../prd/scoring-rubric.md) (existing engine), [docs/prd/analysis-layers.md](../prd/analysis-layers.md) (layer separation)
**Consumed by:** `02-negative-sampling.md`, `04-evaluation-protocol.md`, `05-evaluation-metrics.md`

---

## 1. Purpose

This doc is the single source of truth for:

1. **The canonical goal list** (copied from the onboarding PRD — do not duplicate or rename).
2. **The goal → house mapping** used to re-aggregate per-house engine scores into per-goal scores.
3. **The per-goal event evidence types** the enrichment layer must extract.
4. **Per-goal polarity rules and outcome windows** for labeling biographical events.
5. **Known limitations per goal** — which goals can be evaluated rigorously, which require caveats, and which are excluded from location-scoring evaluation entirely.

The evaluation framework does *not* retrain the existing engine. It runs [computeHouseMatrix()](../../lib/astro/) over enriched (subject, location, time) triples, re-aggregates the 12 house scores into per-goal scores using §4 below, and compares those per-goal scores to per-goal biographical labels.

---

## 2. Canonical Goal List

From [onboarding-flow.md §Screen 4](../prd/onboarding-flow.md). **Six goals, not nine.** Users select 1–3 ranked goals. Four are "core" (always visible), two are "optional add-ons."

| # | Goal | PRD name | Tier | Canonical key |
|---|---|---|---|---|
| 1 | 💕 Love & Relationships | `Love & Relationships` | Core | `love` |
| 2 | 💼 Career & Ambition | `Career & Ambition` | Core | `career` |
| 3 | 🤝 Community & Friendships | `Community & Friendships` | Core | `community` |
| 4 | ⏱️ Timing & Life Transitions | `Timing & Life Transitions` | Core | `timing` |
| 5 | 🌱 Personal Growth | `Personal Growth` | Optional | `growth` |
| 6 | 🏠 Relocation / Living | `Relocation / Living` | Optional | `relocation` |

**Storage:** `profiles.life_goals` is a `jsonb` array of canonical keys. Ranking is position-preserving: index 0 = primary, 1 = secondary, 2 = tertiary.

**Weighting at inference (for combining per-goal scores into a single displayed macroScore):**

| User picks | Weight assignment |
|---|---|
| 1 goal | primary = 1.00 |
| 2 goals | primary = 0.65, secondary = 0.35 |
| 3 goals | primary = 0.50, secondary = 0.33, tertiary = 0.17 |

This weighting is an inference-time UX choice, not an evaluation parameter. The evaluation framework reports per-goal metrics independently — combining metrics across goals would obscure which goals the engine actually scores well on.

---

## 3. The Timing Goal Is Structurally Different

Four of the six goals are *location-scoreable* — they answer "is this **place** good for X?" Timing answers "**when** should I do X?" That's a fundamentally different output surface:

- Location goals → score a (person, location) pair. Map to the existing engine's house scores.
- Timing goal → score a (person, location, **window**) triple. Map to the existing 12-month Windows feature.

**Decision:** Timing is excluded from per-location PR-AUC evaluation. It gets its own metric family:

- **Peak MAE** — for biographical events with known dates, how many weeks away was the engine's predicted peak window?
- **Window precision/recall** — of months the engine rated "excellent," what fraction coincided with actual positive events for that subject?

Timing evaluation is specified in `05-evaluation-metrics.md`, not here. This doc covers the five location-scoreable goals.

---

## 4. Goal → House Mapping

The existing engine produces 12 house scores per (person, location, time), each 0–100. Per-goal scores are weighted linear combinations of those house scores.

Weights below are anchored to the PRD's stated house mappings (onboarding §Screen 4) and cross-checked against the existing engine's house themes (scoring-rubric §Personal/Collective buckets). They are **initial weights for evaluation**, not final product weights — the whole point of the evaluation is to see if they produce calibrated per-goal predictions.

### 4.1 `love` — Love & Relationships

| House | Weight | Role |
|---|---|---|
| H7 | 0.50 | Partnerships, marriage (primary) |
| H5 | 0.30 | Romance, courtship, pleasure |
| H8 | 0.15 | Intimacy, shared resources |
| H4 | 0.05 | Domestic foundation |

**Score formula:** `love_score = 0.50·H7 + 0.30·H5 + 0.15·H8 + 0.05·H4` (on 0–100 scale)

Rationale: PRD names H5 + H7 explicitly. H8 added for intimacy/sexual partnership (absent from PRD but traditional). H4 minor weight for the "settling down" dimension.

### 4.2 `career` — Career & Ambition

| House | Weight | Role |
|---|---|---|
| H10 | 0.55 | Public achievement, reputation (primary) |
| H6 | 0.20 | Daily work, craft, routine |
| H2 | 0.15 | Earned income from career |
| H11 | 0.10 | Professional networks, colleagues |

**Score formula:** `career_score = 0.55·H10 + 0.20·H6 + 0.15·H2 + 0.10·H11`

Rationale: PRD names H10 + H6. H2 added because career outcomes compound financially. H11 added because career mobility is heavily networked.

### 4.3 `community` — Community & Friendships

| House | Weight | Role |
|---|---|---|
| H11 | 0.55 | Groups, friends, affiliations (primary) |
| H3 | 0.25 | Neighbors, local community, daily contacts |
| H7 | 0.20 | Close friendships (one-on-one) |

**Score formula:** `community_score = 0.55·H11 + 0.25·H3 + 0.20·H7`

Rationale: PRD names H11 + H3. H7 added because "friendship" as lived experience includes one-on-one relationships, which traditionally fall in H7 (non-romantic partnerships).

**Flag:** This is the goal with the thinnest biographical evidence (see §6.3).

### 4.4 `growth` — Personal Growth

| House | Weight | Role |
|---|---|---|
| H9 | 0.45 | Higher learning, philosophy, foreign ideas |
| H12 | 0.35 | Solitude, spiritual practice, inner life |
| H3 | 0.20 | Learning, study, curiosity |

**Score formula:** `growth_score = 0.45·H9 + 0.35·H12 + 0.20·H3`

Rationale: PRD names H9 + H12. H3 added because day-to-day learning (classes, reading) happens there.

**Flag:** This goal is the hardest to ground-truth objectively (see §6.4). Consider treating as evaluation-only for educational events (degree completion, book published, documented religious conversion) and excluding from subjective growth claims.

### 4.5 `relocation` — Relocation / Living

| House | Weight | Role |
|---|---|---|
| H4 | 0.60 | Home, roots, sense of belonging (primary) |
| H2 | 0.15 | Cost of living, material stability |
| H6 | 0.15 | Daily life quality, routines |
| H1 | 0.10 | Personal identity in the new place |

**Score formula:** `relocation_score = 0.60·H4 + 0.15·H2 + 0.15·H6 + 0.10·H1`

Rationale: PRD names H4/IC explicitly. H2 and H6 added for the practical substrate of daily life. H1 added because relocation is partly identity reinvention.

**Note:** This is the goal closest to the existing engine's composite `macroScore`. For relocation users, the engine's current macroScore is already near-optimal; evaluation will tell us whether re-weighting through this formula produces meaningfully different (and more accurate) predictions.

### 4.6 House coverage summary

| House | Appears in goals |
|---|---|
| H1 | relocation |
| H2 | career, relocation |
| H3 | community, growth |
| H4 | love, relocation |
| H5 | love |
| H6 | career, relocation |
| H7 | love, community |
| H8 | love |
| H9 | growth |
| H10 | career |
| H11 | career, community |
| H12 | growth |

Every house is used by at least one goal. No goal relies on a single house — all have 3–4 house contributions, which reduces variance in per-goal scores.

---

## 5. Event Evidence Types Per Goal

For each goal, this section defines what biographical events count as evidence, and their default polarity under the B-with-selective-C framework. This is what the enrichment pipeline (01b) must extract and label.

### 5.1 `love` — Event types

| Event type | Polarity | Outcome window | Notes |
|---|---|---|---|
| Marriage | **C** (window-required) | 5 years | Y=+1 if lasted; Y=0 if divorce ≤5y; Y=-1 if documented abuse/infidelity leading to end |
| Long-term relationship start (documented) | **C** | 5 years | Same logic as marriage |
| Engagement (broken before marriage) | −1 | — | Broken engagement = evidence of relationship failure at location |
| Divorce / separation | −1 | — | Unambiguous negative for H7 |
| Birth of child with partner | +1 | — | Family stability signal |
| Widowhood | 0 | — | Exclude — not a location-outcome signal |
| Documented affair leading to scandal | −1 | — | Evidence of H7 instability |

**Thin-data warning:** Most pre-1950 divorces are poorly documented. Biographies of women often underreport relationships. Expect data asymmetry across gender and era.

### 5.2 `career` — Event types

| Event type | Polarity | Outcome window | Notes |
|---|---|---|---|
| Major award won (Nobel, Pulitzer, Oscar, Fields Medal, Olympic gold, etc.) | +1 | — | Unambiguous, no window needed |
| Promotion to executive role (CEO, director, tenure, partner) | **C** | 5 years | Y=+1 if held; Y=0 if demoted/fired ≤5y |
| Company founded | **C** | 5 years | Y=+1 if survived; Y=0 if failed; Y=-1 if bankrupt with personal liability |
| Publication of canonical work | **C** | 10 years | Y=+1 if still read/referenced; Y=0 if forgotten; Y=-1 if retracted/panned |
| Career pivot (new industry/role) | **C** | 5 years | Y=+1 if the new career sustained; Y=0 if reversed |
| Bankruptcy, major fraud conviction, imprisonment affecting career | −1 | — | Unambiguous negative |
| Public disgrace with documented career collapse | −1 | — | Scandals with lasting consequences |
| Retirement (voluntary) | 0 | — | Exclude — not a location signal |
| Firing / forced resignation | −1 | — | Unambiguous negative |

**Strong-evidence warning:** The "career peak" concept is biographically over-documented relative to other goals — biographies structurally emphasize career arcs. This creates positive-class abundance that *helps* Career but may mask survivorship bias (we don't see the failed careers of non-famous people).

### 5.3 `community` — Event types

| Event type | Polarity | Outcome window | Notes |
|---|---|---|---|
| Co-founded movement / group / salon (Lost Generation, Bloomsbury, etc.) | **C** | 10 years | Y=+1 if the group produced lasting cultural output |
| Became documented member of a circle | +1 | — | Membership in historically-recognized group |
| Active political / civic leadership role in community | **C** | 5 years | Y=+1 if position held/re-elected; Y=0 if not |
| Ostracized from community, documented | −1 | — | Unambiguous negative |
| Exile (forced relocation away from community) | −1 | — | Location-specific evidence of community failure |
| Founded charity / community institution | **C** | 10 years | Y=+1 if the institution survived |

**Thin-data warning:** Pre-20th-century "community" evidence is sparse outside of aristocracy, clergy, and politicians. Community is the **goal most likely to have poor per-goal PR-AUC** from data sparsity alone, independent of engine quality.

### 5.4 `growth` — Event types

| Event type | Polarity | Outcome window | Notes |
|---|---|---|---|
| Completed formal education (degree) at location | +1 | — | Objective credential |
| Religious conversion / documented spiritual turning point | **C** | 10 years | Y=+1 if persisted; Y=0 if reversed or de-converted |
| Published philosophical / spiritual work that entered canon | **C** | 20 years | Canonical vs. forgotten — long window |
| Documented periods of sustained meditation / retreat / monastic practice | +1 | — | If verifiable from primary sources |
| Started therapy / personal recovery program that is credited in autobiography | **C** | 5 years | Subject's own framing matters here |
| Breakdown / hospitalization | −1 | — | Unambiguous negative for growth goal, but complex (may be precursor to growth) |

**Subjectivity warning:** Of all five location-scoreable goals, `growth` is the most subjective. Recommendation: restrict Phase 1 training labels to *objectively verifiable* events (degree earned, book published, documented hospitalization). Exclude "spiritual awakening" claims unless the subject's own autobiography uses language of transformation. Accept reduced sample size.

### 5.5 `relocation` — Event types

| Event type | Polarity | Outcome window | Notes |
|---|---|---|---|
| Moved and stayed (≥3 years continuous residence) | +1 | 3 years (built in) | The location "took" |
| Moved and reversed ≤3 years (returned to prior city) | 0 | — | Neutral — doesn't necessarily mean bad location |
| Moved and reversed with documented distress (homesickness, illness, depression attributed to move in primary sources) | −1 | — | Explicit negative |
| Became citizen / established permanent legal residence | +1 | — | Strong positive signal |
| Exile / forced relocation | 0 | — | Exclude — not voluntary, not a location-fit signal |
| Purchased long-term home | +1 | — | Commitment signal |
| Died at location after long residence | +1 | — | Evidence of sustained fit |

**Note:** The `relocation` goal has *mechanically different* labels than other goals — the "event" is the residence interval itself, not a discrete biographical moment. The enrichment pipeline (01b §3) already stores residence intervals as the primary data; this goal consumes them directly.

---

## 6. Per-Goal Evaluation Caveats

### 6.1 `love` — Moderate confidence expected

Good data for modern subjects (post-1950), thin for pre-1900 especially for women. Expect PR-AUC in the 0.60–0.70 range on the enriched AA cohort. If engine scores below 0.55, check whether the marriage labels are correctly window-validated — unvalidated "marriage = +1" labels are the most likely source of label noise.

### 6.2 `career` — Highest confidence expected

Biographies over-document career arcs. Rich event vocabulary, clear outcome windows, unambiguous negative events (bankruptcy, firing). If any goal is going to exceed PR-AUC 0.70 on Phase 1 evaluation, it will be career. **Suspicion signal:** if career PR-AUC is unusually high (>0.80), check for fame leakage — the engine may be learning "famous places" rather than "career-productive placements." Cross-validate by subject era and geography.

### 6.3 `community` — Expect poor performance, document honestly

Evidence is sparse outside narrow subject classes (artists in documented circles, politicians, aristocrats). Expect PR-AUC in the 0.50–0.60 range on Phase 1. This may reflect data sparsity, not engine weakness — separate the two by measuring per-goal sample sizes and reporting effective evaluation cohort per goal.

### 6.4 `growth` — Evaluation-only, not product-facing until data improves

Restrict Phase 1 evaluation to objective growth events (degrees, published works, hospitalizations). Do not claim a PR-AUC for subjective growth until a separate dataset (possibly user self-reports post-launch) exists. Product copy should reflect this limitation — "Growth scoring is experimental" is honest and defensible.

### 6.5 `relocation` — Clean, mechanically different

Because the label is the residence interval itself, `relocation` has the cleanest label-generation process of any goal. However, its prediction is closest to the existing composite `macroScore` — so its evaluation primarily tests whether re-weighting through §4.5 produces meaningfully different predictions than the current engine output. If `relocation_score` correlates r > 0.95 with `macroScore`, the re-weighting adds no value and we should revert to using `macroScore` directly for this goal.

---

## 7. How the Evaluation Pipeline Consumes This Doc

Concretely, for each enriched (subject, location, time_window) row from the 01b location data:

1. Run `computeHouseMatrix()` → get `{H1..H12}` scores, each 0–100.
2. Compute per-goal scores via §4 formulas → `{love, career, community, growth, relocation}`, each 0–100.
3. Look up per-goal ground-truth labels from enriched event records (§5):
   - Apply polarity rules (positive / negative / window-required).
   - Apply outcome windows where specified.
   - Produce per-goal label `Y ∈ {-1, 0, +1, null}` where null = no biographical evidence for this goal at this (subject, location, time).
4. Drop null rows per goal (cannot evaluate without a label).
5. Compute per-goal metrics (PR-AUC, calibration, Spearman) on the non-null rows. Report per-goal sample size alongside each metric — sample size is itself a finding.

The `timing` goal is handled separately via `05-evaluation-metrics.md` §Peak MAE.

---

## 8. Open Questions

1. **Re-weighting anchoring.** The per-goal house weights in §4 are hand-derived from the PRD. Should they be documented as "evaluation v1 weights, subject to revision" with a changelog, or treated as load-bearing product-semantic definitions? Proposal: v1 weights, changelog-tracked.

2. **`growth` Phase 1 scope.** Restrict to objective events only (proposed in §6.4), or include subjective autobiography-language events with a separate `subjective=true` flag? Proposal: objective only for Phase 1; revisit when we have user self-reports.

3. **Multi-goal evidence.** The Hemingway Paris 1926 case produces evidence for *career* (positive) and *love* (negative) simultaneously. The enrichment schema (01b §3.2 after the update in the last conversation) supports per-goal polarity maps. Confirming this is still the intended design and not something the review has changed.

4. **`relocation` vs. `macroScore` fallback.** If §6.5's correlation test shows `relocation_score ≈ macroScore`, do we (a) keep the per-goal formula for consistency, or (b) route relocation users directly to the existing macro output? Proposal: (a) for consistency — the formulas are cheap and keep the evaluation pipeline uniform.

5. **Community data gap.** Is there appetite for a targeted community-evidence enrichment pass (e.g., scraping member lists of documented historical circles, activist groups, founding teams)? This would materially improve the community goal's evaluability but adds ~2 weeks of manual curation.

6. **Weight sensitivity analysis.** Before declaring per-goal PR-AUC numbers, should `04-evaluation-protocol.md` require a sensitivity sweep on §4 weights (±20% perturbation) to confirm metric stability? Proposal: yes, and report metric ranges not point estimates in the final evaluation.
