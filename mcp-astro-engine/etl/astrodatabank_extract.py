"""Astro-Databank end-to-end extractor: Firecrawl fetch → BS4 parse → SQLite.

See docs/ml-evaluation/01 for the extraction spec.
HTML parsing lives in etl.astrodatabank_parse.

Usage:
    FIRECRAWL_API_KEY=fc-... python -m etl.astrodatabank_extract Hemingway,_Ernest
"""

from __future__ import annotations

import json
import sqlite3
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import requests

from etl.astrodatabank_parse import ParsedSubject, RawEvent, parse_html


FIRECRAWL_ENDPOINT = "https://api.firecrawl.dev/v1/scrape"
ASTRODATABANK_BASE = "https://www.astro.com/astro-databank/"
EXTRACTION_VERSION = "v1.0"


@dataclass
class ExtractionResult:
    subject: Optional[ParsedSubject]
    raw_html: str
    raw_metadata: dict
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


# ============================================================================
# Firecrawl fetch
# ============================================================================


def fetch_via_firecrawl(
    astrodatabank_id: str,
    api_key: str,
    wait_for_ms: int = 5000,
    timeout_s: int = 60,
) -> tuple[str, dict]:
    """Fetch HTML via Firecrawl stealth proxy.

    Astro-Databank serves a JS-based anti-bot interstitial on first request,
    so stealth + waitFor are required to get through.
    """
    url = ASTRODATABANK_BASE + astrodatabank_id
    payload = {
        "url": url,
        "formats": ["html"],
        "onlyMainContent": True,
        "waitFor": wait_for_ms,
        "proxy": "stealth",
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }
    resp = requests.post(
        FIRECRAWL_ENDPOINT, json=payload, headers=headers, timeout=timeout_s
    )
    resp.raise_for_status()
    body = resp.json()
    if not body.get("success"):
        raise RuntimeError(f"Firecrawl failed: {body.get('error', body)}")
    data = body.get("data") or {}
    html = data.get("html") or ""
    if len(html) < 2000:
        raise RuntimeError(
            f"Suspiciously short HTML ({len(html)} chars). "
            f"Likely hit the anti-bot interstitial. First 200 chars: {html[:200]}"
        )
    return html, data.get("metadata", {})


# ============================================================================
# Orchestration
# ============================================================================


def extract_subject(
    astrodatabank_id: str, api_key: str
) -> ExtractionResult:
    """Fetch + parse one subject. Errors are captured, not raised."""
    errors: list[str] = []
    warnings: list[str] = []
    html = ""
    metadata: dict = {}

    try:
        html, metadata = fetch_via_firecrawl(astrodatabank_id, api_key)
    except Exception as e:
        errors.append(f"fetch: {e}")
        return ExtractionResult(None, "", {}, errors, warnings)

    try:
        subject = parse_html(astrodatabank_id, html)
    except Exception as e:
        errors.append(f"parse: {e}")
        return ExtractionResult(None, html, metadata, errors, warnings)

    if subject.rodden_rating is None:
        warnings.append("Rodden rating not found")
    if subject.birth_date is None:
        warnings.append("Birth date not parsed")
    if subject.birth_time is None:
        warnings.append("Birth time not parsed (noon_default or unknown)")
    if subject.birth_lat is None:
        warnings.append("Birth coordinates not parsed")
    if not subject.raw_events:
        warnings.append("No events extracted")

    return ExtractionResult(subject, html, metadata, errors, warnings)


# ============================================================================
# Persistence
# ============================================================================


def upsert_subject(db_path: str | Path, subject: ParsedSubject) -> str:
    conn = sqlite3.connect(str(db_path))
    try:
        now = datetime.now(timezone.utc).isoformat()
        cur = conn.cursor()
        cur.execute(
            "SELECT subject_id FROM subjects WHERE astrodatabank_id = ?",
            (subject.astrodatabank_id,),
        )
        row = cur.fetchone()
        subject_id = row[0] if row else str(uuid.uuid4())

        values = {
            "subject_id": subject_id,
            "astrodatabank_id": subject.astrodatabank_id,
            "full_name": subject.full_name,
            "birth_date": subject.birth_date or "",
            "birth_time": subject.birth_time or "",
            "birth_time_precision": subject.birth_time_precision,
            "birth_location_name": subject.birth_location_name or "",
            "birth_geoname_id": None,
            "birth_lat": subject.birth_lat if subject.birth_lat is not None else 0.0,
            "birth_lon": subject.birth_lon if subject.birth_lon is not None else 0.0,
            "birth_country_iso": subject.birth_country_iso,
            "rodden_rating": subject.rodden_rating or "XX",
            "rating_source_notes": subject.rating_source_notes,
            "death_date": subject.death_date,
            "death_location": subject.death_location,
            "profession_tags": json.dumps(subject.profession_tags),
            "sex": subject.sex,
            "astrodatabank_url": subject.astrodatabank_url,
            "extracted_at": now,
            "extraction_version": EXTRACTION_VERSION,
            "has_events": 1 if subject.raw_events else 0,
        }

        cols = ",".join(values.keys())
        placeholders = ",".join(["?"] * len(values))
        cur.execute(
            f"INSERT OR REPLACE INTO subjects ({cols}) VALUES ({placeholders})",
            list(values.values()),
        )
        conn.commit()
        return subject_id
    finally:
        conn.close()


def upsert_events(
    db_path: str | Path, subject_id: str, events: list[RawEvent]
) -> int:
    """Write events. Sets evidence_tier=L-B (Astro-Databank default per 01 §4.2)
    and leaves goal_polarity empty — per-goal mapping is a downstream pass.

    Deletes any existing Astro-Databank-sourced events for the subject before
    inserting so re-runs are idempotent (events carry fresh UUIDs each run).
    Manually-curated events from other pipelines are preserved because they
    have a different ``sources[0].type``.
    """
    conn = sqlite3.connect(str(db_path))
    try:
        now = datetime.now(timezone.utc).isoformat()
        cur = conn.cursor()
        # Remove prior Astro-Databank events for this subject. We filter by
        # json_extract on sources[0].type so we don't trample manual or
        # Wikidata-sourced events.
        cur.execute(
            """DELETE FROM event_record
               WHERE subject_id = ?
                 AND json_extract(sources, '$[0].type') = 'astrodatabank'""",
            (subject_id,),
        )
        n = 0
        for evt in events:
            if not evt.date_iso:
                continue
            event_type = evt.category.lower().replace(" ", "_")
            notes = (
                f"{evt.subcategory}: {evt.description}"
                if evt.subcategory else evt.description
            )
            cur.execute(
                """INSERT OR REPLACE INTO event_record (
                    id, subject_id, event_type, event_date, event_precision,
                    location_geoname_id, location_name, latitude, longitude,
                    evidence_tier, sources, goal_polarity,
                    outcome_validated, outcome_notes, magnitude, notes,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    str(uuid.uuid4()),
                    subject_id,
                    event_type,
                    evt.date_iso,
                    evt.date_precision if evt.date_precision != "unknown" else "year",
                    None,
                    evt.location,
                    None,
                    None,
                    "L-B",
                    json.dumps([{
                        "type": "astrodatabank",
                        "retrieved_at": now,
                        "extracted_by": "astrodatabank_parse_v1",
                        "raw_snippet": evt.date_raw,
                    }]),
                    json.dumps({}),
                    0,
                    None,
                    None,
                    notes,
                    now,
                    now,
                ),
            )
            n += 1
        conn.commit()
        return n
    finally:
        conn.close()


# ============================================================================
# CLI
# ============================================================================


def main() -> int:
    import argparse
    import os
    import sys

    parser = argparse.ArgumentParser(
        description="Extract one Astro-Databank subject via Firecrawl"
    )
    parser.add_argument("astrodatabank_id")
    parser.add_argument(
        "--api-key", default=os.environ.get("FIRECRAWL_API_KEY")
    )
    parser.add_argument("--db", default="data/eval.db")
    parser.add_argument(
        "--save-html", default=None, help="Save raw HTML to this path"
    )
    args = parser.parse_args()

    if not args.api_key:
        print(
            "ERROR: Firecrawl API key required (--api-key or FIRECRAWL_API_KEY)",
            file=sys.stderr,
        )
        return 2

    print(f"Extracting: {args.astrodatabank_id}")
    result = extract_subject(args.astrodatabank_id, args.api_key)

    if args.save_html:
        Path(args.save_html).write_text(result.raw_html)
        print(f"  HTML saved to {args.save_html}")

    if result.errors:
        for e in result.errors:
            print(f"  ERROR: {e}", file=sys.stderr)
        return 1

    s = result.subject
    assert s is not None
    print(f"  Name:         {s.full_name}")
    print(f"  Birthname:    {s.birthname}")
    print(f"  Sex:          {s.sex}")
    print(f"  Birth date:   {s.birth_date}")
    print(f"  Birth time:   {s.birth_time} ({s.birth_time_precision})")
    print(f"  Birthplace:   {s.birth_location_name} [{s.birth_country_iso}]")
    print(f"  Coords:       {s.birth_lat}, {s.birth_lon}")
    print(f"  Rodden:       {s.rodden_rating}  (collector: {s.rating_collector})")
    print(f"  Source:       {s.rating_source_notes}")
    print(f"  Died:         {s.death_date}  ({s.death_notes})")
    print(f"  Professions:  {s.profession_tags}")
    print(f"  Events ({len(s.raw_events)}):")
    for evt in s.raw_events:
        sub = f"[{evt.subcategory}] " if evt.subcategory else ""
        print(
            f"    {evt.date_iso} ({evt.date_precision:>5}) "
            f"{evt.category:<14} {sub}{evt.description[:70]}"
        )

    for w in result.warnings:
        print(f"  warn: {w}")

    subject_id = upsert_subject(args.db, s)
    n_events = upsert_events(args.db, subject_id, s.raw_events)
    print(f"\n  → subject_id={subject_id}  events written={n_events}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
