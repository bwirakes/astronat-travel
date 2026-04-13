"""Per-goal re-aggregation of per-house engine scores.

Implements the weighted-linear formulas from docs/ml-evaluation/01c §4.

Input: a dict of house scores {H1..H12} each in [0, 100].
Output: a dict of goal scores each in [0, 100].

The `timing` goal is not computed here — it has a different output surface
(12-month window scores) handled separately per docs/ml-evaluation/01c §3.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping


# ---- Canonical goal → house weight tables (docs/ml-evaluation/01c §4) ----
# These are the v1 per-goal aggregation weights. Version bump required on change.
# See docs/ml-evaluation/01c §8 open question 1 and 05 §9.

AGGREGATION_VERSION = "v1.0"

GOAL_WEIGHTS: dict[str, dict[int, float]] = {
    # docs/ml-evaluation/01c §4.1
    "love": {7: 0.50, 5: 0.30, 8: 0.15, 4: 0.05},
    # docs/ml-evaluation/01c §4.2
    "career": {10: 0.55, 6: 0.20, 2: 0.15, 11: 0.10},
    # docs/ml-evaluation/01c §4.3
    "community": {11: 0.55, 3: 0.25, 7: 0.20},
    # docs/ml-evaluation/01c §4.4
    "growth": {9: 0.45, 12: 0.35, 3: 0.20},
    # docs/ml-evaluation/01c §4.5
    "relocation": {4: 0.60, 2: 0.15, 6: 0.15, 1: 0.10},
}

LOCATION_GOALS: tuple[str, ...] = tuple(GOAL_WEIGHTS.keys())


def _assert_weights_sum_to_one() -> None:
    for goal, weights in GOAL_WEIGHTS.items():
        total = sum(weights.values())
        if abs(total - 1.0) > 1e-9:
            raise ValueError(
                f"Goal {goal!r} weights sum to {total}, not 1.0. "
                "Fix docs/ml-evaluation/01c §4 and GOAL_WEIGHTS."
            )


_assert_weights_sum_to_one()


@dataclass(frozen=True)
class GoalScores:
    """Per-goal scores for one EvalRow. Each field in [0, 100]."""

    love: float
    career: float
    community: float
    growth: float
    relocation: float

    def as_dict(self) -> dict[str, float]:
        return {
            "love": self.love,
            "career": self.career,
            "community": self.community,
            "growth": self.growth,
            "relocation": self.relocation,
        }


def aggregate_houses_to_goals(houses: Mapping[int, float]) -> GoalScores:
    """Re-aggregate per-house scores into per-goal scores.

    Args:
        houses: mapping from house number (1..12) to score in [0, 100].

    Returns:
        GoalScores with all five location-scoreable goals.

    Raises:
        KeyError: if any house referenced in GOAL_WEIGHTS is absent from `houses`.
        ValueError: if any house score is outside [0, 100].
    """
    for h, score in houses.items():
        if not (0.0 <= score <= 100.0):
            raise ValueError(
                f"House {h} score {score} outside [0, 100]. Upstream engine bug?"
            )

    def _compute(goal: str) -> float:
        weights = GOAL_WEIGHTS[goal]
        return sum(weights[h] * houses[h] for h in weights)

    return GoalScores(
        love=_compute("love"),
        career=_compute("career"),
        community=_compute("community"),
        growth=_compute("growth"),
        relocation=_compute("relocation"),
    )
