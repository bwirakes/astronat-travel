"""Build EvalRows from the eval.db tables for the evaluation pipeline.

Per docs/ml-evaluation/04 §4.2 Stage 1. Phase 1 scope: positive rows only.

Each positive event becomes one EvalRow tagged with the event's goal_polarity
map (populated by etl.map_event_polarity and validated by etl.outcome_window).
The row's `location` is the residence covering the event date (if one exists)
or the subject's birthplace as a fallback.

Negative sampling (temporal + geographic per docs/ml-evaluation/02) is the
follow-up pass — not emitted here.
"""

from __future__ import annotations

import json
import sqlite3
import uuid
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Optional


ROW_BUILDER_VERSION = "v0.1-positive-only"


@dataclass
class EvalRowLocation:
    lat: float
    lon: float
    name: str
    country_iso: Optional[str] = None


@dataclass
class EvalRow:
    row_id: str
    subject_id: str
    subject_name: str
    rodden_rating: str             # "AA" | "A" | "B"
    row_type: str                  # "positive" | "temporal_neg" | "geographic_neg"
    event_id: Optional[str]        # source event for positive rows
    event_type: Optional[str]
    sample_date: str               # ISO date used for transits
    window_start: str
    window_end: str
    location: EvalRowLocation
    birth_date: str
    birth_time: str
    birth_lat: float
    birth_lon: float
    goal_polarity: dict            # {love: +1/-1/0/null, ...}


def _parse(s: Optional[str]) -> Optional[date]:
    if not s:
        return None
    try:
        return date.fromisoformat(s[:10])
    except Exception:
        return None


def _residence_at(
    cur: sqlite3.Cursor, subject_id: str, when: date
) -> Optional[tuple]:
    """Return the residence_record that covers `when` for this subject, or
    None if nothing matches. Preference: L-A > L-B.
    """
    rows = cur.execute(
        """SELECT location_name, latitude, longitude, country_iso,
                  start_date, end_date, evidence_tier
           FROM residence_record
           WHERE subject_id = ?""",
        (subject_id,),
    ).fetchall()
    best = None
    for r in rows:
        start = _parse(r["start_date"])
        end = _parse(r["end_date"])
        if start and when < start:
            continue
        if end and when > end:
            continue
        if r["latitude"] is None or r["longitude"] is None:
            continue
        if best is None or _tier_rank(r["evidence_tier"]) > _tier_rank(best["evidence_tier"]):
            best = r
    return best


def _tier_rank(t: Optional[str]) -> int:
    return {"L-AA": 4, "L-A": 3, "L-B": 2, "L-C": 1}.get(t or "", 0)


def build_positive_rows(db_path: str) -> list[EvalRow]:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        cur = conn.cursor()
        subjects = {
            r["subject_id"]: r
            for r in cur.execute(
                """SELECT subject_id, full_name, birth_date, birth_time,
                          birth_lat, birth_lon, birth_country_iso,
                          birth_location_name, rodden_rating
                   FROM subjects
                   WHERE rodden_rating IN ('AA', 'A', 'B')"""
            ).fetchall()
        }

        events = cur.execute(
            """SELECT id, subject_id, event_type, event_date, notes, goal_polarity
               FROM event_record
               WHERE goal_polarity IS NOT NULL AND goal_polarity != '{}'"""
        ).fetchall()

        rows: list[EvalRow] = []
        for e in events:
            subj = subjects.get(e["subject_id"])
            if not subj:
                continue
            event_date = _parse(e["event_date"])
            if not event_date:
                continue
            gp = json.loads(e["goal_polarity"])
            # Drop rows where every goal is null — no training signal.
            has_signal = any(
                gp.get(g) in (-1, 0, 1)
                for g in ("love", "career", "community", "growth", "relocation")
            )
            if not has_signal:
                continue

            resid = _residence_at(cur, e["subject_id"], event_date)
            if resid:
                loc = EvalRowLocation(
                    lat=float(resid["latitude"]),
                    lon=float(resid["longitude"]),
                    name=resid["location_name"],
                    country_iso=resid["country_iso"],
                )
            else:
                loc = EvalRowLocation(
                    lat=float(subj["birth_lat"]),
                    lon=float(subj["birth_lon"]),
                    name=subj["birth_location_name"] or "",
                    country_iso=subj["birth_country_iso"],
                )

            # Window = ±3 months around event_date for point events
            window_start = f"{event_date.year}-{event_date.month:02d}-01"
            window_end = event_date.isoformat()

            rows.append(EvalRow(
                row_id=f"pos:{e['id']}",
                subject_id=subj["subject_id"],
                subject_name=subj["full_name"],
                rodden_rating=subj["rodden_rating"],
                row_type="positive",
                event_id=e["id"],
                event_type=e["event_type"],
                sample_date=event_date.isoformat(),
                window_start=window_start,
                window_end=window_end,
                location=loc,
                birth_date=subj["birth_date"],
                birth_time=subj["birth_time"],
                birth_lat=float(subj["birth_lat"]),
                birth_lon=float(subj["birth_lon"]),
                goal_polarity=gp,
            ))
        return rows
    finally:
        conn.close()


def main() -> int:
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default="data/eval.db")
    args = ap.parse_args()

    rows = build_positive_rows(args.db)
    print(f"Row builder {ROW_BUILDER_VERSION}: {len(rows)} positive rows")
    # Summary per subject
    by_subj: dict[str, int] = {}
    for r in rows:
        by_subj[r.subject_name] = by_subj.get(r.subject_name, 0) + 1
    print(f"Subjects with rows: {len(by_subj)}")
    print(f"Top 10 by row count:")
    for name, n in sorted(by_subj.items(), key=lambda kv: -kv[1])[:10]:
        print(f"  {n:3d}  {name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
