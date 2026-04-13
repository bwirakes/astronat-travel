"""Ephemeris preprocessing in Python (pyswisseph).

Produces the inputs that /api/house-matrix expects: natalPlanets,
relocatedCusps, transits. ACG lines and parans are passed as empty arrays
(documented caveat in docs/ml-evaluation/experiments/EXP-0001).

Timezone conversion: uses `timezonefinder` for the birth location, falling
back to UTC if the package isn't available (logs a warning in that case).
"""

from __future__ import annotations

import math
import warnings
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional
from zoneinfo import ZoneInfo

import swisseph as swe

from engine.astrocartography import (
    compute_all_lines_for_jd,
    find_closest_distance_to_line,
)


PLANETS: list[tuple[str, int]] = [
    ("Sun", swe.SUN),
    ("Moon", swe.MOON),
    ("Mercury", swe.MERCURY),
    ("Venus", swe.VENUS),
    ("Mars", swe.MARS),
    ("Jupiter", swe.JUPITER),
    ("Saturn", swe.SATURN),
    ("Uranus", swe.URANUS),
    ("Neptune", swe.NEPTUNE),
    ("Pluto", swe.PLUTO),
]

ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

ASPECT_DEFS = [
    ("Conjunction", 0,   8),
    ("Sextile",     60,  6),
    ("Square",      90,  8),
    ("Trine",       120, 8),
    ("Opposition",  180, 8),
]


try:
    from timezonefinder import TimezoneFinder
    _tzfinder: Optional[TimezoneFinder] = TimezoneFinder()
except Exception:
    _tzfinder = None


@dataclass
class HousePayload:
    planet: str
    longitude: float
    latitude: float
    retrograde: bool
    sign: str
    house: int


@dataclass
class EnginePayload:
    """Exactly what /api/house-matrix POST body expects."""
    natalPlanets: list[dict]
    relocatedCusps: list[float]
    acgLines: list[dict] = field(default_factory=list)
    transits: list[dict] = field(default_factory=list)
    parans: list[dict] = field(default_factory=list)
    destLat: float = 0.0
    destLon: float = 0.0

    def as_json_dict(self) -> dict:
        return {
            "natalPlanets": self.natalPlanets,
            "relocatedCusps": self.relocatedCusps,
            "acgLines": self.acgLines,
            "transits": self.transits,
            "parans": self.parans,
            "destLat": self.destLat,
            "destLon": self.destLon,
        }


def local_to_utc(
    birth_date: str, birth_time: str, lat: float, lon: float,
) -> datetime:
    """Convert local birth datetime to UTC via timezone lookup."""
    t = birth_time if len(birth_time) >= 8 else f"{birth_time}:00"
    local_iso = f"{birth_date}T{t}"
    naive = datetime.fromisoformat(local_iso)

    if _tzfinder is None:
        warnings.warn(
            "timezonefinder not installed; treating birth time as UTC. "
            "Install with: pip install timezonefinder",
            stacklevel=2,
        )
        return naive.replace(tzinfo=timezone.utc)

    tz_name = _tzfinder.timezone_at(lat=lat, lng=lon)
    if not tz_name:
        warnings.warn(f"No timezone for ({lat}, {lon}); using UTC", stacklevel=2)
        return naive.replace(tzinfo=timezone.utc)

    localized = naive.replace(tzinfo=ZoneInfo(tz_name))
    return localized.astimezone(timezone.utc)


def _julday(dt_utc: datetime) -> float:
    hour = dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0
    return swe.julday(dt_utc.year, dt_utc.month, dt_utc.day, hour)


def _house_of(longitude: float, cusps: list[float]) -> int:
    """Which house does this longitude fall in? Matches lib/astro/transits.getHouse."""
    for i in range(12):
        start = cusps[i]
        end = cusps[(i + 1) % 12]
        if end < start:
            if longitude >= start or longitude < end:
                return i + 1
        else:
            if start <= longitude < end:
                return i + 1
    return 1


def _compute_cusps(jd: float, lat: float, lon: float) -> tuple[list[float], float, float]:
    """Return (cusps[12], asc, mc). Uses Placidus (P), whole-sign (W) at polar lats."""
    system = b"W" if abs(lat) >= 66 else b"P"
    cusps, ascmc = swe.houses(jd, lat, lon, system)
    # pyswisseph returns cusps as a 12-tuple indexed 0..11 for houses 1..12
    return list(cusps), ascmc[0], ascmc[1]


def _compute_planets(jd: float, cusps: Optional[list[float]] = None) -> list[dict]:
    """Ecliptic longitudes for all 10 planets. Optionally assigns house from cusps."""
    out: list[dict] = []
    flags = swe.FLG_SPEED | swe.FLG_SWIEPH
    for name, pid in PLANETS:
        # Returns ((lon, lat, dist, lon_speed, lat_speed, dist_speed), flags)
        result, _ret = swe.calc_ut(jd, pid, flags)
        lon, lat_ec, _dist, lon_speed, *_ = result
        sign_idx = int(lon // 30)
        entry = {
            "planet": name,
            "name": name,            # house-matrix.ts accepts either
            "longitude": round(lon, 6),
            "latitude": round(lat_ec, 6),
            "sign": ZODIAC_SIGNS[sign_idx],
            "is_retrograde": lon_speed < 0,
            "retrograde": lon_speed < 0,
            "speed": round(lon_speed, 6),
        }
        if cusps is not None:
            entry["house"] = _house_of(lon, cusps)
        out.append(entry)
    return out


def _min_arc(a: float, b: float) -> float:
    d = abs(a - b) % 360
    return d if d <= 180 else 360 - d


def _aspects(transits: list[dict], natals: list[dict]) -> list[dict]:
    """Sky→natal aspects within orb. Applying status unknown → assume True."""
    out: list[dict] = []
    for t in transits:
        for n in natals:
            arc = _min_arc(t["longitude"], n["longitude"])
            for aspect_name, exact, orb in ASPECT_DEFS:
                diff = abs(arc - exact)
                if diff <= orb:
                    out.append({
                        "transitingPlanet": t["planet"],
                        "natalPlanet": n["planet"],
                        "aspect": aspect_name.lower(),
                        "orb": round(diff, 4),
                        "applying": True,
                    })
                    break
    return out


def _compute_acg_lines(
    birth_jd: float, dest_lat: float, dest_lon: float, max_km: float = 700.0,
) -> list[dict]:
    """For each of the 40 natal ACG lines (10 planets × 4 angles), return its
    distance to the destination. Filtered to lines within `max_km` because
    farther lines contribute 0 to the house-matrix score per scoring-rubric §4.

    Output matches the MatrixACGLine shape the engine expects.
    """
    all_lines = compute_all_lines_for_jd(birth_jd)
    out: list[dict] = []
    for line in all_lines:
        dist = find_closest_distance_to_line(dest_lat, dest_lon, line)
        if not math.isfinite(dist) or dist > max_km:
            continue
        out.append({
            "planet": line["planet"],
            "angle": line["angle_type"],        # MC|IC|ASC|DSC
            "distance_km": round(dist, 2),
        })
    return out


def build_engine_payload(
    birth_date: str,
    birth_time: str,
    birth_lat: float,
    birth_lon: float,
    dest_lat: float,
    dest_lon: float,
    sample_date: str,
) -> EnginePayload:
    """Turn an EvalRow's raw inputs into the /api/house-matrix POST body.

    The sample_date is anchored at noon UTC — per EXP-0001 caveat, we don't
    resolve a specific hour for the transit snapshot.
    """
    birth_utc = local_to_utc(birth_date, birth_time, birth_lat, birth_lon)
    birth_jd = _julday(birth_utc)

    natal_cusps, _asc, _mc = _compute_cusps(birth_jd, birth_lat, birth_lon)
    natals = _compute_planets(birth_jd, natal_cusps)

    relocated_cusps, _rasc, _rmc = _compute_cusps(birth_jd, dest_lat, dest_lon)

    # Transits at noon UTC on sample_date
    sample_utc = datetime.fromisoformat(f"{sample_date}T12:00:00").replace(
        tzinfo=timezone.utc
    )
    sample_jd = _julday(sample_utc)
    transit_planets = _compute_planets(sample_jd)
    transit_aspects = _aspects(transit_planets, natals)

    # ACG lines within 700 km of destination — uses
    # engine/astrocartography.py (same math as the TS engine).
    acg_lines = _compute_acg_lines(birth_jd, dest_lat, dest_lon)

    return EnginePayload(
        natalPlanets=natals,
        relocatedCusps=relocated_cusps,
        acgLines=acg_lines,
        transits=transit_aspects,
        parans=[],           # stub — paran integration pending
        destLat=dest_lat,
        destLon=dest_lon,
    )


def main() -> int:
    """Smoke test — Hemingway natal → Paris 1926."""
    payload = build_engine_payload(
        birth_date="1899-07-21",
        birth_time="08:00:00",
        birth_lat=41.883,
        birth_lon=-87.783,
        dest_lat=48.857,
        dest_lon=2.352,
        sample_date="1926-10-22",
    )
    print("Natal planets (Hemingway, NYC):")
    for p in payload.natalPlanets:
        print(
            f"  {p['planet']:<8} {p['longitude']:6.2f}° {p['sign']:<12} "
            f"house={p.get('house')} Rx={p['is_retrograde']}"
        )
    print(f"\nRelocated cusps (Paris):")
    for i, c in enumerate(payload.relocatedCusps, 1):
        print(f"  H{i:<2} {c:.2f}°")
    print(f"\nTransit→natal aspects on 1926-10-22: {len(payload.transits)}")
    for a in payload.transits[:6]:
        print(
            f"  {a['transitingPlanet']:<8} {a['aspect']:<12} "
            f"{a['natalPlanet']:<8} orb={a['orb']}°"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
