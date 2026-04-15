"""Alternative weight configurations for the per-goal re-aggregation.

Implements a sensitivity analysis over the per-goal house weights from
docs/ml-evaluation/01c §4. The `default` scenario is the v1.0 weighting
that's codified in evaluation.aggregate; the other scenarios are principled
alternatives drawn from different astrological traditions or product
framings.

Why run these: the v1.0 weights in 01c §4 were hand-derived from the PRD.
We don't yet know if they're optimal even relative to each other. Running
a small set of alternatives alongside the default exposes how much the
final PR-AUC depends on the weight choice (sensitivity) vs. the engine
itself (signal).

Every scenario's weights sum to 1.0 per goal — preserved invariant.
"""

from __future__ import annotations

from typing import Mapping


SCENARIO_VERSION = "v1.0"

GOALS = ("love", "career", "community", "growth", "relocation")


# ---------------------------------------------------------------------------
# Scenario 1: default (01c §4 v1.0) — same as evaluation.aggregate.GOAL_WEIGHTS
# ---------------------------------------------------------------------------
DEFAULT_WEIGHTS: dict[str, dict[int, float]] = {
    "love":       {7: 0.50, 5: 0.30, 8: 0.15, 4: 0.05},
    "career":     {10: 0.55, 6: 0.20, 2: 0.15, 11: 0.10},
    "community":  {11: 0.55, 3: 0.25, 7: 0.20},
    "growth":     {9: 0.45, 12: 0.35, 3: 0.20},
    "relocation": {4: 0.60, 2: 0.15, 6: 0.15, 1: 0.10},
}

# ---------------------------------------------------------------------------
# Scenario 2: hellenistic-strict — purist single-house classical reading
# ---------------------------------------------------------------------------
# Traditional astrology maps each life area to exactly one house. This is
# the simplest-possible per-goal score and serves as the most opinionated
# baseline. If the default's multi-house blending adds value, it should
# beat this; if not, the blend is noise.
HELLENISTIC_STRICT: dict[str, dict[int, float]] = {
    "love":       {7: 1.00},
    "career":     {10: 1.00},
    "community":  {11: 1.00},
    "growth":     {9: 1.00},
    "relocation": {4: 1.00},
}

# ---------------------------------------------------------------------------
# Scenario 3: material-heavy — finance-tilted pragmatic reading
# ---------------------------------------------------------------------------
# Shifts weight toward the 2nd (earned income) and 8th (invested/inherited)
# houses for career and love. Reflects a pragmatic "does this location
# support my material life?" framing that some relocation clients actually
# care about.
MATERIAL_HEAVY: dict[str, dict[int, float]] = {
    "love":       {7: 0.40, 8: 0.30, 5: 0.20, 2: 0.10},
    "career":     {10: 0.35, 2: 0.35, 6: 0.20, 8: 0.10},
    "community":  {11: 0.50, 3: 0.25, 2: 0.15, 7: 0.10},
    "growth":     {9: 0.40, 12: 0.30, 2: 0.15, 3: 0.15},
    "relocation": {4: 0.45, 2: 0.30, 6: 0.15, 1: 0.10},
}

# ---------------------------------------------------------------------------
# Scenario 4: network-weighted — modern social / career-mobility framing
# ---------------------------------------------------------------------------
# Recognizes that in the 21st century, career and growth outcomes are
# heavily mediated by networks (H11). Gives H11 substantially more weight
# across career, community, and growth goals.
NETWORK_WEIGHTED: dict[str, dict[int, float]] = {
    "love":       {7: 0.45, 5: 0.25, 11: 0.20, 8: 0.10},
    "career":     {10: 0.40, 11: 0.30, 6: 0.15, 2: 0.15},
    "community":  {11: 0.70, 3: 0.15, 7: 0.15},
    "growth":     {9: 0.35, 12: 0.25, 11: 0.25, 3: 0.15},
    "relocation": {4: 0.50, 11: 0.20, 6: 0.15, 2: 0.15},
}

# ---------------------------------------------------------------------------
# Scenario 5: angular-only — angular houses (1/4/7/10) dominate
# ---------------------------------------------------------------------------
# Per docs/prd/scoring-rubric.md §Step 1, angular houses start with the
# highest baseline. This scenario respects that by pushing weight toward
# angular houses wherever the goal-house mapping allows it.
ANGULAR_ONLY: dict[str, dict[int, float]] = {
    "love":       {7: 0.80, 4: 0.20},
    "career":     {10: 0.70, 1: 0.30},
    "community":  {7: 0.50, 1: 0.50},       # community has no angular-house
    "growth":     {4: 0.50, 1: 0.50},       # ditto growth — placeholder
    "relocation": {4: 0.65, 1: 0.35},
}


SCENARIOS: dict[str, dict[str, dict[int, float]]] = {
    "default": DEFAULT_WEIGHTS,
    "hellenistic_strict": HELLENISTIC_STRICT,
    "material_heavy": MATERIAL_HEAVY,
    "network_weighted": NETWORK_WEIGHTED,
    "angular_only": ANGULAR_ONLY,
}


def _assert_weights_valid() -> None:
    """Every scenario × goal: weights sum to 1.0, reference houses 1..12."""
    for name, scenario in SCENARIOS.items():
        for goal, weights in scenario.items():
            total = sum(weights.values())
            if abs(total - 1.0) > 1e-9:
                raise ValueError(
                    f"Scenario {name!r} goal {goal!r} weights sum to "
                    f"{total}, not 1.0"
                )
            for h in weights:
                if h < 1 or h > 12:
                    raise ValueError(
                        f"Scenario {name!r} goal {goal!r} references "
                        f"invalid house {h}"
                    )


_assert_weights_valid()


def scenario_names() -> tuple[str, ...]:
    return tuple(SCENARIOS.keys())


def score_goal(
    houses: Mapping[int, float], goal: str, scenario: str,
) -> float:
    """Apply one scenario's weights for one goal. Input house scores [0,100]."""
    weights = SCENARIOS[scenario][goal]
    return sum(w * float(houses[h]) for h, w in weights.items())


def compute_all_scenarios(
    houses: Mapping[int, float],
) -> dict[str, dict[str, float]]:
    """Return {scenario_name: {goal: score}} for every scenario × goal.

    Each score is on the same [0, 100] scale as the per-house inputs.
    """
    out: dict[str, dict[str, float]] = {}
    for name in SCENARIOS:
        out[name] = {g: score_goal(houses, g, name) for g in GOALS}
    return out
