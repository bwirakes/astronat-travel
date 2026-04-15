#!/usr/bin/env python3
"""
transits.py — Transit Solver

Queries the pre-computed SQLite ephemeris to find aspects between transiting
planets and a user's natal chart, and to compute daily cosmic weather.
"""
from __future__ import annotations

import json
import sqlite3
from datetime import date, datetime, timedelta, timezone

import swisseph as swe

from .aspects import calculate_aspect, find_all_aspects
from .constants import ZODIAC_SIGNS, PLANETS, get_house as _get_house


# ──────────────────────────────────────────────────────────────────────────────
# Database helpers
# ──────────────────────────────────────────────────────────────────────────────

def get_user_profile(conn: sqlite3.Connection, user_id: str) -> dict | None:
    """Load a user's cached natal chart from the database."""
    cursor = conn.cursor()
    cursor.execute(
        "SELECT display_name, birth_data_json, natal_planets, house_cusps FROM user_profiles_cache WHERE user_id = ?",
        (user_id,),
    )
    row = cursor.fetchone()
    if not row:
        return None

    return {
        "display_name": row[0],
        "birth_data": json.loads(row[1]),
        "natal_planets": json.loads(row[2]),
        "house_cusps": json.loads(row[3]),
    }


def get_birth_data_for_user(conn: sqlite3.Connection, user_id: str) -> dict | None:
    """
    Lightweight profile load — only birth_data + display_name.
    Used by the chart generation MCP tools (get_natal_chart, get_transit_chart).
    Does not load natal_planets or house_cusps JSON blobs.
    """
    row = conn.execute(
        "SELECT birth_data_json, display_name FROM user_profiles_cache WHERE user_id = ?",
        (user_id.strip().lower(),),
    ).fetchone()
    if row is None:
        return None
    return {
        "birth_data": json.loads(row[0]),
        "display_name": row[1],
    }


def get_daily_positions(conn: sqlite3.Connection, date_str: str) -> list[dict]:
    """Get all planetary positions for a specific date from the cache."""
    cursor = conn.cursor()
    cursor.execute(
        "SELECT planet_name, longitude, speed, is_retrograde, zodiac_sign, zodiac_degree FROM ephemeris_daily WHERE date_ut = ?",
        (date_str,),
    )
    return [
        {
            "name": row[0],
            "longitude": row[1],
            "speed": row[2],
            "is_retrograde": bool(row[3]),
            "sign": row[4],
            "degree_in_sign": row[5],
        }
        for row in cursor.fetchall()
    ]


def get_positions_range(conn: sqlite3.Connection, start_date: str, end_date: str, planet_name: str | None = None) -> list[dict]:
    """Get daily positions over a date range, optionally filtered by planet."""
    cursor = conn.cursor()
    if planet_name:
        cursor.execute(
            "SELECT date_ut, planet_name, longitude, speed, is_retrograde, zodiac_sign, zodiac_degree FROM ephemeris_daily WHERE date_ut >= ? AND date_ut <= ? AND planet_name = ? ORDER BY date_ut ASC",
            (start_date, end_date, planet_name),
        )
    else:
        cursor.execute(
            "SELECT date_ut, planet_name, longitude, speed, is_retrograde, zodiac_sign, zodiac_degree FROM ephemeris_daily WHERE date_ut >= ? AND date_ut <= ? ORDER BY date_ut ASC",
            (start_date, end_date),
        )

    return [
        {
            "date": row[0],
            "name": row[1],
            "longitude": row[2],
            "speed": row[3],
            "is_retrograde": bool(row[4]),
            "sign": row[5],
            "degree_in_sign": row[6],
        }
        for row in cursor.fetchall()
    ]


def get_ingresses(conn: sqlite3.Connection, planet: str | None = None, sign: str | None = None) -> list[dict]:
    """Query pre-computed ingress events."""
    cursor = conn.cursor()

    query = "SELECT planet_name, entered_sign, exited_sign, exact_timestamp_ut, is_retrograde_dip FROM zodiac_ingresses WHERE 1=1"
    params = []

    if planet:
        query += " AND planet_name = ?"
        params.append(planet)
    if sign:
        query += " AND entered_sign = ?"
        params.append(sign)

    query += " ORDER BY exact_timestamp_ut ASC"
    cursor.execute(query, params)

    return [
        {
            "planet": row[0],
            "entered_sign": row[1],
            "exited_sign": row[2],
            "timestamp_utc": row[3],
            "is_retrograde_reentry": bool(row[4]),
        }
        for row in cursor.fetchall()
    ]


# ──────────────────────────────────────────────────────────────────────────────
# Transit Solver: 12-month forecast
# ──────────────────────────────────────────────────────────────────────────────

def solve_12_month_transits(
    conn: sqlite3.Connection,
    user_id: str,
    start_date_str: str,
) -> dict | None:
    """
    Compute major transits for next 12 months against a user's natal chart.

    For each unique transit-planet + natal-planet + aspect combination, reports
    the date of *tightest orb* (closest approach), not the first entry into orb.
    Outer planet aspects that recur due to retrogrades are reported as separate events.

    Returns None if user not found.
    """
    profile = get_user_profile(conn, user_id)
    if not profile:
        return None

    natal_planets = profile["natal_planets"]
    start = date.fromisoformat(start_date_str)
    end = start + timedelta(days=365)
    end_str = end.isoformat()

    PERSONAL_PLANETS = {"Sun", "Moon", "Mercury", "Venus", "Mars"}

    # Phase 1: Collect ALL aspect hits across the window
    # Store as: aspect_key → list of (date, orb, hit_data)
    all_hits: dict[tuple, list[dict]] = {}

    current = start
    step = 0
    while current <= end:
        date_str = current.isoformat()
        transit_positions = get_daily_positions(conn, date_str)

        if not transit_positions:
            current += timedelta(days=1)
            step += 1
            continue

        for t_pos in transit_positions:
            # Skip Moon for 12-month forecasts (too fast, too many hits)
            if t_pos["name"] == "Moon":
                continue

            # For personal planets, only check every 3 days to reduce noise
            if t_pos["name"] in PERSONAL_PLANETS and step % 3 != 0:
                continue

            for n_planet in natal_planets:
                result = calculate_aspect(
                    t_pos["longitude"],
                    n_planet["longitude"],
                    transit_planet=t_pos["name"],
                    natal_planet=n_planet["name"],
                )

                if result and result["orb"] < 2.0:
                    aspect_key = (t_pos["name"], n_planet["name"], result["aspect"])
                    hit = {
                        "transit_planet": t_pos["name"],
                        "natal_planet": n_planet["name"],
                        "aspect": result["aspect"],
                        "angle": result["angle"],
                        "orb": result["orb"],
                        "is_exact": result["is_exact"],
                        "date": date_str,
                    }
                    if aspect_key not in all_hits:
                        all_hits[aspect_key] = []
                    all_hits[aspect_key].append(hit)

        current += timedelta(days=1)
        step += 1

    # Phase 2: For each aspect, find distinct passes (separated by >7 days gap)
    # and pick the tightest orb within each pass
    major_aspects = []
    for aspect_key, hits in all_hits.items():
        hits.sort(key=lambda x: x["date"])
        passes = _split_into_passes(hits, gap_days=7)
        for single_pass in passes:
            # Pick the hit with the tightest orb in this pass
            best = min(single_pass, key=lambda x: x["orb"])
            major_aspects.append(best)

    # Get ingresses in the 12-month window — use the service helper, not raw SQL
    all_ingresses = get_ingresses(conn)
    ingresses = [
        i for i in all_ingresses
        if start.isoformat() <= i["timestamp_utc"] <= end_str
    ]

    # Detect retrograde periods in the window
    retrograde_periods = _detect_retrograde_periods(conn, start_date_str, end_str)

    return {
        "user_id": user_id,
        "user_name": profile["display_name"],
        "period_start": start_date_str,
        "period_end": end_str,
        "major_aspects": sorted(major_aspects, key=lambda x: x["date"]),
        "ingresses": ingresses,
        "retrograde_periods": retrograde_periods,
    }


def _split_into_passes(hits: list[dict], gap_days: int = 7) -> list[list[dict]]:
    """
    Split a chronological list of aspect hits into distinct passes.

    A "pass" is a group of consecutive days where the aspect is within orb.
    If there's a gap of more than gap_days between hits, it's a new pass
    (likely due to retrograde station and re-approach).
    """
    if not hits:
        return []

    passes = [[hits[0]]]
    for i in range(1, len(hits)):
        prev_date = date.fromisoformat(hits[i - 1]["date"])
        curr_date = date.fromisoformat(hits[i]["date"])
        if (curr_date - prev_date).days > gap_days:
            passes.append([])
        passes[-1].append(hits[i])

    return passes


def _detect_retrograde_periods(conn: sqlite3.Connection, start: str, end: str) -> list[dict]:
    """Detect retrograde periods for outer planets within a date range."""
    cursor = conn.cursor()
    periods = []

    for planet_name in ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"]:
        cursor.execute(
            """SELECT date_ut, is_retrograde, zodiac_sign
               FROM ephemeris_daily
               WHERE planet_name = ? AND date_ut >= ? AND date_ut <= ?
               ORDER BY date_ut ASC""",
            (planet_name, start, end),
        )
        rows = cursor.fetchall()
        if not rows:
            continue

        in_retro = False
        retro_start = None
        retro_sign = None

        for row_date, is_retro, sign in rows:
            if is_retro and not in_retro:
                in_retro = True
                retro_start = row_date
                retro_sign = sign
            elif not is_retro and in_retro:
                in_retro = False
                periods.append({
                    "planet": planet_name,
                    "start_date": retro_start,
                    "end_date": row_date,
                    "sign": retro_sign,
                })

        # If still retrograde at end of period
        if in_retro:
            periods.append({
                "planet": planet_name,
                "start_date": retro_start,
                "end_date": end,
                "sign": retro_sign,
            })

    return sorted(periods, key=lambda x: x["start_date"])


def compute_realtime_positions(dt_utc: datetime, house_cusps: list[float] | None = None) -> list[dict]:
    """
    Compute geocentric tropical positions for all major planets at a specific minute.
    Returns a list of PlanetPosition-compatible dictionaries.
    """
    jd = swe.julday(dt_utc.year, dt_utc.month, dt_utc.day, dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0)
    
    planets = PLANETS
    zodiac_signs = ZODIAC_SIGNS
    
    positions = []
    ts_iso = dt_utc.strftime("%Y-%m-%dT%H:%M:%SZ")

    for name, pid in planets.items():
        res = swe.calc_ut(jd, pid)
        lon = res[0][0]
        speed = res[0][3]
        
        sign_idx = int(lon // 30)
        deg_in_sign = lon % 30
        
        pos = {
            "name": name,
            "longitude": round(lon, 6),
            "sign": zodiac_signs[sign_idx],
            "degree_in_sign": round(deg_in_sign, 4),
            "degree_minutes": int((deg_in_sign - int(deg_in_sign)) * 60),
            "speed": round(speed, 6),
            "is_retrograde": speed < 0,
            "computed_at_utc": ts_iso,
        }
        
        if house_cusps:
            pos["house"] = _get_house(lon, house_cusps)
            
        positions.append(pos)
        
    return positions


# ──────────────────────────────────────────────────────────────────────────────
# Daily Cosmic Weather
# ──────────────────────────────────────────────────────────────────────────────

def compute_daily_weather(conn: sqlite3.Connection, user_id: str, date_str: str, time_utc: str = "00:00") -> dict | None:
    """
    Compute today's cosmic weather: current transits vs natal chart.
    Now supports minute-level precision if time_utc is provided.
    """
    profile = get_user_profile(conn, user_id)
    if not profile:
        return None

    # Parse full datetime for real-time computation
    try:
        dt_str = f"{date_str}T{time_utc}:00"
        dt_utc = datetime.fromisoformat(dt_str).replace(tzinfo=timezone.utc)
    except ValueError:
        # Fallback to midnight if time format is weird
        dt_utc = datetime.fromisoformat(f"{date_str}T00:00:00").replace(tzinfo=timezone.utc)

    house_cusps = profile.get("house_cusps", [])
    
    # Use real-time computation for minute-level precision
    transit_positions = compute_realtime_positions(dt_utc, house_cusps)
    
    # Tag with computed time for models
    computed_at = dt_utc.strftime("%Y-%m-%dT%H:%M:%SZ")

    natal_planets = profile["natal_planets"]

    # Compute all aspects between today's transits and natal chart
    aspects = find_all_aspects(transit_positions, natal_planets)

    # Tag with date
    active_aspects = []
    for a in aspects:
        active_aspects.append({**a, "date": date_str})

    # Check for ingresses today (still uses daily cache for performance, as ingresses are pre-bisected)
    cursor = conn.cursor()
    next_day = (date.fromisoformat(date_str) + timedelta(days=1)).isoformat()
    cursor.execute(
        """SELECT planet_name, entered_sign, exited_sign, exact_timestamp_ut, is_retrograde_dip
           FROM zodiac_ingresses
           WHERE exact_timestamp_ut >= ? AND exact_timestamp_ut < ?""",
        (date_str, next_day),
    )
    ingresses_today = [
        {
            "planet": row[0],
            "entered_sign": row[1],
            "exited_sign": row[2],
            "timestamp_utc": row[3],
            "is_retrograde_reentry": bool(row[4]),
        }
        for row in cursor.fetchall()
    ]

    return {
        "user_id": user_id,
        "user_name": profile["display_name"],
        "date": date_str,
        "computed_at_utc": computed_at,
        "transit_positions": transit_positions,
        "active_aspects": active_aspects,
        "ingresses_today": ingresses_today,
    }
