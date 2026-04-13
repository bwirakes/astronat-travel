# 00 — Overview: AstroNat Evaluation Framework

**Status:** Draft for review
**Owner:** TBD
**Scope:** Evaluate the existing hardcoded scoring engine against a ground-truth dataset. **No model training in this phase.**

---

## 1. What this is

A disciplined evaluation framework that measures how well the **existing** AstroNat scoring engine predicts documented biographical outcomes, using a curated dataset of AA-rated historical subjects.

This is not an ML project yet. It is the **baseline measurement** that any future ML work will be compared against. We can't claim training improved the engine without first quantifying where the engine is today.

## 2. What this is not

- ❌ **Not training.** No Lasso, no XGBoost, no SHAP, no learned weights. The engine's weights ([app/api/house-matrix/route.ts](../../app/api/house-matrix/route.ts) and [lib/astro/](../../lib/astro/)) stay exactly as hardcoded today.
- ❌ **Not weight tuning based on evaluation results.** The evaluation set is read-only. Tuning weights after seeing metrics is p-hacking and invalidates the baseline.
- ❌ **Not a new product feature.** Evaluation outputs are internal reports and investor-facing metric claims. No user-visible changes ship from this work.

If any of these scope drifts happen, we've silently turned this into training without the infrastructure or discipline training requires. See §6.

## 3. Why evaluation-first

Three reasons:

1. **A baseline is required before claiming lift.** Any future training is measured as "we moved PR-AUC from X to Y." Without X, training work is unfalsifiable. Running the current engine against the evaluation set produces X.

2. **De-risk the ML roadmap cheaply.** If evaluation shows the existing engine is near random (PR-AUC ~0.50), we learn — before committing to months of training infrastructure — that either the astrological mechanism has weak predictive signal, our labels are wrong, or our data pipeline is broken. If evaluation shows real signal (PR-AUC 0.65+), training becomes a tuning problem with a known target.

3. **Enables a defensible v0 product claim.** With the evaluation complete, AstroNat can say: "Our engine achieves per-goal PR-AUC of [X, Y, Z] on 500 historically-verified cases." That is a stronger, more honest claim than most consumer astrology products have ever made.

## 4. The scoped question

> For each of the location-scoreable goals (love, career, community, growth, relocation), how well does the existing engine's per-goal score — computed via the goal→house re-aggregation in [01c §4](./01c-goals-and-houses.md) — predict whether documented biographical outcomes at that (subject, location, time) were positive or negative?

The `timing` goal is handled separately via timing-specific metrics (Peak MAE, window precision/recall) — see [01c §3](./01c-goals-and-houses.md).

## 5. Success criteria

What "success" looks like for this phase:

| Criterion | Target | What it proves |
|---|---|---|
| A reproducible evaluation pipeline exists | End-to-end run in < 1 hour on dev laptop | Engineering foundation is sound |
| Per-goal PR-AUC reported for ≥ 4 of 5 location goals | Any metric, honestly reported | We can measure ourselves |
| At least one goal achieves PR-AUC > 0.60 | Beats random (0.50) meaningfully | The engine has measurable signal |
| Calibration curves published per goal | Slope and intercept reported | We understand where the engine is over/under-confident |
| Subsystem ablation results (Hellenistic only, Astrodynes only, Geodetic only) | All three run | We know which subsystem drives predictive power |
| Evaluation report committed to repo | One markdown file per engine version | Claims are auditable |

**Non-success** (honest failure mode): all per-goal PR-AUCs fall in 0.48–0.53. That means the engine's per-goal re-aggregation has no signal on our eval cohort. This would be a critical finding, not a failure of the evaluation framework — it would tell us that before training, we need to reconsider either the house mapping (01c §4), the label scheme (01c §5), or the underlying astrological model. The evaluation still succeeds; it returns a load-bearing negative result.

## 6. Discipline requirements

Two rules must hold for this framework to produce trustworthy numbers:

**Rule 1: The evaluation set is read-only.** No engine code changes based on metrics seen in the evaluation report. If we want to change engine weights, we need a separate dev set or the proper ML pipeline (deferred). One violation and every subsequent metric is p-hacked and untrustworthy.

**Rule 2: External validity has a ceiling.** AA-rated subjects are disproportionately famous, Western, 20th-century. A PR-AUC of 0.70 on this cohort means the engine predicts outcomes *for documented celebrities* moderately well. It does not automatically generalize to typical users in 2026. Every evaluation report must name this ceiling explicitly. "Our engine is validated for notable 20th-century Western subjects" is honest; "our engine is validated" without that qualifier is not.

## 7. Scope decisions

### In scope

- Evaluating the existing engine (no code changes to the engine itself)
- Location enrichment of AA-rated subjects from Astro-Databank (per [01b](./01b-location-enrichment.md))
- Per-goal score re-aggregation from per-house engine output (per [01c](./01c-goals-and-houses.md))
- Per-goal biographical labeling under B-with-selective-C (per [01c §5](./01c-goals-and-houses.md))
- PR-AUC, calibration, Spearman rank correlation per goal
- Peak MAE for the timing goal
- Subsystem ablations (Hellenistic / Astrodynes / Geodetic held out individually)
- Reproducible evaluation reports committed to repo

### Out of scope

- Training any model (Lasso, XGBoost, anything)
- Promoting learned weights into production
- Changing the goal taxonomy, house mapping, or engine subsystems
- Building gold-set curation tooling beyond a CSV import script
- User-facing features
- Cross-cohort generalization claims

## 8. Document map

| Doc | Purpose | Status |
|---|---|---|
| [00-overview.md](./00-overview.md) | This document — framing and scope | ✅ draft |
| [01-dataset-sourcing.md](./01-dataset-sourcing.md) | Astro-Databank AA extraction procedure | ✅ draft |
| [01b-location-enrichment.md](./01b-location-enrichment.md) | Residence history enrichment, evidence tiers | ✅ draft |
| [01c-goals-and-houses.md](./01c-goals-and-houses.md) | Goal→house mapping, label rules, outcome windows | ✅ draft |
| [02-negative-sampling.md](./02-negative-sampling.md) | Temporal + geographic control generation | ✅ draft |
| 03-feature-schema.md | Engine input schema for evaluation rows | ⬜ rolled into [04 §2](./04-evaluation-protocol.md) (EvalRow schema) |
| [04-evaluation-protocol.md](./04-evaluation-protocol.md) | The concrete pipeline, step by step | ✅ draft |
| [05-evaluation-metrics.md](./05-evaluation-metrics.md) | PR-AUC, calibration, Spearman, Peak MAE definitions | ✅ draft |
| experiments/EXP-0001-baseline.md | First evaluation run report | ⬜ blocked on pipeline |

## 9. Milestone breakdown

Concretely phased so each milestone ends with a shippable artifact.

### Milestone E1 — Enrichment (3 weeks)
- Draft remaining docs (01, 02, 05)
- Implement Wikidata SPARQL pass ([mcp-astro-engine/etl/wikidata_residence.py](../../mcp-astro-engine/etl/))
- Implement Wikipedia geoparse fallback
- Hand-curate 50-subject gold set
- Run enrichment quality validation (01b §6)
- **Artifact:** ~500 AA subjects with residence intervals + event labels, validated

### Milestone E2 — Pipeline (1–2 weeks)
- Implement `mcp-astro-engine/evaluation/run_engine.py` (invokes existing engine over enriched rows)
- Implement `compute_metrics.py`, `calibration.py`, `ablation.py`, `report.py`
- Wire negative sampling per 02
- **Artifact:** reproducible end-to-end evaluation run, output to markdown report

### Milestone E3 — Baseline report (1 week)
- Run full pipeline, produce `experiments/EXP-0001-baseline.md`
- Per-goal PR-AUC, calibration, Spearman, Peak MAE (timing)
- Subsystem ablation table
- External validity caveats
- **Artifact:** investor/team-ready baseline report

**Total:** ~6 weeks from docs-done to baseline report. No training, no MLOps, no infrastructure beyond the existing mcp-astro-engine Python tree.

## 10. Glossary

| Term | Meaning |
|---|---|
| **AA rating** | Astro-Databank's highest tier for birth-time reliability (from hospital records or birth certificates) — see [01b §2](./01b-location-enrichment.md) |
| **L-AA / L-A / L-B / L-C** | Location evidence tiers defined in [01b §2](./01b-location-enrichment.md) |
| **Per-goal score** | Weighted re-aggregation of per-house engine scores, per [01c §4](./01c-goals-and-houses.md) |
| **Outcome window** | Time interval post-event required to validate a positive label, per [01c §5](./01c-goals-and-houses.md) |
| **PR-AUC** | Area under the Precision-Recall curve — primary metric for imbalanced binary outcomes |
| **Peak MAE** | Mean Absolute Error in weeks between engine-predicted peak window and actual event date |
| **Engine version** | A pinned commit + weights JSON hash. Every evaluation report references one |
| **Eval set** | The enriched, labeled subject cohort used for evaluation. Read-only. Never tuned against |
