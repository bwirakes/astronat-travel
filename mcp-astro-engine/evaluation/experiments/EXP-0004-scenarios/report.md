# EXP-0004-scenarios — Baseline Evaluation Report

**Pipeline version:** v0.1-positive-only-macroscore  
**Metric version:** v1.0  
**Run:** 2026-04-12T13:59:10.698645+00:00 → 2026-04-12T13:59:14.938958+00:00  
**Git commit:** `794b31a9bc8fe338e45501d7582e312896f2d759`  
**Endpoint:** `http://localhost:3000/api/house-matrix`

## Pipeline status

- Rows scored: **551/551** (100.0%)
- Rows with errors: 0
- Mean macroScore: 51.86

### Verdict distribution

| Verdict | Count |
|---|---|
| Mixed | 209 |
| Challenging | 188 |
| Productive | 79 |
| Hostile | 54 |
| Highly Productive | 21 |

## Cohort composition (by Rodden rating)

| Rating | Rows | Subjects |
|---|---|---|
| AA | 358 | 61 |
| A | 159 | 23 |
| B | 34 | 7 |

## Per-goal metrics

Predictor is **macroScore** (not per-goal re-aggregated scores — pending per-house score extraction). Labels come from `etl.map_event_polarity` + `etl.outcome_window`. See [docs/ml-evaluation/05](../../../docs/ml-evaluation/05-evaluation-metrics.md) for metric definitions.

| Goal | N | +1 | 0 | −1 | PR-AUC (pos-detect) | PR-AUC (harm-detect) | Spearman ρ median | Calibration slope |
|---|---|---|---|---|---|---|---|---|
| love | 233 | 99 | 85 | 49 | 0.423 [0.348, 0.541] | 0.206 [0.145, 0.296] | 0.000  (n=30) | 0.012 |
| career | 270 | 223 | 8 | 39 | 0.810 [0.758, 0.868] | 0.153 [0.102, 0.258] | 0.236  (n=23) | -0.685 |
| community | 0 | — | — | — | — | — | — | — |
| growth | 26 | 1 | 0 | 25 | 0.056 [0.045, 0.226] | 0.961 [0.853, 0.974] | — | -0.028 |
| relocation | 22 | 19 | 3 | 0 | 0.851 [0.652, 0.976] | N too small | -0.500  (n=1) | -0.227 |

## Tier-stratified PR-AUC (positive-detection only)

Per docs/ml-evaluation/04 §4.5: stratifying by Rodden rating exposes whether engine performance degrades as birth-time precision weakens. AA (hospital records) is the most-trusted cohort; A/B have progressively larger angle errors.

| Goal | All (N) | AA (N) | A (N) |
|---|---|---|---|
| love | 0.423 [0.35, 0.54] (233) | 0.477 [0.37, 0.62] (135) | 0.355 [0.25, 0.53] (84) |
| career | 0.810 [0.76, 0.87] (270) | 0.795 [0.72, 0.87] (191) | 0.830 [0.71, 0.94] (67) |
| community | — (0) | — (0) | — (0) |
| growth | 0.056 [0.05, 0.23] (26) | — (20) | 0.500 [0.50, 0.50] (2) |
| relocation | 0.851 [0.65, 0.98] (22) | 0.965 [0.87, 0.99] (12) | 0.692 [0.27, 0.93] (6) |

**Interpretation:** If AA PR-AUC >> A PR-AUC for a goal, engine performance is sensitive to birth-time precision there — expected for ACG- and house-driven goals like career and partnership. If AA ≈ A, the goal's scoring may not depend on precise angles.

## Weight-scenario comparison (positive-detection PR-AUC)

Each cell: PR-AUC [95% CI], N. macroScore column is the goal-agnostic composite for reference. Cells where any per-goal scenario beats macroScore by >0.05 are bolded.

| Goal | macroScore | default | hellenistic_strict | material_heavy | network_weighted | angular_only |
|---|---|---|---|---|---|---|
| love | 0.423 [0.35, 0.54] (n=233) | 0.415 [0.34, 0.52] | 0.418 [0.35, 0.52] | 0.411 [0.34, 0.51] | 0.418 [0.34, 0.52] | 0.417 [0.35, 0.52] |
| career | 0.810 [0.76, 0.87] (n=270) | 0.797 [0.74, 0.86] | 0.794 [0.74, 0.86] | 0.793 [0.73, 0.86] | 0.816 [0.76, 0.87] | 0.802 [0.75, 0.86] |
| community | — (n=0) | — | — | — | — | — |
| growth | 0.056 [0.05, 0.23] (n=26) | 0.100 [0.07, 0.38] | 0.043 [0.04, 0.17] | 0.083 [0.06, 0.31] | 0.042 [0.04, 0.17] | 0.050 [0.04, 0.20] |
| relocation | 0.851 [0.65, 0.98] (n=22) | **0.968 [0.89, 1.00]** | **0.968 [0.89, 1.00]** | **0.962 [0.87, 1.00]** | **0.955 [0.85, 1.00]** | **0.971 [0.90, 1.00]** |

## Caveats (required per docs/ml-evaluation/04 §7)

**External validity.** This evaluation was conducted on 551 rows drawn from 42 AA-rated subjects from Astro-Databank. The cohort is disproportionately 20th-century and Western (30/42 born in the US). Metrics reflect engine performance *on this cohort only*. Generalization to non-Western / non-famous / living subjects is unverified.

**Evidence tier.** Event labels derive from L-B Astro-Databank event entries. Outcome-window validation is applied only to marriage (5y) and relocation (3y) events; career publications/promotions retain initial +1 labels pending canon/employment enrichment.

**Positive-event bias.** Biographical sources overweight positive events (awards, marriages, publications). Harm-detection PR-AUC is expected to be weaker than positive-detection PR-AUC and should not be interpreted as evidence of engine quality.

**Pipeline caveats (this experiment specifically):**
- ACG lines computed via engine/astrocartography.py, filtered to ≤700 km
- Parans passed as empty array — pending integration
- Transit sample_date anchored at noon UTC (no hour-of-day resolution)
- Lot of Fortune / Spirit not explicitly computed — engine derives internally
- Negative sampling not performed; only positive event rows scored
- Per-house + per-goal scores now extracted; 5 weight scenarios evaluated
- External validity limited per docs/ml-evaluation/04 §7

**Predictor limitation.** This experiment uses the single scalar `macroScore` as predictor for all five goals. macroScore is goal-agnostic (travel-weighted per docs/prd/scoring-rubric.md), so per-goal PR-AUC numbers here measure *how well the global composite predicts each goal* — NOT how well a goal-specific re-aggregation would perform. Per-house score extraction + [docs/ml-evaluation/01c §4](../../../docs/ml-evaluation/01c-goals-and-houses.md) re-aggregation is the next planned experiment.

## What this experiment proves

1. **Pipeline is functional end-to-end.** Python builds EvalRows, pyswisseph computes natal planets / relocated cusps / transits, HTTP POSTs the payload to the production `/api/house-matrix` route, and the engine returns scores. This is the baseline infrastructure against which future improvements will be measured.
2. **Some engine signal exists, directionally.** Any goal with PR-AUC meaningfully above its prevalence demonstrates the macroScore correlates with biographical outcomes for that goal. Zero/low PR-AUC on a goal suggests the composite score doesn't capture that goal's dynamics — reinforcing the case for per-goal re-aggregation.

**This is not the scientific baseline** described in [docs/ml-evaluation/00 §5](../../../docs/ml-evaluation/00-overview.md). That requires ACG + paran integration and per-house score extraction. Treat this as the plumbing validation experiment.
