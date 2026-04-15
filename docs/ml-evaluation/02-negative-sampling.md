# 02 — Negative Sampling

**Status:** Draft for review
**Owner:** TBD
**Depends on:** [01b](./01b-location-enrichment.md) (residence + event records), [01c](./01c-goals-and-houses.md) (per-goal label rules)
**Consumed by:** [04 §4.2](./04-evaluation-protocol.md) (Stage 1 row construction)

---

## 1. Purpose

Evaluation requires both positive and negative rows. Biographical data gives us positives — a dated, located event that maps to a goal's +1 or −1 label. We must synthesize negatives: (subject, location, time) triples where no goal-relevant event occurred, or where the subject wasn't present at all.

Without negatives, PR-AUC is undefined. With poorly-chosen negatives, PR-AUC is artificially inflated by confounds (class imbalance, geographic plausibility, era shifts). This doc defines the rules that keep negative sampling honest.

## 2. Two negative types, two questions

| Type | Question | Keeps constant | Varies |
|---|---|---|---|
| **Temporal negative** | "Does the engine distinguish eventful years from quiet years *for this person at this location*?" | Subject, location | Time |
| **Geographic negative** | "Does the engine rank the actual city above other plausible cities *for this person on this date*?" | Subject, time | Location |

These answer different product questions. The 12-month Windows feature maps to temporal evaluation. The "compare candidate cities" feature maps to geographic evaluation. Reporting metrics separately for each type is more informative than a merged number.

A third type — subject negatives (same location/time, different subject) — is **excluded**. The engine's score is subject-dependent, so swapping subjects changes everything about the prediction. Subject negatives would measure nothing useful.

## 3. Temporal negative sampling

### 3.1 Intuition

For a subject with a 10-year residence in Paris and a single 1921 marriage event, the temporal negatives are other years in the same Paris residence when no marriage event occurred. The engine sees the same natal chart, same location, but different transiting sky — and should score the actual 1921 marriage year higher than the quiet years, if the engine has real temporal signal.

### 3.2 Construction rules

**Step 1: Partition.** For each `residence_record` where the subject had continuous residence ≥ 24 months, partition the interval into non-overlapping 12-month sub-windows starting at the residence start date.

Example: Hemingway in Paris 1921-01 → 1928-01 (7 years) → 7 sub-windows: `[1921-01, 1922-01), [1922-01, 1923-01), …, [1927-01, 1928-01)`.

**Step 2: Goal-specific exclusion zones.** For each goal independently, exclude sub-windows that overlap:
- A positive event for that goal (±3 months buffer)
- The outcome window of a window-required (C-case) event for that goal — per [01c §5](./01c-goals-and-houses.md)

Example for `love` goal: Hemingway married Hadley in Paris 1921 (C-case with 5-year window → outcome validated negative in 1927 divorce). Exclude `[1921-01, 1926-01]` (marriage window + 5yr outcome), and the divorce window `[1926-06, 1927-06]`. Remaining love-negative candidates in Paris residence: `[1920, 1921)` if residence covered it — effectively nothing. Hemingway's Paris residence contributes no clean `love` temporal negatives.

This is expected and correct. A subject with dense positive events in a location should contribute positives, not temporal negatives, for that goal.

**Step 3: Event-density filter.** Exclude sub-windows that overlap events of *any other goal* unless that overlap itself is intended as a training signal. For Phase 1, we exclude any sub-window overlapping any event (any goal) to keep negatives unambiguously quiet. Trade-off: this reduces the negative pool for highly-eventful subjects but produces cleaner labels.

**Step 4: Sampling.** Per positive event in each goal, sample `k_temporal = 3` negative sub-windows from the remaining pool. Sampling is **without replacement** and uses the seeded random generator from [04 §4.1](./04-evaluation-protocol.md).

If fewer than 3 clean negatives exist for a (subject, goal) pair, use all available and log the shortfall.

**Step 5: Label assignment.** For sampled temporal negatives, assign `Y = 0` to the goal being negative-sampled for. Other goals' labels at the same sub-window are computed independently (they may also be 0, or `null` if no goal-specific evidence exists either way).

### 3.3 Edge cases

**Short residences (< 24 months):** Exclude from temporal sampling. 24 months is the minimum to get 2 sub-windows after excluding the event window itself.

**Open-ended residences** (`end_date = null`, `end_is_open = true` per [01b §3.1](./01b-location-enrichment.md)): Use the latest verified presence date as the effective end. Do not sample sub-windows beyond it.

**Year-precision dates only:** Many residences have `start_precision = year`. Treat `1921-01-01` as calendar year 1921 and partition by calendar years. The 3-month event buffer becomes effectively a full-year buffer for year-precision events. This loses resolution but keeps labeling honest.

**Subject's death:** Never sample sub-windows after the death date. Subject's "residence" effectively ends at death regardless of the record's `end_date`.

**Residence gaps:** If a subject lived in Paris 1920-1924, moved to Key West 1924-1928, returned to Paris 1928-1930 — each Paris residence is a separate record. Temporal negatives are sampled within each independently, not across the gap.

## 4. Geographic negative sampling

### 4.1 Intuition

For a positive event (subject, actual_city, date), a geographic negative is (subject, alternative_city, date). The engine sees the same natal chart, same sky, but different location — and should score the actual city above the alternatives, if the engine's spatial reasoning has signal.

### 4.2 Construction rules

**Step 1: Control pool.** For each positive event, build a pool of alternative cities satisfying:

- **Era-matched:** City existed in its current form by the event date. (Rule out controls like "Las Vegas in 1890.")
- **Continent-matched:** Same continent as the actual event location. Reduces wildcards — Hemingway in Paris 1926 gets London / Berlin / Madrid controls, not Jakarta. This deliberately weakens the test (Paris-vs-Jakarta is too easy) but keeps it fair (the engine shouldn't get credit for "Jakarta is astrologically wrong for an American" — that's cultural, not astrological).
- **Geographically plausible:** Within 2000 km of the actual event location, OR within the same country. Same rationale as continent-matching, stricter.
- **Subject-excluded:** Must not appear in any `residence_record` for the subject. We don't want a "negative" that's actually where they lived.
- **Sufficiently distinct:** At least 100 km from the actual event location. Nearby cities share too much ACG geography to be informative controls.

**Step 2: Sampling.** Per positive event, sample `k_geographic = 5` controls from the pool. Sampling is seeded and without replacement per-event.

If the pool has fewer than 5 valid controls, use all and log the shortfall. Log the event_id and goal for analysis.

**Step 3: Label assignment.** Control locations receive `Y = 0` for the goal corresponding to the positive event. Other goals are `null` (we have no biographical evidence either way at a location the subject never visited).

### 4.3 Control city source

A fixed control-city pool per continent, drawn from major cities with known founding dates and geo-coordinates:

| Continent | Control cities (example, not exhaustive) |
|---|---|
| Europe | London, Paris, Berlin, Madrid, Rome, Amsterdam, Vienna, Prague, Stockholm, Warsaw |
| North America | NYC, Boston, Chicago, LA, SF, Toronto, Montreal, Mexico City |
| Asia | Tokyo, Shanghai, Beijing, Mumbai, Delhi, Singapore, Seoul, Bangkok |
| South America | Buenos Aires, São Paulo, Rio, Santiago, Lima |
| Africa | Cairo, Lagos, Johannesburg, Nairobi, Casablanca |
| Oceania | Sydney, Melbourne, Auckland |

Roughly 50-city pool total, maintained in `mcp-astro-engine/data/control_cities.csv`. Each entry: `geoname_id, name, country, continent, lat, lon, founded_year, population_1900`.

### 4.4 Edge cases

**Subject-specific visit lists are incomplete.** A subject may have visited cities (weekend trip to London) that aren't in `residence_record`. Those cities are still eligible as geographic controls unless explicitly flagged. This introduces some label noise — we may be labeling a city as a "control" where the subject actually had a minor event we don't know about. Mitigation: accept the noise; document it.

**Very recent cities:** For controls dated < 50 years old in the relevant era (e.g., Dubai as a control for pre-1960 events), exclude.

**Small control pool for some regions:** For subjects in areas with sparse control-city coverage (Africa pre-1950, Central Asia, rural areas), the 5-control target may drop to 2–3. Log shortfall and proceed.

## 5. Per-goal labeling of negatives — the cross-goal question

A crucial subtlety: when we sample a temporal negative for the `love` goal at Paris 1923, what do we label the *other* goals?

Three options:

1. **Label other goals = 0 (all negatives).** Assumes no event of any goal occurred in that window.
2. **Label other goals = null (unknown).** Only the goal being sampled gets a 0; others are excluded from their own metric computation for this row.
3. **Check biographical data per goal.** Look up whether events of other goals occurred in that window; label accordingly.

**Decision: Option 2 for Phase 1.** Each goal's negative pool is sampled independently with per-goal labels assigned only to that goal. Other goals for the same row are `null` and dropped from those goals' metric computation.

Rationale: Option 1 is wrong — a "quiet for love" window may have career events. Option 3 is right in principle but requires near-complete biographical coverage per subject, which we don't have. Option 2 is the honest minimum — we only make claims about goals we have evidence for.

Consequence: the evaluation effectively runs 5 independent per-goal evaluations with partially-overlapping rows. Each goal has its own positive count, negative count, and metric. This is cleaner than a joint evaluation and matches how the product uses per-goal scores.

## 6. Ratio and balance

**Target ratios per goal:**

| Row type | Target count | Rationale |
|---|---|---|
| Positive | N_pos = events × subjects with that goal evidenced | Fixed by enrichment |
| Temporal negative | 3 × N_pos | Provides per-goal temporal discrimination |
| Geographic negative | 5 × N_pos | Provides spatial discrimination; higher ratio because geographic control pool is richer |

Effective positive:negative ratio per goal ≈ 1:8. This is a deliberately moderate imbalance — high enough to require PR-AUC (not accuracy) as the metric, low enough that precision at moderate recall is still measurable. Extreme imbalance (1:1000) would inflate PR-AUC's reported values without adding signal.

**Rebalancing is explicitly prohibited.** Do not oversample positives, undersample negatives, or apply class weights. The evaluation metrics should reflect the imbalance the engine faces in reality.

## 7. Known biases introduced by sampling

Every sampling scheme introduces bias. Document these honestly:

**7.1 Geographic negatives favor cosmopolitan regions.** The 50-city control pool over-represents major cities. Events that occurred in smaller cities (Key West for Hemingway) get compared against major-city controls, which may systematically differ in astrological features (latitudes, geodetic zones). Mitigation: report geographic-negative PR-AUC separately from temporal, and track whether subjects with rural events score differently.

**7.2 Temporal negatives favor long residents.** Subjects with short residences (expats, travelers) contribute fewer temporal negatives. The temporal-negative evaluation is effectively weighted toward long-term residents. Mitigation: report per-subject contribution counts; flag if a small number of subjects dominates.

**7.3 The "quiet year" assumption is fragile.** We treat event-free years as negatives, but biographies are incomplete. A "quiet" year may have had private events (a relationship beginning, a spiritual turning point) we don't know about. Mitigation: this noise is symmetric across the negative pool and shouldn't systematically bias PR-AUC, but it caps achievable precision. Expect ceiling effects.

**7.4 Era imbalance in controls.** Some control cities (e.g., Dubai, LA) are more viable for recent subjects than historical ones. The control pool is thinner for pre-1900 subjects, which may correlate with the engine's historical cohort performance. Track this in subgroup analysis per [04 §4.5](./04-evaluation-protocol.md).

**7.5 Continent-matching weakens the test.** Excluding cross-continent controls (Hemingway in Paris never compared to Tokyo) means we can't claim the engine correctly identifies Paris across all plausible Earth destinations — only within Europe. Stronger claim would require cross-continent controls. Proposal: run one ablation with **global controls** (no continent restriction) and report separately. If PR-AUC stays high, the engine has strong spatial signal; if it collapses, the continent-matched version is what we ship.

## 8. Validation of negative-sample quality

Before Stage 4 metric computation, verify that negatives are actually negative:

**Check 1: No positive contamination.** For every negative row, re-check that no event_record for that (subject, goal, time_window, location) exists. Should be guaranteed by construction, but assert anyway.

**Check 2: Feature distribution sanity.** Plot per-feature distributions (natal chart features, transit features) for positives vs. negatives. They should *differ slightly* (the whole point is that positives are distinguishable) but not be categorically different in ways that imply data leakage. If negative rows have systematically different feature statistics (e.g., all temporal negatives happen to fall in Mercury-retrograde periods), investigate sampling bug.

**Check 3: Control-pool coverage.** Log per-continent and per-era the average number of controls actually used vs. the target k_geographic. If a cohort averages < 3 controls while others get 5, that cohort's geographic-negative PR-AUC is less reliable and should be flagged in subgroup reporting.

**Check 4: Temporal window non-overlap.** Assert that no temporal-negative window overlaps any positive event window for the same (subject, goal). Should be guaranteed; assert anyway.

Failing any check halts Stage 1 and requires sampler bug-fix before evaluation runs.

## 9. Sampling determinism

All sampling uses the seeded random generator from [04 §4.1](./04-evaluation-protocol.md). A re-run with the same seed + dataset_version must produce identical EvalRow sets. Verified by hashing the sorted `row_id` list.

Changing `k_temporal`, `k_geographic`, the control-city pool, or the continent-matching rule = new dataset_version, new EXP-####.

## 10. Implementation outline

```
mcp-astro-engine/evaluation/row_builder.py

Phase 1 — load positives
  for event in enriched_events:
      produce EvalRow with row_type=positive, goal labels per 01c §5

Phase 2 — temporal negatives
  for (subject, residence) in residence_records:
      sub_windows = partition(residence, 12 months)
      for goal in GOALS:
          excluded = event_windows(subject, goal) + outcome_windows
          pool = sub_windows - excluded
          sample k_temporal from pool (seeded)
          produce EvalRows with row_type=temporal_neg

Phase 3 — geographic negatives
  for event in positive_events:
      pool = control_cities.filter(
          era_match(event.date),
          same_continent(event.location),
          within_2000km(event.location),
          not_in_residences(event.subject),
          distance_gt_100km(event.location),
      )
      sample k_geographic from pool (seeded)
      produce EvalRows with row_type=geographic_neg

Phase 4 — validation checks (§8)
  assert no positive contamination
  log feature distribution stats
  log control-pool coverage per cohort
  assert temporal non-overlap
```

## 11. Open questions

1. **Global-controls ablation (§7.5).** Worth running as a separate track, or over-engineering? Proposal: yes, run it. It's cheap (same pipeline, relaxed filter) and tells us whether the continent-matching is load-bearing.

2. **Control pool size.** 50 cities globally is a starting point. Expand to 100–200 for better subgroup coverage, or keep tight to reduce curation cost? Proposal: 50 for Phase 1; expand if subgroup-coverage validation (§8 check 3) shows thin cells.

3. **k ratios.** `k_temporal = 3, k_geographic = 5` are defensible but arbitrary. Worth a sensitivity run at k = 1, 3, 5, 10 to see if PR-AUC is stable across ratios? Proposal: add to Phase 1 ablations — if PR-AUC swings > 0.05 between k=3 and k=10, we have a sampling-instability problem worth fixing before declaring baseline metrics.

4. **Unknown-event pollution (§7.3).** Is there appetite for a manual audit where, for the gold-set 50 subjects, we hand-verify that sampled "quiet" windows actually contained no notable events? Proposal: yes for the gold set only — it bounds the ceiling effect.

5. **Residence-inferred-from-events exclusion.** If a residence_record was inferred from an event (e.g., "Hemingway was in Paris in 1921 because he married there"), its sub-windows are structurally biased toward event proximity. Per 01b §7.1, we should flag these and exclude from temporal negative sampling. Confirm this is implemented in `row_builder.py`.
