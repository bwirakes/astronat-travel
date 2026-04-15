#!/usr/bin/env python3
"""
aspects.py — Astrological Geometry Engine

Calculates geometric relationships (aspects) between two ecliptic longitudes
using the shortest-arc formula on a 360° wheel. Supports configurable orbs
per aspect type and planet pairing.
"""
from __future__ import annotations


# ──────────────────────────────────────────────────────────────────────────────
# Aspect Definitions
# ──────────────────────────────────────────────────────────────────────────────

ASPECTS = {
    0:   "Conjunction",
    60:  "Sextile",
    90:  "Square",
    120: "Trine",
    180: "Opposition",
}

# Default orb matrix: (aspect_angle) → default_orb_degrees
DEFAULT_ORBS = {
    0:   6.0,
    60:  4.0,
    90:  5.0,
    120: 5.0,
    180: 6.0,
}

# Luminaries (Sun, Moon) get wider orbs
LUMINARY_ORBS = {
    0:   8.0,
    60:  5.0,
    90:  7.0,
    120: 7.0,
    180: 8.0,
}

LUMINARIES = {"Sun", "Moon"}


# ──────────────────────────────────────────────────────────────────────────────
# Core Calculation
# ──────────────────────────────────────────────────────────────────────────────

def angular_distance(lon_a: float, lon_b: float) -> float:
    """
    Compute the shortest angular distance on a 360° circle.

    Returns a value in [0, 180].
    """
    diff = abs(lon_a - lon_b) % 360.0
    return min(diff, 360.0 - diff)


def calculate_aspect(
    transit_lon: float,
    natal_lon: float,
    transit_planet: str = "",
    natal_planet: str = "",
    orb_overrides: dict[int, float] | None = None,
) -> dict | None:
    """
    Determine the aspect (if any) between a transiting body and a natal body.

    Args:
        transit_lon: Ecliptic longitude of the transiting planet (0–360).
        natal_lon: Ecliptic longitude of the natal planet (0–360).
        transit_planet: Name of the transiting planet (for orb selection).
        natal_planet: Name of the natal planet (for orb selection).
        orb_overrides: Optional per-aspect overrides {angle: orb_degrees}.

    Returns:
        dict with aspect info, or None if no aspect is within orb.
        Example: {"aspect": "Trine", "angle": 120, "orb": 2.34, "is_exact": False}
    """
    distance = angular_distance(transit_lon, natal_lon)

    # Select orb table: widen for luminaries
    is_luminary = transit_planet in LUMINARIES or natal_planet in LUMINARIES
    orb_table = LUMINARY_ORBS if is_luminary else DEFAULT_ORBS

    if orb_overrides:
        orb_table = {**orb_table, **orb_overrides}

    best_match = None
    best_orb = float("inf")

    for exact_angle, aspect_name in ASPECTS.items():
        max_orb = orb_table.get(exact_angle, DEFAULT_ORBS[exact_angle])
        orb = abs(distance - exact_angle)

        if orb <= max_orb and orb < best_orb:
            best_orb = orb
            best_match = {
                "aspect": aspect_name,
                "angle": exact_angle,
                "orb": round(orb, 4),
                "is_exact": orb < 0.5,  # Within 0.5° = "exact" aspect
            }

    return best_match


def find_all_aspects(
    transit_positions: list[dict],
    natal_positions: list[dict],
) -> list[dict]:
    """
    Compute all aspects between a set of transiting bodies and natal bodies.

    Args:
        transit_positions: List of {"name": str, "longitude": float, ...}
        natal_positions:   List of {"name": str, "longitude": float, ...}

    Returns:
        List of aspect hits, sorted by orb tightness.
    """
    hits = []

    for t in transit_positions:
        for n in natal_positions:
            # Skip same-body aspects (e.g., transit Sun to natal Sun is always conjunction)
            # We still include it since transit Sun conjunct natal Sun IS meaningful (solar return)
            result = calculate_aspect(
                t["longitude"],
                n["longitude"],
                transit_planet=t["name"],
                natal_planet=n["name"],
            )
            if result:
                hits.append({
                    "transit_planet": t["name"],
                    "natal_planet": n["name"],
                    **result,
                })

    # Sort by tightness of orb (most exact first)
    hits.sort(key=lambda x: x["orb"])
    return hits
