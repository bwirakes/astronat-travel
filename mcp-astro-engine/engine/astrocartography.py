#!/usr/bin/env python3
"""
astrocartography.py — Astrocartography Math Engine

Computes planetary angularity lines (MC, IC, ASC, DSC) on the globe for any given
moment in time. Also provides deterministic geocoding and kilometric distance
calculations from cities to planetary lines.

Math:
- MC/IC are vertical longitudes derived from Right Ascension (RA) and Greenwich
  Sidereal Time (GST).
- ASC/DSC are oblique curves derived via spherical trigonometry (Local Hour Angle).
"""
from __future__ import annotations

import math
from datetime import datetime

import swisseph as swe
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError

# Use a deterministic user-agent for OpenStreetMap Nominatim
GEOCODER_USER_AGENT = "openclaw_astro_engine/1.0"


# ──────────────────────────────────────────────────────────────────────────────
# Geometry & Math Helpers
# ──────────────────────────────────────────────────────────────────────────────

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on the Earth surface.
    Returns distance in kilometers.
    """
    # Earth radius in kilometers
    R = 6371.0

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0)**2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0)**2
    
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def normalize_longitude(lon: float) -> float:
    """Normalize longitude to be between -180 and +180 for standard maps."""
    lon = lon % 360
    if lon > 180:
        lon -= 360
    return lon


# ──────────────────────────────────────────────────────────────────────────────
# Core Astrological Math
# ──────────────────────────────────────────────────────────────────────────────

def get_planet_ra_dec(jd: float, planet_id: int) -> tuple[float, float]:
    """
    Get the Equatorial Right Ascension (RA) and Declination (Dec) of a planet.
    Both returned in degrees.
    """
    # swe.FLG_EQUATORIAL tells swisseph to return equatorial coordinates
    result = swe.calc_ut(jd, planet_id, swe.FLG_EQUATORIAL)
    ra = result[0][0]   # Right Ascension in degrees
    dec = result[0][1]  # Declination in degrees
    return ra, dec


def get_gst(jd: float) -> float:
    """
    Get Greenwich Sidereal Time (GST) in degrees.
    swe.sidtime returns hours (0-24), so multiply by 15.
    """
    gst_hours = swe.sidtime(jd)
    return (gst_hours * 15.0) % 360.0


def compute_mc_ic_longitude(ra: float, gst: float) -> tuple[float, float]:
    """
    Compute the longitudes of the Midheaven (MC) and Imum Coeli (IC) lines.
    These are straight vertical lines.
    Returns (MC_longitude, IC_longitude) in degrees (0-360).
    """
    mc_lon = (ra - gst) % 360.0
    ic_lon = (mc_lon + 180.0) % 360.0
    return mc_lon, ic_lon


def compute_asc_dsc_lines(ra: float, dec: float, gst: float) -> tuple[list[dict], list[dict]]:
    """
    Compute the Ascendant (ASC) and Descendant (DSC) curves.
    Evaluates every integer latitude from -89 to +89.
    
    Returns two lists of points: (asc_points, dsc_points)
    where each point is {"lat": float, "lon": float}. Longitudes are -180 to 180.
    """
    asc_points = []
    dsc_points = []
    
    dec_rad = math.radians(dec)
    
    # Iterate latitudes. Avoid exact poles (-90, 90) because tan is undefined/infinite.
    for lat_deg in range(-89, 90):
        lat_rad = math.radians(lat_deg)
        
        # Local Hour Angle horizon formula: cos(LHA) = -tan(Lat) * tan(Dec)
        cos_lha = -math.tan(lat_rad) * math.tan(dec_rad)
        
        # If cos_lha is outside [-1, 1], the planet is circumpolar at this latitude
        # (it never rises or sets).
        if abs(cos_lha) > 1.0:
            continue
            
        lha_rad = math.acos(cos_lha)
        lha_deg = math.degrees(lha_rad)
        
        # ASC longitude: RA - LHA - GST
        asc_lon360 = (ra - lha_deg - gst) % 360.0
        # DSC longitude: RA + LHA - GST
        dsc_lon360 = (ra + lha_deg - gst) % 360.0
        
        asc_points.append({"lat": float(lat_deg), "lon": normalize_longitude(asc_lon360)})
        dsc_points.append({"lat": float(lat_deg), "lon": normalize_longitude(dsc_lon360)})
        
    return asc_points, dsc_points


def compute_all_lines_for_jd(jd: float) -> list[dict]:
    """
    Compute all 4 angle lines (MC, IC, ASC, DSC) for the 10 major planets.
    Returns a list of dictionaries suitable for the AstroCartographyLine model.
    """
    planets = {
        "Sun": swe.SUN, "Moon": swe.MOON, "Mercury": swe.MERCURY, 
        "Venus": swe.VENUS, "Mars": swe.MARS, "Jupiter": swe.JUPITER, 
        "Saturn": swe.SATURN, "Uranus": swe.URANUS, "Neptune": swe.NEPTUNE, 
        "Pluto": swe.PLUTO
    }
    
    gst = get_gst(jd)
    lines = []
    
    for name, pid in planets.items():
        ra, dec = get_planet_ra_dec(jd, pid)
        
        # Compute MC/IC
        mc_lon, ic_lon = compute_mc_ic_longitude(ra, gst)
        
        lines.append({
            "planet": name,
            "angle_type": "MC",
            "longitude": normalize_longitude(mc_lon),
            "points": None
        })
        lines.append({
            "planet": name,
            "angle_type": "IC",
            "longitude": normalize_longitude(ic_lon),
            "points": None
        })
        
        # Compute ASC/DSC
        asc_points, dsc_points = compute_asc_dsc_lines(ra, dec, gst)
        
        lines.append({
            "planet": name,
            "angle_type": "ASC",
            "longitude": None,
            "points": asc_points
        })
        lines.append({
            "planet": name,
            "angle_type": "DSC",
            "longitude": None,
            "points": dsc_points
        })
        
    return lines


# ──────────────────────────────────────────────────────────────────────────────
# Relocation & Geocoding
# ──────────────────────────────────────────────────────────────────────────────

def geocode_city(city_name: str) -> tuple[float, float, str]:
    """
    Deterministically resolve a city name to its latitude, longitude, and formatted name.
    Uses OpenStreetMap's Nominatim.
    
    Raises ValueError if city cannot be found.
    Raises RuntimeError if the geocoder service fails.
    """
    geolocator = Nominatim(user_agent=GEOCODER_USER_AGENT)
    try:
        location = geolocator.geocode(city_name, language="en", timeout=10)
        if not location:
            raise ValueError(f"Could not find coordinates for city: '{city_name}'")
        return location.latitude, location.longitude, location.address
    except (GeocoderTimedOut, GeocoderServiceError) as e:
        raise RuntimeError(f"Geocoding service unavailable: {str(e)}")


def find_closest_distance_to_line(city_lat: float, city_lon: float, line: dict) -> float:
    """
    Find the closest kilometric distance from a city to a planetary line.
    
    For MC/IC lines (vertical), computes the distance along the constant city_lat 
    to the line's longitude.
    
    For ASC/DSC curves, computes distance to the closest point in the pre-computed array.
    """
    angle = line["angle_type"]
    
    if angle in ("MC", "IC"):
        # For a vertical line, the closest point on the line is exactly at the city's latitude
        line_lon = line["longitude"]
        return haversine_distance(city_lat, city_lon, city_lat, line_lon)
        
    elif angle in ("ASC", "DSC"):
        points = line["points"]
        if not points:
            return float('inf')
            
        # The ASC/DSC curves are computed at integer latitudes.
        # Find the two closest latitude points on the curve and check distance.
        # This provides a very close approximation (within ~10s of km max error).
        closest_dist = float('inf')
        
        for pt in points:
            # Optimization: only check points roughly nearby in latitude (±3 degrees)
            if abs(pt["lat"] - city_lat) <= 3.0:
                dist = haversine_distance(city_lat, city_lon, pt["lat"], pt["lon"])
                if dist < closest_dist:
                    closest_dist = dist
                    
        return closest_dist
        
    return float('inf')


def compute_city_relocation_aspects(dt_utc: datetime, city_name: str) -> dict:
    """
    Complete relocation pipeline:
    1. Geocodes the city.
    2. Computes all astrocartography lines for the given time.
    3. Calculates distance from the city to *every* line.
    4. Returns a curated dictionary of the impacts.
    """
    lat, lon, address = geocode_city(city_name)
    
    # Calculate Julian Day
    jd = swe.julday(
        dt_utc.year, dt_utc.month, dt_utc.day, 
        dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0
    )
    
    lines = compute_all_lines_for_jd(jd)
    
    distances = []
    for line in lines:
        dist = find_closest_distance_to_line(lat, lon, line)
        if dist != float('inf'):
            distances.append({
                "planet": line["planet"],
                "angle": line["angle_type"],
                "distance_km": round(dist, 1)
            })
            
    # Sort by closest first
    distances.sort(key=lambda x: x["distance_km"])
    
    return {
        "city_query": city_name,
        "resolved_address": address,
        "latitude": round(lat, 4),
        "longitude": round(lon, 4),
        "closest_lines": distances
    }
