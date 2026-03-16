# Astro Nat — Analysis Layer Design Spec
## Client Requirements + Implementation Guide

> How the five data layers map to UI cards, user explanations, and the Gemini reading.

---

## The Core Principle

There are five distinct types of astrological data, each answering a different question:

| Layer | Question answered | Changes with travel date? | Changes with person? |
|---|---|---|---|
| **Geodetic Lines** | Which zodiac sign zone governs this location on Earth? | No — fixed to Earth | No |
| **Geodetic Transits** | How do current sky planets interact with that location's zodiac zone? | Yes | No |
| **Natal ACG Lines** | Where are *your* birth planets angular on Earth? | No — permanent | Yes |
| **Personal Transits** | How does the current sky hit *your* natal chart? | Yes | Yes |
| **Country Natal Chart** | How does the global transit affect this *country's* own birth chart? | Yes | No |

Gemini synthesizes all five layers into a single flowing reading.

---

## Layer 0 — Geodetic Lines (Client Requirement #1)

> **Reference:** https://www.astro-map-links.com/map_library/GEODETIC_TRANSIT/

### What geodetic lines are:
The Earth's surface is divided into 12 zodiac zones, fixed permanently to geography. Each 30° longitude band corresponds to one zodiac sign, anchored at 0° Aries = 0° longitude (Greenwich). This creates a world map of zodiac columns that never move.

- **MC columns** (vertical lines): the zodiac sign that culminates (reaches the Midheaven) over that longitude
- **ASC columns** (curved lines): the zodiac sign rising over that latitude+longitude combination

### Why this matters:
When a transiting planet occupies a zodiac sign (e.g. Uranus in Taurus for 7+ years), it **activates the entire geographic column where Taurus is the Midheaven or the Ascendant**. This is a collective, location-fixed effect — not personal.

**Example from client:**
> "Global planetary transits (e.g. Uranus in Taurus) will affect the places under the Taurus midheaven (right side column of the Taurus red line) and Taurus risings (right side column of the curved yellow line)."

Dubai sits under the **Taurus geodetic MC column** (~55°E longitude). When Uranus transits Taurus (2018–2026), it runs directly through the Taurus MC zone — meaning Dubai's entire region is under Uranus's disruptive, transformative energy at the collective level.

### Card design — Geodetic Lines:
**Tag pill:** `GEODETIC` (cyan)
**Card header:** `Geodetic Zones — Earth's Fixed Zodiac Map`

**Explanation copy:**
> The Earth is divided into 12 permanent zodiac zones based on longitude. Wherever a transiting planet falls in the sky, it also activates the geographic column where that sign is on the Midheaven or Ascendant. This is collective — it affects entire regions, not individuals.

**Two sub-sections:**

**A) Your destination's geodetic zone:**
```
Dubai, UAE — Geodetic MC: Taurus (55°E)
             Geodetic ASC: Cancer (at 25°N latitude)
```
Explanation: *"Dubai's Midheaven zone is Taurus. Any planet currently in Taurus — or aspecting Taurus — activates this region collectively."*

**B) Active transiting planets in this zone:**
```
Uranus  27° Taurus  →  conjunct Dubai's GEODETIC MC zone  [GEODETIC]
Mars    27° Aquarius →  square Dubai's GEODETIC MC zone    [GEODETIC] ⚠ TENSE
```

> These are the "geodetic transits" — exactly what the client's comparison screenshots show: the blue Uranus line running through Dubai.

**Important note to show users:**
> "These are general transits affecting the entire geodetic column. For specific outcomes, they must be cross-referenced with the country's natal chart (see below) and your personal chart."

---

## Layer 1 — Natal ACG Lines (Personal, Permanent)

**Data source:** Birth datetime + RAMC math → personal MC/IC/ASC/DSC lines  
**Tag pill:** `NATAL ACG` (indigo/purple)  
**Card header:** `Your Planetary Lines Near [Destination]`

### Explanation copy:
> Your natal ACG lines are fixed to the moment you were born. They never change. What changes is whether a transit or geodetic zone activates them — and which houses the angles land in when you relocate.

### Key rule from client:
> "Planetary aspects to each other never change, but planetary aspects to angles WILL change in relocation."

This means: your natal Venus square Saturn stays a square forever. But moving cities shifts which *house* each planet falls in — and crucially, **the chart ruler changes house**, which changes the entire theme of the trip.

### Chart Ruler Relocation (must be explained in UI):
> **Example (from client):**
> Brandon is a **Taurus Rising in Jakarta** — Venus rules his chart, placed in his 3rd house (local travel, communication).
> In **New York**, he becomes a **Libra Rising** — still Venus-ruled, but now Venus moves to his 9th house (foreign travel, philosophy, publishing). Same planet, same aspects — totally different *themes* for what the trip brings.

**The UI must communicate this clearly:**
```
Chart Ruler:  Venus (Taurus Rising at birth)
Relocated to: [Destination]
Relocated Rising: [Sign] → Venus now in House [N]
Theme shift:  [e.g. "Career focus (10th) → Partnership focus (7th)"]
```

### Angles & Orb rule (from client):
> "Most important lines to consider: Ascendant, Midheaven, IC, Descendant. Planets within a **5-degree orb** of these angles will influence the houses those angles land in (1st, 4th, 7th, 10th)."

### Row content:
```
[Planet icon]  Planet Name   [MC/IC/ASC/DSC]   ● orb dot   521 km
```

### Paran sub-section:
**Label:** `Paran Lines — Latitude Crossings`
**Explanation copy:**
> A paran is where two of your natal planetary lines cross at the same latitude. It activates within ~75 miles north or south of that parallel, worldwide. A difficult paran overrides a beneficial ACG line.

**Client example:**
> "Brandon should avoid: **Uranus Rising / Mars Anticulminating Paran (Latitude 30°N 45')** or **Saturn-Uranus Paran (Saturn Setting / Uranus Setting, Latitude 37°N 19')**"

---

## Layer 2 — Geodetic Transits vs Personal Transits (Client Requirement #3)

This is the critical distinction from the client's comparison screenshots.

### Without geodetic transits (personal ACG only):
Shows only where your NATAL planets are angular — fixed to your birth. The Uranus-in-Taurus transit over Dubai does not appear because you didn't have Uranus on the angles at birth.

### With geodetic transits included:
Adds the **Uranus in Taurus blue line running through Dubai** — because Uranus currently occupies Taurus, which is Dubai's geodetic MC column. This is the extra layer that locates the *current sky* to the *geography*.

**The UI comparison table (from client):**

| Geodetic Transit | Planetary Combo | Aspects to Birth Chart | Birth Chart Planets |
|---|---|---|---|
| Feb 27 – Mar 2 2026 | Mars (Aquarius) □ Uranus (Taurus) at 27° | Late-degree fixed sign placements (20–29°) are hit by squares/oppositions/conjunctions | Natal planets within 5° orb in fixed signs (Taurus, Leo, Scorpio, Aquarius) |

**Card design — Geodetic Transits:**
**Tag pill:** `GEODETIC TRANSIT` (cyan/teal)
**Sub-label:** `How the current sky activates this location's geodetic zone`

**Explanation copy:**
> Geodetic transits show where transiting planets are currently active in Earth's fixed zodiac columns. Unlike personal ACG lines (which are fixed to your birth), geodetic transits change with the current sky. If you have natal planets in the same sign or modality as the transiting planet, both layers interact — your personal chart is hit through the location's geodetic zone.

**Who gets hit hardest (UI tooltip or footnote):**
> "If your natal chart has planets at 20–29° of fixed signs (Taurus, Leo, Scorpio, Aquarius), the Mars □ Uranus world transit through Dubai's geodetic MC zone directly aspects your personal planets. This is where geodetic and personal layers merge."

---

## Layer 3 — Personal Transit Table (Client Requirement #2)

**Data source:** `/api/transits` + Gemini interpretation  
**Card header:** `Personal Transit Analysis · [Destination]`

This is the structured table the client specified. It must appear **after** the geodetic and ACG layers.

### Table structure (from client):

| Planetary Transit & Dates | Aspects to [Name]'s Chart Placements | ACG Lines to Avoid | Paran Lines to Avoid |
|---|---|---|---|
| Mars in Aries, 24 April 2026 | Conjunct Natal Mars in Aries (10°) in 12th house · Square Natal Venus in Cancer (9°) in 3rd · Square Natal Neptune in Capricorn (7°) in 9th | Mars, Venus, Neptune lines on all 4 angles | Uranus Rising / Mars IC Paran (30°N 45') · Saturn-Uranus Paran (37°N 19') |

**Implementation notes:**
- Transit dates must be computed (currently handled by `/api/transits` → exact date lookup)
- House placements must use the **relocated chart** at the destination, not birth chart
- ACG lines to avoid = the lines of the *aspected* planets within orb
- Paran lines to avoid = computed from `/api/mundane` paran output

**Tag pills per row:**
- `NATAL` if transiting planet hits a natal planet
- `GEODETIC` if transiting planet hits a geodetic-equivalent point
- `RELOCATED` if the house number shown is the destination house (not birth house)

---

## Layer 4 — Country Natal Chart (Client Requirement #4)

**Data source:** Curated database of country/city founding charts  
**Tag pill:** `COUNTRY CHART` (amber/gold)  
**Card header:** `[Country] National Chart · Founded [date]`

### What this layer adds:
> "Incorporate country natal chart for more specific outcomes based on global transits."

A country has its own birth chart (based on independence date/time/place). Global transits (Mars □ Uranus) interact with that country's natal planets differently than with your personal chart. This is **mundane astrology at the national level** — bridging the world transit and the location.

**Example:**
- UAE national chart: founded 2 December 1971, Abu Dhabi
- If UAE natal chart has planets at 27° fixed signs → March 2026 Mars □ Uranus hits the UAE chart directly
- This explains *why* a world transit is particularly significant *for Dubai specifically* — not just regionally

**Card design:**
```
UAE (Founded: 2 Dec 1971, Abu Dhabi)
Natal Sun: 10° Sagittarius (House 9)
Natal Moon: 18° Libra (House 7)

Active transits to UAE natal chart:
Mars □ UAE natal [planet if any at 27° fixed]   [COUNTRY CHART]
Uranus hits UAE [house/planet]                   [COUNTRY CHART]
```

**Explanation copy:**
> Every country has its own birth chart based on its founding or independence. Global planetary transits interact with that chart the same way they interact with yours. When a world transit also hits the country's natal chart, the effect in that location becomes more specific and pronounced.

**Implementation note:** Start with a small curated list of the most common travel destinations (USA, UAE, UK, France, Japan, Thailand, Indonesia, Singapore). Expand over time.

---

## Updated Card Order (top to bottom)

```
┌─────────────────────────────────────────────────────────────┐
│  🗺  Geodetic Zones      Earth's fixed zodiac columns        │  ← new
│  ⚡  Geodetic Transits   Current sky hitting this zone       │  ← new
│  🌍  World Sky           Sky-to-sky aspects (mundane)        │  ← existing
│  ⭐  Your ACG Lines      Your permanent natal map            │  ← existing
│  ✦   Personal Transits   Current sky hitting your chart      │  ← existing
│  🏛  Country Chart       National chart + current transits   │  ← new
└─────────────────────────────────────────────────────────────┘
```

**Reason for this order:** Earth's geography → current world sky → your permanent map → your personal timing → the country you're visiting. Each layer narrows the focus.

---

## Gemini Integration — Updated Prompt Structure

### All layers Gemini receives:

```
GEODETIC ZONE — [Destination]:
Geodetic MC: [Sign] | Geodetic ASC: [Sign] at this latitude
Active planets in geodetic MC sign: [list]
Active planets squaring geodetic MC sign: [list]

WORLD SKY (MUNDANE) ON [date]:
[sky-to-sky aspects with orb + applying/separating]

ANGULAR TRANSITING PLANETS OVER [destination]:
[list or "none at this time"]

NATAL ACG LINES NEAR [destination]:
[planet + angle + km + orb tier]
Chart ruler at birth: [planet] in [sign], House [N]
Chart ruler relocated to [destination]: House [N]

PERSONAL TRANSITS:
[sky→natal aspects with orb + natal/geodetic tag]

COUNTRY NATAL CHART — [Country]:
[key natal planets + any active transits to them]
```

### Gemini output sections:

**Section 1 — The Location's Collective Climate**
> Synthesize geodetic zone + world sky: what is the *place* experiencing right now, for everyone? What does it mean to be in Dubai when Uranus transits its Taurus geodetic MC? Is there a world transit amplifying this?

**Section 2 — Your Permanent Map Here**
> Natal ACG lines within orb. Chart ruler relocation. Which houses activate at this destination? East/west of the line. Parans to watch.

**Section 3 — Your Personal Timing**
> How the current sky (world transits + geodetic) hits *your* natal chart specifically. Tight orbs first. Call out if a world transit also hits your personal planets at the same degree — this is the maximum intensity point.

**Section 4 — Country Chart Overlay**
> Does the world transit hit the country's natal chart? If so, why does this *specific* destination respond more strongly than another city with the same geodetic zone?

**Section 5 — Verdict Table**

| Planetary Transit & Dates | Aspects to [Name]'s Chart | ACG Lines to Avoid | Parans to Avoid |
|---|---|---|---|
| [Computed from data] | [Natal aspects with house + degree] | [Lines of aspected planets] | [From paran computation] |

### Gemini layer separation instruction:
```
You MUST label which layer each claim comes from:
- [GEODETIC]: affects this location because of Earth's fixed zodiac mapping
- [MUNDANE]: sky-to-sky world transit, affects everyone on this date
- [ACG]: your permanent natal line, fixed to your birth
- [PERSONAL]: current sky hitting your natal chart
- [COUNTRY]: world transit hitting this country's own natal chart
Never blur these without explicitly noting when layers interact.
```

---

## Tag Pill System (Complete)

| Pill | Colour | Meaning |
|---|---|---|
| `GEODETIC` | Cyan | Earth's fixed zodiac zone or transit into it |
| `GEODETIC TRANSIT` | Teal | Current sky planet activating a geodetic zone |
| `MUNDANE` | Violet | World sky-to-sky aspect, affects everyone |
| `ANGULAR` | Amber | Transiting planet on angles over this city |
| `NATAL ACG` | Indigo | Your permanent birth-fixed planet line |
| `PARAN` | Cyan | Latitude crossing of two natal lines |
| `NATAL` | Gold | Transit hitting your birth planet |
| `RELOCATED` | Purple | House number shown is destination house |
| `COUNTRY CHART` | Amber/gold | Hits the country's own founding chart |
| `APL` | Purple | Aspect applying — getting stronger |
| `SEP` | Muted | Aspect separating — fading |

---

## Backtest Validation (Feb 27 2026 — Dubai)

| Layer | Result | Why it matters |
|---|---|---|
| Geodetic zone | ✅ Dubai = Taurus geodetic MC | Uranus in Taurus activates this zone collectively |
| Geodetic transit | ✅ Uranus (Taurus) on Dubai geodetic MC | Exactly the blue line in client's screenshot |
| World sky | ✅ Mars □ Uranus, 0.30° applying | Tense collective energy overlaid on the geodetic zone |
| Angular over Dubai | ❌ None at 12:00 UTC | Not yet angular at midday — hourly scan needed |
| Personal ACG | Depends on natal chart | Relevant if natal planets at 27° fixed signs |
| Country chart | UAE chart → needs check | Would confirm if UAE natal chart is hit |
| Old system output | ❌ Would miss all of the above | Only tracked sky→natal personal transits |

**The expert (Feb 27 Dubai) was seeing all of this simultaneously:**
- Mars □ Uranus world transit (mundane) ← our system now detects this
- Uranus in Taurus = Dubai's geodetic zone (geodetic) ← new layer to implement
- Geopolitical resonance with UAE/Middle East ← country natal chart layer
