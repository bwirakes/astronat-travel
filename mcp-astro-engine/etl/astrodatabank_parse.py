"""Astro-Databank HTML parser using BeautifulSoup.

Consumes HTML returned by Firecrawl (or any source) and extracts the
structured fields needed for subjects + event_record tables.

Replaces the regex-on-markdown parser previously in astrodatabank_extract
because:
  - The markdown table representation is whitespace-fragile
  - HTML has stable structural anchors (class="infobox", h2 section IDs)
  - Events live in per-event <ul><li> blocks, cleaner to walk in DOM
  - Categories give us Vocation + Death info that the infobox omits

Public API:
    parse_html(astrodatabank_id: str, html: str) -> ParsedSubject
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Iterator, Optional

from bs4 import BeautifulSoup, Tag


ASTRODATABANK_BASE = "https://www.astro.com/astro-databank/"


# ============================================================================
# Output dataclasses (mirror astrodatabank_extract.py for now)
# ============================================================================


@dataclass
class ParsedSubject:
    astrodatabank_id: str
    full_name: str
    birthname: Optional[str]

    birth_date: Optional[str]
    birth_time: Optional[str]
    birth_time_precision: str           # minute|hour|noon_default|unknown

    birth_location_name: Optional[str]
    birth_country_iso: Optional[str]
    birth_lat: Optional[float]
    birth_lon: Optional[float]

    rodden_rating: Optional[str]        # AA|A|B|C|DD|XX|None
    rating_source_notes: Optional[str]
    rating_collector: Optional[str]

    sex: Optional[str]                  # M|F|None

    death_date: Optional[str]           # ISO YYYY-MM-DD
    death_notes: Optional[str]          # "Suicide (Shot self)" etc.
    death_location: Optional[str]

    profession_tags: list[str] = field(default_factory=list)
    raw_categories: list[str] = field(default_factory=list)
    astrodatabank_url: str = ""
    raw_events: list["RawEvent"] = field(default_factory=list)


@dataclass
class RawEvent:
    date_raw: str
    date_iso: Optional[str]
    date_precision: str                 # day|month|year|unknown
    category: str                       # "Health", "Relationship", "Work", ...
    subcategory: Optional[str]          # "Change residence", "Marriage", ...
    description: str
    location: Optional[str]


# ============================================================================
# Month lookup shared across date parsers
# ============================================================================

_MONTHS = {
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5,
    "june": 6, "july": 7, "august": 8, "september": 9,
    "october": 10, "november": 11, "december": 12,
}


# ============================================================================
# Main entry point
# ============================================================================


def parse_html(astrodatabank_id: str, html: str) -> ParsedSubject:
    """Parse Astro-Databank HTML into a ParsedSubject."""
    soup = BeautifulSoup(html, "lxml")

    info = _parse_infobox(soup)
    categories = _parse_categories(soup)
    events = _parse_events(soup)

    # Derive death info from categories if infobox didn't have a 'died' row.
    death_date = info.get("death_date")
    death_notes = None
    if not death_date or categories.get("death_year"):
        dy = categories.get("death_year")
        if dy and not death_date:
            death_date = f"{dy:04d}-01-01"
    death_notes = categories.get("death_notes")

    professions = categories.get("vocations", [])

    return ParsedSubject(
        astrodatabank_id=astrodatabank_id,
        full_name=astrodatabank_id.replace("_", " "),
        birthname=info.get("birthname"),
        birth_date=info.get("birth_date"),
        birth_time=info.get("birth_time"),
        birth_time_precision=info.get("birth_time_precision", "unknown"),
        birth_location_name=info.get("birth_location_name"),
        birth_country_iso=info.get("birth_country_iso"),
        birth_lat=info.get("birth_lat"),
        birth_lon=info.get("birth_lon"),
        rodden_rating=info.get("rodden_rating"),
        rating_source_notes=info.get("rating_source_notes"),
        rating_collector=info.get("rating_collector"),
        sex=info.get("sex"),
        death_date=death_date,
        death_notes=death_notes,
        death_location=None,
        profession_tags=professions,
        raw_categories=categories.get("raw", []),
        astrodatabank_url=ASTRODATABANK_BASE + astrodatabank_id,
        raw_events=events,
    )


# ============================================================================
# Infobox (the table at the top of every Astro-Databank entry)
# ============================================================================


def _parse_infobox(soup: BeautifulSoup) -> dict:
    """Walk the <table class='infobox toccolours'> and extract labeled rows.

    Each top-level <tr> has two <td>s: label and value. Nested tables in the
    value cells are flattened by BS4's get_text(), which is fine for our
    purposes.
    """
    infobox = soup.find("table", class_="infobox")
    if not infobox:
        return {}

    fields: dict[str, str] = {}
    # Direct children only — avoid nested table rows polluting the dict.
    tbody = infobox.find("tbody") or infobox
    for tr in tbody.find_all("tr", recursive=False):
        tds = tr.find_all("td", recursive=False)
        if len(tds) < 2:
            continue
        label = tds[0].get_text(" ", strip=True)
        value = tds[1].get_text(" ", strip=True)
        if label and value:
            fields[label] = value

    out: dict = {}

    # Name + gender — "Name" row has combined text like
    # "Hemingway, Ernest Gender : M"
    if "Name" in fields:
        name_raw = fields["Name"]
        m_sex = re.search(r"Gender\s*:\s*([MF])\b", name_raw)
        if m_sex:
            out["sex"] = m_sex.group(1)

    if "Birthname" in fields:
        out["birthname"] = fields["Birthname"]

    if "born on" in fields:
        d, t, p = _parse_datetime(fields["born on"])
        out["birth_date"] = d
        out["birth_time"] = t
        out["birth_time_precision"] = p

    if "Place" in fields:
        loc, iso, lat, lon = _parse_place(fields["Place"])
        out["birth_location_name"] = loc
        out["birth_country_iso"] = iso
        out["birth_lat"] = lat
        out["birth_lon"] = lon

    if "Data source" in fields:
        ds_raw = fields["Data source"]
        # Astro-Databank uses AA/A/B/C/DD plus X (no time) and XX (no data).
        m_rating = re.search(r"Rodden Rating\s+(AA|A|B|C|DD|XX|X)\b", ds_raw)
        if m_rating:
            out["rodden_rating"] = m_rating.group(1)
        m_col = re.search(r"Collector\s*:\s*([^\n]+?)(?:\s+Rodden|\s*$)", ds_raw)
        if m_col:
            out["rating_collector"] = m_col.group(1).strip()
        # Everything before "Rodden Rating" is the source description
        pre = re.split(r"\s*Rodden Rating\b", ds_raw, maxsplit=1)[0].strip()
        if pre:
            out["rating_source_notes"] = pre

    if "died" in fields:
        d, _, _ = _parse_datetime(fields["died"])
        if d:
            out["death_date"] = d

    return out


# ============================================================================
# Categories (bottom of the article, Vocation + Death signals)
# ============================================================================


def _parse_categories(soup: BeautifulSoup) -> dict:
    """Extract the category list from the Categories h2 section.

    Returns:
        dict with keys:
            raw: list[str]               all category strings
            vocations: list[str]         "Vocation : X : Y" entries parsed to "Y"
            death_year: Optional[int]    if a "NNNN deaths" category is present
            death_notes: Optional[str]   "Personal : Death : ..." description
    """
    out = {
        "raw": [],
        "vocations": [],
        "death_year": None,
        "death_notes": None,
    }

    # Section 1: the on-page "Categories" h2 (semantic categories like
    # "Vocation : Writers : Fiction")
    categories_span = soup.find("span", id="Categories")
    if categories_span:
        h2 = categories_span.find_parent("h2")
        if h2:
            for ul in _iter_siblings_until_next_section(h2, ("h2",)):
                if not isinstance(ul, Tag) or ul.name != "ul":
                    continue
                for li in ul.find_all("li"):
                    text = li.get_text(" ", strip=True)
                    if text:
                        out["raw"].append(text)

    # Section 2: MediaWiki-rendered category links at the very bottom of the
    # page (contains "NNNN births", "NNNN deaths", "Birthplace X" etc.)
    catlinks = soup.find(id="mw-normal-catlinks") or soup.find(
        "div", class_="catlinks"
    )
    if catlinks:
        for a in catlinks.find_all("a"):
            text = a.get_text(strip=True)
            if text and text != "Categories":
                out["raw"].append(text)

    # Now parse the raw list for signals
    for text in out["raw"]:
        # Vocation : X : Y — capture Y (the specific profession)
        m_voc = re.match(r"Vocation\s*:\s*([^:]+?)\s*:\s*(.+?)(?:\s*\(|$)", text)
        if m_voc:
            out["vocations"].append(m_voc.group(2).strip())
            continue

        # "NNNN deaths" — death year
        m_dy = re.match(r"(\d{4})\s+deaths\b", text)
        if m_dy:
            out["death_year"] = int(m_dy.group(1))
            continue

        # Personal : Death : X (Y)
        m_dn = re.match(r"Personal\s*:\s*Death\s*:\s*(.+)", text)
        if m_dn:
            out["death_notes"] = m_dn.group(1).strip()
            continue

    # Dedupe vocations preserving order
    seen = set()
    out["vocations"] = [
        v for v in out["vocations"] if not (v in seen or seen.add(v))
    ]
    return out


# ============================================================================
# Events (per-event <ul><li> blocks after h2#Events)
# ============================================================================


def _parse_events(soup: BeautifulSoup) -> list[RawEvent]:
    """Extract every event in the Events section.

    Each event is its own <ul> with one <li> like:
        Health : Job related injury  8 July 1918   (Schrapnel wounds WW I)
        chart Placidus Equal_H.

    We split on the first ' : ', take the rest as the "what", and parse the
    date + parenthetical.
    """
    events: list[RawEvent] = []
    events_span = soup.find("span", id="Events")
    if not events_span:
        return events
    h2 = events_span.find_parent("h2")
    if not h2:
        return events

    for node in _iter_siblings_until_next_section(h2, ("h2",)):
        if not isinstance(node, Tag) or node.name != "ul":
            continue
        for li in node.find_all("li"):
            text = li.get_text(" ", strip=True)
            # Strip trailing chart links ("chart Placidus Equal_H.")
            text = re.sub(r"\s+chart\s+Placidus.*$", "", text)
            text = re.sub(r"\s+chart\s+Equal.*$", "", text)

            m = re.match(r"([A-Z][A-Za-z ]+?)\s*:\s*(.+)", text)
            if not m:
                continue
            category = m.group(1).strip()
            rest = m.group(2).strip()

            subcat, date_iso, precision, description = _split_event_payload(rest)
            if not date_iso:
                continue
            events.append(
                RawEvent(
                    date_raw=rest[:300],
                    date_iso=date_iso,
                    date_precision=precision,
                    category=category,
                    subcategory=subcat,
                    description=description[:500],
                    location=None,
                )
            )
    return events


def _split_event_payload(
    s: str,
) -> tuple[Optional[str], Optional[str], str, str]:
    """Parse 'Marriage  1920   (Hadley Richardson)' into parts.

    Returns (subcategory, iso_date, precision, description).
    """
    # Parenthetical description at the end
    m_paren = re.search(r"\(([^)]+)\)\s*$", s)
    paren_desc = m_paren.group(1).strip() if m_paren else ""
    before_paren = s[: m_paren.start()].strip() if m_paren else s

    # Find date in before_paren — try day/month/year, month/year, year-only.
    subcat = before_paren
    iso_date, precision = None, "unknown"

    m_dmy = re.search(r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", before_paren)
    if m_dmy and m_dmy.group(2).lower() in _MONTHS:
        d = int(m_dmy.group(1))
        mo = _MONTHS[m_dmy.group(2).lower()]
        y = int(m_dmy.group(3))
        iso_date = f"{y:04d}-{mo:02d}-{d:02d}"
        precision = "day"
        subcat = before_paren[: m_dmy.start()].strip()

    if not iso_date:
        m_my = re.search(r"\b([A-Za-z]+)\s+(\d{4})\b", before_paren)
        if m_my and m_my.group(1).lower() in _MONTHS:
            mo = _MONTHS[m_my.group(1).lower()]
            y = int(m_my.group(2))
            iso_date = f"{y:04d}-{mo:02d}-01"
            precision = "month"
            subcat = before_paren[: m_my.start()].strip()

    if not iso_date:
        m_y = re.search(r"\b(\d{4})\b", before_paren)
        if m_y:
            y = int(m_y.group(1))
            if 1500 <= y <= 2100:
                iso_date = f"{y:04d}-01-01"
                precision = "year"
                subcat = before_paren[: m_y.start()].strip()

    subcat = subcat.rstrip(" ,-:").strip() or None

    # Description = parenthetical or fallback to the original string
    description = paren_desc if paren_desc else before_paren
    return subcat, iso_date, precision, description


# ============================================================================
# Shared value parsers
# ============================================================================


def _parse_datetime(s: str) -> tuple[Optional[str], Optional[str], str]:
    """Parse 'DD Month YYYY at HH:MM' etc. Returns (iso_date, iso_time, prec)."""
    m_date = re.search(r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", s)
    if not m_date:
        return None, None, "unknown"
    if m_date.group(2).lower() not in _MONTHS:
        return None, None, "unknown"

    d = int(m_date.group(1))
    mo = _MONTHS[m_date.group(2).lower()]
    y = int(m_date.group(3))
    iso_date = f"{y:04d}-{mo:02d}-{d:02d}"

    m_time = re.search(r"at\s+(\d{1,2}):(\d{2})(?::(\d{2}))?", s)
    if m_time:
        hh = int(m_time.group(1))
        mm = int(m_time.group(2))
        ss = int(m_time.group(3) or 0)
        return iso_date, f"{hh:02d}:{mm:02d}:{ss:02d}", "minute"

    if re.search(r"\bnoon\b", s, re.I):
        return iso_date, "12:00:00", "noon_default"

    return iso_date, None, "unknown"


def _parse_place(s: str) -> tuple[Optional[str], Optional[str], Optional[float], Optional[float]]:
    """Parse 'Oak Park, Illinois, 41n53, 87w47' into (location, iso, lat, lon).

    Astro-Databank's "Place" field embeds coordinates with lowercase hemisphere
    letters and no degree symbols: ``DDnMM, DDDwMM`` or ``DDsMM, DDDeMM``.
    """
    # Coordinates — astro.com uses "DDnMM" or "DDnMMSS" (optional seconds) and
    # "DDDwMM" or "DDDwMMSS". Precision of seconds varies by city.
    lat = lon = None
    m_coord = re.search(
        r"(\d{1,3})([nNsS])(\d{2})(\d{2})?[,\s]+(\d{1,3})([eEwW])(\d{2})(\d{2})?",
        s,
    )
    if m_coord:
        lat_deg = int(m_coord.group(1))
        lat_min = int(m_coord.group(3))
        lat_sec = int(m_coord.group(4) or 0)
        lat_hemi = m_coord.group(2).upper()
        lon_deg = int(m_coord.group(5))
        lon_min = int(m_coord.group(7))
        lon_sec = int(m_coord.group(8) or 0)
        lon_hemi = m_coord.group(6).upper()
        lat = lat_deg + lat_min / 60.0 + lat_sec / 3600.0
        lon = lon_deg + lon_min / 60.0 + lon_sec / 3600.0
        if lat_hemi == "S":
            lat = -lat
        if lon_hemi == "W":
            lon = -lon

    # Strip the coordinates from the location string to get the clean name
    loc = re.sub(
        r",\s*\d{1,3}[nNsS]\d{1,2}[,\s]+\d{1,3}[eEwW]\d{1,2}\s*$", "", s
    ).strip(", \t")

    # Country ISO — the "(XX)" suffix that appears on the Birthplace category
    # link. The Place infobox field typically doesn't include it; we leave the
    # ISO to be derived from categories, but also try a parenthesized code.
    iso = None
    m_iso = re.search(r"\(([A-Z]{2,3})\)\s*$", loc)
    if m_iso:
        iso = m_iso.group(1)
        loc = loc[: m_iso.start()].strip(", \t")

    return (loc or None), iso, lat, lon


# ============================================================================
# Internal: DOM walk helpers
# ============================================================================


def _iter_siblings_until_next_section(
    start: Tag, stop_names: tuple[str, ...]
) -> Iterator[Tag]:
    """Yield siblings after `start` until encountering an element in `stop_names`."""
    node = start.next_sibling
    while node is not None:
        if isinstance(node, Tag) and node.name in stop_names:
            return
        yield node
        node = node.next_sibling
