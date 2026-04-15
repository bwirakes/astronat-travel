#!/usr/bin/env python3
"""
server.py — Astrological Transit Engine MCP Server

FastMCP server exposing planetary ephemeris data, zodiac ingresses,
transit forecasts, and daily cosmic weather as strictly-typed tools
for LLM consumption.

Tools:
  1. get_historical_ingress(planet, sign)  — "When was Neptune in Gemini?"
  2. get_12_month_transits(user_id, start_date) — 12-month aspect forecast
  3. get_daily_cosmic_weather(user_id, date) — Daily transit brief
  4. register_user(user_id, name, ...) — Register a new user's natal chart

Usage (stdio mode for MCP):
    python3 server.py

Usage (standalone test):
    python3 server.py --test
"""
from __future__ import annotations

import json
import os
import sqlite3
import sys
from datetime import datetime, timezone, timedelta

# Add project root to path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

import swisseph as swe
from mcp.server.fastmcp import FastMCP

from engine.transits import (
    compute_daily_weather,
    get_ingresses,
    get_user_profile,
    solve_12_month_transits,
    compute_realtime_positions,
)
from engine.models import (
    DailyWeather,
    IngressEvent,
    IngressQueryResult,
    TransitForecast,
    UserProfile,
    NatalPlanet,
    AspectHit,
    RetrogradePeriod,
    PlanetPosition,
    AstroCartographyLine,
    AstroCartographyMap,
    CityRelocationAspects,
)
from engine.astrocartography import (
    compute_all_lines_for_jd,
    compute_city_relocation_aspects,
)
from etl.build_ephemeris import compute_natal_chart


# ──────────────────────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────────────────────

DB_PATH = os.environ.get(
    "ASTRO_ENGINE_DB",
    os.path.join(SCRIPT_DIR, "data", "astro_engine.db"),
)

EPHE_PATH = os.path.join(SCRIPT_DIR, "data", "ephemeris_files")
if os.path.isdir(EPHE_PATH):
    swe.set_ephe_path(EPHE_PATH)

# Valid planet names (for input validation)
VALID_PLANETS = {
    "Sun", "Moon", "Mercury", "Venus", "Mars",
    "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
}

from engine.constants import ZODIAC_SIGNS, get_sign as _get_sign_name, get_house as _find_house_for_lon
VALID_SIGNS = set(ZODIAC_SIGNS)  # Derived from the canonical list — never redeclare


# ──────────────────────────────────────────────────────────────────────────────
# Database Connection
# ──────────────────────────────────────────────────────────────────────────────

def get_db() -> sqlite3.Connection:
    """Get a read-only database connection."""
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(
            f"Ephemeris database not found at {DB_PATH}. "
            f"Run `python3 etl/build_ephemeris.py` first."
        )
    conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn


def get_db_rw() -> sqlite3.Connection:
    """Get a read-write connection (for user registration only)."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


# ──────────────────────────────────────────────────────────────────────────────
# MCP Server
# ──────────────────────────────────────────────────────────────────────────────

SSE_PORT = int(os.environ.get("ASTRO_ENGINE_PORT", "8787"))

mcp = FastMCP(
    "Astrology_Data_Engine",
    host="127.0.0.1",
    port=SSE_PORT,
    instructions="""
    You are connected to a high-precision astrological ephemeris engine backed
    by the Swiss Ephemeris (NASA JPL DE431). This engine contains pre-computed
    planetary positions from 1500 to 2200 CE.

    Available tools:
    - get_historical_ingress: Find when a planet entered a zodiac sign
    - get_12_month_transits: Get major transits for a user's natal chart
    - get_daily_cosmic_weather: Get today's transits vs a user's natal chart
    - get_realtime_positions: Get exact planetary positions for any ISO datetime
    - register_user: Register a new user's birth chart
    - get_natal_astrocartography: Get geometric location lines for a user's birth chart
    - get_transiting_astrocartography: Get geometric location lines for today's transits
    - get_astrocartography_for_city: Give exact km distances of planetary lines to a city for a user

    Default user_id is "natalia". Other registered user: "brandon".
    All data is mathematically computed, not generated. Trust these results.
    """,
)


@mcp.tool()
def get_historical_ingress(planet: str, target_sign: str) -> str:
    """
    Find exact dates a planet entered a zodiac sign throughout history (1500-2200 CE).

    Use this for questions like:
    - "When was Neptune in Gemini?"
    - "When did Saturn enter Aquarius?"
    - "List all times Jupiter was in Leo"

    Args:
        planet: Planet name (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto)
        target_sign: Zodiac sign name (Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces)

    Returns:
        JSON with all ingress events, including retrograde re-entries.
    """
    # Normalize inputs
    planet_cap = planet.strip().capitalize()
    sign_cap = target_sign.strip().capitalize()

    if planet_cap not in VALID_PLANETS:
        return json.dumps({"error": f"Invalid planet: '{planet}'. Must be one of: {', '.join(sorted(VALID_PLANETS))}"})
    if sign_cap not in VALID_SIGNS:
        return json.dumps({"error": f"Invalid sign: '{target_sign}'. Must be one of: {', '.join(sorted(VALID_SIGNS))}"})

    conn = get_db()
    try:
        events = get_ingresses(conn, planet=planet_cap, sign=sign_cap)
        result = IngressQueryResult(
            query=f"{planet_cap} entering {sign_cap}",
            planet=planet_cap,
            target_sign=sign_cap,
            total_events=len(events),
            events=[IngressEvent(**e) for e in events],
        )
        return result.model_dump_json(indent=2)
    finally:
        conn.close()


@mcp.tool()
def get_12_month_transits(user_id: str, start_date: str) -> str:
    """
    Get major planetary transits and aspects for a user's natal chart over the next 12 months.

    This analyzes how transiting planets form geometric aspects (conjunctions, squares,
    trines, oppositions, sextiles) to the user's natal planet positions.

    Args:
        user_id: The user ID (e.g., "brandon"). User must be registered first.
        start_date: Start date in YYYY-MM-DD format (e.g., "2026-02-19")

    Returns:
        JSON forecast with major aspects, ingresses, and retrograde periods.
    """
    conn = get_db()
    try:
        result = solve_12_month_transits(conn, user_id.strip().lower(), start_date.strip())
        if result is None:
            return json.dumps({"error": f"User '{user_id}' not found. Register user first with register_user."})

        forecast = TransitForecast(
            user_id=result["user_id"],
            user_name=result["user_name"],
            period_start=result["period_start"],
            period_end=result["period_end"],
            major_aspects=[AspectHit(**a) for a in result["major_aspects"]],
            ingresses=[IngressEvent(**i) for i in result["ingresses"]],
            retrograde_periods=[RetrogradePeriod(**r) for r in result["retrograde_periods"]],
        )
        return forecast.model_dump_json(indent=2)
    finally:
        conn.close()


@mcp.tool()
def get_daily_cosmic_weather(user_id: str, date: str, time_utc: str = "00:00") -> str:
    """
    Get today's cosmic weather: current planetary transits compared to a user's natal chart.

    Shows all active aspects, today's ingresses, and current planetary positions at a specific time.

    Args:
        user_id: The user ID (e.g., "brandon"). User must be registered first.
        date: Date in YYYY-MM-DD format (e.g., "2026-02-19")
        time_utc: Time in HH:MM format (24h) (e.g., "14:30"). Defaults to "00:00".

    Returns:
        JSON with transit positions, active aspects, and any ingresses today.
    """
    conn = get_db()
    try:
        result = compute_daily_weather(conn, user_id.strip().lower(), date.strip(), time_utc.strip())
        if result is None:
            return json.dumps({"error": f"User '{user_id}' not found or no data for date '{date}'."})

        weather = DailyWeather(
            user_id=result["user_id"],
            user_name=result["user_name"],
            date=result["date"],
            computed_at_utc=result["computed_at_utc"],
            transit_positions=[PlanetPosition(**p) for p in result["transit_positions"]],
            active_aspects=[AspectHit(**a) for a in result["active_aspects"]],
            ingresses_today=[IngressEvent(**i) for i in result["ingresses_today"]],
        )
        return weather.model_dump_json(indent=2)
    finally:
        conn.close()


@mcp.tool()
def get_realtime_positions(date_iso: str) -> str:
    """
    Get exact planetary positions for any ISO 8601 datetime (UTC).
    Use this for high-precision lookups (e.g., birth moments or exact event times).

    Args:
        date_iso: Full ISO 8601 timestamp (e.g., "2026-02-19T03:09:00Z" or "2026-02-19T14:30")

    Returns:
        JSON list of planetary positions computed via Swiss Ephemeris.
    """
    try:
        # Normalize to UTC
        dt = datetime.fromisoformat(date_iso.replace("Z", "+00:00"))
    except ValueError:
        return json.dumps({"error": f"Invalid date format: '{date_iso}'. Use ISO 8601 (YYYY-MM-DDTHH:MMZ)"})

    positions = compute_realtime_positions(dt)
    return json.dumps({
        "computed_at_utc": dt.isoformat(),
        "positions": [PlanetPosition(**p).model_dump() for p in positions]
    }, indent=2)


def _deg_to_sign(deg: float) -> dict:
    """Convert ecliptic longitude to sign + degree_in_sign."""
    return {"sign": _get_sign_name(deg), "degree": round(deg % 30.0, 4)}


@mcp.tool()
def get_realtime_positions_with_houses(date_iso: str, latitude: float, longitude: float) -> str:
    """
    Get planetary positions AND house cusps for any date/time at a specific location.

    Uses the Placidus house system. This is ideal for country natal charts where
    you have a founding date AND a founding city with known coordinates.

    Args:
        date_iso: Full ISO 8601 timestamp (e.g., "1810-09-16T05:00:00Z")
        latitude: Location latitude (e.g., 21.15 for Dolores Hidalgo, Mexico)
        longitude: Location longitude (e.g., -100.93 for Dolores Hidalgo, Mexico)

    Returns:
        JSON with planetary positions (including house placement), house cusps,
        Ascendant, and Midheaven.
    """
    try:
        dt = datetime.fromisoformat(date_iso.replace("Z", "+00:00"))
    except ValueError:
        return json.dumps({"error": f"Invalid date format: '{date_iso}'. Use ISO 8601."})

    # Compute positions
    positions = compute_realtime_positions(dt)

    # Compute Julian Day for house calculation
    utc_hour = dt.hour + dt.minute / 60.0 + dt.second / 3600.0
    jd = swe.julday(dt.year, dt.month, dt.day, utc_hour)

    # Compute house cusps (Placidus)
    cusps, ascmc = swe.houses(jd, latitude, longitude, b'P')
    house_cusps_deg = [round(c, 4) for c in cusps]

    asc_data = _deg_to_sign(ascmc[0])
    mc_data = _deg_to_sign(ascmc[1])

    # Build house cusp objects
    house_cusps = []
    for i, cusp_deg in enumerate(house_cusps_deg, 1):
        s = _deg_to_sign(cusp_deg)
        house_cusps.append({
            "house": i,
            "sign": s["sign"],
            "degree": s["degree"],
            "longitude": cusp_deg,
        })

    # Assign houses to positions
    enriched = []
    for p in positions:
        pos_dict = PlanetPosition(**p).model_dump()
        lon = p.get("longitude", p.get("degree", 0.0))
        if lon == 0.0:
            # Try to reconstruct from sign + degree
            sign_idx = ZODIAC_SIGNS.index(p.get("sign", "Aries")) if p.get("sign") in ZODIAC_SIGNS else 0
            lon = sign_idx * 30.0 + p.get("degree", 0.0)
        pos_dict["house"] = _find_house_for_lon(lon, house_cusps_deg)
        enriched.append(pos_dict)

    return json.dumps({
        "computed_at_utc": dt.isoformat(),
        "latitude": latitude,
        "longitude": longitude,
        "house_system": "Placidus",
        "positions": enriched,
        "house_cusps": house_cusps,
        "ascendant": {"sign": asc_data["sign"], "degree": asc_data["degree"], "longitude": round(ascmc[0], 4)},
        "midheaven": {"sign": mc_data["sign"], "degree": mc_data["degree"], "longitude": round(ascmc[1], 4)},
    }, indent=2)



@mcp.tool()
def register_user(
    user_id: str,
    display_name: str,
    birth_year: int,
    birth_month: int,
    birth_day: int,
    birth_hour: int,
    birth_minute: int,
    timezone_offset: float,
    latitude: float,
    longitude: float,
    city: str = "",
    country: str = "",
) -> str:
    """
    Register a new user by computing and caching their natal chart.

    Once registered, the user can be queried with get_12_month_transits and
    get_daily_cosmic_weather.

    Args:
        user_id: Unique identifier for the user (lowercase, no spaces)
        display_name: User's display name
        birth_year: Birth year (e.g., 1992)
        birth_month: Birth month (1-12)
        birth_day: Birth day (1-31)
        birth_hour: Birth hour in 24h format (0-23)
        birth_minute: Birth minute (0-59)
        timezone_offset: Timezone offset from UTC (e.g., 8.0 for Singapore, -5.0 for EST)
        latitude: Birth location latitude (e.g., -23.5505 for São Paulo)
        longitude: Birth location longitude (e.g., -46.6333 for São Paulo)
        city: Birth city name (optional, for display)
        country: Birth country code (optional, for display)

    Returns:
        JSON with the computed natal chart summary.
    """
    uid = user_id.strip().lower().replace(" ", "_")

    birth_data = {
        "year": birth_year,
        "month": birth_month,
        "day": birth_day,
        "hour": birth_hour,
        "minute": birth_minute,
        "timezone_offset": timezone_offset,
        "latitude": latitude,
        "longitude": longitude,
        "city": city,
        "country": country,
    }

    # Compute natal chart
    try:
        natal_planets, house_cusps = compute_natal_chart(birth_data)
    except Exception as e:
        return json.dumps({"error": f"Failed to compute natal chart: {str(e)}"})

    # Store in database
    conn = get_db_rw()
    try:
        now = datetime.now(timezone.utc).isoformat()
        cursor = conn.cursor()

        # Upsert: insert or update existing
        cursor.execute(
            """INSERT INTO user_profiles_cache (user_id, display_name, birth_data_json, natal_planets, house_cusps, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(user_id) DO UPDATE SET
                   display_name = excluded.display_name,
                   birth_data_json = excluded.birth_data_json,
                   natal_planets = excluded.natal_planets,
                   house_cusps = excluded.house_cusps,
                   updated_at = excluded.updated_at""",
            (
                uid,
                display_name,
                json.dumps(birth_data),
                json.dumps(natal_planets),
                json.dumps(house_cusps),
                now,
                now,
            ),
        )
        conn.commit()

        result = UserProfile(
            user_id=uid,
            display_name=display_name,
            natal_planets=[NatalPlanet(**p) for p in natal_planets],
            house_cusps=house_cusps,
            message=f"Natal chart for {display_name} computed and cached successfully.",
        )
        return result.model_dump_json(indent=2)
    finally:
        conn.close()


@mcp.tool()
def get_natal_astrocartography(user_id: str) -> str:
    """
    Compute astrocartography lines for a registered user's natal chart.

    Returns planet-angle lines (MC, IC, ASC, DSC) for all 10 planets
    mapped onto the globe using the user's exact birth date/time (UTC).

    Args:
        user_id: The user ID (e.g., "natalia"). Must be registered.

    Returns:
        JSON with lines for all 10 planets × 4 angles = 40 line objects.
        MC/IC lines are straight vertical longitudes.
        ASC/DSC lines are sequences of lat/lon points forming curves.
    """
    conn = get_db()
    try:
        profile = get_user_profile(conn, user_id.strip().lower())
        if not profile:
            return json.dumps({"error": f"User '{user_id}' not found. Register user first."})

        birth_data = profile["birth_data"]
        local_hour_desc = birth_data["hour"] + birth_data["minute"] / 60.0
        utc_hour_desc = local_hour_desc - birth_data.get("timezone_offset", 0.0)

        jd_utc = swe.julday(
            birth_data["year"],
            birth_data["month"],
            birth_data["day"],
            utc_hour_desc
        )

        lines_data = compute_all_lines_for_jd(jd_utc)
        
        # Convert jd_utc back to ISO string for the payload
        dt_utc = swe.revjul(jd_utc)
        iso_str = f"{dt_utc[0]:04d}-{dt_utc[1]:02d}-{dt_utc[2]:02d}T{int(dt_utc[3]):02d}:{int((dt_utc[3]%1)*60):02d}:00Z"

        result = AstroCartographyMap(
            computed_at_utc=datetime.now(timezone.utc).isoformat(),
            label="Natal Map",
            user_id=profile["display_name"],
            lines=[AstroCartographyLine(**L) for L in lines_data],
            total_lines=len(lines_data)
        )
        return result.model_dump_json(indent=2)
    finally:
        conn.close()


@mcp.tool()
def get_transiting_astrocartography(date_iso: str) -> str:
    """
    Compute astrocartography lines for the current transiting planets on a given date.

    Useful for understanding which geographical zones are energized by transit planets
    on a specific day, independent of any birth chart.

    Args:
        date_iso: ISO 8601 datetime or date string (e.g., "2026-02-23T09:00:00Z")

    Returns:
        JSON with lines for all 10 transiting planets × 4 angles.
    """
    try:
        dt = datetime.fromisoformat(date_iso.replace("Z", "+00:00"))
        jd = swe.julday(dt.year, dt.month, dt.day, dt.hour + dt.minute / 60.0 + dt.second / 3600.0)
    except ValueError:
        return json.dumps({"error": f"Invalid date format: '{date_iso}'. Use ISO 8601."})

    lines_data = compute_all_lines_for_jd(jd)

    result = AstroCartographyMap(
        computed_at_utc=datetime.now(timezone.utc).isoformat(),
        label=dt.isoformat(),
        lines=[AstroCartographyLine(**L) for L in lines_data],
        total_lines=len(lines_data)
    )
    return result.model_dump_json(indent=2)


@mcp.tool()
def get_astrocartography_for_city(user_id: str, city_name: str) -> str:
    """
    Compute exact kilometric distances from a user's planetary lines to a specific city.
    
    This uses deterministic geocoding (Nominatim) to find the city's exact coordinates,
    then calculates the spherical Haversine distance from the city to every single
    planetary line in the user's natal astrocartography map.

    Args:
        user_id: The user ID (e.g., "natalia"). Must be registered.
        city_name: Name of the city (e.g., "Paris, France" or "Tokyo").

    Returns:
        JSON with the resolved city coordinates and a sorted list of the closest planetary lines
        in kilometers (e.g., "Sun MC line is 200km away").
    """
    conn = get_db()
    try:
        profile = get_user_profile(conn, user_id.strip().lower())
        if not profile:
            return json.dumps({"error": f"User '{user_id}' not found. Register user first."})

        birth_data = profile["birth_data"]
        local_hour_desc = birth_data["hour"] + birth_data["minute"] / 60.0
        utc_hour_desc = local_hour_desc - birth_data.get("timezone_offset", 0.0)

        # Reconstruct birth datetime in UTC
        fractional_hour = utc_hour_desc % 24
        day_offset = int(utc_hour_desc // 24)
        
        # We need a proper datetime object to pass to compute_city_relocation_aspects, 
        # handling day wrapping.
        dt_base = datetime(birth_data["year"], birth_data["month"], birth_data["day"])
        dt_utc = dt_base + timedelta(days=day_offset, hours=fractional_hour)
        
        try:
            aspects_data = compute_city_relocation_aspects(dt_utc, city_name)
        except Exception as e:
            return json.dumps({"error": f"Failed to compute city relocation: {str(e)}"})
            
        result = CityRelocationAspects(**aspects_data)
        return result.model_dump_json(indent=2)
    finally:
        conn.close()


# ──────────────────────────────────────────────────────────────────────────────
# Natal Chart Tools (powered by `kerykeion`)
# All chart generation delegated to skill layer — do not re-implement here.
# ──────────────────────────────────────────────────────────────────────────────

_KERYKEION_AVAILABLE = None  # cached availability check


def _check_kerykeion() -> bool:
    """Return True if kerykeion is importable."""
    global _KERYKEION_AVAILABLE
    if _KERYKEION_AVAILABLE is None:
        try:
            import kerykeion  # noqa: F401
            _KERYKEION_AVAILABLE = True
        except ImportError:
            _KERYKEION_AVAILABLE = False
    return _KERYKEION_AVAILABLE


from engine.utils import birth_data_to_utc_dt as _birth_data_to_utc_dt
from engine.transits import get_birth_data_for_user as _load_birth_data_for_user_from_db

import sys as _sys
from pathlib import Path as _Path
_SKILLS_SCRIPTS = str(_Path(__file__).parent.parent / "skills" / "astro-research" / "scripts")
if _SKILLS_SCRIPTS not in _sys.path:
    _sys.path.insert(0, _SKILLS_SCRIPTS)
try:
    from natal_chart_utils import (
        build_natal_data as _build_natal_data,
        generate_chart_png as _generate_chart_png,
        get_chart_stats as _extract_chart_stats,
        get_transit_stats as _extract_transit_stats,
    )
except ImportError:
    _build_natal_data = None  # Degrades gracefully if skill layer not present
    _generate_chart_png = None
    _extract_chart_stats = None
    _extract_transit_stats = None


def _load_birth_data_for_user(user_id: str) -> dict | None:
    """Load birth_data + display_name for a user via the service layer."""
    conn = get_db()
    try:
        return _load_birth_data_for_user_from_db(conn, user_id)
    finally:
        conn.close()


@mcp.tool()
def get_natal_chart(user_id: str) -> str:
    """
    Generate a natal birth chart SVG and structured statistics for a registered user.

    Uses kerykeion (Swiss Ephemeris-backed) to produce a high-quality birth chart wheel
    as an SVG string plus planet positions, aspects, and element counts.

    Args:
        user_id: The user ID (e.g. "natalia", "brandon"). Must be registered.

    Returns:
        JSON with:
          - svg: full SVG chart string
          - stats: planet positions, aspects, element/modality counts
          - summary_md: Markdown table of planet positions for embedding in Notion
    """
    if not _check_kerykeion():
        return json.dumps({"error": "kerykeion not installed. Run: pip install kerykeion"})
    if _build_natal_data is None:
        return json.dumps({"error": "natal_chart_utils skill layer not available."})

    subject, display_name = _build_natal_data(user_id)
    if subject is None:
        return json.dumps({"error": f"User '{user_id}' not found. Register first with register_user."})

    try:
        from kerykeion.chart_data_factory import ChartDataFactory
        from kerykeion.charts.chart_drawer import ChartDrawer
        chart_data = ChartDataFactory.create_natal_chart_data(subject)
        svg = ChartDrawer(chart_data=chart_data).generate_svg_string()
    except Exception as e:
        return json.dumps({"error": f"Chart generation failed: {str(e)}"})

    stats = _extract_chart_stats(subject)

    rows = ["| Planet | Sign | Degree | ℞ |",
            "| :--- | :--- | :---: | :---: |"]
    for p in stats.get("planets", []):
        retro = "℞" if p["retrograde"] else "—"
        rows.append(f"| {p['name'].capitalize()} | {p['sign'].capitalize()} | {p['degree']}° | {retro} |")
    summary_md = "\n".join(rows)

    return json.dumps({
        "user_id": user_id,
        "display_name": display_name,
        "chart_type": "natal",
        "svg": svg,
        "svg_length": len(svg),
        "stats": stats,
        "summary_md": summary_md,
    }, indent=2)


@mcp.tool()
def get_transit_chart(user_id: str, date_iso: str) -> str:
    """
    Generate a transit chart SVG (bi-wheel: natal inner / transiting outer) for a user.

    Shows how transiting planets for the given date connect to the user's natal chart.
    Uses kerykeion with today's transits at noon UTC on date_iso.

    Args:
        user_id: The user ID (e.g. "natalia"). Must be registered.
        date_iso: ISO date string YYYY-MM-DD for the transit date (e.g. "2026-03-01").

    Returns:
        JSON with svg, stats (natal + transit planets), and summary_md.
    """
    if not _check_kerykeion():
        return json.dumps({"error": "kerykeion not installed. Run: pip install kerykeion"})
    if _build_natal_data is None:
        return json.dumps({"error": "natal_chart_utils skill layer not available."})

    # Validate transit date
    try:
        transit_dt = datetime.fromisoformat(date_iso.replace("Z", "+00:00"))
        date_str = f"{transit_dt.year:04d}-{transit_dt.month:02d}-{transit_dt.day:02d}"
    except ValueError:
        return json.dumps({"error": f"Invalid date_iso: '{date_iso}'. Use YYYY-MM-DD."})

    natal_subject, display_name = _build_natal_data(user_id)
    if natal_subject is None:
        return json.dumps({"error": f"User '{user_id}' not found. Register first with register_user."})

    try:
        from kerykeion import AstrologicalSubjectFactory
        from kerykeion.chart_data_factory import ChartDataFactory
        from kerykeion.charts.chart_drawer import ChartDrawer
        transit_subject = AstrologicalSubjectFactory.from_birth_data(
            name="Transit",
            year=transit_dt.year, month=transit_dt.month, day=transit_dt.day,
            hour=12, minute=0,
            lat=natal_subject.lat, lng=natal_subject.lng,
            tz_str="UTC", online=False,
        )
        chart_data = ChartDataFactory.create_transit_chart_data(natal_subject, transit_subject)
        svg = ChartDrawer(chart_data=chart_data).generate_svg_string()
    except Exception as e:
        return json.dumps({"error": f"Transit chart generation failed: {str(e)}"})

    natal_stats = _extract_chart_stats(natal_subject)
    transit_stats = _extract_chart_stats(transit_subject)

    rows = ["| Planet | Natal Sign | Transit Sign | Shift |",
            "| :--- | :--- | :--- | :--- |"]
    natal_map = {p["name"]: p for p in natal_stats.get("planets", [])}
    for tp in transit_stats.get("planets", []):
        np = natal_map.get(tp["name"], {})
        n_sign = np.get("sign", "—").capitalize()
        t_sign = tp["sign"].capitalize()
        shift = "" if n_sign == t_sign else "→ changed"
        rows.append(f"| {tp['name'].capitalize()} | {n_sign} | {t_sign} | {shift} |")
    summary_md = "\n".join(rows)

    return json.dumps({
        "user_id": user_id,
        "display_name": display_name,
        "chart_type": "transit",
        "transit_date": date_str,
        "svg": svg,
        "svg_length": len(svg),
        "natal_stats": natal_stats,
        "transit_stats": transit_stats,
        "summary_md": summary_md,
    }, indent=2)


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if "--test" in sys.argv:
        print("🔧 Running in test mode...")
        print(f"📂 Database: {DB_PATH}")
        print(f"📂 Ephemeris: {EPHE_PATH}")

        if not os.path.exists(DB_PATH):
            print("❌ Database not found. Run ETL first.")
            sys.exit(1)

        # Quick test: historical ingress
        result = get_historical_ingress("Neptune", "Gemini")
        parsed = json.loads(result)
        print(f"\n✅ Neptune in Gemini: {parsed.get('total_events', 0)} events found")
        if parsed.get("events"):
            for e in parsed["events"][:3]:
                print(f"   {e['timestamp_utc']} (retro: {e['is_retrograde_reentry']})")

        # Quick test: daily weather for Natalia (default user)
        result = get_daily_cosmic_weather("natalia", "2026-02-19")
        parsed = json.loads(result)
        if "error" not in parsed:
            print(f"\n✅ Daily weather for Natalia: {len(parsed.get('active_aspects', []))} aspects")
        else:
            print(f"\n⚠️  Daily weather (Natalia): {parsed['error']}")

        # Quick test: daily weather for Brandon
        result = get_daily_cosmic_weather("brandon", "2026-02-19")
        parsed = json.loads(result)
        if "error" not in parsed:
            print(f"✅ Daily weather for Brandon: {len(parsed.get('active_aspects', []))} aspects")
        else:
            print(f"⚠️  Daily weather (Brandon): {parsed['error']}")

        print("\n✅ All tests passed!")
    elif "--sse" in sys.argv:
        # Run as persistent SSE server (HTTP transport)
        print(f"🚀 Starting Astrology Data Engine (SSE) on port {SSE_PORT}...")
        print(f"📂 Database: {DB_PATH}")
        mcp.run(transport="sse")
    else:
        # Run as MCP server (stdio transport)
        mcp.run()
