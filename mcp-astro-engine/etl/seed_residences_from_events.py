"""Seed residence_record from Astro-Databank 'Change residence' events.

Each subject's chronologically-sorted "Change residence" events define a
piecewise residence timeline:

    event_N.location  is active from event_N.date to event_{N+1}.date
    last event        is active from its date to subject's death_date (if known)
                                                 or end_is_open=true otherwise

Implements the residence-from-events path described in docs/ml-evaluation/01b
§4. Complements (not replaces) the Wikidata + Wikipedia geoparse passes that
same doc specifies.

Evidence tier for these residences = L-B:
  - The event itself is L-B (Astro-Databank, sourced from biography)
  - The inferred interval between events is less precise than a cited residence

Usage:
    python -m etl.seed_residences_from_events --db data/eval.db
"""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional


SEEDER_VERSION = "v1.0"


@dataclass
class ChangeResidenceEvent:
    event_id: str
    subject_id: str
    event_date: str           # ISO
    event_precision: str      # day|month|year
    destination_raw: str      # "Move to Paris to write"
    notes: str


def _parse_destination(text: str) -> Optional[str]:
    """Extract destination city from 'Move(d) to X' style descriptions.

    Handles:
      'Move to Paris to write'          -> 'Paris'
      'Moved to Key West, FL'           -> 'Key West, FL'
      'Move to Havana, Cuba'            -> 'Havana, Cuba'
      'Change residence: Moved to...'   -> stripped upstream
    Returns None if no recognizable destination found.
    """
    t = text.strip()
    # Strip "Change residence:" prefix if present
    t = re.sub(r"^change residence\s*:\s*", "", t, flags=re.I)
    # Match "Move(d|ment) to <dest>" up to end or a qualifying 'to/with/in'
    m = re.search(
        r"\bmove(?:d|ment)?\s+to\s+(.+?)(?:\s+to\s+|\s+with\s+|\s+in\s+\d|$)",
        t,
        re.I,
    )
    if not m:
        return None
    dest = m.group(1).strip(" .,:;")
    # Drop trailing context clauses
    dest = re.sub(r"\s+(?:to\s+.*|for\s+.*)$", "", dest, flags=re.I)
    return dest or None


def seed(db_path: str, replace: bool = True) -> dict:
    """Build residence_record rows from change-residence events.

    Args:
        db_path: SQLite path
        replace: if True, delete previously-seeded rows first (idempotent)
    """
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        cur = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()

        if replace:
            cur.execute(
                """DELETE FROM residence_record
                   WHERE extracted_by = 'seed_residences_from_events_v1'"""
            )

        # Pull every change-residence event, grouped by subject
        events_by_subj: dict[str, list[ChangeResidenceEvent]] = {}
        rows = cur.execute(
            """SELECT id, subject_id, event_date, event_precision, notes
               FROM event_record
               WHERE event_type = 'family'
                 AND notes LIKE 'Change residence:%'
               ORDER BY subject_id, event_date"""
        ).fetchall()
        for r in rows:
            ev = ChangeResidenceEvent(
                event_id=r["id"],
                subject_id=r["subject_id"],
                event_date=r["event_date"],
                event_precision=r["event_precision"],
                destination_raw=r["notes"],
                notes=r["notes"],
            )
            events_by_subj.setdefault(ev.subject_id, []).append(ev)

        stats = {"residences_created": 0, "events_with_no_destination": 0,
                 "subjects_touched": 0, "open_ended": 0}

        for sid, events in events_by_subj.items():
            stats["subjects_touched"] += 1

            # Fetch subject's death_date if available to close the final interval
            r = cur.execute(
                "SELECT death_date FROM subjects WHERE subject_id = ?", (sid,)
            ).fetchone()
            death_date = r["death_date"] if r else None

            events.sort(key=lambda e: e.event_date)
            for i, ev in enumerate(events):
                dest = _parse_destination(ev.destination_raw)
                if not dest:
                    stats["events_with_no_destination"] += 1
                    continue

                # End date = next event's start OR death_date OR null
                if i + 1 < len(events):
                    end_date = events[i + 1].event_date
                    end_prec = events[i + 1].event_precision
                    end_is_open = False
                elif death_date:
                    end_date = death_date
                    end_prec = "year"
                    end_is_open = False
                else:
                    end_date = None
                    end_prec = "unknown"
                    end_is_open = True
                    stats["open_ended"] += 1

                cur.execute(
                    """INSERT INTO residence_record (
                        id, subject_id, location_name, geoname_id,
                        wikidata_place_qid, latitude, longitude, country_iso,
                        start_date, start_precision, end_date, end_precision,
                        end_is_open, evidence_tier, sources, confidence,
                        extracted_by, notes, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        str(uuid.uuid4()),
                        sid,
                        dest,
                        None,
                        None,
                        None,
                        None,
                        None,
                        ev.event_date,
                        ev.event_precision,
                        end_date,
                        end_prec,
                        1 if end_is_open else 0,
                        "L-B",
                        json.dumps([{
                            "type": "astrodatabank",
                            "derived_from_event_id": ev.event_id,
                            "extracted_by": "seed_residences_from_events_v1",
                            "retrieved_at": now,
                            "raw_snippet": ev.destination_raw[:200],
                        }]),
                        0.70,
                        "seed_residences_from_events_v1",
                        f"Derived from 'Change residence' event. "
                        f"Destination parse: {ev.destination_raw[:120]}",
                        now,
                        now,
                    ),
                )
                stats["residences_created"] += 1

        conn.commit()
        return stats
    finally:
        conn.close()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default="data/eval.db")
    ap.add_argument(
        "--no-replace", action="store_true",
        help="Append rather than delete+replace (not idempotent)",
    )
    args = ap.parse_args()

    stats = seed(args.db, replace=not args.no_replace)
    print(f"Seeder version: {SEEDER_VERSION}")
    print(f"Subjects processed:        {stats['subjects_touched']}")
    print(f"Residences created:        {stats['residences_created']}")
    print(f"Open-ended (no end date):  {stats['open_ended']}")
    print(f"Events skipped (no dest):  {stats['events_with_no_destination']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
