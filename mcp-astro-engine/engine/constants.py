#!/usr/bin/env python3
"""
constants.py — Shared astrological constants for the MCP Astro Engine.

Import from here. Never re-declare these values in other modules:
  - ZODIAC_SIGNS: the 12-sign list (duplicated in 3 places previously)
  - PLANETS: planet-name → swisseph ID mapping
  - get_sign(): longitude → sign name
  - get_house(): longitude + cusps → house number (1–12)
"""
import swisseph as swe

ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

PLANETS = {
    "Sun":     swe.SUN,
    "Moon":    swe.MOON,
    "Mercury": swe.MERCURY,
    "Venus":   swe.VENUS,
    "Mars":    swe.MARS,
    "Jupiter": swe.JUPITER,
    "Saturn":  swe.SATURN,
    "Uranus":  swe.URANUS,
    "Neptune": swe.NEPTUNE,
    "Pluto":   swe.PLUTO,
}


def get_sign(longitude: float) -> str:
    """Convert ecliptic longitude (0–360) to zodiac sign name."""
    return ZODIAC_SIGNS[int(longitude // 30)]


def get_house(longitude: float, cusps: list) -> int:
    """
    Determine which house (1–12) a longitude falls into given 12 house cusps.
    Handles wrap-around at 0°/360° (e.g. house 12 spanning 350°–20°).

    This is the CANONICAL house-finding function. Always import this;
    never re-implement in another module.

    Args:
        longitude: Ecliptic longitude to resolve (0.0–360.0).
        cusps: List of 12 house cusp longitudes in order (house 1 first).

    Returns:
        House number 1–12.
    """
    for i in range(12):
        start = cusps[i]
        end = cusps[(i + 1) % 12]
        if start < end:
            if start <= longitude < end:
                return i + 1
        else:
            # Wrap-around case: e.g. start=350, end=20
            if longitude >= start or longitude < end:
                return i + 1
    return 1  # Fallback (shouldn't be reached with valid input)
