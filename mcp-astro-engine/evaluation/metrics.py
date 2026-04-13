"""Evaluation metrics per docs/ml-evaluation/05.

Primary metrics:
  - PR-AUC (positive-detection and harm-detection variants)  §2.1
  - Calibration (bin-wise reliability + ECE)                  §2.2
  - Within-subject Spearman rank correlation                  §2.3

Timing metric:
  - Peak MAE in weeks                                         §3

Secondary metrics:
  - Top-k precision                                           §4.1
  - Confusion matrix at fixed threshold                       §4.2

All metrics accept numpy arrays and return plain Python types (floats, dicts,
tuples) so results are JSON-serializable into run manifests.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable, Sequence

import numpy as np
from scipy.stats import spearmanr
from sklearn.metrics import average_precision_score


METRIC_VERSION = "v1.0"  # docs/ml-evaluation/05 §9


# ============================================================================
# PR-AUC
# ============================================================================


@dataclass(frozen=True)
class PRAUCResult:
    """PR-AUC with bootstrap CI, per docs/ml-evaluation/05 §2.1."""

    point_estimate: float
    ci_lower: float
    ci_upper: float
    n_positive: int
    n_negative: int
    positive_class_prevalence: float
    variant: str  # "positive_detection" or "harm_detection"


def pr_auc_with_ci(
    y_true: np.ndarray,
    y_score: np.ndarray,
    variant: str = "positive_detection",
    n_bootstrap: int = 1000,
    ci_level: float = 0.95,
    rng_seed: int = 42,
) -> PRAUCResult:
    """Compute PR-AUC with bootstrap confidence interval.

    Args:
        y_true: binary labels in {0, 1}. For harm detection, caller should
            already have constructed y_true with Y=-1 mapped to 1.
        y_score: continuous predictions (higher = more likely positive class).
            For harm detection, caller should have inverted the engine score.
        variant: "positive_detection" or "harm_detection" (stored as metadata).
        n_bootstrap: resample count for CI.
        ci_level: e.g., 0.95 for 95% CI.
        rng_seed: deterministic seed (docs/ml-evaluation/04 §4.1).

    Returns:
        PRAUCResult with point + CI + prevalence.
    """
    _validate_binary_labels(y_true)
    if len(y_true) != len(y_score):
        raise ValueError(f"Length mismatch: {len(y_true)} vs {len(y_score)}")
    if len(y_true) == 0:
        raise ValueError("Cannot compute PR-AUC on empty arrays")

    y_true = np.asarray(y_true, dtype=int)
    y_score = np.asarray(y_score, dtype=float)

    n_pos = int(y_true.sum())
    n_neg = len(y_true) - n_pos
    if n_pos == 0 or n_neg == 0:
        raise ValueError(
            f"Need both classes: n_pos={n_pos}, n_neg={n_neg}. "
            "Drop this metric or widen the eval cohort."
        )

    point = float(average_precision_score(y_true, y_score))

    rng = np.random.default_rng(rng_seed)
    n = len(y_true)
    boot_scores: list[float] = []
    for _ in range(n_bootstrap):
        idx = rng.integers(0, n, size=n)
        try:
            # Skip resamples where the bootstrap sample happens to lack a class.
            if y_true[idx].sum() == 0 or y_true[idx].sum() == n:
                continue
            boot_scores.append(
                float(average_precision_score(y_true[idx], y_score[idx]))
            )
        except ValueError:
            continue

    alpha = (1.0 - ci_level) / 2.0
    if len(boot_scores) < 100:
        # Not enough valid resamples — return CI = point estimate to signal.
        ci_lower = ci_upper = point
    else:
        ci_lower = float(np.quantile(boot_scores, alpha))
        ci_upper = float(np.quantile(boot_scores, 1.0 - alpha))

    return PRAUCResult(
        point_estimate=point,
        ci_lower=ci_lower,
        ci_upper=ci_upper,
        n_positive=n_pos,
        n_negative=n_neg,
        positive_class_prevalence=n_pos / len(y_true),
        variant=variant,
    )


# ============================================================================
# Calibration
# ============================================================================


@dataclass(frozen=True)
class CalibrationBin:
    bin_index: int
    lower: float
    upper: float
    n: int
    mean_predicted: float
    empirical_rate: float


@dataclass(frozen=True)
class CalibrationResult:
    """Bin-wise reliability + slope/intercept + ECE.

    Per docs/ml-evaluation/05 §2.2.
    """

    bins: tuple[CalibrationBin, ...]
    slope: float
    intercept: float
    ece: float
    n_total: int


def calibration(
    y_true: np.ndarray,
    y_score: np.ndarray,
    n_bins: int = 10,
    score_range: tuple[float, float] = (0.0, 100.0),
) -> CalibrationResult:
    """Binned reliability diagram + calibration fit + ECE.

    Args:
        y_true: {0, 1} labels.
        y_score: predictions on the scale of `score_range`. Defaults to [0, 100]
            (matching engine output per docs/prd/scoring-rubric.md §Final Clamp).
        n_bins: number of equal-width bins.
        score_range: (min, max) of the score domain.

    Returns:
        CalibrationResult with per-bin stats, linear fit, and ECE.
    """
    _validate_binary_labels(y_true)
    y_true = np.asarray(y_true, dtype=int)
    y_score = np.asarray(y_score, dtype=float)

    if len(y_true) != len(y_score):
        raise ValueError(f"Length mismatch: {len(y_true)} vs {len(y_score)}")

    lo, hi = score_range
    edges = np.linspace(lo, hi, n_bins + 1)

    bins_out: list[CalibrationBin] = []
    mean_preds: list[float] = []
    emp_rates: list[float] = []
    bin_weights: list[float] = []
    n_total = len(y_true)

    for i in range(n_bins):
        edge_lo = edges[i]
        edge_hi = edges[i + 1]
        # Include upper edge only in the last bin.
        if i == n_bins - 1:
            mask = (y_score >= edge_lo) & (y_score <= edge_hi)
        else:
            mask = (y_score >= edge_lo) & (y_score < edge_hi)

        n_bin = int(mask.sum())
        if n_bin == 0:
            # Still emit the bin for plotting continuity, but skip from fit.
            bins_out.append(
                CalibrationBin(
                    bin_index=i,
                    lower=float(edge_lo),
                    upper=float(edge_hi),
                    n=0,
                    mean_predicted=float("nan"),
                    empirical_rate=float("nan"),
                )
            )
            continue

        mp = float(y_score[mask].mean() / (hi - lo))  # scale to [0, 1]
        er = float(y_true[mask].mean())
        bins_out.append(
            CalibrationBin(
                bin_index=i,
                lower=float(edge_lo),
                upper=float(edge_hi),
                n=n_bin,
                mean_predicted=mp,
                empirical_rate=er,
            )
        )
        mean_preds.append(mp)
        emp_rates.append(er)
        bin_weights.append(n_bin)

    if len(mean_preds) < 2:
        slope = float("nan")
        intercept = float("nan")
    else:
        x = np.asarray(mean_preds)
        y = np.asarray(emp_rates)
        # Simple OLS with all bins equal-weighted. Weighted fit is a refinement
        # flagged for docs/ml-evaluation/05 open question (not yet raised).
        slope, intercept = np.polyfit(x, y, 1)
        slope = float(slope)
        intercept = float(intercept)

    # Expected Calibration Error (weighted mean |mean_pred - emp_rate|)
    if len(mean_preds) == 0:
        ece = float("nan")
    else:
        ece = float(
            sum(
                (w / n_total) * abs(mp - er)
                for mp, er, w in zip(mean_preds, emp_rates, bin_weights)
            )
        )

    return CalibrationResult(
        bins=tuple(bins_out),
        slope=slope,
        intercept=intercept,
        ece=ece,
        n_total=n_total,
    )


# ============================================================================
# Within-subject Spearman ρ
# ============================================================================


@dataclass(frozen=True)
class SpearmanResult:
    """Aggregated within-subject Spearman ρ per docs/ml-evaluation/05 §2.3."""

    median_rho: float
    q25_rho: float
    q75_rho: float
    n_subjects_included: int
    n_subjects_excluded: int  # fewer than min_rows_per_subject
    min_rows_per_subject: int


def within_subject_spearman(
    subject_ids: Sequence[str],
    y_true: np.ndarray,
    y_score: np.ndarray,
    min_rows_per_subject: int = 3,
) -> SpearmanResult:
    """Compute per-subject Spearman ρ and aggregate via median + IQR.

    Args:
        subject_ids: same length as y_true, y_score. Rows grouped by subject_id.
        y_true: numeric labels (-1, 0, +1). Treated as ordinal for rank corr.
        y_score: engine scores.
        min_rows_per_subject: subjects with fewer rows are excluded from the
            aggregation (their per-subject ρ is too noisy).

    Returns:
        SpearmanResult.
    """
    if not (len(subject_ids) == len(y_true) == len(y_score)):
        raise ValueError("subject_ids, y_true, y_score must be same length")

    by_subject: dict[str, list[tuple[float, float]]] = {}
    for sid, yt, ys in zip(subject_ids, y_true, y_score):
        by_subject.setdefault(str(sid), []).append((float(yt), float(ys)))

    per_subject_rhos: list[float] = []
    n_excluded = 0
    for sid, rows in by_subject.items():
        if len(rows) < min_rows_per_subject:
            n_excluded += 1
            continue
        ys_true = np.asarray([r[0] for r in rows])
        ys_score = np.asarray([r[1] for r in rows])
        if np.all(ys_true == ys_true[0]) or np.all(ys_score == ys_score[0]):
            # Constant — Spearman undefined. Skip but don't count as excluded;
            # subject had enough rows, just no variance.
            continue
        rho, _ = spearmanr(ys_true, ys_score)
        if np.isnan(rho):
            continue
        per_subject_rhos.append(float(rho))

    if len(per_subject_rhos) == 0:
        return SpearmanResult(
            median_rho=float("nan"),
            q25_rho=float("nan"),
            q75_rho=float("nan"),
            n_subjects_included=0,
            n_subjects_excluded=n_excluded,
            min_rows_per_subject=min_rows_per_subject,
        )

    arr = np.asarray(per_subject_rhos)
    return SpearmanResult(
        median_rho=float(np.median(arr)),
        q25_rho=float(np.quantile(arr, 0.25)),
        q75_rho=float(np.quantile(arr, 0.75)),
        n_subjects_included=len(per_subject_rhos),
        n_subjects_excluded=n_excluded,
        min_rows_per_subject=min_rows_per_subject,
    )


# ============================================================================
# Peak MAE (timing goal)
# ============================================================================


@dataclass(frozen=True)
class PeakMAEResult:
    """Peak MAE in weeks per docs/ml-evaluation/05 §3."""

    mean_weeks: float
    median_weeks: float
    n_events: int


def peak_mae_weeks(offsets_days: Iterable[int]) -> PeakMAEResult:
    """Aggregate per-event |peak_window_center − event_date| distances.

    Args:
        offsets_days: for each positive event, |predicted_peak_date − actual_date|
            in days (already computed upstream from engine output).

    Returns:
        PeakMAEResult in weeks.
    """
    offsets = np.asarray(list(offsets_days), dtype=float)
    if len(offsets) == 0:
        return PeakMAEResult(
            mean_weeks=float("nan"), median_weeks=float("nan"), n_events=0
        )
    weeks = np.abs(offsets) / 7.0
    return PeakMAEResult(
        mean_weeks=float(weeks.mean()),
        median_weeks=float(np.median(weeks)),
        n_events=int(len(offsets)),
    )


# ============================================================================
# Top-k precision (secondary, §4.1)
# ============================================================================


def top_k_precision(
    subject_ids: Sequence[str],
    y_true: np.ndarray,
    y_score: np.ndarray,
    k: int = 3,
) -> float:
    """Per-subject top-k precision, averaged across subjects.

    For each subject: rank all their labeled rows by y_score descending. Is at
    least one of the top-k rows labeled positive (Y == 1)? Return the fraction
    of subjects for whom this is true.

    Args:
        subject_ids: same length as y_true, y_score.
        y_true: {0, 1} labels.
        y_score: predictions.
        k: top-k cutoff.

    Returns:
        Fraction of subjects with ≥ 1 positive in their top-k scored rows.
        Subjects with fewer than k total rows are skipped.
    """
    _validate_binary_labels(y_true)
    if not (len(subject_ids) == len(y_true) == len(y_score)):
        raise ValueError("Length mismatch")

    by_subject: dict[str, list[tuple[int, float]]] = {}
    for sid, yt, ys in zip(subject_ids, y_true, y_score):
        by_subject.setdefault(str(sid), []).append((int(yt), float(ys)))

    hits = 0
    n_eligible = 0
    for sid, rows in by_subject.items():
        if len(rows) < k:
            continue
        n_eligible += 1
        rows_sorted = sorted(rows, key=lambda r: -r[1])[:k]
        if any(r[0] == 1 for r in rows_sorted):
            hits += 1

    if n_eligible == 0:
        return float("nan")
    return hits / n_eligible


# ============================================================================
# Internal
# ============================================================================


def _validate_binary_labels(y: np.ndarray) -> None:
    arr = np.asarray(y)
    unique = np.unique(arr)
    for v in unique:
        if v not in (0, 1):
            raise ValueError(
                f"Expected binary labels in {{0, 1}}, got value {v}. "
                "Binarize {-1, 0, +1} upstream per docs/ml-evaluation/05 §2.1."
            )
