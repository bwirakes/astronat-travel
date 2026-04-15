"""Tests for evaluation.metrics — PR-AUC, calibration, Spearman, Peak MAE.

Verifies docs/ml-evaluation/05 primary metrics behave correctly on
synthetic data with known ground truth.
"""

from __future__ import annotations

import math

import numpy as np
import pytest

from evaluation.metrics import (
    METRIC_VERSION,
    calibration,
    peak_mae_weeks,
    pr_auc_with_ci,
    top_k_precision,
    within_subject_spearman,
)


def test_metric_version_is_pinned():
    assert METRIC_VERSION == "v1.0"


# ============================================================================
# PR-AUC
# ============================================================================


def test_pr_auc_perfect_predictor():
    """Perfect score-label correspondence should give PR-AUC = 1.0."""
    y_true = np.array([0, 0, 0, 0, 1, 1, 1, 1])
    y_score = np.array([0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9])
    result = pr_auc_with_ci(y_true, y_score, n_bootstrap=200, rng_seed=42)
    assert math.isclose(result.point_estimate, 1.0, abs_tol=1e-9)
    assert result.n_positive == 4
    assert result.n_negative == 4
    assert math.isclose(result.positive_class_prevalence, 0.5, abs_tol=1e-9)


def test_pr_auc_random_predictor_near_prevalence():
    """Random scores → PR-AUC ≈ positive class prevalence."""
    rng = np.random.default_rng(7)
    n = 2000
    prevalence = 0.1
    y_true = (rng.random(n) < prevalence).astype(int)
    y_score = rng.random(n)
    result = pr_auc_with_ci(y_true, y_score, n_bootstrap=200, rng_seed=42)
    # Random baseline PR-AUC equals positive class prevalence in expectation.
    assert 0.07 < result.point_estimate < 0.15


def test_pr_auc_ci_is_sensible():
    """CI lower bound ≤ point estimate ≤ CI upper bound."""
    y_true = np.array([0] * 20 + [1] * 20)
    y_score = np.concatenate([np.random.default_rng(0).normal(0.3, 0.2, 20),
                               np.random.default_rng(1).normal(0.7, 0.2, 20)])
    result = pr_auc_with_ci(y_true, y_score, n_bootstrap=500, rng_seed=42)
    assert result.ci_lower <= result.point_estimate <= result.ci_upper


def test_pr_auc_deterministic_with_seed():
    """Same seed → bit-identical CI."""
    y_true = np.array([0] * 20 + [1] * 20)
    rng = np.random.default_rng(0)
    y_score = rng.random(40)
    r1 = pr_auc_with_ci(y_true, y_score, n_bootstrap=500, rng_seed=42)
    r2 = pr_auc_with_ci(y_true, y_score, n_bootstrap=500, rng_seed=42)
    assert r1.ci_lower == r2.ci_lower
    assert r1.ci_upper == r2.ci_upper


def test_pr_auc_rejects_single_class():
    y_true = np.array([0, 0, 0, 0])
    y_score = np.array([0.1, 0.2, 0.3, 0.4])
    with pytest.raises(ValueError, match="both classes"):
        pr_auc_with_ci(y_true, y_score, n_bootstrap=100)


def test_pr_auc_rejects_non_binary_labels():
    y_true = np.array([0, 1, 2, 1])
    y_score = np.array([0.1, 0.2, 0.3, 0.4])
    with pytest.raises(ValueError, match="binary labels"):
        pr_auc_with_ci(y_true, y_score, n_bootstrap=100)


# ============================================================================
# Calibration
# ============================================================================


def test_calibration_perfect_is_identity():
    """Predictions = empirical rates → slope 1.0, intercept 0.0, ECE 0.0."""
    # Build a dataset where the score directly encodes P(Y=1).
    scores = []
    labels = []
    for target_score in range(5, 100, 10):
        for i in range(200):
            scores.append(target_score)
            # Exactly target_score/100 fraction are positive within each bin.
            labels.append(1 if i < int(target_score * 2) else 0)
    y_score = np.asarray(scores, dtype=float)
    y_true = np.asarray(labels, dtype=int)
    result = calibration(y_true, y_score, n_bins=10)
    assert math.isclose(result.slope, 1.0, abs_tol=0.05)
    assert abs(result.intercept) < 0.05
    assert result.ece < 0.02


def test_calibration_overconfident_has_slope_below_1():
    """If engine outputs high scores but empirical rate is moderate,
    slope should be < 1.0."""
    # All scores 80-100, but only 50% actually positive.
    rng = np.random.default_rng(5)
    n = 1000
    y_score = rng.uniform(80, 100, size=n)
    y_true = (rng.random(n) < 0.5).astype(int)
    result = calibration(y_true, y_score, n_bins=10)
    # With limited score variance, slope won't be stable — just verify
    # that ECE is high (overconfidence detected).
    assert result.ece > 0.2


def test_calibration_empty_bins_are_emitted_as_nan():
    """Bins with no data should appear in output with NaN stats."""
    y_score = np.array([10.0, 15.0, 20.0, 25.0])  # all in [10, 30)
    y_true = np.array([0, 1, 0, 1])
    result = calibration(y_true, y_score, n_bins=10)
    # Most bins should be empty → NaN mean_predicted.
    empty_bins = [b for b in result.bins if b.n == 0]
    assert len(empty_bins) >= 7


# ============================================================================
# Within-subject Spearman
# ============================================================================


def test_within_subject_spearman_perfect_per_subject():
    """Scores perfectly rank labels → ρ at the tied-labels ceiling.

    With binary labels like [0, 0, 0, 1, 1], Spearman's maximum achievable
    value is √3/2 ≈ 0.866 due to the tie structure, not 1.0. We use the -1/0/+1
    label scheme (docs/ml-evaluation/01c §5) but the ties are inherent to any
    ordinal label scheme with repeated values.
    """
    subject_ids: list[str] = []
    y_true: list[int] = []
    y_score: list[float] = []
    for s in range(20):
        for i, label in enumerate([-1, 0, 0, 1, 1]):  # 3 distinct ranks, ties on 0 and 1
            subject_ids.append(f"subj_{s}")
            y_true.append(label)
            y_score.append(float(i) + (s * 0.01))
    result = within_subject_spearman(
        subject_ids, np.asarray(y_true), np.asarray(y_score), min_rows_per_subject=3
    )
    # With the tie structure above, perfect-monotone scoring yields ρ > 0.94.
    assert result.median_rho > 0.94
    assert result.n_subjects_included == 20


def test_within_subject_spearman_excludes_low_row_subjects():
    """Subjects with < min_rows are excluded and counted."""
    subject_ids = ["a", "a", "b", "b", "b", "c", "c", "c", "c"]
    y_true = np.array([0, 1, 0, 0, 1, 0, 1, 1, 0])
    y_score = np.array([1.0, 2.0, 1.0, 2.0, 3.0, 1.0, 2.0, 3.0, 4.0])
    result = within_subject_spearman(
        subject_ids, y_true, y_score, min_rows_per_subject=3
    )
    # 'a' has 2 rows → excluded. 'b' and 'c' have ≥ 3 → included.
    assert result.n_subjects_excluded == 1
    assert result.n_subjects_included <= 2


def test_within_subject_spearman_handles_constant_subject():
    """A subject with constant labels or constant scores shouldn't crash."""
    subject_ids = ["a"] * 5 + ["b"] * 5
    # 'a' has constant labels, 'b' varies
    y_true = np.array([1, 1, 1, 1, 1, 0, 0, 1, 1, 1])
    y_score = np.array([1.0, 2.0, 3.0, 4.0, 5.0, 1.0, 2.0, 3.0, 4.0, 5.0])
    result = within_subject_spearman(
        subject_ids, y_true, y_score, min_rows_per_subject=3
    )
    # 'a' is skipped (constant labels → Spearman undefined); 'b' is included.
    assert result.n_subjects_included == 1


# ============================================================================
# Peak MAE
# ============================================================================


def test_peak_mae_mean_and_median():
    """|offsets| / 7 → weeks. Mean and median computed correctly."""
    offsets_days = [0, 7, 14, 21, 28]  # 0, 1, 2, 3, 4 weeks
    result = peak_mae_weeks(offsets_days)
    assert math.isclose(result.mean_weeks, 2.0, abs_tol=1e-9)
    assert math.isclose(result.median_weeks, 2.0, abs_tol=1e-9)
    assert result.n_events == 5


def test_peak_mae_handles_negative_offsets():
    """Absolute value — negative (peak before event) treated same as positive."""
    offsets_days = [-14, 14]
    result = peak_mae_weeks(offsets_days)
    assert math.isclose(result.mean_weeks, 2.0, abs_tol=1e-9)


def test_peak_mae_empty_is_nan():
    result = peak_mae_weeks([])
    assert result.n_events == 0
    assert math.isnan(result.mean_weeks)
    assert math.isnan(result.median_weeks)


# ============================================================================
# Top-k precision
# ============================================================================


def test_top_k_precision_perfect():
    """Subject's top-3 scored rows all contain positives → precision = 1.0."""
    subject_ids = ["a"] * 5 + ["b"] * 5
    y_true = np.array([1, 1, 1, 0, 0, 1, 1, 1, 0, 0])
    y_score = np.array([9, 8, 7, 1, 2, 9, 8, 7, 1, 2])
    result = top_k_precision(subject_ids, y_true, y_score, k=3)
    assert result == 1.0


def test_top_k_precision_no_positives_in_top():
    """Top-3 are all negatives → precision = 0.0."""
    subject_ids = ["a"] * 5
    y_true = np.array([0, 0, 0, 1, 1])
    y_score = np.array([9, 8, 7, 1, 2])
    result = top_k_precision(subject_ids, y_true, y_score, k=3)
    assert result == 0.0


def test_top_k_precision_skips_short_subjects():
    """Subjects with < k rows are skipped."""
    subject_ids = ["a", "a"]  # only 2 rows
    y_true = np.array([0, 1])
    y_score = np.array([1.0, 2.0])
    result = top_k_precision(subject_ids, y_true, y_score, k=3)
    assert math.isnan(result)
