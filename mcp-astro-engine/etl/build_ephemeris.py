#!/usr/bin/env python3
"""
build_ephemeris.py — Cache Warming ETL Pipeline

Pre-computes 700 years (1500–2200) of planetary ephemeris data into SQLite.
Designed to run once during build/deployment.

Tables produced:
  1. ephemeris_daily   — Daily 00:00 UT positions for 10 major bodies
  2. zodiac_ingresses  — Minute-level sign-change events via binary bisection
  3. user_profiles_cache — Pre-seeded with Natalia's and Brandon's natal charts

Usage:
    python3 build_ephemeris.py [--db-path astro_engine.db] [--start 1500] [--end 2200]
"""
from __future__ import annotations

import argparse
import json
import os
import sqlite3
import sys
import time
from datetime import date, datetime, timedelta, timezone

import swisseph as swe

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from engine.constants import ZODIAC_SIGNS, PLANETS, get_sign, get_house

# Pre-seeded user profiles
# Natalia is the default/primary user
NATALIA_BIRTH = {
    "year": 1990, "month": 12, "day": 23,
    "hour": 15, "minute": 57,
    "timezone_offset": 8.0,  # Singapore GMT+8
    "latitude": 1.3521, "longitude": 103.8198,
    "city": "Singapore", "country": "SG",
}

BRANDON_BIRTH = {
    "year": 1988, "month": 8, "day": 17,
    "hour": 22, "minute": 15,
    "timezone_offset": 7.0,  # Jakarta GMT+7
    "latitude": -6.2088, "longitude": 106.8456,
    "city": "Jakarta", "country": "ID",
}

# Binary bisection precision: converge until JD interval < this value
# 0.0007 JD ≈ 1 minute
BISECTION_PRECISION_JD = 0.0007

# Ephemeris file path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
EPHE_PATH = os.path.join(SCRIPT_DIR, "..", "data", "ephemeris_files")
DEFAULT_DB_PATH = os.path.join(SCRIPT_DIR, "..", "data", "astro_engine.db")


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

# get_sign imported from engine.constants


def jd_to_iso(jd: float) -> str:
    """Convert Julian Day to ISO 8601 UTC string (to the minute)."""
    year, month, day, hour_frac = swe.revjul(jd)
    hours = int(hour_frac)
    minutes = int((hour_frac - hours) * 60)
    return f"{year:04d}-{month:02d}-{day:02d}T{hours:02d}:{minutes:02d}:00Z"


def calc_planet(jd: float, planet_id: int) -> tuple[float, float, float]:
    """
    Compute geocentric tropical position.
    Returns (longitude, latitude, speed).
    """
    result = swe.calc_ut(jd, planet_id)
    return result[0][0], result[0][1], result[0][3]


# ──────────────────────────────────────────────────────────────────────────────
# Schema
# ──────────────────────────────────────────────────────────────────────────────

def create_tables(conn: sqlite3.Connection):
    """Create all tables and indexes."""
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ephemeris_daily (
            date_ut       TEXT NOT NULL,
            planet_name   TEXT NOT NULL,
            longitude     REAL NOT NULL,
            latitude      REAL NOT NULL,
            speed         REAL NOT NULL,
            is_retrograde INTEGER NOT NULL,
            zodiac_sign   TEXT NOT NULL,
            zodiac_degree REAL NOT NULL,
            PRIMARY KEY (date_ut, planet_name)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS zodiac_ingresses (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            planet_name         TEXT NOT NULL,
            entered_sign        TEXT NOT NULL,
            exited_sign         TEXT NOT NULL,
            exact_timestamp_ut  TEXT NOT NULL,
            is_retrograde_dip   INTEGER NOT NULL,
            jd_ut               REAL NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_profiles_cache (
            user_id         TEXT PRIMARY KEY,
            display_name    TEXT NOT NULL,
            birth_data_json TEXT NOT NULL,
            natal_planets   TEXT NOT NULL,
            house_cusps     TEXT NOT NULL,
            created_at      TEXT NOT NULL,
            updated_at      TEXT
        )
    """)

    conn.commit()


def create_indexes(conn: sqlite3.Connection):
    """Create indexes after bulk insert (faster than during)."""
    cursor = conn.cursor()
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_daily_planet_sign ON ephemeris_daily(planet_name, zodiac_sign)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_daily_date ON ephemeris_daily(date_ut)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ingress_planet_sign ON zodiac_ingresses(planet_name, entered_sign)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ingress_planet ON zodiac_ingresses(planet_name)")
    conn.commit()


# ──────────────────────────────────────────────────────────────────────────────
# ETL: ephemeris_daily
# ──────────────────────────────────────────────────────────────────────────────

def build_daily_ephemeris(conn: sqlite3.Connection, start_year: int, end_year: int):
    """
    Populate ephemeris_daily with 00:00 UT positions for all planets.
    """
    cursor = conn.cursor()
    current = date(start_year, 1, 1)
    end = date(end_year, 1, 1)
    total_days = (end - current).days
    batch = []
    batch_size = 10000
    count = 0

    print(f"  📅 Computing daily ephemeris: {start_year}–{end_year} ({total_days:,} days × {len(PLANETS)} planets)")

    while current < end:
        jd = swe.julday(current.year, current.month, current.day, 0.0)

        for name, pid in PLANETS.items():
            lon, lat, speed = calc_planet(jd, pid)
            sign = get_sign(lon)
            deg_in_sign = lon % 30.0

            batch.append((
                current.isoformat(),
                name,
                round(lon, 6),
                round(lat, 6),
                round(speed, 6),
                1 if speed < 0 else 0,
                sign,
                round(deg_in_sign, 4),
            ))

        count += 1
        if count % batch_size == 0:
            cursor.executemany(
                "INSERT OR IGNORE INTO ephemeris_daily VALUES (?,?,?,?,?,?,?,?)",
                batch,
            )
            conn.commit()
            batch.clear()
            pct = count / total_days * 100
            print(f"    {pct:5.1f}% — {current.isoformat()}")

        current += timedelta(days=1)

    # Flush remaining
    if batch:
        cursor.executemany(
            "INSERT OR IGNORE INTO ephemeris_daily VALUES (?,?,?,?,?,?,?,?)",
            batch,
        )
        conn.commit()

    print(f"  ✅ Daily ephemeris complete: {count * len(PLANETS):,} rows")


# ──────────────────────────────────────────────────────────────────────────────
# ETL: zodiac_ingresses (with binary bisection)
# ──────────────────────────────────────────────────────────────────────────────

def bisect_ingress(planet_id: int, jd_start: float, jd_end: float) -> float:
    """
    Binary bisection to find the exact JD when a planet crosses a sign boundary.

    Assumes the planet is in one sign at jd_start and a different sign at jd_end.
    Converges to within BISECTION_PRECISION_JD (~1 minute).
    """
    sign_start = get_sign(calc_planet(jd_start, planet_id)[0])

    while (jd_end - jd_start) > BISECTION_PRECISION_JD:
        jd_mid = (jd_start + jd_end) / 2.0
        sign_mid = get_sign(calc_planet(jd_mid, planet_id)[0])

        if sign_mid == sign_start:
            jd_start = jd_mid
        else:
            jd_end = jd_mid

    return jd_end


def build_ingresses(conn: sqlite3.Connection, start_year: int, end_year: int):
    """
    Detect and log zodiac sign changes with minute-level precision.

    Scans ephemeris_daily for consecutive-day sign changes, then uses binary
    bisection to pinpoint the exact crossing moment.
    """
    cursor = conn.cursor()
    ingresses = []
    count = 0

    print(f"  🔍 Detecting zodiac ingresses with minute-level bisection...")

    for name, pid in PLANETS.items():
        # Read all daily positions for this planet, ordered by date
        cursor.execute("""
            SELECT date_ut, longitude, zodiac_sign, speed
            FROM ephemeris_daily
            WHERE planet_name = ?
            ORDER BY date_ut ASC
        """, (name,))

        rows = cursor.fetchall()
        if len(rows) < 2:
            continue

        planet_ingresses = 0

        for i in range(1, len(rows)):
            prev_date, prev_lon, prev_sign, prev_speed = rows[i - 1]
            curr_date, curr_lon, curr_sign, curr_speed = rows[i]

            if prev_sign != curr_sign:
                # Sign change detected — bisect to find exact moment
                # Parse dates to JD
                y0, m0, d0 = map(int, prev_date.split("-"))
                y1, m1, d1 = map(int, curr_date.split("-"))
                jd_start = swe.julday(y0, m0, d0, 0.0)
                jd_end = swe.julday(y1, m1, d1, 0.0)

                exact_jd = bisect_ingress(pid, jd_start, jd_end)

                # Is this a retrograde reentry?
                is_retro_dip = curr_speed < 0

                ingresses.append((
                    name,
                    curr_sign,
                    prev_sign,
                    jd_to_iso(exact_jd),
                    1 if is_retro_dip else 0,
                    round(exact_jd, 6),
                ))
                planet_ingresses += 1

        count += planet_ingresses
        print(f"    {name}: {planet_ingresses:,} ingresses")

    # Bulk insert
    cursor.executemany(
        "INSERT INTO zodiac_ingresses (planet_name, entered_sign, exited_sign, exact_timestamp_ut, is_retrograde_dip, jd_ut) VALUES (?,?,?,?,?,?)",
        ingresses,
    )
    conn.commit()

    print(f"  ✅ Ingress detection complete: {count:,} total events")


# ──────────────────────────────────────────────────────────────────────────────
# ETL: user_profiles_cache (pre-seed Natalia + Brandon)
# ──────────────────────────────────────────────────────────────────────────────

def compute_natal_chart(birth_data: dict) -> tuple[list[dict], list[float]]:
    """
    Compute full natal chart: planetary positions + house cusps.

    Returns:
        (natal_planets, house_cusps)
    """
    # Convert Local Time to UTC
    # Local = UTC + Offset -> UTC = Local - Offset
    local_hour_decimal = birth_data["hour"] + birth_data["minute"] / 60.0
    utc_hour_decimal = local_hour_decimal - birth_data.get("timezone_offset", 0.0)

    jd = swe.julday(
        birth_data["year"],
        birth_data["month"],
        birth_data["day"],
        utc_hour_decimal,
    )

    # Compute planetary positions
    natal_planets = []
    for name, pid in PLANETS.items():
        lon, lat, speed = calc_planet(jd, pid)
        sign = get_sign(lon)
        deg_in_sign = lon % 30.0

        natal_planets.append({
            "name": name,
            "longitude": round(lon, 6),
            "sign": sign,
            "degree_in_sign": round(deg_in_sign, 4),
            "house": None,  # Assigned after house calculation
        })

    # Compute house cusps (Placidus system)
    cusps, ascmc = swe.houses(
        jd,
        birth_data["latitude"],
        birth_data["longitude"],
        b'P',  # P = Placidus
    )
    house_cusps = [round(c, 6) for c in cusps]

    # Assign houses to planets
    for planet in natal_planets:
        planet["house"] = get_house(planet["longitude"], house_cusps)

    return natal_planets, house_cusps


# _find_house removed — use get_house from engine.constants


def _seed_user(conn: sqlite3.Connection, user_id: str, display_name: str, birth_data: dict):
    """Seed a single user's natal chart into user_profiles_cache."""
    cursor = conn.cursor()

    cursor.execute("SELECT 1 FROM user_profiles_cache WHERE user_id = ?", (user_id,))
    if cursor.fetchone():
        print(f"  ℹ️  {display_name}'s profile already exists, skipping")
        return

    print(f"  🌟 Computing {display_name}'s natal chart...")
    natal_planets, house_cusps = compute_natal_chart(birth_data)

    now = datetime.now(timezone.utc).isoformat()
    cursor.execute(
        "INSERT INTO user_profiles_cache VALUES (?,?,?,?,?,?,?)",
        (
            user_id,
            display_name,
            json.dumps(birth_data),
            json.dumps(natal_planets),
            json.dumps(house_cusps),
            now,
            None,
        ),
    )
    conn.commit()

    for p in natal_planets:
        retro = "℞" if p.get("speed", 1) < 0 else ""
        print(f"    {p['name']:<10} {p['degree_in_sign']:>6.2f}° {p['sign']:<12} House {p['house']}{retro}")
    print(f"  ✅ {display_name}'s profile seeded")


def seed_users(conn: sqlite3.Connection):
    """Pre-seed all default user profiles (Natalia first as primary, then Brandon)."""
    _seed_user(conn, "natalia", "Natalia", NATALIA_BIRTH)
    _seed_user(conn, "brandon", "Brandon Wirakesuma", BRANDON_BIRTH)


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Build Astrological Ephemeris Database")
    parser.add_argument("--db-path", default=DEFAULT_DB_PATH, help="Output SQLite database path")
    parser.add_argument("--start", type=int, default=1500, help="Start year (default: 1500)")
    parser.add_argument("--end", type=int, default=2200, help="End year (default: 2200)")
    parser.add_argument("--seed-only", action="store_true", help="Only seed user profiles, skip ephemeris")
    args = parser.parse_args()

    # Set ephemeris path if available
    if os.path.isdir(EPHE_PATH):
        swe.set_ephe_path(EPHE_PATH)
        print(f"📂 Using ephemeris files from: {EPHE_PATH}")
    else:
        print("📂 Using built-in Moshier ephemeris (no .se1 files found)")

    # Ensure output directory exists
    os.makedirs(os.path.dirname(args.db_path), exist_ok=True)

    conn = sqlite3.connect(args.db_path)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")

    print(f"\n🔧 Building ephemeris database: {args.db_path}")
    print(f"   Range: {args.start}–{args.end}\n")

    t0 = time.time()

    create_tables(conn)

    if not args.seed_only:
        build_daily_ephemeris(conn, args.start, args.end)
        create_indexes(conn)
        build_ingresses(conn, args.start, args.end)

    seed_users(conn)

    elapsed = time.time() - t0
    print(f"\n⏱️  Total time: {elapsed:.1f}s")

    # Print DB stats
    cursor = conn.cursor()
    for table in ["ephemeris_daily", "zodiac_ingresses", "user_profiles_cache"]:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"   {table}: {count:,} rows")

    db_size = os.path.getsize(args.db_path) / (1024 * 1024)
    print(f"   Database size: {db_size:.1f} MB")

    conn.close()
    print(f"\n✅ Ephemeris database ready!")


if __name__ == "__main__":
    main()
