#!/usr/bin/env python3
"""
test_utils.py — Unit tests for engine/utils.py

Validates the canonical birth_data_to_utc_dt() across positive, negative,
fractional, and day-boundary timezone offsets.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from engine.utils import birth_data_to_utc_dt


def test_positive_offset_sgt():
    """SGT+8: 15:57 local → 07:57 UTC (Natalia's birth)"""
    assert birth_data_to_utc_dt({
        "year": 1990, "month": 12, "day": 23,
        "hour": 15, "minute": 57, "timezone_offset": 8.0,
    }) == "1990-12-23 07:57"


def test_positive_offset_wib():
    """WIB+7: 22:15 local → 15:15 UTC (Brandon's birth)"""
    assert birth_data_to_utc_dt({
        "year": 1988, "month": 8, "day": 17,
        "hour": 22, "minute": 15, "timezone_offset": 7.0,
    }) == "1988-08-17 15:15"


def test_negative_offset_est():
    """EST-5: 10:00 local → 15:00 UTC, same day"""
    assert birth_data_to_utc_dt({
        "year": 2000, "month": 6, "day": 15,
        "hour": 10, "minute": 0, "timezone_offset": -5.0,
    }) == "2000-06-15 15:00"


def test_negative_offset_day_rollover():
    """EST-5: 01:00 local → 06:00 UTC, same day (no day change here)"""
    assert birth_data_to_utc_dt({
        "year": 2000, "month": 1, "day": 1,
        "hour": 1, "minute": 0, "timezone_offset": -5.0,
    }) == "2000-01-01 06:00"


def test_fractional_offset_india():
    """IST+5:30: 10:00 local → 04:30 UTC"""
    assert birth_data_to_utc_dt({
        "year": 2000, "month": 1, "day": 1,
        "hour": 10, "minute": 0, "timezone_offset": 5.5,
    }) == "2000-01-01 04:30"


def test_minute_rounding_no_overflow():
    """Ensure 59-minute values don't round up to 60."""
    result = birth_data_to_utc_dt({
        "year": 2000, "month": 6, "day": 1,
        "hour": 12, "minute": 59, "timezone_offset": 0.0,
    })
    assert result == "2000-06-01 12:59"


def test_zero_offset():
    """UTC+0: local time IS UTC."""
    assert birth_data_to_utc_dt({
        "year": 2026, "month": 3, "day": 1,
        "hour": 8, "minute": 30, "timezone_offset": 0.0,
    }) == "2026-03-01 08:30"
