"""Batch extractor for Astro-Databank subjects.

Caches raw HTML to disk — each subject is fetched exactly once per URL. Re-runs
read from cache (free; no Firecrawl credits). Rate-limited to 2s between
Firecrawl calls per docs/ml-evaluation/01 §4.3.

Usage:
    FIRECRAWL_API_KEY=fc-... python -m etl.astrodatabank_batch
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from etl.astrodatabank_extract import (
    fetch_via_firecrawl,
    upsert_events,
    upsert_subject,
)
from etl.astrodatabank_parse import parse_html


CACHE_DIR = Path("data/raw/astrodatabank_cache")
BATCH_LOG = Path("data/raw/batch_runs.jsonl")


@dataclass
class BatchItem:
    status: str          # 'ok' | 'fail' | 'cached'
    subject_id: Optional[str]
    astrodatabank_id: str
    rodden_rating: Optional[str]
    n_events: int
    error: Optional[str]
    used_credit: bool


def extract_with_cache(
    astrodatabank_id: str,
    api_key: str,
    db_path: str,
    delay_s: float = 2.0,
) -> BatchItem:
    """Fetch (or load from cache), parse, write to DB."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_path = CACHE_DIR / f"{astrodatabank_id}.html"

    used_credit = False
    if cache_path.exists() and cache_path.stat().st_size > 2000:
        html = cache_path.read_text()
    else:
        try:
            html, _meta = fetch_via_firecrawl(astrodatabank_id, api_key)
            cache_path.write_text(html)
            used_credit = True
        except Exception as e:
            return BatchItem(
                status="fail",
                subject_id=None,
                astrodatabank_id=astrodatabank_id,
                rodden_rating=None,
                n_events=0,
                error=f"fetch: {e}",
                used_credit=False,
            )
        if delay_s > 0:
            time.sleep(delay_s)

    try:
        subject = parse_html(astrodatabank_id, html)
    except Exception as e:
        return BatchItem(
            status="fail",
            subject_id=None,
            astrodatabank_id=astrodatabank_id,
            rodden_rating=None,
            n_events=0,
            error=f"parse: {e}",
            used_credit=used_credit,
        )

    # Phase 1.5 cohort: accept AA/A/B; reject C/DD/X/XX/None.
    ACCEPTED_RATINGS = {"AA", "A", "B"}
    if subject.rodden_rating not in ACCEPTED_RATINGS:
        return BatchItem(
            status="fail",
            subject_id=None,
            astrodatabank_id=astrodatabank_id,
            rodden_rating=subject.rodden_rating,
            n_events=0,
            error=f"rating {subject.rodden_rating} below A/B threshold",
            used_credit=used_credit,
        )

    sid = upsert_subject(db_path, subject)
    n = upsert_events(db_path, sid, subject.raw_events)
    return BatchItem(
        status="cached" if not used_credit else "ok",
        subject_id=sid,
        astrodatabank_id=astrodatabank_id,
        rodden_rating=subject.rodden_rating,
        n_events=n,
        error=None,
        used_credit=used_credit,
    )


# ============================================================================
# The subject list
# ============================================================================
#
# Diversity targets (soft, per docs/ml-evaluation/01 §3):
#   - Gender: ≥ 30% female
#   - Profession mix across artists, scientists, politicians, athletes, business
#   - Era: some pre-1950, some post-1950
#
# If a slug 404s, the fetch fails but the batch continues. Bad slugs are
# reported in the run summary and can be retried with corrected slugs.

SUBJECTS = [
    # Writers / artists
    "Hemingway,_Ernest",
    "Plath,_Sylvia",
    "Warhol,_Andy",
    "Picasso,_Pablo",
    "Dali,_Salvador",
    "Kahlo,_Frida",
    "Camus,_Albert",
    "Sartre,_Jean-Paul",
    "Beauvoir,_Simone_de",
    "Chaplin,_Charlie",

    # Musicians / performers
    "Presley,_Elvis",
    "Monroe,_Marilyn",
    "Dylan,_Bob",
    "Jackson,_Michael",
    "Sinatra,_Frank",
    "Streisand,_Barbra",
    "Garland,_Judy",
    "Holiday,_Billie",
    "Hepburn,_Audrey",
    "Pacino,_Al",

    # Scientists / thinkers
    "Einstein,_Albert",
    "Curie,_Marie",
    "Hawking,_Stephen",
    "Sagan,_Carl",
    "Freud,_Sigmund",
    "Jung,_Carl",
    "Tesla,_Nikola",

    # Politicians / leaders
    "Kennedy,_John_F.",
    "Obama,_Barack",
    "Clinton,_Bill",
    "Clinton,_Hillary",
    "Churchill,_Winston",
    "Thatcher,_Margaret",
    "Reagan,_Ronald",
    "Nixon,_Richard",
    "Castro,_Fidel",
    "Gandhi,_Mohandas",

    # Athletes
    "Ali,_Muhammad",
    "Williams,_Serena",

    # Royalty
    "Diana,_Princess_of_Wales",

    # --- Second pass: modern celebs (likelier to be AA due to hospital records)
    "Winfrey,_Oprah",
    "Madonna",
    "Prince",
    "Lennon,_John",
    "McCartney,_Paul",
    "Jagger,_Mick",
    "Joplin,_Janis",
    "Bowie,_David",
    "Hendrix,_Jimi",
    "Swift,_Taylor",
    "DiCaprio,_Leonardo",
    "Pitt,_Brad",
    "Jolie,_Angelina",
    "Cruise,_Tom",
    "Streep,_Meryl",
    "Roberts,_Julia",
    "Depp,_Johnny",
    "Carrey,_Jim",
    "Hathaway,_Anne",
    "Gaga,_Lady",

    # Fixed slug retries
    "Chaplin,_Charles",     # was "Charlie" — placeholder

    # --- Third pass: likelier AA candidates (US presidents, astrologers,
    # classical Hollywood stars, modern athletes with well-documented births)
    "Roosevelt,_Franklin_D.",
    "Eisenhower,_Dwight_D.",
    "Ford,_Gerald",
    "Carter,_Jimmy",
    "Trump,_Donald",
    "Biden,_Joe",
    "Bush,_George_W.",
    "Rudhyar,_Dane",         # astrologer — collectors keep own data
    "Arroyo,_Stephen",
    "Brando,_Marlon",
    "Taylor,_Elizabeth",
    "Davis,_Bette",
    "Crawford,_Joan",
    "Vonnegut,_Kurt",
    "Angelou,_Maya",
    "Jordan,_Michael",
    "Tyson,_Mike",
    "Agassi,_Andre",
    "Federer,_Roger",
    "Huxley,_Aldous",

    # --- Fourth pass: Phase 1.5 cohort expansion.
    # Targeting likely A/B ratings (historical figures, classical musicians,
    # non-Western subjects) to significantly expand the eval set beyond the
    # original AA-only cohort.

    # US presidents / historical politicians
    "Lincoln,_Abraham",
    "Roosevelt,_Theodore",
    "Jefferson,_Thomas",
    "Washington,_George",
    "Truman,_Harry",
    "Johnson,_Lyndon",
    "Bush,_George_H.W.",
    "Kennedy,_Robert",
    "Kennedy,_Jacqueline",

    # Classical composers
    "Mozart,_Wolfgang",
    "Beethoven,_Ludwig_van",
    "Bach,_Johann_Sebastian",
    "Chopin,_Frederic",
    "Schubert,_Franz",
    "Wagner,_Richard",
    "Tchaikovsky,_Peter",
    "Debussy,_Claude",
    "Stravinsky,_Igor",

    # Writers (pre-1950)
    "Shakespeare,_William",
    "Tolstoy,_Leo",
    "Dostoevsky,_Fyodor",
    "Dickens,_Charles",
    "Austen,_Jane",
    "Woolf,_Virginia",
    "Joyce,_James",
    "Kafka,_Franz",
    "Twain,_Mark",
    "Orwell,_George",

    # Scientists
    "Newton,_Isaac",
    "Darwin,_Charles",
    "Galileo_Galilei",
    "Bohr,_Niels",
    "Planck,_Max",
    "Heisenberg,_Werner",
    "Pauling,_Linus",

    # Actors (likely A)
    "Hanks,_Tom",
    "Washington,_Denzel",
    "Nicholson,_Jack",
    "Redford,_Robert",
    "Penn,_Sean",
    "Kidman,_Nicole",
    "Winslet,_Kate",
    "Blanchett,_Cate",
    "Portman,_Natalie",
    "Johansson,_Scarlett",
    "Hoffman,_Dustin",
    "De_Niro,_Robert",

    # Musicians
    "Cash,_Johnny",
    "Cohen,_Leonard",
    "Springsteen,_Bruce",
    "Joel,_Billy",
    "John,_Elton",
    "Cobain,_Kurt",
    "Zappa,_Frank",
    "Clapton,_Eric",
    "Beyonce,_Knowles",
    "Rihanna",
    "Perry,_Katy",

    # Non-Western / diversity
    "Mandela,_Nelson",
    "King,_Martin_Luther,_Jr.",
    "Malcolm_X",
    "Lee,_Bruce",
    "Murakami,_Haruki",
    "Akihito",
    "Yukio_Mishima",
    "Frida_Kahlo_II",        # placeholder if disambig exists
    "Borges,_Jorge_Luis",
    "Neruda,_Pablo",

    # Athletes
    "Phelps,_Michael",
    "Bolt,_Usain",
    "Woods,_Tiger",
    "Messi,_Lionel",
    "Ronaldo,_Cristiano",

    # Philosophers / thinkers
    "Nietzsche,_Friedrich",
    "Kant,_Immanuel",
    "Wittgenstein,_Ludwig",
    "Foucault,_Michel",
]


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Batch-extract Astro-Databank subjects via Firecrawl"
    )
    ap.add_argument("--api-key", default=os.environ.get("FIRECRAWL_API_KEY"))
    ap.add_argument("--db", default="data/eval.db")
    ap.add_argument(
        "--subjects", nargs="*", default=None,
        help="Override subject list (space-separated slugs)",
    )
    ap.add_argument(
        "--limit", type=int, default=None,
        help="Cap number of subjects (for testing)",
    )
    ap.add_argument(
        "--delay", type=float, default=2.0,
        help="Seconds between Firecrawl calls (respects astro.com crawl-delay)",
    )
    args = ap.parse_args()

    if not args.api_key:
        print("ERROR: need --api-key or FIRECRAWL_API_KEY env var", file=sys.stderr)
        return 2

    subjects = args.subjects or SUBJECTS
    if args.limit:
        subjects = subjects[: args.limit]

    started = datetime.now(timezone.utc).isoformat()
    results: list[BatchItem] = []

    print(f"Batch: {len(subjects)} subjects, db={args.db}, delay={args.delay}s")
    print(f"Cache: {CACHE_DIR}")
    print()

    for i, sid in enumerate(subjects, 1):
        print(f"[{i:2d}/{len(subjects)}] {sid:<35}", end=" ", flush=True)
        item = extract_with_cache(sid, args.api_key, args.db, delay_s=args.delay)
        results.append(item)
        if item.status == "fail":
            print(f"FAIL ({item.error[:60]})")
        else:
            cached_marker = " [cached]" if not item.used_credit else ""
            print(
                f"OK  rating={item.rodden_rating} events={item.n_events}"
                f"{cached_marker}"
            )

    # Summary
    ok = [r for r in results if r.status in ("ok", "cached")]
    failed = [r for r in results if r.status == "fail"]
    credits_used = sum(1 for r in results if r.used_credit)

    print()
    print("=" * 72)
    print(f"Success: {len(ok)}/{len(results)}   Credits used: ~{credits_used * 5}")
    print(f"Failed:  {len(failed)}")
    for r in failed:
        print(f"  - {r.astrodatabank_id:<35} {r.error[:80]}")

    # Log the run
    BATCH_LOG.parent.mkdir(parents=True, exist_ok=True)
    with BATCH_LOG.open("a") as f:
        f.write(json.dumps({
            "started_at": started,
            "finished_at": datetime.now(timezone.utc).isoformat(),
            "n_subjects": len(subjects),
            "n_ok": len(ok),
            "n_fail": len(failed),
            "credits_used_estimate": credits_used * 5,
            "failed_subjects": [r.astrodatabank_id for r in failed],
        }) + "\n")

    return 0 if len(failed) == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
