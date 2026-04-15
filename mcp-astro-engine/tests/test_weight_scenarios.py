"""Tests for evaluation.weight_scenarios."""

from __future__ import annotations

import math
import pytest

from evaluation.weight_scenarios import (
    SCENARIOS,
    compute_all_scenarios,
    score_goal,
    scenario_names,
)


def test_every_scenario_weights_sum_to_one():
    for scenario, goals in SCENARIOS.items():
        for goal, weights in goals.items():
            total = sum(weights.values())
            assert math.isclose(total, 1.0, abs_tol=1e-9), (
                f"{scenario} / {goal}: sum = {total}"
            )


def test_all_scenarios_cover_all_five_goals():
    expected = {"love", "career", "community", "growth", "relocation"}
    for scenario, goals in SCENARIOS.items():
        assert set(goals.keys()) == expected, f"{scenario} missing goals"


def test_hellenistic_strict_maps_to_single_house():
    """Traditional reading: each goal = one house."""
    hs = SCENARIOS["hellenistic_strict"]
    assert hs["love"] == {7: 1.0}
    assert hs["career"] == {10: 1.0}
    assert hs["relocation"] == {4: 1.0}


def test_score_goal_respects_weights():
    houses = {i: 0.0 for i in range(1, 13)}
    houses[10] = 100.0
    assert score_goal(houses, "career", "hellenistic_strict") == 100.0


def test_compute_all_scenarios_shape():
    houses = {i: 50.0 for i in range(1, 13)}
    result = compute_all_scenarios(houses)
    assert set(result.keys()) == set(scenario_names())
    for scenario_name, goals in result.items():
        assert set(goals.keys()) == {"love", "career", "community",
                                     "growth", "relocation"}
        for goal, score in goals.items():
            # With uniform house scores, every goal should sum to the same.
            assert math.isclose(score, 50.0, abs_tol=1e-9), (
                f"{scenario_name} / {goal}: {score}"
            )


def test_material_heavy_shifts_career_toward_h2():
    """Check the intended tilt — career weight on H2 should be higher."""
    default_h2 = SCENARIOS["default"]["career"].get(2, 0)
    material_h2 = SCENARIOS["material_heavy"]["career"].get(2, 0)
    assert material_h2 > default_h2, (
        f"material_heavy should weight H2 more than default "
        f"(default={default_h2}, material={material_h2})"
    )


def test_network_weighted_boosts_h11():
    """H11 weight should be higher in network_weighted for career/community."""
    default_h11_career = SCENARIOS["default"]["career"].get(11, 0)
    network_h11_career = SCENARIOS["network_weighted"]["career"].get(11, 0)
    assert network_h11_career > default_h11_career
