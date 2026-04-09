#!/usr/bin/env python3
"""
test_aspects.py — Unit tests for the Aspect Geometry Engine
"""
import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from engine.aspects import angular_distance, calculate_aspect, find_all_aspects


class TestAngularDistance:
    """Test the shortest-arc distance calculation."""

    def test_same_point(self):
        assert angular_distance(100.0, 100.0) == 0.0

    def test_opposite_points(self):
        assert angular_distance(0.0, 180.0) == 180.0

    def test_short_arc_forward(self):
        assert angular_distance(10.0, 50.0) == 40.0

    def test_short_arc_backward(self):
        assert angular_distance(350.0, 10.0) == 20.0

    def test_wrap_around_360(self):
        """359° and 1° should be 2° apart, not 358°."""
        assert angular_distance(359.0, 1.0) == 2.0

    def test_symmetry(self):
        """Distance should be symmetric."""
        assert angular_distance(30.0, 150.0) == angular_distance(150.0, 30.0)


class TestCalculateAspect:
    """Test aspect detection with orbs."""

    def test_exact_conjunction(self):
        result = calculate_aspect(100.0, 100.0)
        assert result is not None
        assert result["aspect"] == "Conjunction"
        assert result["orb"] == 0.0
        assert result["is_exact"] is True

    def test_conjunction_within_orb(self):
        result = calculate_aspect(100.0, 104.0)
        assert result is not None
        assert result["aspect"] == "Conjunction"
        assert result["orb"] == 4.0

    def test_conjunction_outside_default_orb(self):
        """7° apart — outside default 6° orb for non-luminaries."""
        result = calculate_aspect(100.0, 107.0, transit_planet="Mars", natal_planet="Venus")
        assert result is None

    def test_conjunction_luminary_wide_orb(self):
        """7° apart — within 8° luminary orb for Sun."""
        result = calculate_aspect(100.0, 107.0, transit_planet="Sun", natal_planet="Venus")
        assert result is not None
        assert result["aspect"] == "Conjunction"

    def test_exact_trine(self):
        result = calculate_aspect(0.0, 120.0)
        assert result is not None
        assert result["aspect"] == "Trine"
        assert result["orb"] == 0.0

    def test_trine_within_orb(self):
        result = calculate_aspect(0.0, 123.0)
        assert result is not None
        assert result["aspect"] == "Trine"
        assert result["orb"] == 3.0

    def test_exact_square(self):
        result = calculate_aspect(0.0, 90.0)
        assert result is not None
        assert result["aspect"] == "Square"

    def test_exact_opposition(self):
        result = calculate_aspect(0.0, 180.0)
        assert result is not None
        assert result["aspect"] == "Opposition"

    def test_exact_sextile(self):
        result = calculate_aspect(0.0, 60.0)
        assert result is not None
        assert result["aspect"] == "Sextile"

    def test_wrap_around_conjunction(self):
        """359° and 1° = 2° apart = conjunction."""
        result = calculate_aspect(359.0, 1.0)
        assert result is not None
        assert result["aspect"] == "Conjunction"
        assert result["orb"] == 2.0

    def test_wrap_around_opposition(self):
        """10° and 190° = 180° apart = opposition."""
        result = calculate_aspect(10.0, 190.0)
        assert result is not None
        assert result["aspect"] == "Opposition"

    def test_no_aspect(self):
        """45° apart — not a major aspect."""
        result = calculate_aspect(0.0, 45.0)
        assert result is None

    def test_orb_boundary_exact(self):
        """Exactly at max orb should still count."""
        # Default conjunction orb = 6.0°
        result = calculate_aspect(100.0, 106.0, transit_planet="Mars", natal_planet="Venus")
        assert result is not None
        assert result["aspect"] == "Conjunction"

    def test_orb_boundary_just_outside(self):
        """Just outside max orb should not count."""
        result = calculate_aspect(100.0, 106.01, transit_planet="Mars", natal_planet="Venus")
        assert result is None

    def test_closest_aspect_wins(self):
        """When near two aspect angles, the closer one should win."""
        # 58° apart — closer to 60° (Sextile) than to 0° or 90°
        result = calculate_aspect(0.0, 58.0)
        assert result is not None
        assert result["aspect"] == "Sextile"


class TestFindAllAspects:
    """Test batch aspect computation."""

    def test_find_aspects_basic(self):
        transits = [{"name": "Jupiter", "longitude": 120.0}]
        natals = [{"name": "Sun", "longitude": 120.0}]
        results = find_all_aspects(transits, natals)
        assert len(results) == 1
        assert results[0]["aspect"] == "Conjunction"
        assert results[0]["transit_planet"] == "Jupiter"
        assert results[0]["natal_planet"] == "Sun"

    def test_find_aspects_multiple(self):
        transits = [
            {"name": "Jupiter", "longitude": 120.0},
            {"name": "Saturn", "longitude": 210.0},
        ]
        natals = [
            {"name": "Sun", "longitude": 120.0},  # Conj with Jupiter
            {"name": "Moon", "longitude": 30.0},   # Square with Jupiter (120-30=90)
        ]
        results = find_all_aspects(transits, natals)
        # Jupiter conjunct Sun (0° orb), Jupiter square Moon (0° orb),
        # Saturn square Sun (210-120=90°), Saturn opposition Moon (210-30=180°)
        assert len(results) >= 3

    def test_sorted_by_orb(self):
        transits = [
            {"name": "Mars", "longitude": 100.0},
        ]
        natals = [
            {"name": "Sun", "longitude": 103.0},   # Conjunction, 3° orb
            {"name": "Moon", "longitude": 100.5},   # Conjunction, 0.5° orb
        ]
        results = find_all_aspects(transits, natals)
        # Tighter orb should come first
        assert results[0]["natal_planet"] == "Moon"
        assert results[0]["orb"] < results[1]["orb"]
