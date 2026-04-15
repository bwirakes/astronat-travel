#!/usr/bin/env python3
"""
test_constants.py — Unit tests for engine/constants.py

Verifies that the shared constants module provides correct values and that
the canonical get_sign() and get_house() functions work for boundary cases,
including the wrap-around at 0°/360°.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from engine.constants import ZODIAC_SIGNS, PLANETS, get_sign, get_house


class TestZodiacSigns:
    def test_twelve_signs(self):
        assert len(ZODIAC_SIGNS) == 12

    def test_order(self):
        assert ZODIAC_SIGNS[0] == "Aries"
        assert ZODIAC_SIGNS[11] == "Pisces"

    def test_no_duplicates(self):
        assert len(set(ZODIAC_SIGNS)) == 12


class TestPlanets:
    def test_ten_planets(self):
        assert len(PLANETS) == 10

    def test_contains_luminaries(self):
        assert "Sun" in PLANETS
        assert "Moon" in PLANETS

    def test_contains_outer_planets(self):
        assert "Uranus" in PLANETS
        assert "Neptune" in PLANETS
        assert "Pluto" in PLANETS


class TestGetSign:
    def test_aries_start(self):
        assert get_sign(0.0) == "Aries"

    def test_aries_end(self):
        assert get_sign(29.99) == "Aries"

    def test_taurus_start(self):
        assert get_sign(30.0) == "Taurus"

    def test_pisces_end(self):
        assert get_sign(359.9) == "Pisces"

    def test_midpoint_libra(self):
        assert get_sign(195.0) == "Libra"  # 180 + 15 = 195 = Libra midpoint


class TestGetHouse:
    """Even cusps: house 1 = 0°–30°, house 2 = 30°–60°, ..., house 12 = 330°–360°."""
    EVEN_CUSPS = [i * 30.0 for i in range(12)]

    def test_house_1(self):
        assert get_house(0.0, self.EVEN_CUSPS) == 1

    def test_house_2(self):
        assert get_house(30.0, self.EVEN_CUSPS) == 2

    def test_house_12(self):
        assert get_house(359.0, self.EVEN_CUSPS) == 12

    def test_house_6_midpoint(self):
        assert get_house(165.0, self.EVEN_CUSPS) == 6

    def test_wrap_around(self):
        """House 12 spans 350°–20° (wraps through 0°)."""
        cusps = [20.0, 50.0, 80.0, 110.0, 140.0, 170.0,
                 200.0, 230.0, 260.0, 290.0, 320.0, 350.0]
        # 5° is between 350° and 20° → house 12
        assert get_house(5.0, cusps) == 12
        # 20° is exactly at house 1 cusp
        assert get_house(20.0, cusps) == 1
        # 19.99° still in house 12
        assert get_house(19.99, cusps) == 12

    def test_fallback_does_not_raise(self):
        """Degenerate input should return 1, not raise."""
        cusps = [0.0] * 12
        result = get_house(180.0, cusps)
        assert result == 1
