"""Wikidata enrichment: resolve QIDs, then pull P551 residences per subject.

Implements docs/ml-evaluation/01b §4.1. Wikidata is CC0, no scraping barriers,
no API keys required. Two-phase flow:

  Phase A — resolve QID for each subject via wbsearchentities (name search)
            then filter candidates by P569 birth-date match.
  Phase B — SPARQL query P551 statements with P580/P582 qualifiers for each
            resolved QID. Resolve place coordinates in a follow-up batch call.

Evidence tier per 01b §4.1:
  * Both P580 and P582 qualifiers present (year+ precision): L-A
  * One qualifier missing: L-B
  * No qualifiers: L-C (excluded from Phase 1 per 01 §3)

Usage:
    python -m etl.wikidata_residence --db data/eval.db
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

import requests


WD_API = "https://www.wikidata.org/w/api.php"
WDQS = "https://query.wikidata.org/sparql"
USER_AGENT = "astronat-research/0.1 (evaluation framework; contact: <tbd>)"

ENRICHER_VERSION = "v1.0"


# ============================================================================
# Phase A: resolve Wikidata QIDs
# ============================================================================


@dataclass
class QidCandidate:
    qid: str
    label: str
    description: str


def search_wikidata(name: str, limit: int = 8) -> list[QidCandidate]:
    """wbsearchentities — returns candidate QIDs by name match."""
    params = {
        "action": "wbsearchentities",
        "search": name,
        "language": "en",
        "format": "json",
        "limit": limit,
        "type": "item",
    }
    resp = requests.get(
        WD_API, params=params, headers={"User-Agent": USER_AGENT}, timeout=15
    )
    resp.raise_for_status()
    data = resp.json()
    return [
        QidCandidate(
            qid=r["id"], label=r.get("label", ""), description=r.get("description", ""),
        )
        for r in data.get("search", [])
    ]


def check_birth_date(qid: str, expected_date: str) -> bool:
    """Return True if the entity's P569 matches expected_date (YYYY-MM-DD).

    SPARQL is more reliable than parsing wbgetentities JSON because qualifiers
    vary. One round-trip per candidate — we only call this on the top few.
    """
    query = f"""SELECT ?birth WHERE {{ wd:{qid} wdt:P569 ?birth }}"""
    try:
        resp = requests.get(
            WDQS,
            params={"query": query, "format": "json"},
            headers={"User-Agent": USER_AGENT, "Accept": "application/sparql-results+json"},
            timeout=15,
        )
        resp.raise_for_status()
    except Exception:
        return False
    bindings = resp.json().get("results", {}).get("bindings", [])
    for b in bindings:
        dt = b.get("birth", {}).get("value", "")
        if dt.startswith(expected_date):
            return True
    return False


def resolve_qid(
    full_name: str, birth_date: str, birthname: Optional[str] = None
) -> Optional[str]:
    """Resolve a subject to a Wikidata QID by name + birth-date match.

    Returns the QID of the first candidate whose P569 matches ``birth_date``
    (YYYY-MM-DD). Tries the birthname first if provided (closer match for
    people with stage names).
    """
    # Try several name forms — Astro-Databank stores "Lastname, Firstname"
    query_names: list[str] = []
    if birthname:
        query_names.append(birthname)
    # "Lastname, Firstname" → "Firstname Lastname"
    if "," in full_name:
        last, _, first = full_name.partition(",")
        query_names.append(f"{first.strip()} {last.strip()}")
    query_names.append(full_name)

    seen: set[str] = set()
    for name in query_names:
        if name in seen:
            continue
        seen.add(name)
        try:
            candidates = search_wikidata(name, limit=5)
        except Exception:
            continue
        for cand in candidates:
            if check_birth_date(cand.qid, birth_date):
                return cand.qid
            time.sleep(0.2)  # polite
    return None


# ============================================================================
# Phase B: pull residences for each QID
# ============================================================================


@dataclass
class WikidataResidence:
    place_qid: str
    place_label: str
    lat: Optional[float]
    lon: Optional[float]
    country_iso: Optional[str]
    start_date: Optional[str]      # ISO
    end_date: Optional[str]
    evidence_tier: str             # L-A | L-B | L-C


def fetch_residences_for_qid(qid: str) -> list[WikidataResidence]:
    """SPARQL for P551 statements with optional P580/P582/coords/country."""
    query = f"""SELECT ?place ?placeLabel ?coord ?countryIso ?start ?end WHERE {{
        wd:{qid} p:P551 ?stmt .
        ?stmt ps:P551 ?place .
        OPTIONAL {{ ?stmt pq:P580 ?start . }}
        OPTIONAL {{ ?stmt pq:P582 ?end . }}
        OPTIONAL {{ ?place wdt:P625 ?coord . }}
        OPTIONAL {{
            ?place wdt:P17 ?country .
            ?country wdt:P297 ?countryIso .
        }}
        SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en" . }}
    }}"""
    resp = requests.get(
        WDQS,
        params={"query": query, "format": "json"},
        headers={"User-Agent": USER_AGENT, "Accept": "application/sparql-results+json"},
        timeout=20,
    )
    resp.raise_for_status()
    bindings = resp.json().get("results", {}).get("bindings", [])

    residences = []
    for b in bindings:
        place_uri = b["place"]["value"]
        place_qid = place_uri.rsplit("/", 1)[-1]
        place_label = b.get("placeLabel", {}).get("value", place_qid)
        iso = b.get("countryIso", {}).get("value")

        # Coord — parse "Point(lon lat)"
        lat = lon = None
        coord = b.get("coord", {}).get("value")
        if coord and coord.startswith("Point("):
            try:
                inner = coord[6:-1]
                lon_s, lat_s = inner.split()
                lon, lat = float(lon_s), float(lat_s)
            except Exception:
                pass

        start = b.get("start", {}).get("value", "")[:10] or None
        end = b.get("end", {}).get("value", "")[:10] or None

        if start and end:
            tier = "L-A"
        elif start or end:
            tier = "L-B"
        else:
            tier = "L-C"

        residences.append(WikidataResidence(
            place_qid=place_qid,
            place_label=place_label,
            lat=lat,
            lon=lon,
            country_iso=iso,
            start_date=start,
            end_date=end,
            evidence_tier=tier,
        ))
    return residences


# ============================================================================
# Orchestration
# ============================================================================


def run(db_path: str, throttle_s: float = 0.5) -> dict:
    """Resolve QIDs and import P551 residences for every AA subject."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        cur = conn.cursor()

        subjects = cur.execute(
            """SELECT subject_id, full_name, birth_date, rating_source_notes
               FROM subjects WHERE rodden_rating = 'AA'"""
        ).fetchall()

        # Read existing QIDs from previous runs (store in a side column? for now,
        # we check notes field of residence_record to dedupe on place_qid).
        # We'll use INSERT OR IGNORE-style dedupe by (subject_id, place_qid,
        # start_date) — done per-row below.

        stats = {
            "subjects_total": len(subjects),
            "qids_resolved": 0,
            "qids_missing": 0,
            "residences_added": 0,
            "tier_breakdown": {"L-A": 0, "L-B": 0, "L-C": 0},
            "failed_qids": [],
        }

        now = datetime.now(timezone.utc).isoformat()

        # Clear prior Wikidata residences to keep this pass idempotent.
        cur.execute(
            """DELETE FROM residence_record
               WHERE extracted_by = 'wikidata_residence_v1'"""
        )

        for i, row in enumerate(subjects, 1):
            sid = row["subject_id"]
            name = row["full_name"]
            birth_date = row["birth_date"]

            print(f"  [{i:2d}/{len(subjects)}] {name:<28}", end=" ", flush=True)
            qid = resolve_qid(name, birth_date)

            if not qid:
                stats["qids_missing"] += 1
                stats["failed_qids"].append(name)
                print("no QID match")
                continue
            stats["qids_resolved"] += 1
            time.sleep(throttle_s)

            try:
                residences = fetch_residences_for_qid(qid)
            except Exception as e:
                print(f"QID {qid} — fetch failed: {e}")
                time.sleep(throttle_s)
                continue

            for r in residences:
                if r.evidence_tier == "L-C":
                    # Phase 1 excludes L-C per 01 §3
                    continue
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
                        r.place_label,
                        None,
                        r.place_qid,
                        r.lat,
                        r.lon,
                        r.country_iso,
                        r.start_date,
                        "year",
                        r.end_date,
                        "year",
                        1 if r.end_date is None else 0,
                        r.evidence_tier,
                        json.dumps([{
                            "type": "wikidata",
                            "qid": qid,
                            "place_qid": r.place_qid,
                            "extracted_by": "wikidata_residence_v1",
                            "retrieved_at": now,
                            "url": f"https://www.wikidata.org/wiki/{qid}#P551",
                        }]),
                        0.95 if r.evidence_tier == "L-A" else 0.75,
                        "wikidata_residence_v1",
                        f"Wikidata P551 residence. Tier: {r.evidence_tier}",
                        now,
                        now,
                    ),
                )
                stats["residences_added"] += 1
                stats["tier_breakdown"][r.evidence_tier] += 1

            print(f"QID={qid} residences={len(residences)}")
            time.sleep(throttle_s)

        conn.commit()
        return stats
    finally:
        conn.close()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default="data/eval.db")
    ap.add_argument("--throttle", type=float, default=0.5)
    args = ap.parse_args()

    print(f"Wikidata residence enrichment — version {ENRICHER_VERSION}")
    print()
    stats = run(args.db, throttle_s=args.throttle)
    print()
    print(f"QIDs resolved:       {stats['qids_resolved']}/{stats['subjects_total']}")
    print(f"QIDs missing:        {stats['qids_missing']}")
    print(f"Residences added:    {stats['residences_added']}")
    print(f"Tier breakdown:      {stats['tier_breakdown']}")
    if stats["failed_qids"]:
        print(f"\nSubjects without QID match:")
        for name in stats["failed_qids"]:
            print(f"  - {name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
