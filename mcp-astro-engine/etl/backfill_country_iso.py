"""Reverse-geocode birth_lat/lon → birth_country_iso for every subject.

Offline GeoNames lookup via reverse_geocoder. No network calls, deterministic.

Usage:
    python -m etl.backfill_country_iso --db data/eval.db
"""

from __future__ import annotations

import argparse
import sqlite3
from datetime import datetime, timezone

import reverse_geocoder as rg


def run(db_path: str, only_missing: bool = True) -> dict:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        cur = conn.cursor()
        where = "birth_country_iso IS NULL OR birth_country_iso = ''"
        if not only_missing:
            where = "1=1"
        rows = cur.execute(
            f"""SELECT subject_id, full_name, birth_lat, birth_lon,
                       birth_country_iso
                FROM subjects WHERE {where}"""
        ).fetchall()

        coords: list[tuple[float, float]] = []
        subject_ids: list[str] = []
        for r in rows:
            if r["birth_lat"] is None or r["birth_lon"] is None:
                continue
            if r["birth_lat"] == 0 and r["birth_lon"] == 0:
                continue       # sentinel for unknown
            coords.append((r["birth_lat"], r["birth_lon"]))
            subject_ids.append(r["subject_id"])

        if not coords:
            return {"updated": 0, "skipped_no_coords": len(rows)}

        # Batch reverse geocoding — one library call handles all
        results = rg.search(coords, mode=2)  # single-threaded, deterministic

        now = datetime.now(timezone.utc).isoformat()
        n_updated = 0
        for sid, result in zip(subject_ids, results):
            iso = result.get("cc")
            if not iso:
                continue
            cur.execute(
                "UPDATE subjects SET birth_country_iso = ?, extracted_at = ? "
                "WHERE subject_id = ?",
                (iso, now, sid),
            )
            n_updated += 1
        conn.commit()

        return {
            "updated": n_updated,
            "skipped_no_coords": len(rows) - len(coords),
            "total_candidates": len(rows),
        }
    finally:
        conn.close()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default="data/eval.db")
    ap.add_argument(
        "--all", action="store_true",
        help="Re-geocode everyone, not just rows with missing country",
    )
    args = ap.parse_args()

    stats = run(args.db, only_missing=not args.all)
    print(f"Updated: {stats['updated']}")
    print(f"Skipped (no coords):  {stats['skipped_no_coords']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
