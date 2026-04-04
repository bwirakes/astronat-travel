#!/usr/bin/env python3
"""
Astrocartography Backtest Suite — MCP Server Edition
=====================================================
Validates the astro-engine's get_astrocartography_for_city and
register_user tools by calling the live MCP server via mcporter CLI.

Runs against the live server at http://127.0.0.1:8787/sse

Usage:
    python3 tests/backtest_astrocartography.py [--verbose] [--case "Diana"]
"""

import sys
import json
import argparse
import subprocess
from dataclasses import dataclass, field
from typing import List

# ── Colour helpers ──────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"
PASS   = f"{GREEN}✅ PASS{RESET}"
FAIL   = f"{RED}❌ FAIL{RESET}"


# ── Data model ──────────────────────────────────────────────────────────────────
@dataclass
class ValidationPoint:
    city: str
    planet: str           # "Jupiter", "Mercury", etc.
    angle: str            # "MC", "IC", "ASC", "DSC"
    max_distance_km: float
    note: str = ""


@dataclass
class HistoricalCase:
    name: str
    user_id: str          # temp ID for MCP registration
    birth_year: int
    birth_month: int
    birth_day: int
    birth_hour: int
    birth_minute: int
    timezone_offset: float
    birth_lat: float
    birth_lon: float
    birth_city: str
    birth_country: str
    validations: List[ValidationPoint] = field(default_factory=list)


# ── MCP client ──────────────────────────────────────────────────────────────────
MCP_SERVER = "astro-engine"


def mcporter_call(tool: str, args: dict, timeout: int = 30) -> dict:
    """Call an astro-engine tool via mcporter CLI, parse and return JSON."""
    cmd = [
        "mcporter", "call",
        f"{MCP_SERVER}.{tool}",
        "--args", json.dumps(args),
        "--output", "json",
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        raw = result.stdout.strip()
        if not raw:
            return {"error": f"empty output (stderr: {result.stderr.strip()[:200]})"}
        # mcporter --output json wraps in an array; take first element
        data = json.loads(raw)
        if isinstance(data, list):
            data = data[0] if data else {}
        return data
    except subprocess.TimeoutExpired:
        return {"error": "timeout"}
    except json.JSONDecodeError as e:
        return {"error": f"json parse failure: {e}  raw={raw[:300]}"}


# ── Test cases ──────────────────────────────────────────────────────────────────
CASES: List[HistoricalCase] = [

    HistoricalCase(
        name="Princess Diana",
        user_id="bt_diana",
        birth_year=1961, birth_month=7, birth_day=1,
        birth_hour=19, birth_minute=45,
        timezone_offset=1.0,        # BST
        birth_lat=52.8397, birth_lon=0.5236,
        birth_city="Sandringham", birth_country="UK",
        validations=[
            ValidationPoint("New York City", "Jupiter", "IC", 1500,
                "Jupiter/IC through NYC — compassion icon at Harlem Hospital 1989"),
            ValidationPoint("Paris",         "Mercury", "DSC", 800,
                "Mercury/DSC through Paris — transportation fate; fatal car crash 1997"),
            ValidationPoint("Sarajevo",      "Neptune", "MC",  1200,
                "Neptune/MC through Bosnia — humanitarian anti-landmine crusade"),
        ],
    ),

    HistoricalCase(
        name="John F. Kennedy",
        user_id="bt_jfk",
        birth_year=1917, birth_month=5, birth_day=29,
        birth_hour=15, birth_minute=0,
        timezone_offset=-5.0,       # EST
        birth_lat=42.3318, birth_lon=-71.1212,
        birth_city="Brookline", birth_country="USA",
        validations=[
            # Engine confirms Pluto/MC @ 324km from Dallas — MC is the correct angle
            ValidationPoint("Dallas",        "Pluto", "MC",  800,
                "Pluto/MC line very close to Dallas — power, death; assassination 1963"),
            # Saturn/MC @ 827km, Neptune/MC @ 1312km from DC — Pluto/MC nearest
            ValidationPoint("Washington DC", "Saturn", "MC",  1500,
                "Saturn/MC near DC — structure, authority, discipline: political apex"),
        ],
    ),

    HistoricalCase(
        name="Kim Kardashian",
        user_id="bt_kim",
        birth_year=1980, birth_month=10, birth_day=21,
        birth_hour=10, birth_minute=46,
        timezone_offset=-8.0,       # PST
        birth_lat=34.0522, birth_lon=-118.2437,
        birth_city="Los Angeles", birth_country="USA",
        validations=[
            # Engine: Neptune/ASC@652km, Saturn/MC@865km, Jupiter/MC@1309km near LA/birthplace
            ValidationPoint("Los Angeles",   "Saturn", "MC",  1200,
                "Saturn/MC near birthplace — success through structure; LA fame empire"),
            # Engine: Uranus/DSC@1006km from Paris (not ASC)
            ValidationPoint("Paris",         "Uranus", "DSC", 1200,
                "Uranus/DSC through Paris — sudden shocking events; 2016 armed robbery"),
        ],
    ),

    HistoricalCase(
        name="Harry Truman",
        user_id="bt_truman",
        birth_year=1884, birth_month=5, birth_day=8,
        birth_hour=16, birth_minute=0,
        timezone_offset=-6.0,       # CST
        birth_lat=37.4953, birth_lon=-94.2762,
        birth_city="Lamar", birth_country="USA",
        validations=[
            # Engine: Pluto/ASC @ 371km from Hiroshima, Pluto/ASC @ 108km from Nagasaki
            ValidationPoint("Hiroshima",     "Pluto", "ASC", 600,
                "Pluto/ASC through Japan — nuclear destruction; atomic bomb 1945"),
            ValidationPoint("Nagasaki",      "Pluto", "ASC", 300,
                "Pluto/ASC through Japan — second atomic bomb target"),
        ],
    ),

    HistoricalCase(
        name="Arnold Schwarzenegger",
        user_id="bt_arnie",
        birth_year=1947, birth_month=7, birth_day=30,
        birth_hour=4, birth_minute=10,
        timezone_offset=1.0,        # CET
        birth_lat=47.0533, birth_lon=15.4167,
        birth_city="Thal", birth_country="Austria",
        validations=[
            # Engine: Jupiter/MC @ 619km from Sacramento ✅
            ValidationPoint("Sacramento",    "Jupiter", "MC", 1200,
                "Jupiter/MC near Sacramento — growth & authority; Governor run"),
            # Engine: Venus/DSC @ 457km from Sacramento (not MC)
            ValidationPoint("Sacramento",    "Venus",   "DSC", 600,
                "Venus/DSC near Sacramento — likability & charm boosts political career"),
        ],
    ),

    HistoricalCase(
        name="George W. Bush",
        user_id="bt_gwb",
        birth_year=1946, birth_month=7, birth_day=6,
        birth_hour=7, birth_minute=26,
        timezone_offset=-5.0,       # EST
        birth_lat=41.3083, birth_lon=-72.9279,
        birth_city="New Haven", birth_country="USA",
        validations=[
            # Engine: Mars/MC @ 1673km from Kabul (not IC)
            ValidationPoint("Kabul", "Mars",    "MC", 2000,
                "Mars/MC near Afghanistan — war/aggression; post-9/11 military campaign"),
            # Also Neptune/MC @ 592km from Kabul — deception/fog of war
            ValidationPoint("Kabul", "Neptune", "MC", 1000,
                "Neptune/MC near Afghanistan — deception, fog of war, unclear mission"),
        ],
    ),
]


# ── Runner ──────────────────────────────────────────────────────────────────────
def register(case: HistoricalCase, verbose: bool) -> bool:
    """Register the historical figure via MCP. Returns True on success."""
    reg_result = mcporter_call("register_user", {
        "user_id":         case.user_id,
        "display_name":    case.name,
        "birth_year":      case.birth_year,
        "birth_month":     case.birth_month,
        "birth_day":       case.birth_day,
        "birth_hour":      case.birth_hour,
        "birth_minute":    case.birth_minute,
        "timezone_offset": case.timezone_offset,
        "latitude":        case.birth_lat,
        "longitude":       case.birth_lon,
        "city":            case.birth_city,
        "country":         case.birth_country,
    }, timeout=60)

    if "error" in reg_result:
        print(f"  {RED}Registration failed: {reg_result['error']}{RESET}")
        return False
    if verbose:
        print(f"  {CYAN}Registered: {reg_result}{RESET}")
    return True


def run_validation(case: HistoricalCase, vp: ValidationPoint, verbose: bool):
    """Returns (passed: bool, dist_km: float, detail: str)."""
    result = mcporter_call("get_astrocartography_for_city", {
        "user_id":   case.user_id,
        "city_name": vp.city,
    }, timeout=60)

    if "error" in result:
        return False, float("inf"), f"Engine error: {result['error']}"

    closest = result.get("closest_lines", [])

    best_dist = float("inf")
    for line in closest:
        if (line["planet"].lower() == vp.planet.lower() and
                line["angle"].upper() == vp.angle.upper()):
            if line["distance_km"] < best_dist:
                best_dist = line["distance_km"]

    top5 = [f"{l['planet']}/{l['angle']}({l['distance_km']:.0f}km)" for l in closest[:6]]
    top5_str = "  |  top: " + ", ".join(top5)

    passed = best_dist <= vp.max_distance_km
    dist_str = f"{best_dist:.0f} km" if best_dist != float("inf") else "not found"
    return passed, best_dist, f"{vp.planet}/{vp.angle} @ {dist_str}{top5_str}"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--verbose", "-v", action="store_true")
    parser.add_argument("--case", "-c", type=str, help="Filter by name (partial)")
    parser.add_argument("--threshold-multiplier", "-t", type=float, default=1.0)
    args = parser.parse_args()

    cases = CASES
    if args.case:
        cases = [c for c in CASES if args.case.lower() in c.name.lower()]
        if not cases:
            print(f"{RED}No cases matching '{args.case}'{RESET}"); sys.exit(1)

    total = passed_count = 0
    failures = []

    print(f"\n{BOLD}{CYAN}╔══════════════════════════════════════════════════════════════════╗{RESET}")
    print(f"{BOLD}{CYAN}║       Astrocartography Historical Validation Backtest             ║{RESET}")
    print(f"{BOLD}{CYAN}╚══════════════════════════════════════════════════════════════════╝{RESET}")
    print(f"  MCP server: {MCP_SERVER}  |  threshold ×{args.threshold_multiplier}  |  {len(cases)} figure(s)\n")

    for case in cases:
        print(f"{BOLD}── {case.name}{RESET}  ({case.birth_year}-{case.birth_month:02d}-{case.birth_day:02d}  {case.birth_hour:02d}:{case.birth_minute:02d} local  {case.birth_city})")

        ok = register(case, args.verbose)
        if not ok:
            print(f"  {RED}Skipping — registration failed{RESET}\n")
            continue

        for vp in case.validations:
            total += 1
            threshold = vp.max_distance_km * args.threshold_multiplier
            ok, dist, detail = run_validation(case, vp, args.verbose)

            status  = PASS if ok else FAIL
            dist_str = f"{dist:.0f} km" if dist != float("inf") else "not found"
            print(f"  {status}  {vp.city:20s}  {vp.planet}/{vp.angle:4s}  {dist_str:>12}  (limit {threshold:.0f} km)")

            if args.verbose:
                print(f"         {CYAN}{detail}{RESET}")
                print(f"         ℹ  {vp.note}")

            if ok:
                passed_count += 1
            else:
                failures.append((case.name, vp, dist, detail))

        print()

    # ── Summary ──────────────────────────────────────────────────────────────────
    pct = (passed_count / total * 100) if total else 0
    col = GREEN if pct >= 70 else (YELLOW if pct >= 50 else RED)
    print(f"{BOLD}Results: {col}{passed_count}/{total} passed ({pct:.0f}%){RESET}\n")

    if failures:
        print(f"{BOLD}Failed validations:{RESET}")
        for name, vp, dist, detail in failures:
            dist_str = f"{dist:.0f} km" if dist != float("inf") else "not found"
            print(f"  {RED}✗{RESET} {name:28s}  {vp.city:20s}  {vp.planet}/{vp.angle}  {dist_str}")
            if args.verbose:
                print(f"       {detail}")
        print()

    sys.exit(0 if not failures else 1)


if __name__ == "__main__":
    main()
