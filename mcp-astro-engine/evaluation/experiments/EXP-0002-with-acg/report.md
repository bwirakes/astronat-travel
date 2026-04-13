# EXP-0002-with-acg — Baseline Evaluation Report

**Pipeline version:** v0.1-positive-only-macroscore  
**Metric version:** v1.0  
**Run:** 2026-04-12T07:32:23.021830+00:00 → 2026-04-12T07:32:24.743607+00:00  
**Git commit:** `794b31a9bc8fe338e45501d7582e312896f2d759`  
**Endpoint:** `http://localhost:3000/api/house-matrix`

## Pipeline status

- Rows scored: **249/249** (100.0%)
- Rows with errors: 0
- Mean macroScore: 51.37

### Verdict distribution

| Verdict | Count |
|---|---|
| Challenging | 91 |
| Mixed | 87 |
| Productive | 44 |
| Hostile | 24 |
| Highly Productive | 3 |

## Per-goal metrics

Predictor is **macroScore** (not per-goal re-aggregated scores — pending per-house score extraction). Labels come from `etl.map_event_polarity` + `etl.outcome_window`. See [docs/ml-evaluation/05](../../../docs/ml-evaluation/05-evaluation-metrics.md) for metric definitions.

| Goal | N | +1 | 0 | −1 | PR-AUC (pos-detect) | PR-AUC (harm-detect) | Spearman ρ median | Calibration slope |
|---|---|---|---|---|---|---|---|---|
| love | 94 | 42 | 31 | 21 | 0.445 [0.333, 0.598] | 0.188 [0.122, 0.333] | 0.000  (n=13) | 0.181 |
| career | 131 | 107 | 4 | 20 | 0.756 [0.666, 0.854] | 0.138 [0.077, 0.271] | 0.074  (n=10) | -0.585 |
| community | 0 | — | — | — | — | — | — | — |
| growth | 14 | 0 | 0 | 14 | N too small | N too small | — | — |
| relocation | 10 | 10 | 0 | 0 | N too small | N too small | — | — |

## Caveats (required per docs/ml-evaluation/04 §7)

**External validity.** This evaluation was conducted on 249 rows drawn from 42 AA-rated subjects from Astro-Databank. The cohort is disproportionately 20th-century and Western (30/42 born in the US). Metrics reflect engine performance *on this cohort only*. Generalization to non-Western / non-famous / living subjects is unverified.

**Evidence tier.** Event labels derive from L-B Astro-Databank event entries. Outcome-window validation is applied only to marriage (5y) and relocation (3y) events; career publications/promotions retain initial +1 labels pending canon/employment enrichment.

**Positive-event bias.** Biographical sources overweight positive events (awards, marriages, publications). Harm-detection PR-AUC is expected to be weaker than positive-detection PR-AUC and should not be interpreted as evidence of engine quality.

**Pipeline caveats (this experiment specifically):**
- ACG lines computed via engine/astrocartography.py, filtered to ≤700 km
- Parans passed as empty array — pending integration
- Transit sample_date anchored at noon UTC (no hour-of-day resolution)
- Lot of Fortune / Spirit not explicitly computed — engine derives internally
- Negative sampling not performed; only positive event rows scored
- No per-house score extraction — macroScore only
- External validity limited per docs/ml-evaluation/04 §7

**Predictor limitation.** This experiment uses the single scalar `macroScore` as predictor for all five goals. macroScore is goal-agnostic (travel-weighted per docs/prd/scoring-rubric.md), so per-goal PR-AUC numbers here measure *how well the global composite predicts each goal* — NOT how well a goal-specific re-aggregation would perform. Per-house score extraction + [docs/ml-evaluation/01c §4](../../../docs/ml-evaluation/01c-goals-and-houses.md) re-aggregation is the next planned experiment.

## What this experiment proves

1. **Pipeline is functional end-to-end.** Python builds EvalRows, pyswisseph computes natal planets / relocated cusps / transits, HTTP POSTs the payload to the production `/api/house-matrix` route, and the engine returns scores. This is the baseline infrastructure against which future improvements will be measured.
2. **Some engine signal exists, directionally.** Any goal with PR-AUC meaningfully above its prevalence demonstrates the macroScore correlates with biographical outcomes for that goal. Zero/low PR-AUC on a goal suggests the composite score doesn't capture that goal's dynamics — reinforcing the case for per-goal re-aggregation.

**This is not the scientific baseline** described in [docs/ml-evaluation/00 §5](../../../docs/ml-evaluation/00-overview.md). That requires ACG + paran integration and per-house score extraction. Treat this as the plumbing validation experiment.
