# 04 — Evaluation Protocol

**Status:** Draft for review
**Owner:** TBD
**Depends on:** [01b](./01b-location-enrichment.md) (enrichment), [01c](./01c-goals-and-houses.md) (goals+houses), [02-negative-sampling.md](./02-negative-sampling.md) (to be drafted), [05-evaluation-metrics.md](./05-evaluation-metrics.md) (to be drafted)
**Consumed by:** `mcp-astro-engine/evaluation/*.py`, every `experiments/EXP-####.md` report

---

## 1. Purpose

Defines the exact procedure for evaluating the current engine against the enriched AA cohort. Every evaluation run follows this protocol; deviations must be documented in the resulting `EXP-####.md` report.

The output of one run is:
1. A `report.md` in `experiments/` containing per-goal metrics, calibration curves, ablation tables.
2. A `predictions.parquet` of all scored rows for re-analysis without re-running the engine.
3. A `run_manifest.json` locking engine version, dataset version, random seed, config.

---

## 2. The evaluation row

The unit of evaluation is a tuple:

```
EvalRow = {
  # Keys
  row_id:           UUID                            # deterministic from inputs
  subject_id:       str                             # AA subject reference

  # Spatial/temporal coordinates
  location:         {lat, lon, geoname_id}          # from residence_record (01b §3)
  time_window:      {start, end}                    # ISO dates

  # Row type
  row_type:         enum: positive | temporal_neg | geographic_neg

  # Feature inputs (passed to engine, not hand-engineered here)
  natal_chart:      {planets, houses, dignities}    # computed once per subject
  destination:      {lat, lon}                      # == location
  sample_date:      ISO datetime                    # midpoint of time_window

  # Labels (only for evaluation, not inputs to engine)
  labels: {
    love:        Y ∈ {-1, 0, +1, null}
    career:      Y ∈ {-1, 0, +1, null}
    community:   Y ∈ {-1, 0, +1, null}
    growth:      Y ∈ {-1, 0, +1, null}
    relocation:  Y ∈ {-1, 0, +1, null}
  }
  label_provenance: [event_record_id, ...]          # which events drove this label

  # Metadata
  evidence_tier:    L-AA | L-A | L-B | L-C          # from 01b §2
  era_bucket:       pre-1900 | 1900-1950 | 1950-2000 | post-2000
  subject_cohort:   (profession_class, birth_country)   # for subgroup analysis
}
```

`null` labels mean no biographical evidence for that goal at this (subject, location, time) — the row is dropped from that goal's metric computation but may still be used for others.

---

## 3. Pipeline

```
┌─────────────────────────────────────┐
│  Stage 0: Freeze inputs             │
│  - Pin engine commit + weights hash │
│  - Pin enrichment dataset version   │
│  - Set random seed                  │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Stage 1: Build EvalRows            │
│  - Positive rows from events        │
│  - Temporal negatives (02)          │
│  - Geographic negatives (02)        │
│  - Apply outcome windows (01c §5)   │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Stage 2: Run engine                │
│  - For each row, call computeHouse- │
│    Matrix() → {H1..H12} × [0,100]   │
│  - Also capture subsystem scalars   │
│    (Hel, Ast, Geo, Transit)         │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Stage 3: Per-goal re-aggregation   │
│  - Apply 01c §4 formulas            │
│  - Produce {love, career, ...} ∈    │
│    [0,100] per row                  │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Stage 4: Compute metrics           │
│  - Per-goal PR-AUC                  │
│  - Per-goal calibration             │
│  - Per-goal Spearman (within-subj)  │
│  - Timing: Peak MAE                 │
│  - Subgroup analysis                │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Stage 5: Ablations                 │
│  - Re-run Stages 2–4 with Hel only  │
│  - Re-run with Astrodynes only      │
│  - Re-run with Geodetic only        │
│  - Re-run with transits frozen      │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Stage 6: Report                    │
│  - Write experiments/EXP-####.md    │
│  - Write predictions.parquet        │
│  - Write run_manifest.json          │
└─────────────────────────────────────┘
```

---

## 4. Stage details

### 4.1 Stage 0: Freeze inputs

Every run starts by locking three things:

**Engine version identifier:**
```
engine_version = {
  git_commit:        "abcd1234"                     # from `git rev-parse HEAD`
  weights_hash:      "sha256:..."                   # hash of any JSON config files
  subsystem_flags:   {hellenistic: true, astrodynes: true, geodetic: true, transits: true}
  node_version:      "20.x.x"
  pyswisseph_version: "2.10.3"
}
```

**Dataset version identifier:**
```
dataset_version = {
  enrichment_snapshot:  "2026-04-12T00:00:00Z"      # last enrichment run timestamp
  subject_count:        500
  gold_set_hash:        "sha256:..."                # over the 50-subject gold CSV
  event_label_version:  "v1.0"                      # per-goal polarity rules version
}
```

**Random seed:**
- Single `seed = 42` (configurable). Drives negative-sample selection, train/eval split if any, and anything else non-deterministic. Locked in the manifest.

If any of these change between runs, it is a **new experiment** with a new `EXP-####` report. Do not overwrite prior reports.

### 4.2 Stage 1: Build EvalRows

Row construction order matters — positives first, then negatives:

1. **Positive rows.** For each `event_record` in the enriched dataset:
   - Compute the event's `time_window`: for point-date events, ±3 months; for interval events (e.g., company-founding windows), use the interval directly.
   - Join with subject's `residence_record` at that time to get `location`. If no residence match, drop the row and log `positive_dropped_no_residence_match`.
   - Apply per-goal polarity rules from [01c §5](./01c-goals-and-houses.md). For window-required labels (C cases), check outcome window data and set Y accordingly. If outcome window data is missing, set that goal's Y to `null`.

2. **Temporal negative rows.** For each (subject, location) from `residence_record` with continuous residence ≥ 12 months:
   - Partition the residence interval into non-overlapping 12-month sub-windows.
   - Exclude any sub-window overlapping a positive event for that subject.
   - Sample `k_temporal = 3` negative sub-windows per positive event of the same goal, prioritizing "quiet" years (no events of any goal).
   - Labels: all goals set to `Y = 0` for the sub-windows that have no evidence of any event. If a quiet sub-window overlaps an event of a *different* goal, only label the uninvolved goals as 0.

3. **Geographic negative rows.** For each positive event:
   - Sample `k_geographic = 5` control locations matched on:
     - Same era (birth cohort of subject)
     - Same continent (to avoid geographic plausibility issues)
     - Different from any residence location the subject is known to have visited
   - Time window = same as positive event.
   - Labels: goals set to `Y = 0` for the sampled control location, with the assumption that the subject did not experience that goal's event at that location.

Full rules and rationale go in [02-negative-sampling.md](./02-negative-sampling.md); that doc owns the specifics. This protocol consumes whatever 02 specifies.

**Row count sanity checks (log and fail on violation):**
- ≥ 1 positive row per (subject, goal) for ≥ 80% of enriched subjects
- Temporal negatives = 3–5× positive count per goal (ratio tracked in manifest)
- Geographic negatives = 5–10× positive count per goal
- At least 100 labeled rows per goal or that goal's metrics are reported with a "low-N" warning

### 4.3 Stage 2: Run engine

For each EvalRow, invoke the existing engine:

```python
# pseudocode — actual implementation in evaluation/run_engine.py
for row in eval_rows:
    result = compute_house_matrix(
        natal_planets = row.natal_chart.planets,
        relocated_cusps = relocate_chart(row.natal_chart, row.location),
        acg_lines = compute_acg(row.natal_chart, row.location),
        transits = mundane_transits_at(row.sample_date),
        parans = parans_at(row.location, row.sample_date),
        dest_lat = row.location.lat,
        dest_lon = row.location.lon,
    )
    row.engine_output = {
        'houses': result.house_scores,           # {H1..H12} each 0-100
        'macro': result.macro_score,             # 0-100
        'personal': result.personal_score,       # 0-70
        'collective': result.collective_score,   # 0-30
        'subsystems': {
            'hellenistic': result.hellenistic_contribution,  # scalar
            'astrodynes': result.astrodynes_contribution,
            'geodetic': result.geodetic_contribution,
            'transits': result.transit_contribution,
        },
        'global_penalty': result.global_penalty,
    }
```

**Determinism requirement:** Running Stage 2 twice on the same EvalRow with the same engine_version must produce bit-identical output. If not, we have a reproducibility bug that invalidates all metrics. Verified by hashing output JSON per row and confirming hash stability on a 10-row sanity re-run.

**Performance target:** ≤ 500ms per row on a dev laptop. At 500 subjects × ~20 rows/subject = 10,000 rows total, total runtime ≤ ~80 minutes. If slower, cache ephemeris lookups.

### 4.4 Stage 3: Per-goal re-aggregation

Straight application of [01c §4](./01c-goals-and-houses.md):

```python
row.goal_scores = {
    'love':       0.50*H7 + 0.30*H5 + 0.15*H8 + 0.05*H4,
    'career':     0.55*H10 + 0.20*H6 + 0.15*H2 + 0.10*H11,
    'community':  0.55*H11 + 0.25*H3 + 0.20*H7,
    'growth':     0.45*H9 + 0.35*H12 + 0.20*H3,
    'relocation': 0.60*H4 + 0.15*H2 + 0.15*H6 + 0.10*H1,
}
# Each output ∈ [0, 100]
```

### 4.5 Stage 4: Compute metrics

Per goal, on rows with non-null labels for that goal:

1. **Binarize labels.** For PR-AUC, treat Y = +1 as positive class, Y ∈ {0, −1} as negative. Separately, compute "harm detection" PR-AUC treating Y = −1 as positive class, Y ∈ {0, +1} as negative — this measures whether the engine flags harmful locations, which is a distinct product-relevant property.

2. **PR-AUC.** Standard sklearn `average_precision_score`. Report 95% bootstrap CI via 1000 resamples.

3. **Calibration.**
   - Bin predictions into 10 equal-width bins (0–10, 10–20, …, 90–100).
   - Per bin, compute `(mean_predicted_score / 100, empirical_positive_rate)`.
   - Fit linear regression: perfect calibration has slope = 1, intercept = 0.
   - Report slope, intercept, and per-bin table.

4. **Spearman rank correlation (within-subject).** For each subject with ≥ 3 labeled rows for a goal, compute Spearman(engine_score, label) across their rows. This measures whether the engine correctly *rank-orders* a person's locations/times even if absolute scores are poorly calibrated. Report median and IQR across subjects.

5. **Timing Peak MAE.** For each positive event with a known exact date, find the 12-month window where the engine's score peaks (via Windows feature logic). MAE = |weeks between peak and actual event date|. Report mean and median in weeks.

Full metric definitions in [05-evaluation-metrics.md](./05-evaluation-metrics.md).

6. **Subgroup analysis.** Re-compute PR-AUC per:
   - `era_bucket` (4 buckets)
   - `evidence_tier` (L-AA vs L-A — L-B excluded from Phase 1 per 01b §2)
   - `subject_cohort` profession class (artist / scientist / politician / athlete / …)
   - `birth_country` continent

   Subgroup PR-AUCs exist to expose cohort-specific weakness, not to be headline numbers. Minimum 50 labeled rows per subgroup-goal cell or the cell is reported as "N too small."

### 4.6 Stage 5: Ablations

Re-run Stages 2–4 with the engine modified to disable one subsystem at a time:

| Ablation name | Modification | Purpose |
|---|---|---|
| `hel_only` | Zero out Astrodynes + Geodetic contributions | Does Hellenistic alone predict? |
| `ast_only` | Zero out Hellenistic + Geodetic | Does Astrodynes alone predict? |
| `geo_only` | Zero out Hellenistic + Astrodynes | Does Geodetic alone predict? |
| `no_transits` | Use `sample_date = natal_date` so no transit signal | Does static positional data alone predict? |
| `transits_only` | Zero natal dignity and ACG contributions, keep transits | Does pure timing signal predict? |

The ablation results table is the most useful artifact for understanding engine internals. If `hel_only` PR-AUC ≈ full PR-AUC, the Astrodynes and Geodetic subsystems add no predictive value and are candidates for deprecation (or, at minimum, closer scrutiny). This finding by itself justifies the evaluation framework existing.

**Ablation implementation:** Do not modify engine source. Instead, zero out the relevant fields in the engine output *after* running, then re-compute the goal aggregations. This avoids drift between ablation and production engine behavior.

Wait — this deserves a correction. Zeroing post-hoc doesn't capture how the engine's internal weighting interacts. For a proper ablation, we need the engine to actually skip the subsystem during computation. **Decision:** Phase 1 ablations use post-hoc zeroing with a flagged caveat in the report ("post-hoc attribution, not causal ablation"). True subsystem ablation requires engine support, which is a code change we defer.

### 4.7 Stage 6: Report

Output files in `mcp-astro-engine/evaluation/experiments/EXP-####/`:

**`report.md`** — human-readable per-goal results, ablation tables, calibration curves (PNG embedded), subgroup analysis, external validity caveats. Template provided at `evaluation/templates/report_template.md`.

**`predictions.parquet`** — one row per EvalRow with: `row_id`, `subject_id`, `location`, `time_window`, `row_type`, engine outputs (all 12 houses + subsystems + macro/personal/collective), per-goal scores, per-goal labels. Enables re-analysis without re-running.

**`run_manifest.json`** — engine_version, dataset_version, seed, row counts, any run-time warnings.

**`calibration_plots/`** — one PNG per goal, reliability diagram.

All four artifacts are committed to the repo so results are auditable forever.

---

## 5. Train / evaluation set handling

**There is no training set in this phase.** The entire enriched cohort is evaluation data. Every row is used exactly once in Stage 4.

**Why this matters:** When we eventually train, the AA cohort will need to be split into train/val/test. Anything we've seen during evaluation *cannot* be used as a training target without leakage. Mitigation: the evaluation rows' `row_id`s are committed to a registry at `evaluation/eval_set_v1_row_ids.txt`. Future training runs must exclude these row_ids from training and validation. Test set only.

This is a commitment we should make before Stage 1 runs — it's cheap now and expensive to recover later.

---

## 6. Discipline rules (enforced in code where possible)

**Rule 1: Evaluation set is read-only.**
- No engine code changes after Stage 0 freeze except bug fixes documented in the `EXP-####.md` report.
- No weight tuning based on Stage 4 output.
- If weights change, a new `EXP-####` run against the **same** dataset_version is required to compare.

**Rule 2: External validity caveats are mandatory in every report.**
- Every `report.md` includes the §7 caveats block verbatim or a justified variant.
- Report templates enforce this section.

**Rule 3: Negative results are published.**
- If all PR-AUCs are 0.48–0.53, the report still ships with that finding clearly stated. Negative results are load-bearing evidence.
- No re-running to "get better numbers" without changing the engine or dataset version.

**Rule 4: Reproducibility check on every run.**
- Stage 2 determinism verified on a 10-row sample before running the full cohort.
- If hashes differ, fix the nondeterminism before producing any report.

**Rule 5: Dataset changes trigger new experiment IDs.**
- Adding subjects, changing labels, or re-running enrichment = new `EXP-####`.
- Never silently re-label existing rows.

---

## 7. Mandatory external validity caveats (report boilerplate)

Every report includes:

> **External validity limitations.** This evaluation was conducted on N = [X] AA-rated subjects drawn from Astro-Databank. This cohort is disproportionately [describe era, nationality, profession mix]. Metrics reported here characterize engine performance on this specific cohort. Generalization to the broader user population — particularly non-Western, non-famous, and living subjects — is unverified. Claims in product copy, marketing, and investor materials should specify this cohort limitation.

> **Evidence tier limitations.** Labels in this evaluation derive primarily from L-AA and L-A sources per [01b §2]. Events with L-B evidence were [included / excluded] with the following rationale: [...]. Events with L-C evidence were excluded entirely.

> **Positive-event bias.** Biographical sources overweight documented positive events (awards, promotions, publications) relative to negative events (failures, breakdowns, relationship collapses). Per-goal metrics reflect this asymmetry. The "harm detection" PR-AUC (Y=−1 as positive class) is likely to be weaker than the positive-detection PR-AUC for all goals, and this should not be interpreted as evidence of engine quality.

---

## 8. Failure modes and how to handle them

| Failure mode | Signal | Response |
|---|---|---|
| All PR-AUCs ≈ 0.50 | Metrics near random | Negative result. Ship report. Investigate whether labels are correct before concluding engine is weak |
| One goal's PR-AUC very high, others very low | High variance across goals | Expected — some goals have better data. Report honestly |
| Career PR-AUC > 0.85 | Suspicious — may be fame leakage | Investigate via cohort controls (are famous-location scores elevated regardless of person?) |
| Calibration slope << 1.0 | Engine overconfident at high scores | Flag for post-launch monitoring; consider score remapping before user display |
| Ablation shows one subsystem dominates | E.g., `geo_only` ≈ full | Flag candidates for review; don't ship a recommendation to remove subsystems from production |
| Subgroup PR-AUC varies > 0.20 across cohorts | Engine performs very differently across era/region | Document; may require separate engine variants or weight sets |
| Enrichment coverage < 70% | Per 01b §6 target | Fix enrichment, don't run evaluation. Low coverage = biased eval set |

---

## 9. Implementation file map

```
mcp-astro-engine/
├── evaluation/
│   ├── __init__.py
│   ├── row_builder.py          # Stage 1
│   ├── run_engine.py           # Stage 2 — invokes existing engine
│   ├── aggregate.py            # Stage 3 — 01c §4 formulas
│   ├── metrics.py              # Stage 4 — PR-AUC, calibration, Spearman
│   ├── ablations.py            # Stage 5
│   ├── report.py               # Stage 6 — templated markdown generator
│   ├── manifest.py             # run_manifest.json I/O
│   ├── determinism_check.py    # Stage 2 sanity check
│   ├── templates/
│   │   └── report_template.md
│   └── experiments/
│       └── EXP-0001/
│           ├── report.md
│           ├── predictions.parquet
│           ├── run_manifest.json
│           └── calibration_plots/
│               ├── love.png
│               ├── career.png
│               └── ...
└── tests/
    ├── test_row_builder.py     # Stage 1 unit tests
    ├── test_aggregate.py       # Stage 3 — formulas match 01c
    └── test_metrics.py         # Stage 4 — metric math sanity
```

The existing `tests/smoke.spec.ts` and `scripts/backtest-brandon.ts` are unchanged — they test the engine itself, not the evaluation framework on top of it.

---

## 10. Open questions

1. **Ablation fidelity:** post-hoc zeroing (§4.6) is simpler but not a true causal ablation. Worth the engineering cost of threading ablation flags through the engine for Phase 1, or accept the caveat? Proposal: accept the caveat; revisit if Phase 1 ablation results are suspicious.

2. **Bootstrap CIs everywhere:** reporting 95% bootstrap CI on PR-AUC is expensive (×1000 resamples). On 10,000 rows × 5 goals × 5 subgroup dimensions, this compounds. Acceptable compute cost or restrict CIs to headline per-goal metrics only? Proposal: CIs on headline per-goal only.

3. **"Harm detection" framing:** I introduced two binarizations in §4.5 (Y=+1 as positive class, and Y=−1 as positive class). Worth emphasizing in reports, or over-engineering? Proposal: emphasize — harm detection is a product-critical property (avoid telling users to move to locations with documented negative outcomes for the selected goal).

4. **Re-running the same engine:** if we find a bug in `run_engine.py` and rerun, is that a new EXP-#### or the same one with a correction note? Proposal: new EXP-####. Never silently replace a published report.

5. **Weight evolution tracking:** the per-goal aggregation weights in [01c §4](./01c-goals-and-houses.md) are v1. When they change, every downstream report's numbers change too. Track goal-weight version in `dataset_version.event_label_version`? Proposal: yes, rename that field to `label_and_aggregation_version` to cover both.
