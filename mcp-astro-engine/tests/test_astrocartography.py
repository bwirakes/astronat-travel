#!/usr/bin/env python3
"""
test_astrocartography.py — Unit tests for the Astrocartography Engine
"""
import sys
import os
import pytest
import math
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from engine.astrocartography import (
    haversine_distance,
    normalize_longitude,
    get_planet_ra_dec,
    get_gst,
    compute_mc_ic_longitude,
    compute_asc_dsc_lines,
    find_closest_distance_to_line,
    geocode_city
)
import swisseph as swe

# Try to set ephemeris path if .se1 files are available
EPHE_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "ephemeris_files")
if os.path.isdir(EPHE_PATH):
    swe.set_ephe_path(EPHE_PATH)


class TestMathHelpers:
    """Test haversine and coordinate normalization."""

    def test_haversine_same_point(self):
        assert haversine_distance(10.0, 10.0, 10.0, 10.0) == 0.0

    def test_haversine_equator_degree(self):
        # 1 degree at the equator is approx 111.1 - 111.3 km
        dist = haversine_distance(0.0, 0.0, 0.0, 1.0)
        assert 111.0 < dist < 111.4

    def test_haversine_poles(self):
        # Distance from North Pole to South Pole should be half circumference (~20,015 km)
        dist = haversine_distance(90.0, 0.0, -90.0, 0.0)
        assert 20000 < dist < 20050

    def test_normalize_longitude(self):
        assert normalize_longitude(100.0) == 100.0
        assert normalize_longitude(190.0) == -170.0
        assert normalize_longitude(-10.0) == -10.0
        assert normalize_longitude(-190.0) == 170.0
        assert normalize_longitude(370.0) == 10.0


class TestAstrologicalMath:
    """Test the spherical trigonometry line generations."""

    def test_gst_j2000(self):
        """Greenwich Sidereal Time at J2000.0 (2000-01-01 12:00 UT) is ~280.4606°"""
        jd_j2000 = 2451545.0
        gst = get_gst(jd_j2000)
        assert abs(gst - 280.46) < 0.1

    def test_mc_ic_are_opposite(self):
        """MC and IC longitudes must be exactly 180 degrees apart."""
        mc, ic = compute_mc_ic_longitude(100.0, 50.0)
        assert mc == 50.0  # (100 - 50) % 360
        assert ic == 230.0 # (50 + 180) % 360

    def test_asc_dsc_equator_symmetry(self):
        """
        At the equator (latitude = 0), cos(LHA) = 0, so LHA = 90 degrees.
        Thus, ASC and DSC should be exactly 90 degrees away from the MC line.
        """
        ra = 150.0
        dec = 20.0
        gst = 50.0
        mc_lon = (ra - gst) % 360.0 # 100.0
        
        asc_points, dsc_points = compute_asc_dsc_lines(ra, dec, gst)
        
        # Find the equator point
        asc_eq = next(p for p in asc_points if p["lat"] == 0.0)
        dsc_eq = next(p for p in dsc_points if p["lat"] == 0.0)
        
        # MC is 100. ASC = RA - 90 - GST = 150 - 90 - 50 = 10
        # DSC = RA + 90 - GST = 150 + 90 - 50 = 190 -> -170
        assert asc_eq["lon"] == 10.0
        assert dsc_eq["lon"] == -170.0

    def test_circumpolar_filtering(self):
        """
        If a planet's declination is very high, it never sets at high latitudes.
        We should get fewer than 179 points if the planet is circumpolar.
        """
        ra = 0.0
        dec = 80.0 # Extreme declination (e.g. some asteroid, but good for math test)
        gst = 0.0
        asc_points, _ = compute_asc_dsc_lines(ra, dec, gst)
        
        # Total lats checked is -89 to +89 (179 points)
        assert len(asc_points) < 179


class TestGeocodingAndDistances:
    """Test geopy integration and line distance solvers."""

    def test_geocode_known_city(self):
        """Ensure geopy correctly resolves a major city via Nominatim."""
        # Using a major city to ensure reliable return
        lat, lon, addr = geocode_city("London, UK")
        assert 51.0 < lat < 52.0
        assert -0.5 < lon < 0.5
        assert "London" in addr

    def test_geocode_unknown_city(self):
        with pytest.raises(ValueError):
            geocode_city("SomeFakeCityThatDoesNot_Exist_123456")

    def test_closest_distance_vertical_line(self):
        """MC/IC lines should compute straightforward longitude delta distance."""
        city_lat = 0.0
        city_lon = 0.0
        
        # A line exactly 1 degree east of the city on the equator
        line = {
            "angle_type": "MC",
            "longitude": 1.0,
            "points": None
        }
        
        dist = find_closest_distance_to_line(city_lat, city_lon, line)
        # 1 degree at equator is ~111km
        assert 110.0 < dist < 112.0

    def test_closest_distance_curve(self):
        """ASC/DSC closest point logic."""
        city_lat = 40.0
        city_lon = -74.0 # Roughly NYC
        
        # Craft a fake curve that passes exactly through NYC at lat 40
        line = {
            "angle_type": "ASC",
            "longitude": None,
            "points": [
                {"lat": 39.0, "lon": -75.0},
                {"lat": 40.0, "lon": -74.0}, # Exact hit
                {"lat": 41.0, "lon": -73.0},
            ]
        }
        
        dist = find_closest_distance_to_line(city_lat, city_lon, line)
        assert dist == 0.0

class TestE2EIntegration:
    """Integration style tests ensuring the engine orchestrates tools properly."""

    def test_compute_city_relocation_aspects(self):
        """Test the end-to-end relocation solver for a specific static date."""
        from engine.astrocartography import compute_city_relocation_aspects
        
        # Test an arbitrary moment: 2026-02-23 09:00 UTC
        dt = datetime(2026, 2, 23, 9, 0, tzinfo=timezone.utc)
        
        # Resolve for London
        results = compute_city_relocation_aspects(dt, "London, UK")
        
        assert results["city_query"] == "London, UK"
        assert "London" in results["resolved_address"]
        assert "closest_lines" in results
        
        lines = results["closest_lines"]
        # Should have results for all 10 planets and 4 angles (some might be inf if circumpolar)
        # We expect at minimum the MC/IC lines which never fail (10 planets * 2 angles = 20)
        assert len(lines) >= 20
        
        # Must be sorted by distance closest to furthest
        assert lines[0]["distance_km"] <= lines[-1]["distance_km"]

    def test_compute_all_lines_volume(self):
        """Ensure all 40 lines are fully generated."""
        from engine.astrocartography import compute_all_lines_for_jd
        
        # Arbitrary JD
        jd = 2460000.5
        lines = compute_all_lines_for_jd(jd)
        
        assert len(lines) == 40  # 10 planets * 4 angle types
