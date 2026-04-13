"""Compute metrics + write the EXP-#### report.

Reads predictions.csv + run_manifest.json, computes PR-AUC / calibration /
within-subject Spearman per goal per docs/ml-evaluation/05, and emits a
report.md with honest caveats.

Per docs/ml-evaluation/05 §2.1, PR-AUC uses binarization:
  Y == +1 → positive class; Y ∈ {-1, 0} → negative class.
Harm-detection (Y == -1 as positive) reported as secondary.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
from pathlib import Path
from typing import Optional

import numpy as np

from evaluation.metrics import (
    METRIC_VERSION,
    calibration,
    pr_auc_with_ci,
    within_subject_spearman,
)


GOALS = ("love", "career", "community", "growth", "relocation")


def _parse_label(s: str) -> float | None:
    """Parse a goal-polarity cell: empty or 'None' → None; otherwise int."""
    if s in ("", "None", None):
        return None
    try:
        return int(s)
    except (ValueError, TypeError):
        return None


def load_predictions(path: Path) -> list[dict]:
    with path.open() as f:
        return list(csv.DictReader(f))


def metrics_per_goal(
    rows: list[dict],
    goal: str,
    rating_filter: Optional[set[str]] = None,
    predictor_col: str = "macro_score",
) -> dict:
    """Positive- and harm-detection PR-AUC + calibration for one goal.

    Args:
        rating_filter: if provided, only include rows whose rodden_rating
            is in this set. Used for tier-stratified metrics.
        predictor_col: which column of the predictions CSV to use as the
            score. Defaults to 'macro_score'; pass e.g.
            'score__default__career' to evaluate per-goal re-aggregated
            scores.
    """
    subject_ids: list[str] = []
    y_raw: list[float] = []
    scores: list[float] = []
    for r in rows:
        if r["status"] != "ok":
            continue
        if rating_filter is not None and r.get("rodden_rating") not in rating_filter:
            continue
        label = _parse_label(r[goal])
        if label is None:
            continue
        try:
            ms = float(r[predictor_col])
        except (ValueError, TypeError, KeyError):
            continue
        subject_ids.append(r["subject_id"])
        y_raw.append(label)
        scores.append(ms)

    if not y_raw:
        return {"goal": goal, "n_total": 0, "status": "empty"}

    y_arr = np.array(y_raw, dtype=int)
    score_arr = np.array(scores, dtype=float)

    n_pos = int((y_arr == 1).sum())
    n_neg_or_zero = int((y_arr != 1).sum())

    out: dict = {
        "goal": goal,
        "n_total": len(y_raw),
        "n_positive_plus1": n_pos,
        "n_zero": int((y_arr == 0).sum()),
        "n_negative_minus1": int((y_arr == -1).sum()),
        "score_mean": float(score_arr.mean()),
        "score_median": float(np.median(score_arr)),
        "score_min": float(score_arr.min()),
        "score_max": float(score_arr.max()),
    }

    # Positive-detection: Y==+1 vs rest
    if n_pos > 0 and n_neg_or_zero > 0:
        y_bin_pos = (y_arr == 1).astype(int)
        pr_pos = pr_auc_with_ci(y_bin_pos, score_arr, variant="positive_detection",
                                n_bootstrap=500)
        out["pr_auc_positive"] = {
            "point": pr_pos.point_estimate,
            "ci_lower": pr_pos.ci_lower,
            "ci_upper": pr_pos.ci_upper,
            "prevalence": pr_pos.positive_class_prevalence,
        }
    else:
        out["pr_auc_positive"] = None

    # Harm-detection: Y==-1 vs rest, with inverted score
    n_harm = int((y_arr == -1).sum())
    if n_harm > 0 and (len(y_arr) - n_harm) > 0:
        y_bin_harm = (y_arr == -1).astype(int)
        inv_score = 100.0 - score_arr
        pr_harm = pr_auc_with_ci(y_bin_harm, inv_score, variant="harm_detection",
                                 n_bootstrap=500)
        out["pr_auc_harm"] = {
            "point": pr_harm.point_estimate,
            "ci_lower": pr_harm.ci_lower,
            "ci_upper": pr_harm.ci_upper,
            "prevalence": pr_harm.positive_class_prevalence,
        }
    else:
        out["pr_auc_harm"] = None

    # Calibration (positive-detection framing)
    if n_pos > 0 and n_neg_or_zero > 0:
        cal = calibration((y_arr == 1).astype(int), score_arr, n_bins=10)
        out["calibration"] = {
            "slope": cal.slope,
            "intercept": cal.intercept,
            "ece": cal.ece,
        }
    else:
        out["calibration"] = None

    # Within-subject Spearman (positive-detection framing)
    if n_pos > 0 and n_neg_or_zero > 0:
        sp = within_subject_spearman(
            subject_ids, (y_arr == 1).astype(int), score_arr, min_rows_per_subject=3,
        )
        out["spearman"] = {
            "median": sp.median_rho,
            "q25": sp.q25_rho,
            "q75": sp.q75_rho,
            "subjects_included": sp.n_subjects_included,
            "subjects_excluded_low_rows": sp.n_subjects_excluded,
        }
    else:
        out["spearman"] = None

    out["status"] = "computed"
    out["predictor"] = predictor_col
    return out


def render_report(
    manifest: dict,
    metrics: list[dict],
    predictions_count: int,
) -> str:
    """Render the markdown report."""
    lines: list[str] = []
    lines.append(f"# {manifest['exp_id']} — Baseline Evaluation Report")
    lines.append("")
    lines.append(
        f"**Pipeline version:** {manifest['pipeline_version']}  \n"
        f"**Metric version:** {METRIC_VERSION}  \n"
        f"**Run:** {manifest['started_at']} → {manifest['finished_at']}  \n"
        f"**Git commit:** `{manifest['git_commit']}`  \n"
        f"**Endpoint:** `{manifest['endpoint']}`"
    )
    lines.append("")
    lines.append("## Pipeline status")
    lines.append("")
    lines.append(
        f"- Rows scored: **{manifest['rows_ok']}/{manifest['row_count']}**"
        f" ({100.0 * manifest['rows_ok'] / max(manifest['row_count'], 1):.1f}%)"
    )
    lines.append(f"- Rows with errors: {manifest['rows_error']}")
    avg = manifest.get('avg_macro_score')
    if avg is not None:
        lines.append(f"- Mean macroScore: {avg:.2f}")
    lines.append("")

    lines.append("### Verdict distribution")
    lines.append("")
    lines.append("| Verdict | Count |")
    lines.append("|---|---|")
    for v, n in sorted(manifest.get('verdict_distribution', {}).items(),
                       key=lambda kv: -kv[1]):
        lines.append(f"| {v} | {n} |")
    lines.append("")

    # --- Cohort composition by rating ---
    lines.append("## Cohort composition (by Rodden rating)")
    lines.append("")
    rating_dist = manifest.get("rating_distribution", {})
    if rating_dist:
        lines.append("| Rating | Rows | Subjects |")
        lines.append("|---|---|---|")
        for rating in ("AA", "A", "B"):
            if rating in rating_dist:
                d = rating_dist[rating]
                lines.append(f"| {rating} | {d['rows']} | {d['subjects']} |")
        lines.append("")

    # --- Per-goal metrics ---
    lines.append("## Per-goal metrics")
    lines.append("")
    lines.append(
        "Predictor is **macroScore** (not per-goal re-aggregated scores — "
        "pending per-house score extraction). Labels come from "
        "`etl.map_event_polarity` + `etl.outcome_window`. See "
        "[docs/ml-evaluation/05](../../../docs/ml-evaluation/05-evaluation-metrics.md) "
        "for metric definitions."
    )
    lines.append("")
    lines.append(
        "| Goal | N | +1 | 0 | −1 | PR-AUC (pos-detect) | PR-AUC (harm-detect) "
        "| Spearman ρ median | Calibration slope |"
    )
    lines.append(
        "|---|---|---|---|---|---|---|---|---|"
    )
    for m in metrics:
        if m["status"] != "computed":
            lines.append(
                f"| {m['goal']} | {m['n_total']} | — | — | — | — | — | — | — |"
            )
            continue
        pos = m.get("pr_auc_positive")
        harm = m.get("pr_auc_harm")
        sp = m.get("spearman")
        cal = m.get("calibration")
        pos_cell = (
            f"{pos['point']:.3f} [{pos['ci_lower']:.3f}, {pos['ci_upper']:.3f}]"
            if pos else "N too small"
        )
        harm_cell = (
            f"{harm['point']:.3f} [{harm['ci_lower']:.3f}, {harm['ci_upper']:.3f}]"
            if harm else "N too small"
        )
        sp_cell = (
            f"{sp['median']:.3f}  (n={sp['subjects_included']})"
            if sp and not math.isnan(sp['median']) else "—"
        )
        cal_cell = (
            f"{cal['slope']:.3f}" if cal and not math.isnan(cal['slope']) else "—"
        )
        lines.append(
            f"| {m['goal']} | {m['n_total']} | {m['n_positive_plus1']} "
            f"| {m['n_zero']} | {m['n_negative_minus1']} "
            f"| {pos_cell} | {harm_cell} | {sp_cell} | {cal_cell} |"
        )
    lines.append("")

    # --- Caveats block (REQUIRED per docs/ml-evaluation/04 §7) ---
    lines.append("## Caveats (required per docs/ml-evaluation/04 §7)")
    lines.append("")
    lines.append(
        "**External validity.** This evaluation was conducted on "
        f"{manifest['row_count']} rows drawn from 42 AA-rated subjects from "
        "Astro-Databank. The cohort is disproportionately 20th-century and "
        "Western (30/42 born in the US). Metrics reflect engine performance "
        "*on this cohort only*. Generalization to non-Western / non-famous / "
        "living subjects is unverified."
    )
    lines.append("")
    lines.append(
        "**Evidence tier.** Event labels derive from L-B Astro-Databank event "
        "entries. Outcome-window validation is applied only to marriage (5y) "
        "and relocation (3y) events; career publications/promotions retain "
        "initial +1 labels pending canon/employment enrichment."
    )
    lines.append("")
    lines.append(
        "**Positive-event bias.** Biographical sources overweight positive "
        "events (awards, marriages, publications). Harm-detection PR-AUC is "
        "expected to be weaker than positive-detection PR-AUC and should not "
        "be interpreted as evidence of engine quality."
    )
    lines.append("")
    lines.append("**Pipeline caveats (this experiment specifically):**")
    for c in manifest.get("caveats", []):
        lines.append(f"- {c}")
    lines.append("")

    lines.append(
        "**Predictor limitation.** This experiment uses the single scalar "
        "`macroScore` as predictor for all five goals. macroScore is "
        "goal-agnostic (travel-weighted per docs/prd/scoring-rubric.md), so "
        "per-goal PR-AUC numbers here measure *how well the global composite "
        "predicts each goal* — NOT how well a goal-specific re-aggregation "
        "would perform. Per-house score extraction + "
        "[docs/ml-evaluation/01c §4](../../../docs/ml-evaluation/01c-goals-and-houses.md) "
        "re-aggregation is the next planned experiment."
    )
    lines.append("")

    # --- What this experiment proves ---
    lines.append("## What this experiment proves")
    lines.append("")
    lines.append(
        "1. **Pipeline is functional end-to-end.** Python builds EvalRows, "
        "pyswisseph computes natal planets / relocated cusps / transits, HTTP "
        "POSTs the payload to the production `/api/house-matrix` route, and "
        "the engine returns scores. This is the baseline infrastructure "
        "against which future improvements will be measured."
    )
    lines.append(
        "2. **Some engine signal exists, directionally.** Any goal with "
        "PR-AUC meaningfully above its prevalence demonstrates the macroScore "
        "correlates with biographical outcomes for that goal. Zero/low "
        "PR-AUC on a goal suggests the composite score doesn't capture that "
        "goal's dynamics — reinforcing the case for per-goal re-aggregation."
    )
    lines.append("")
    lines.append(
        "**This is not the scientific baseline** described in "
        "[docs/ml-evaluation/00 §5](../../../docs/ml-evaluation/00-overview.md). "
        "That requires ACG + paran integration and per-house score "
        "extraction. Treat this as the plumbing validation experiment."
    )

    return "\n".join(lines) + "\n"


def render_report_stratified(
    manifest: dict,
    metrics_overall: list[dict],
    metrics_aa: list[dict],
    metrics_a: list[dict],
    predictions_count: int,
) -> str:
    """Report with per-tier PR-AUC stratification per docs/ml-evaluation/04 §4.5."""
    base = render_report(manifest, metrics_overall, predictions_count)

    extra: list[str] = []
    extra.append("## Tier-stratified PR-AUC (positive-detection only)")
    extra.append("")
    extra.append(
        "Per docs/ml-evaluation/04 §4.5: stratifying by Rodden rating "
        "exposes whether engine performance degrades as birth-time precision "
        "weakens. AA (hospital records) is the most-trusted cohort; A/B have "
        "progressively larger angle errors."
    )
    extra.append("")
    extra.append("| Goal | All (N) | AA (N) | A (N) |")
    extra.append("|---|---|---|---|")
    for i, g in enumerate(GOALS):
        def _cell(m: dict) -> str:
            if m.get("status") != "computed":
                return f"— ({m['n_total']})"
            pos = m.get("pr_auc_positive")
            if not pos:
                return f"— ({m['n_total']})"
            return (
                f"{pos['point']:.3f} "
                f"[{pos['ci_lower']:.2f}, {pos['ci_upper']:.2f}] "
                f"({m['n_total']})"
            )
        extra.append(
            f"| {g} | {_cell(metrics_overall[i])} "
            f"| {_cell(metrics_aa[i])} | {_cell(metrics_a[i])} |"
        )
    extra.append("")
    extra.append(
        "**Interpretation:** If AA PR-AUC >> A PR-AUC for a goal, engine "
        "performance is sensitive to birth-time precision there — expected "
        "for ACG- and house-driven goals like career and partnership. If AA "
        "≈ A, the goal's scoring may not depend on precise angles."
    )
    extra.append("")

    # Splice the tier table in before the Caveats section
    out = base.replace(
        "## Caveats (required per docs/ml-evaluation/04 §7)",
        "\n".join(extra) + "\n## Caveats (required per docs/ml-evaluation/04 §7)",
    )
    return out


def render_scenario_comparison(
    rows: list[dict], scenarios: list[str],
) -> str:
    """Table: PR-AUC per goal per weighting scenario (with macroScore for ref).

    Reveals which scenario (if any) produces goal-specific lift vs. the global
    composite.
    """
    lines: list[str] = []
    lines.append("## Weight-scenario comparison (positive-detection PR-AUC)")
    lines.append("")
    lines.append(
        "Each cell: PR-AUC [95% CI], N. macroScore column is the "
        "goal-agnostic composite for reference. Cells where any per-goal "
        "scenario beats macroScore by >0.05 are bolded."
    )
    lines.append("")

    header = "| Goal | macroScore | " + " | ".join(scenarios) + " |"
    lines.append(header)
    lines.append("|---|" + "---|" * (len(scenarios) + 1))

    for goal in GOALS:
        m_macro = metrics_per_goal(rows, goal, predictor_col="macro_score")
        macro_val: Optional[float] = None
        if m_macro.get("status") == "computed" and m_macro.get("pr_auc_positive"):
            macro_val = m_macro["pr_auc_positive"]["point"]
            macro_cell = (
                f"{macro_val:.3f} "
                f"[{m_macro['pr_auc_positive']['ci_lower']:.2f}, "
                f"{m_macro['pr_auc_positive']['ci_upper']:.2f}]"
                f" (n={m_macro['n_total']})"
            )
        else:
            macro_cell = f"— (n={m_macro.get('n_total', 0)})"

        row_cells = [goal, macro_cell]
        for sc in scenarios:
            col = f"score__{sc}__{goal}"
            if not col in (rows[0].keys() if rows else {}):
                row_cells.append("—")
                continue
            m = metrics_per_goal(rows, goal, predictor_col=col)
            if m.get("status") == "computed" and m.get("pr_auc_positive"):
                val = m["pr_auc_positive"]["point"]
                cell = (
                    f"{val:.3f} "
                    f"[{m['pr_auc_positive']['ci_lower']:.2f}, "
                    f"{m['pr_auc_positive']['ci_upper']:.2f}]"
                )
                if macro_val is not None and val - macro_val > 0.05:
                    cell = f"**{cell}**"
                row_cells.append(cell)
            else:
                row_cells.append("—")
        lines.append("| " + " | ".join(row_cells) + " |")
    lines.append("")
    return "\n".join(lines)


def run(exp_dir: Path) -> Path:
    preds_path = exp_dir / "predictions.csv"
    manifest_path = exp_dir / "run_manifest.json"
    report_path = exp_dir / "report.md"
    metrics_path = exp_dir / "metrics.json"

    rows = load_predictions(preds_path)
    manifest = json.loads(manifest_path.read_text())

    # Cohort stats per rating — inject into manifest for report rendering
    rating_dist: dict[str, dict[str, int]] = {}
    for r in rows:
        if r.get("status") != "ok":
            continue
        rating = r.get("rodden_rating") or "UNKNOWN"
        d = rating_dist.setdefault(rating, {"rows": 0, "subjects": set()})
        d["rows"] += 1
        d["subjects"].add(r.get("subject_id"))
    for rating, d in rating_dist.items():
        d["subjects"] = len(d["subjects"])
    manifest["rating_distribution"] = rating_dist

    # Overall metrics + stratified AA-only and A-only
    metrics_overall = [metrics_per_goal(rows, g) for g in GOALS]
    metrics_aa = [metrics_per_goal(rows, g, rating_filter={"AA"}) for g in GOALS]
    metrics_a = [metrics_per_goal(rows, g, rating_filter={"A"}) for g in GOALS]

    metrics_path.write_text(json.dumps({
        "overall": metrics_overall,
        "aa_only": metrics_aa,
        "a_only": metrics_a,
    }, indent=2, default=str))

    report = render_report_stratified(
        manifest, metrics_overall, metrics_aa, metrics_a, len(rows),
    )

    # Append weight-scenario table if any scenarios were run
    scenarios = manifest.get("scenarios", [])
    if scenarios and rows and any(k.startswith("score__") for k in rows[0]):
        scenario_section = render_scenario_comparison(rows, scenarios)
        # Insert before the Caveats section
        report = report.replace(
            "## Caveats",
            scenario_section + "\n## Caveats",
        )
    report_path.write_text(report)

    print(f"✓ {metrics_path}")
    print(f"✓ {report_path}")
    return report_path


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--exp-id", default="EXP-0001")
    args = ap.parse_args()
    run(Path("evaluation/experiments") / args.exp_id)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
