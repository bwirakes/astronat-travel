"""Negative sampling for the evaluation pipeline.

Implements docs/ml-evaluation/02. Two negative types:
  - temporal: same (subject, location), different year
  - geographic: same (subject, date), different location

Key design points:
  - Seeded RNG: identical seed + dataset = identical EvalRows.
  - Per-goal labels only assigned to the goal being sampled for (Option 2
    in 02 §5). Other goals = null.
  - Path-dependency aware: each negative row gets features for
    `years_since_last_positive_event` and `trajectory_phase` so downstream
    analysis can stratify by where in the life arc the quiet year sits.
  - Respects event-buffer exclusions: ±3 months around any positive event
    (or outcome-window for C-cases) can't be a temporal negative.

Control-city pool in data/control_cities.csv. Continent-matched + era-matched
+ ≥100 km from the event location + not in subject's residence_record.
"""

from __future__ import annotations

import csv
import json
import sqlite3
from dataclasses import dataclass, field
from datetime import date, timedelta
from pathlib import Path
from typing import Optional

import numpy as np

from evaluation.row_builder import EvalRow, EvalRowLocation, _parse


NEGATIVE_SAMPLING_VERSION = "v1.0"

# Defaults per docs/ml-evaluation/02 §6
K_TEMPORAL = 3
K_GEOGRAPHIC = 5
EVENT_BUFFER_MONTHS = 3
MIN_RESIDENCE_MONTHS = 24
TEMPORAL_WINDOW_MONTHS = 12
MIN_KM_FROM_EVENT = 100.0
GEO_COHORT_K = 5                    # max controls per positive event

GOALS = ("love", "career", "community", "growth", "relocation")


# ---------------------------------------------------------------------------
# Control-city pool
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class ControlCity:
    geoname_id: int
    name: str
    country: str
    continent: str
    lat: float
    lon: float
    founded_year: int


def load_control_cities(path: str | Path) -> list[ControlCity]:
    out: list[ControlCity] = []
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            try:
                out.append(ControlCity(
                    geoname_id=int(r["geoname_id"]),
                    name=r["name"],
                    country=r["country"],
                    continent=r["continent"],
                    lat=float(r["lat"]),
                    lon=float(r["lon"]),
                    founded_year=int(r["founded_year"]),
                ))
            except (KeyError, ValueError):
                continue
    return out


# ---------------------------------------------------------------------------
# Geo helpers (simple haversine — no external dependency)
# ---------------------------------------------------------------------------


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    lat1r, lat2r = np.radians(lat1), np.radians(lat2)
    dlat = np.radians(lat2 - lat1)
    dlon = np.radians(lon2 - lon1)
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1r) * np.cos(lat2r) * np.sin(dlon / 2) ** 2
    return float(2 * R * np.arcsin(np.sqrt(a)))


# Rough continent assignment from lat/lon — used when the event's country_iso
# is missing or doesn't map cleanly. Order matches control_cities.csv buckets.
def _approx_continent(lat: float, lon: float) -> str:
    if -56 <= lat <= 12 and -82 <= lon <= -34:
        return "South America"
    if 12 < lat <= 83 and -170 <= lon <= -50:
        return "North America"
    if 35 <= lat <= 71 and -25 <= lon <= 60:
        return "Europe"
    if -35 <= lat <= 12 and -18 <= lon <= 55:
        return "Africa"
    if -50 <= lat <= -10 and 110 <= lon <= 180:
        return "Oceania"
    if -10 < lat <= 55 and 25 <= lon <= 180:
        return "Asia"
    return "Europe"   # default — common case for famous subjects


# ---------------------------------------------------------------------------
# Path-dependency features
# ---------------------------------------------------------------------------


def _years_since_last_positive(
    sample_date: date, subject_events: list[dict],
) -> Optional[float]:
    """Years between sample_date and the most recent prior +1 event (any goal).

    Returns None if no prior positive event exists.
    """
    prior_positive_dates: list[date] = []
    for e in subject_events:
        event_date = _parse(e["event_date"])
        if not event_date or event_date >= sample_date:
            continue
        try:
            polarity = json.loads(e["goal_polarity"] or "{}")
        except json.JSONDecodeError:
            continue
        if any(polarity.get(g) == 1 for g in GOALS):
            prior_positive_dates.append(event_date)
    if not prior_positive_dates:
        return None
    newest = max(prior_positive_dates)
    return (sample_date - newest).days / 365.25


def _trajectory_phase(
    sample_date: date, subject_events: list[dict], birth_date: Optional[date],
) -> str:
    """Coarse life-stage classification.

    - pre_first_event: before any labeled event
    - early (0-10y from first event)
    - mid (10-25y from first event)
    - late (>25y)
    - posthumous: sample_date after any observed death
    """
    event_dates = sorted([
        _parse(e["event_date"]) for e in subject_events
        if _parse(e["event_date"]) is not None
    ])
    if not event_dates:
        return "pre_first_event"
    first = event_dates[0]
    if sample_date < first:
        return "pre_first_event"
    years = (sample_date - first).days / 365.25
    if years <= 10:
        return "early"
    if years <= 25:
        return "mid"
    return "late"


# ---------------------------------------------------------------------------
# Temporal negative sampling
# ---------------------------------------------------------------------------


def _build_event_buffers(
    subject_events: list[dict], goal: str,
) -> list[tuple[date, date]]:
    """For one goal, return [start, end] windows to exclude from temporal
    negatives: the event date ±3mo, plus outcome window for C-cases."""
    buffers: list[tuple[date, date]] = []
    buffer = timedelta(days=30 * EVENT_BUFFER_MONTHS)
    for e in subject_events:
        try:
            polarity = json.loads(e["goal_polarity"] or "{}")
        except json.JSONDecodeError:
            continue
        if polarity.get(goal) not in (-1, 0, 1):
            continue
        event_date = _parse(e["event_date"])
        if not event_date:
            continue
        start = event_date - buffer
        end = event_date + buffer

        # Extend end by outcome-window for C-cases
        if polarity.get("is_c_case"):
            if goal == "love":
                end = max(end, event_date + timedelta(days=int(5 * 365.25)))
            elif goal == "relocation":
                end = max(end, event_date + timedelta(days=int(3 * 365.25)))
            elif goal == "career":
                end = max(end, event_date + timedelta(days=int(5 * 365.25)))
        buffers.append((start, end))
    return buffers


def _in_any_buffer(d: date, buffers: list[tuple[date, date]]) -> bool:
    return any(b_start <= d <= b_end for b_start, b_end in buffers)


def _partition_residence(
    residence: dict, subject_death: Optional[date],
) -> list[tuple[date, date]]:
    """Partition a residence interval into non-overlapping 12-month windows.

    Only returns windows where the full [start, end] falls inside the
    residence. Short residences (<24 months) return [].
    """
    start = _parse(residence["start_date"])
    end = _parse(residence["end_date"]) or subject_death
    if not start or not end:
        return []
    if (end - start).days < MIN_RESIDENCE_MONTHS * 30:
        return []

    windows: list[tuple[date, date]] = []
    cur = start
    step = timedelta(days=int(TEMPORAL_WINDOW_MONTHS * 30.44))
    while cur + step <= end:
        windows.append((cur, cur + step))
        cur = cur + step
    return windows


def sample_temporal_negatives(
    subject: dict,
    subject_events: list[dict],
    subject_residences: list[dict],
    goal: str,
    rng: np.random.Generator,
    k: int = K_TEMPORAL,
) -> list[dict]:
    """Per-goal temporal negative rows for a subject."""
    buffers = _build_event_buffers(subject_events, goal)

    # Build pool of candidate 12-month windows across all residences.
    death = _parse(subject.get("death_date"))
    candidates: list[tuple[date, date, dict]] = []
    for r in subject_residences:
        if r.get("latitude") is None or r.get("longitude") is None:
            continue
        for window_start, window_end in _partition_residence(r, death):
            # A candidate window is valid if neither endpoint falls in a buffer.
            mid = window_start + (window_end - window_start) / 2
            if _in_any_buffer(mid, buffers):
                continue
            if _in_any_buffer(window_start, buffers):
                continue
            if _in_any_buffer(window_end, buffers):
                continue
            candidates.append((window_start, window_end, r))

    if not candidates:
        return []

    # Count positive events for this goal to set target count
    positive_count = sum(
        1 for e in subject_events
        if json.loads(e.get("goal_polarity") or "{}").get(goal) == 1
    )
    target_n = max(k, positive_count * k) if positive_count else 0
    if target_n == 0:
        return []
    target_n = min(target_n, len(candidates))

    idx = rng.choice(len(candidates), size=target_n, replace=False)
    out: list[dict] = []
    for i in idx:
        window_start, window_end, residence = candidates[i]
        mid = window_start + (window_end - window_start) / 2

        years_since = _years_since_last_positive(mid, subject_events)
        phase = _trajectory_phase(
            mid, subject_events, _parse(subject.get("birth_date")),
        )

        out.append({
            "row_type": "temporal_neg",
            "goal": goal,
            "sample_date": mid.isoformat(),
            "window_start": window_start.isoformat(),
            "window_end": window_end.isoformat(),
            "location": EvalRowLocation(
                lat=float(residence["latitude"]),
                lon=float(residence["longitude"]),
                name=residence.get("location_name", ""),
                country_iso=residence.get("country_iso"),
            ),
            "years_since_last_positive": years_since,
            "trajectory_phase": phase,
        })
    return out


# ---------------------------------------------------------------------------
# Geographic negative sampling
# ---------------------------------------------------------------------------


def _filter_control_pool(
    event_lat: float,
    event_lon: float,
    event_date: date,
    subject_residences: list[dict],
    control_cities: list[ControlCity],
) -> list[ControlCity]:
    event_continent = _approx_continent(event_lat, event_lon)
    event_year = event_date.year

    # Locations the subject is known to have visited — exclude.
    visited: set[int] = set()
    for r in subject_residences:
        if r.get("geoname_id") is not None:
            try:
                visited.add(int(r["geoname_id"]))
            except (ValueError, TypeError):
                pass

    pool: list[ControlCity] = []
    for c in control_cities:
        if c.continent != event_continent:
            continue
        if c.founded_year > event_year - 50:
            continue
        if c.geoname_id in visited:
            continue
        if _haversine_km(event_lat, event_lon, c.lat, c.lon) < MIN_KM_FROM_EVENT:
            continue
        pool.append(c)
    return pool


def sample_geographic_negatives(
    event_row: dict,
    subject_residences: list[dict],
    control_cities: list[ControlCity],
    rng: np.random.Generator,
    k: int = K_GEOGRAPHIC,
) -> list[dict]:
    """For one positive event, emit k geographic negatives at control cities."""
    event_date = _parse(event_row["event_date"])
    if not event_date:
        return []
    event_lat = event_row.get("latitude")
    event_lon = event_row.get("longitude")
    if event_lat is None or event_lon is None:
        return []

    pool = _filter_control_pool(
        event_lat, event_lon, event_date, subject_residences, control_cities,
    )
    if not pool:
        return []

    n = min(k, len(pool))
    idx = rng.choice(len(pool), size=n, replace=False)
    out: list[dict] = []
    for i in idx:
        c = pool[i]
        out.append({
            "row_type": "geographic_neg",
            "goal": event_row.get("_goal"),     # caller annotates
            "sample_date": event_date.isoformat(),
            "window_start": event_date.isoformat(),
            "window_end": event_date.isoformat(),
            "location": EvalRowLocation(
                lat=c.lat, lon=c.lon, name=c.name, country_iso=c.country,
            ),
            "years_since_last_positive": None,
            "trajectory_phase": "counterfactual",
        })
    return out


# ---------------------------------------------------------------------------
# Orchestration (build negatives for an entire DB)
# ---------------------------------------------------------------------------


def _negative_eval_row(
    subject: dict, row_type: str, goal: str, sample_date: str,
    window_start: str, window_end: str, location: EvalRowLocation,
    years_since_last_positive: Optional[float], trajectory_phase: str,
    row_counter: list[int],
) -> EvalRow:
    row_counter[0] += 1
    polarity: dict[str, Optional[int]] = {g: None for g in GOALS}
    polarity[goal] = 0             # per 02 §5 Option 2
    polarity["is_c_case"] = False
    return EvalRow(
        row_id=f"{row_type}:{subject['subject_id']}:{goal}:{row_counter[0]}",
        subject_id=subject["subject_id"],
        subject_name=subject["full_name"],
        rodden_rating=subject["rodden_rating"],
        row_type=row_type,
        event_id=None,
        event_type=None,
        sample_date=sample_date,
        window_start=window_start,
        window_end=window_end,
        location=location,
        birth_date=subject["birth_date"],
        birth_time=subject["birth_time"],
        birth_lat=float(subject["birth_lat"]),
        birth_lon=float(subject["birth_lon"]),
        goal_polarity={
            **polarity,
            "_years_since_last_positive": years_since_last_positive,
            "_trajectory_phase": trajectory_phase,
        },
    )


def build_negative_rows(
    db_path: str,
    control_cities_csv: str | Path,
    seed: int = 42,
    k_temporal: int = K_TEMPORAL,
    k_geographic: int = K_GEOGRAPHIC,
) -> list[EvalRow]:
    """Generate temporal + geographic negatives for every AA/A/B subject."""
    rng = np.random.default_rng(seed)
    control_cities = load_control_cities(control_cities_csv)

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        cur = conn.cursor()
        subjects = cur.execute(
            """SELECT subject_id, full_name, birth_date, birth_time,
                      birth_lat, birth_lon, birth_country_iso,
                      birth_location_name, rodden_rating, death_date
               FROM subjects
               WHERE rodden_rating IN ('AA','A','B')"""
        ).fetchall()

        rows: list[EvalRow] = []
        counter = [0]

        for subj in subjects:
            sid = subj["subject_id"]
            events = [
                dict(r) for r in cur.execute(
                    "SELECT * FROM event_record WHERE subject_id = ?",
                    (sid,),
                ).fetchall()
            ]
            residences = [
                dict(r) for r in cur.execute(
                    "SELECT * FROM residence_record WHERE subject_id = ?",
                    (sid,),
                ).fetchall()
            ]
            subject_dict = dict(subj)

            # --- Temporal negatives, per goal
            for goal in GOALS:
                temporals = sample_temporal_negatives(
                    subject_dict, events, residences, goal, rng, k=k_temporal,
                )
                for t in temporals:
                    rows.append(_negative_eval_row(
                        subject_dict,
                        row_type="temporal_neg",
                        goal=goal,
                        sample_date=t["sample_date"],
                        window_start=t["window_start"],
                        window_end=t["window_end"],
                        location=t["location"],
                        years_since_last_positive=t["years_since_last_positive"],
                        trajectory_phase=t["trajectory_phase"],
                        row_counter=counter,
                    ))

            # --- Geographic negatives, per positive event
            for e in events:
                if not e.get("latitude") or not e.get("longitude"):
                    continue
                try:
                    polarity = json.loads(e.get("goal_polarity") or "{}")
                except json.JSONDecodeError:
                    continue
                for goal in GOALS:
                    if polarity.get(goal) != 1:
                        continue
                    event_dict = dict(e)
                    event_dict["_goal"] = goal
                    geos = sample_geographic_negatives(
                        event_dict, residences, control_cities, rng,
                        k=k_geographic,
                    )
                    for g in geos:
                        rows.append(_negative_eval_row(
                            subject_dict,
                            row_type="geographic_neg",
                            goal=goal,
                            sample_date=g["sample_date"],
                            window_start=g["window_start"],
                            window_end=g["window_end"],
                            location=g["location"],
                            years_since_last_positive=None,
                            trajectory_phase="counterfactual",
                            row_counter=counter,
                        ))
        return rows
    finally:
        conn.close()


def main() -> int:
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default="data/eval.db")
    ap.add_argument("--controls", default="data/control_cities.csv")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--k-temporal", type=int, default=K_TEMPORAL)
    ap.add_argument("--k-geographic", type=int, default=K_GEOGRAPHIC)
    args = ap.parse_args()

    rows = build_negative_rows(
        args.db, args.controls, seed=args.seed,
        k_temporal=args.k_temporal, k_geographic=args.k_geographic,
    )
    by_type: dict[str, int] = {}
    by_goal: dict[str, int] = {}
    by_phase: dict[str, int] = {}
    for r in rows:
        by_type[r.row_type] = by_type.get(r.row_type, 0) + 1
        for g in GOALS:
            if r.goal_polarity.get(g) == 0:
                by_goal[g] = by_goal.get(g, 0) + 1
        phase = r.goal_polarity.get("_trajectory_phase", "unknown")
        by_phase[phase] = by_phase.get(phase, 0) + 1

    print(f"Negative sampling version: {NEGATIVE_SAMPLING_VERSION}")
    print(f"Total negative rows:       {len(rows)}")
    print(f"By row_type:               {by_type}")
    print(f"By goal (Y=0 rows):        {by_goal}")
    print(f"By trajectory phase:       {by_phase}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
