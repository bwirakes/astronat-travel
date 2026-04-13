# 05 — Evaluation Metrics

**Status:** Draft for review
**Owner:** TBD
**Depends on:** [01c](./01c-goals-and-houses.md) (per-goal labels), [02](./02-negative-sampling.md) (row types)
**Consumed by:** [04 §4.5](./04-evaluation-protocol.md) (Stage 4), every `experiments/EXP-####/report.md`

---

## 1. Purpose

Defines the exact metrics used to characterize engine performance. Each metric has a specific product-facing interpretation. Metrics not listed here are not used in reports.

The metric set is deliberately small. More metrics create more ways to cherry-pick favorable numbers.

## 2. Primary metrics

Reported for every goal, every evaluation run.

### 2.1 PR-AUC (Precision-Recall Area Under Curve)

**Headline metric.** Per goal, per evaluation.

**Definition:** Area under the precision-recall curve computed via `sklearn.metrics.average_precision_score(y_true, y_score)`. Returns a scalar in [0, 1].

**Binarization — two variants reported per goal:**

| Variant | Positive class | Negative class | Product-facing meaning |
|---|---|---|---|
| **Positive-detection** | Y = +1 | Y ∈ {0, −1} | Does the engine correctly identify locations where the goal outcome was positive? |
| **Harm-detection** | Y = −1 | Y ∈ {0, +1} | Does the engine correctly identify locations where the goal outcome was negative? |

For harm-detection, the `y_score` is inverted: `y_score_harm = 100 - goal_score`, so lower engine scores should predict higher harm probability.

**Why PR-AUC (not accuracy or ROC-AUC):**
- Negative rows outnumber positives roughly 8:1 (per [02 §6](./02-negative-sampling.md)). Accuracy would be trivially high for a model that predicts "nothing happens."
- ROC-AUC is less informative under class imbalance — false-positive rate is normalized by the large negative class, making ROC look better than precision-recall.
- PR-AUC directly reflects the product's false-positive cost: telling a user to move to a location where the goal outcome turned out bad.

**Reference thresholds:**

| PR-AUC | Interpretation |
|---|---|
| 0.50 | Random baseline (no signal) |
| 0.55–0.60 | Weak signal — detectable but marginal |
| 0.60–0.70 | Moderate signal — product-viable per goal |
| 0.70–0.80 | Strong signal — high confidence |
| > 0.80 | Very strong — **investigate for leakage or fame bias** before celebrating |

Note: these thresholds are adjusted for the actual positive-class prevalence. A random classifier on a dataset with 10% positives has PR-AUC = 0.10, not 0.50. We report PR-AUC alongside the positive-class prevalence so interpretation is grounded. The numerical thresholds above assume our 1:8 ratio (≈11% positive).

**Confidence intervals:** 95% bootstrap CI via 1000 resamples of the labeled rows (with replacement). Report as `PR-AUC = 0.64 [0.59, 0.68]`.

**Reporting:**
```
PR-AUC per goal (positive-detection):
  love:        0.64 [0.59, 0.68]   N_pos=84   N_neg=672
  career:      0.71 [0.67, 0.75]   N_pos=142  N_neg=1136
  community:   0.55 [0.49, 0.61]   N_pos=38   N_neg=304
  growth:      0.58 [0.52, 0.64]   N_pos=51   N_neg=408
  relocation:  0.69 [0.65, 0.73]   N_pos=109  N_neg=872

PR-AUC per goal (harm-detection):
  love:        0.48 [0.42, 0.54]   N_harm=29
  career:      0.52 [0.46, 0.58]   N_harm=44
  ...
```

Note that harm-detection PR-AUCs are expected to be weaker than positive-detection for all goals, reflecting the positive-event bias in biographical sources (per [01b §7.1](./01b-location-enrichment.md)). This is a data limitation, not an engine failing.

### 2.2 Calibration

**Definition:** The correspondence between engine-score magnitudes and empirical positive rates. A well-calibrated engine scoring "80/100 for Career in Paris" should mean 80% of subjects with similar scores actually experienced positive career events there.

**Construction:**
1. Bin predictions into 10 equal-width bins: `[0,10), [10,20), …, [90,100]`.
2. Per bin, compute:
   - `mean_predicted = mean of engine goal_score in bin / 100` (scaled to [0,1])
   - `empirical_rate = fraction of rows in bin with Y = +1`
   - `n_bin` = row count in bin (sanity check; bins with < 10 rows are flagged unreliable)
3. Fit `empirical_rate ~ slope × mean_predicted + intercept`.

**Perfect calibration:** slope = 1.0, intercept = 0.0.

**Interpretations:**

| Pattern | Meaning | Product implication |
|---|---|---|
| slope < 1, intercept > 0 | Engine is overconfident at high scores, underconfident at low | Score remapping at display time; clamp highs |
| slope > 1 | Engine is underconfident; empirical rate exceeds predictions | Engine is conservative; fine to display raw |
| Non-monotonic | Engine's score ordering inverts somewhere | Investigate; engine has a bug in some score range |

**Expected Calibration Error (ECE):** additionally reported as a summary number.
```
ECE = Σ (n_bin / N_total) × |mean_predicted_in_bin - empirical_rate_in_bin|
```

Lower is better. ECE ≤ 0.10 is good; ≥ 0.20 suggests significant miscalibration.

**Visualization:** One reliability diagram per goal, saved as `calibration_plots/{goal}.png`. X-axis: mean predicted (0–1). Y-axis: empirical rate (0–1). Diagonal line for reference. Bin-count sized markers.

**Why calibration matters:** The product displays raw 0–100 scores to users. A "75/100 for Love" must mean something consistent. Poor calibration means the number is just a ranking, not a probability — which would require product-copy changes ("your chart ranks higher than average" vs. "75% likely").

### 2.3 Within-subject Spearman rank correlation

**Definition:** For each subject with ≥ 3 labeled rows in a goal, compute Spearman rank correlation between engine goal_score and label Y across their rows. Aggregate across subjects via median and IQR.

**Product interpretation:** When a user inputs multiple candidate cities, does the engine rank them correctly? This is the metric most aligned with the core product use case (compare A vs. B vs. C).

**Why within-subject, not across:** Different subjects have different natal charts. A cross-subject correlation would mix "people with favorable natal placements tend to have good outcomes anywhere" with "the engine ranks correctly." Within-subject isolates the spatial-temporal discrimination from natal luck.

**Aggregation:**
```
per_subject_rho = Spearman(engine_score, Y) for each subject's rows
aggregate: median, Q25, Q75 across subjects
```

**Reporting:**
```
Within-subject Spearman ρ per goal:
  love:        median=0.42, IQR=[0.18, 0.61], N_subjects=58
  career:      median=0.51, IQR=[0.31, 0.69], N_subjects=89
  ...
```

**Reference thresholds:**

| Median ρ | Interpretation |
|---|---|
| 0.00 | No rank signal |
| 0.20–0.40 | Weak ordering |
| 0.40–0.60 | Moderate ordering — product-viable |
| > 0.60 | Strong ordering |

**Requirement:** A subject contributes to this metric only if they have ≥ 3 labeled rows (positive or negative) for the goal. Subjects with fewer rows produce noisy per-subject correlations and are excluded from the aggregation.

## 3. Timing-goal metric: Peak MAE

The `timing` goal is evaluated separately per [01c §3](./01c-goals-and-houses.md). Does not produce a per-location PR-AUC.

### 3.1 Definition

For each positive event with a known exact date (day or month precision):
1. Compute engine-predicted 12-month windows for that subject at that location, covering ±24 months around the event date.
2. Identify the **peak window** (window with highest macro_score in that range).
3. Compute `|event_date - peak_window_center|` in weeks.

**Aggregate:** Mean and median across qualifying events, plus per-era and per-goal breakdowns.

### 3.2 Reference thresholds

| Peak MAE (weeks) | Interpretation |
|---|---|
| ≤ 4 | Excellent — engine pinpoints event within ~1 month |
| 4–12 | Good — within a quarter |
| 12–26 | Moderate — within a half-year |
| 26–52 | Weak — within a year |
| > 52 | Poor — engine has no temporal precision |

**Reporting:**
```
Peak MAE (weeks):
  All events:       mean=18.4, median=14.0, N=183
  Career events:    mean=15.2, median=11.0, N=78
  Love events:      mean=21.7, median=17.5, N=42
  ...
```

### 3.3 Window precision/recall

Supplementary timing metrics:

**Window precision:** Of 12-month windows the engine rated "excellent" (macro_score ≥ 65), what fraction coincided with an actual positive event for that subject?

**Window recall:** Of positive events, what fraction fell inside an engine-rated "excellent" window?

Both computed per-goal and aggregated. Lower than PR-AUC's equivalent because the thresholds (macro_score ≥ 65) are product-copy-derived, not optimized.

## 4. Secondary metrics

Reported in the detailed appendix of `report.md` but not headline.

### 4.1 Top-k precision

For each subject, rank all their scored locations by goal_score. What fraction of top-k locations correspond to actual positive events?

```
top_1_precision:  fraction of subjects whose highest-scoring location is an actual positive event location
top_3_precision:  ... whose top-3 contain a positive event location
```

Product-aligned: users see top-3 recommendations. If `top_3_precision` is 0.70, the app surfaces a genuinely positive-outcome location in its top 3 for 70% of subjects.

### 4.2 Confusion matrix at fixed threshold

At a product-chosen threshold (e.g., goal_score ≥ 65, the current "Productive" verdict cutoff), per goal:

|  | Predicted positive | Predicted negative |
|---|---|---|
| Actual +1 | TP | FN |
| Actual 0 or −1 | FP | TN |

Useful for product conversations: "At our current threshold, we mislabel X% of bad locations as good." Not a primary metric because threshold is arbitrary, but informative.

### 4.3 Score distribution histograms

Per goal, histogram of goal_scores separately for positives, negatives, and all rows. Reveals:
- Whether positives and negatives are well-separated in score space
- Whether the score distribution is bimodal, uniform, or skewed
- Whether the engine uses the full 0–100 range or clusters (e.g., never outputs scores < 30)

Saved as `distributions/{goal}.png`. Not summary-statistic reduced; visual inspection only.

## 5. Subgroup reporting

Every primary metric (PR-AUC, calibration, Spearman) is re-computed per subgroup:

| Subgroup dimension | Buckets |
|---|---|
| Era | pre-1900 / 1900–1950 / 1950–2000 / post-2000 |
| Evidence tier | L-AA / L-A (L-B excluded Phase 1) |
| Birth continent | Europe / N.America / Asia / S.America / Africa / Oceania |
| Profession class | Artist / Scientist / Politician / Athlete / Business / Other |
| Sex | M / F (where available and relevant; acknowledge biographical sex-data biases) |

**Minimum N per cell:** 50 labeled rows. Cells below that are reported as `N too small — ρ not estimated`.

**Purpose:** Cohort-specific weakness surfacing. If career PR-AUC is 0.71 overall but 0.52 for pre-1900 subjects, the engine may rely on recent-era feature patterns that don't generalize historically. This is actionable.

## 6. Row-type stratification

Temporal and geographic negatives answer different questions per [02 §2](./02-negative-sampling.md). Compute PR-AUC separately for:

| Evaluation context | Negatives used | Question answered |
|---|---|---|
| **Full eval** | Both types | Headline engine performance |
| **Temporal only** | Positives + temporal_neg | Does the engine discriminate across time for the same (subject, location)? |
| **Geographic only** | Positives + geographic_neg | Does the engine rank cities correctly on the same date? |

Report all three per goal. The full PR-AUC is the headline; the stratified PR-AUCs diagnose where the signal comes from.

**Expected pattern:** Geographic-only PR-AUC should exceed temporal-only. Rationale: spatial signal (ACG lines, geodetic zones) is more discriminating than temporal signal (transits over ~1 year). If temporal-only is higher, the engine's transit system is doing more predictive work than its spatial system — a finding worth investigating.

## 7. Explicitly excluded metrics

These are **not** used in primary reporting. Justifications below.

| Metric | Why excluded |
|---|---|
| **Accuracy** | Meaningless under 1:8 class imbalance. "Predict negative always" ≈ 88% accurate. |
| **F1 at fixed threshold** | Threshold-dependent; encourages threshold hacking |
| **ROC-AUC** | Less informative than PR-AUC under imbalance; reported as secondary only |
| **R² / regression metrics** | Labels are categorical, not continuous |
| **Log loss / cross-entropy** | Useful for model training, not for product-validity interpretation |
| **Single aggregated "accuracy" across goals** | Obscures per-goal variation, which is the main signal |

ROC-AUC may appear in appendix tables for reviewers who ask, but primary claims are PR-AUC only.

## 8. Report format and metric presentation rules

**Headline numbers:** PR-AUC per goal, positive-detection variant. Always reported with 95% CI and N_positive. Never reported as a point estimate alone.

**Comparison language:** Forbidden in v1 reports:
- "Our engine is [percentage] accurate" — accuracy is not our metric
- "Outperforms random by [amount]" — without specifying what "random" means at the observed positive-class prevalence
- Any aggregation across goals into a single number

Allowed:
- "Per-goal PR-AUC of [X, Y, Z] on N subjects, with positive-class prevalence Z%"
- "Within-subject Spearman ρ of [median, IQR] suggests the engine rank-orders correctly at the subject level"

**Every claim cites the metric and N.** No "the engine performs well for Career" — instead, "Career PR-AUC = 0.71 [0.67, 0.75] with N_positive = 142 across 89 subjects, suggesting moderate-to-strong predictive signal."

## 9. Metric version

This document's rule set is **v1.0**. Changes to any of the following trigger a metric-version bump:
- Adding or removing a primary metric
- Changing binarization rules (2.1)
- Changing calibration bin scheme (2.2)
- Changing subgroup dimensions (§5)
- Changing row-type stratification (§6)

Every `EXP-####` report specifies its metric version. Cross-run comparisons require matching metric versions.

## 10. Open questions

1. **Harm-detection framing.** §2.1 reports two binarizations (positive, harm). Is the harm-detection metric user-interpretable, or does it confuse investors and readers? Proposal: keep, clearly labeled. It's product-critical.

2. **ECE in headlines.** Currently ECE is a secondary number under calibration. Should it graduate to headline status alongside PR-AUC? Proposal: no — PR-AUC is enough headline; ECE is detail.

3. **Within-subject Spearman vs. Kendall τ.** Kendall τ is more robust to ties (common when scores cluster). Spearman is more widely recognized. Proposal: keep Spearman; add Kendall τ as secondary in appendix.

4. **Subgroup cell minimum.** §5 specifies N ≥ 50. Too strict or too loose? Proposal: 50 for Phase 1; re-evaluate if we have more data in Phase 2.

5. **Reporting language in investor decks.** The strict "always with CI and N" rule (§8) is honest but may produce slide-unfriendly statements. Worth preparing a separate "investor simplification" metric summary that trades some rigor for readability, or hold the line? Proposal: hold the line internally; allow a separate cleaned summary for external use that still cites the underlying full numbers.
