"""AstroNat evaluation framework.

See docs/ml-evaluation/ for design specs.
See docs/ml-evaluation/00-overview.md for scope and milestones.

Module layout:
    aggregate.py    — per-goal re-aggregation (docs/ml-evaluation/01c §4)
    metrics.py      — PR-AUC, calibration, Spearman, Peak MAE (docs/ml-evaluation/05)
    row_builder.py  — EvalRow construction (docs/ml-evaluation/04 §4.2, 02)
    run_engine.py   — engine invocation (docs/ml-evaluation/04 §4.3) — TODO
    ablations.py    — subsystem ablations (docs/ml-evaluation/04 §4.6) — TODO
    report.py       — report generation (docs/ml-evaluation/04 §4.7) — TODO
    manifest.py     — run manifest I/O (docs/ml-evaluation/04 §4.1) — TODO
"""

__version__ = "0.1.0-dev"
