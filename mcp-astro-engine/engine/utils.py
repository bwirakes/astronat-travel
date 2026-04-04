#!/usr/bin/env python3
"""
utils.py — Shared utilities for the MCP Astro Engine.

Import from here. Do not re-implement these in other modules.
  - birth_data_to_utc_dt(): canonical UTC conversion used by server.py and natal_chart_utils.py
  - birth_data_to_utc_jd(): Julian Day conversion for direct swisseph calls
"""
import swisseph as swe
from datetime import date, timedelta


def birth_data_to_utc_dt(birth: dict) -> str:
    """
    Convert a birth_data dict (local time + timezone_offset) to a UTC datetime string.
    Returns format: "YYYY-MM-DD HH:MM".

    This is the CANONICAL implementation. Both server.py and natal_chart_utils.py
    import this function. Never re-implement this logic elsewhere.

    Args:
        birth: Dict with keys: year, month, day, hour, minute, timezone_offset.
               timezone_offset is hours east of UTC (e.g. 7.0 for WIB, -5.0 for EST).

    Returns:
        UTC datetime string in "YYYY-MM-DD HH:MM" format.
    """
    local_h = birth["hour"] + birth["minute"] / 60.0
    utc_frac = local_h - birth.get("timezone_offset", 0.0)

    day_off = 0
    if utc_frac >= 24:
        day_off = int(utc_frac // 24)
        utc_frac -= day_off * 24
    elif utc_frac < 0:
        day_off = -int((-utc_frac) // 24 + 1)
        utc_frac += abs(day_off) * 24

    utc_h = int(utc_frac)
    utc_m = int(round((utc_frac - utc_h) * 60))
    if utc_m == 60:
        utc_h += 1
        utc_m = 0

    actual = date(birth["year"], birth["month"], birth["day"]) + timedelta(days=day_off)
    return f"{actual.year:04d}-{actual.month:02d}-{actual.day:02d} {utc_h:02d}:{utc_m:02d}"


def birth_data_to_utc_jd(birth: dict) -> float:
    """
    Convert a birth_data dict to Julian Day number (UTC).
    Convenience wrapper for swisseph.julday() — avoids repeating the offset math.
    """
    local_h = birth["hour"] + birth["minute"] / 60.0
    utc_h = local_h - birth.get("timezone_offset", 0.0)
    return swe.julday(birth["year"], birth["month"], birth["day"], utc_h)
