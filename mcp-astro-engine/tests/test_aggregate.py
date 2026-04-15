"""Tests for evaluation.aggregate — per-goal house score re-aggregation.

Verifies docs/ml-evaluation/01c §4 formulas are implemented correctly
and that weights sum to 1.0 per goal.
"""

from __future__ import annotations

import math

import pytest

from evaluation.aggregate import (
    AGGREGATION_VERSION,
    GOAL_WEIGHTS,
    LOCATION_GOALS,
    aggregate_houses_to_goals,
)


def test_aggregation_version_is_pinned():
    assert AGGREGATION_VERSION == "v1.0"


def test_goal_weights_sum_to_one():
    """Per docs/ml-evaluation/01c §4 — every goal's weights must sum to 1.0."""
    for goal, weights in GOAL_WEIGHTS.items():
        total = sum(weights.values())
        assert math.isclose(total, 1.0, abs_tol=1e-9), (
            f"Goal {goal!r}: weights sum to {total}, not 1.0"
        )


def test_location_goals_excludes_timing():
    """Timing is not location-scoreable per docs/ml-evaluation/01c §3."""
    assert "timing" not in LOCATION_GOALS
    assert set(LOCATION_GOALS) == {"love", "career", "community", "growth", "relocation"}


def test_all_max_houses_produces_100():
    """Every house at 100 → every goal at 100."""
    houses = {i: 100.0 for i in range(1, 13)}
    goals = aggregate_houses_to_goals(houses)
    for name, score in goals.as_dict().items():
        assert math.isclose(score, 100.0, abs_tol=1e-9), f"{name} = {score}"


def test_all_zero_houses_produces_zero():
    houses = {i: 0.0 for i in range(1, 13)}
    goals = aggregate_houses_to_goals(houses)
    for name, score in goals.as_dict().items():
        assert score == 0.0, f"{name} = {score}"


def test_love_formula_matches_spec():
    """docs/ml-evaluation/01c §4.1: love = 0.50*H7 + 0.30*H5 + 0.15*H8 + 0.05*H4"""
    houses = {i: 0.0 for i in range(1, 13)}
    houses[7] = 100.0
    houses[5] = 80.0
    houses[8] = 60.0
    houses[4] = 40.0
    expected = 0.50 * 100 + 0.30 * 80 + 0.15 * 60 + 0.05 * 40
    result = aggregate_houses_to_goals(houses)
    assert math.isclose(result.love, expected, abs_tol=1e-9)


def test_career_formula_matches_spec():
    """docs/ml-evaluation/01c §4.2: career = 0.55*H10 + 0.20*H6 + 0.15*H2 + 0.10*H11"""
    houses = {i: 0.0 for i in range(1, 13)}
    houses[10] = 90.0
    houses[6] = 50.0
    houses[2] = 30.0
    houses[11] = 70.0
    expected = 0.55 * 90 + 0.20 * 50 + 0.15 * 30 + 0.10 * 70
    result = aggregate_houses_to_goals(houses)
    assert math.isclose(result.career, expected, abs_tol=1e-9)


def test_relocation_formula_matches_spec():
    """docs/ml-evaluation/01c §4.5: relocation = 0.60*H4 + 0.15*H2 + 0.15*H6 + 0.10*H1"""
    houses = {i: 0.0 for i in range(1, 13)}
    houses[4] = 70.0
    houses[2] = 40.0
    houses[6] = 60.0
    houses[1] = 50.0
    expected = 0.60 * 70 + 0.15 * 40 + 0.15 * 60 + 0.10 * 50
    result = aggregate_houses_to_goals(houses)
    assert math.isclose(result.relocation, expected, abs_tol=1e-9)


def test_rejects_house_score_out_of_range():
    houses = {i: 50.0 for i in range(1, 13)}
    houses[10] = 150.0
    with pytest.raises(ValueError, match="outside"):
        aggregate_houses_to_goals(houses)


def test_rejects_missing_houses():
    houses = {i: 50.0 for i in range(1, 12)}  # missing H12
    with pytest.raises(KeyError):
        aggregate_houses_to_goals(houses)


def test_goal_scores_are_immutable():
    """GoalScores is a frozen dataclass — attribute assignment should fail."""
    houses = {i: 50.0 for i in range(1, 13)}
    goals = aggregate_houses_to_goals(houses)
    with pytest.raises((AttributeError, TypeError)):
        goals.love = 999.0  # type: ignore
