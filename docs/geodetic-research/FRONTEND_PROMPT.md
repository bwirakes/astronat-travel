# Prompt — Imagine the Geodetic Weather Frontend

**Task:** Design and build a frontend for the Geodetic Weather engine at `/api/geodetic-weather`. Follow the **existing Astronat reading flow** as the template — this is a new *reading type*, not a new product. Follow `.agents/skills/astro-design/SKILL.md` for all design tokens and aesthetic rules. Reference `app/design-system/page.tsx` for the Y2K-editorial vocabulary.

---

## The core reframe — this tool predicts the future

The engine is **forecast-native**. Unlike historical analysis (which is what the `scripts/backtest-runner.ts` harness does), the user-facing tool answers:

> *"Over the next **N days**, what are the **dates to watch** for the **places I care about**?"*

The output is **a timeline of severity tiers projected forward**, with the top 3–5 most severe days surfaced as *warnings* — each with plain-English attribution, so the user understands *why* Tuesday the 27th is flagged and not Monday the 26th.

**The frontend must feel like reading a weather almanac crossed with an editorial horoscope — not a dashboard, not a historical database.**

---

## How this fits into the existing app

Study these files first; they are the canonical pattern:

| File | What it is | Your template |
|---|---|---|
| `app/(frontend)/(app)/dashboard/page.tsx` + `HomeClient.tsx` | The hub. 6-card Explore grid + "YOUR READINGS" list + `+ New Reading` FAB | **Add a 7th Explore card here** that entry-points this tool |
| `app/(frontend)/(app)/reading/new/page.tsx` → `app/components/ReadingFlow.tsx` | 3–4-step wizard: type → goals → destination → generate | **Add a new branch** of this wizard for the `"weather"` reading type, or mount a parallel wizard at `/reading/new?type=weather` |
| `app/(frontend)/(app)/reading/[id]/page.tsx` | Persisted reading detail page, reached after generation | **Render weather readings here** under `?type=weather` — the same URL pattern the rest of the app already uses |
| `app/components/ScoreRing.tsx` | Small 0–100 circular dial used in dashboard's readings list | **Reuse this** for each weather-reading row (with tier-colored ring instead of score-colored) |
| `app/api/readings/generate/route.ts` | Creates a reading row in Supabase, returns `readingId`, redirects user to `/reading/[id]` | **Extend** to support `readingCategory: "geodetic-weather"` — call `/api/geodetic-weather` for each day in the window and persist the forecast |

**The tool is not a standalone app. It's a new reading type inside the existing reading system.**

---

## What the engine returns (ground truth)

`POST /api/geodetic-weather` with `{ date, destLat, destLon }` returns a `GeodeticWeatherResult`:

```jsonc
{
  "dateUtc": "2026-05-12T12:00:00Z",
  "location": { "lat": 39.47, "lon": -0.38 },
  "fixedAngles": { "mc": 359.62, "ic": 179.62, "asc": 290.54, "dsc": 110.54 },
  "score": 66,                          // 0–100, HIGH = calm
  "severity": "Turbulent",              // Calm | Unsettled | Turbulent | Severe | Extreme
  "severityPreShift": "Unsettled",
  "events": [                           // sorted by |severity| desc
    { "layer": "late-degree", "label": "Pluto at 29.7° Capricorn [Earth]", "planets": ["Pluto"], "severity": -22, "direction": "malefic" },
    { "layer": "angle-transit", "label": "Neptune on fixed MC (orb 1.6°)", "planets": ["Neptune"], "orb": 1.6, "severity": -15, "direction": "malefic" },
    { "layer": "station", "label": "Mars station direct in 21d near IC (orb 1.1°)", "planets": ["Mars"], "severity": -18, "direction": "malefic" },
    { "layer": "severity-modifier", "label": "OOB Mars + OOB Moon combo", "planets": ["Mars","Moon"], "severity": -15, "direction": "malefic", "note": "Research-cited amplifier" }
  ],
  "breakdown": { "bucketAngle": 54, "bucketParan": 63, "bucketStation": 45, "bucketIngress": 36, "bucketEclipse": 86, "bucketLate": 12, "bucketConfig": 30, "tierShift": 1 /* + raw fields */ },
  "severityModifiers": [{ "label": "OOB Mars + OOB Moon combo", "tierShift": 1, "direction": "malefic" }],
  "oobPlanets": [{ "name": "Mars", "declination": 24.26, "longitude": 126.3 }],
  "phasesActive": [1, 2, 3, 4, 6, 7, 8, 9]
}
```

**To build a forecast**, the API extension route (`/api/readings/generate` with `readingCategory: "geodetic-weather"`) calls the engine once per day across the chosen window — e.g., 30 sequential calls for a 30-day forecast — persists the full array, and returns a `readingId`. The reading detail page loads the persisted forecast.

## Plain-English layer glossary (use in UI copy — never raw layer codes)

| Engine code | User-facing label | When it fires |
|---|---|---|
| `angle-transit` | **Sky on the Axis** | A planet aligning with this location's permanent horizon/meridian |
| `paran` | **Latitude Crossings** | Planet-pair signatures at this latitude band |
| `station` | **Stalled Energy** | A planet parking on a retrograde station near the location's angle |
| `world-point` | **Global Broadcast** | An outer planet at 0° of a cardinal sign — planetary in scope |
| `eclipse` | **Detonator** | A recent or imminent eclipse seeding this longitude |
| `late-degree` | **Final Degree Pressure** | A planet in the 26–29° anaretic zone, possibly compounded by a fixed star |
| `configuration` | **Geometric Pattern** | Stellium, T-square, grand cross/trine, yod formed in the current sky |
| `severity-modifier` | **Boundary Override** | Out-of-bounds planets or nodal imbalance — escalator rather than trigger |

---

# The User Journey

## Step 0 — Dashboard entry

**`/dashboard` changes:**

1. Add a 7th card to the Explore grid (currently `LifeGoalsButton`, `CouplesButton`, `MyChartButton`, `WorldChartsButton`, `TransitsButton`, `LearnButton` — all in `app/components/ExploreButtons.tsx`). New card: **`SkyWeatherButton`**.
   - Copy: **"SKY / WEATHER"** stacked like `DiveIntoButton` — `SKY` in `var(--font-primary)` uppercase, `weather` in `var(--font-display-alt-2)` SLOOP SCRIPT with `var(--color-y2k-blue)` color overlap.
   - Kicker underneath in `var(--font-mono)`: *"DATES TO WATCH · ANY PLACE"*.
   - `onClick` → `router.push("/reading/new?type=weather")`.
2. When past weather readings exist, they appear in the existing `YOUR READINGS` list on the right. Each row:
   - Mini `ScoreRing` — **tier-tinted ring** instead of score-green, colored by the worst day in the window.
   - Primary text: the destination (e.g. *"Valencia, Spain"*).
   - Secondary text: *"Next 30d · 2 Severe days · May 12, May 27"* (or whatever pattern comes out of the forecast — dates-to-watch condensed).
   - `View ›` → `/reading/[id]?type=weather`.

No disruption to the existing dashboard aesthetic — just one more card and a new row variant.

## Step 1 — Reading wizard (new type branch)

**`/reading/new?type=weather`:**

Extend [app/components/ReadingFlow.tsx](app/components/ReadingFlow.tsx) with a fourth `type` value: `"weather"`. Or mount a parallel wizard (`WeatherReadingFlow`) with the same visual grammar — steps slide horizontally with framer-motion (`slideVariants` pattern is already there), each step shows `Step N of M` as h5, an uppercase `var(--font-primary)` headline with one word accented (`var(--color-y2k-blue)` or `var(--color-spiced-life)`), and a Continue button in `var(--shape-asymmetric-md)`.

**Step 1 — Where?**
- Reuse the `CityAutocomplete` component (already in `ReadingFlow.tsx`).
- Headline: **"Where should the sky watch?"** (uppercase primary, "the sky watch" in spiced-life).
- Subhead: *"Pick a city — or up to 3 to compare."*
- Below the input, once the user has selected one city, chips appear letting them add more: *"+ add another place"*. Max 3.
- Under each resolved city, print the **fixed MC + ASC signs** in small-caps mono (e.g. *"MC 29° PISCES · ASC 21° CAPRICORN"*). This teaches the user that their location has permanent astrological coordinates.

**Step 2 — Over what window?**
- Headline: **"For how many days ahead?"** (uppercase primary, "days ahead" in y2k-blue).
- Three big radio tiles like the `type` picker on screen 0 of `ReadingFlow.tsx`, but visually richer — use `var(--cut-md)` chamfered corners:
  - **`7 days`** — *"next week. short-term triggers."*
  - **`30 days`** — *"the month ahead. most reading types."* (default)
  - **`90 days`** — *"the quarter. catches station cycles and eclipse windows."*
- Under the selected tile, print a mono metadata caption: *"2026-04-18 → 2026-05-18 · 30 daily snapshots"*.

**Step 3 — Anything specific to watch for? (optional)**
- Same `LIFE_GOALS` shape as the existing flow but with a **weather-native goal set**:
  - `Floods & storms` (water-resonant — Saturn/Neptune, Jupiter/Neptune, 29° water signs)
  - `Fires & heat` (fire-resonant — Mars/Uranus, 29° fire signs, OOB)
  - `Earthquakes & structural` (earth-resonant — Saturn stations, Mars/Pluto midpoint)
  - `Atmospheric disruption` (air-resonant — Mercury rx, Uranus)
  - `Public / civil tension` (world points, configurations, Mars angles)
  - `Just show everything`
- Same selection UI (up to 3, accent-colored corner radius when active) as the current `LIFE_GOALS` block.
- These drive **which events are surfaced in the reading output** — not the scoring itself. The engine still returns everything; the UI filters the event timeline when a goal is selected.

**Step 4 — Generate.**
- "Generate Reading" button reuses the existing style. Spinner pattern same as current. POST to `/api/readings/generate` with `readingCategory: "geodetic-weather"`, the list of cities, the window, and the goal filter. Server calls `/api/geodetic-weather` once per day per city, persists, returns `readingId`. Redirect to `/reading/[id]?type=weather`.

## Step 2 — The reading (the forecast page)

**`/reading/[id]?type=weather`:**

This is where the design carries the most. Four stacked bands, each its own page-spread.

### Band A — Verdict Slab (full-bleed hero)

Full-width color block whose **background is driven by the worst-tier day in the window** (most severe single day over all cities):

| Worst tier in window | Bg | Text | Accent |
|---|---|---|---|
| Calm | `var(--color-eggshell)` | `var(--color-charcoal)` | `var(--sage)` |
| Unsettled | `var(--color-acqua)` | `var(--color-charcoal)` | `var(--color-y2k-blue)` |
| Turbulent | `var(--color-cream)` | `var(--color-charcoal)` | `var(--gold)` |
| Severe | `var(--color-spiced-life)` | `var(--color-charcoal)` | `var(--color-black)` |
| Extreme | `var(--color-black)` | `var(--color-eggshell)` | `var(--color-spiced-life)` |

**Layout:**
- Left column: huge `var(--font-primary)` verdict word (**"TURBULENT"**) at `clamp(6rem, 14vw, 12rem)`, tight line-height 0.82.
- Oversized `var(--font-display-alt-2)` (SLOOP SCRIPT) word behind/beside it at 0.15 opacity — *"ahead"* or *"watching"* — positioned absolutely, no pointer events.
- Right column stacks:
  - Mono kicker: **VALENCIA · NEXT 30 DAYS · 2026-04-18 → 2026-05-18**
  - `var(--font-secondary)` paragraph in one editorial sentence: *"Two days in this window read Severe. The rest holds steady between Unsettled and Turbulent. Mars stations direct over your ASC mid-window, followed by an eclipse aftershock 8 days later."*
  - A row of mono stat boxes: `2 SEVERE` · `4 TURBULENT` · `18 UNSETTLED` · `6 CALM`.

### Band B — Timeline Zine Strip

A horizontal strip of 30 mini-columns (one per day), sized so the strip fits full viewport width on desktop and scrolls horizontally on mobile. Each column:
- Height: 160–200 px.
- Background: tier color (from the palette above).
- A vertical stack of up to 3 tiny planet-glyph sigils (Unicode: ☉ ☽ ☿ ♀ ♂ ♃ ♄ ♅ ♆ ♇) showing the day's top-3 event planets. Glyphs colored by `bg-planet-*` via the tailwind planet classes.
- Date number at the bottom in mono, uppercase month as a kicker if it changes mid-strip.
- Special markers above the strip: 🌑 solar-eclipse sigil on eclipse days, ℞ on station days, an upside-down triangle on world-point days — all drawn in CSS/SVG, *never* as emoji.
- Hover/tap any column → tooltip pops showing the day's top event: *"Mars station direct on fixed ASC"*.
- Click → scroll-snap to Band D's per-day detail section (or open a side drawer on mobile).

This is the single most important component. It *feels* like flipping through a monthly zine where each page is a day.

### Band C — Dates to Watch

A short list — **top 3–5 peak severity days in the window** — surfaced as editorial pull-quote cards in a 2-column grid (stacked on mobile):
- Each card uses `var(--cut-lg)` clip-path for the Y2K chamfered corner (no generic rounded-lg).
- Background alternates `var(--color-eggshell)` / `var(--color-charcoal)` / `var(--color-black)` between adjacent cards (the ebook color-block rule from the skill doc).
- Content per card:
  - Mono kicker: day-of-week + date in uppercase — **TUE · MAY 12**.
  - Tier pill in the top-right: `TurbulentPill` using severity palette.
  - `var(--font-secondary)` headline at 2rem: *"Mars stalls on your public axis."*
  - Plain-English body at 0.9rem: *"The planet of force parks right on the meridian your city points at the sky. When a heavy planet slows down on your top line, the regions under that longitude sit in a pressure system — figuratively, and often literally."*
  - Footer row: 3–5 planet pills (use `bg-planet-*`) + a small mono link *"expand →"* that opens Band D preselected to this day.

### Band D — Day Deep-Dive (anchor target)

A large, editorial explanation block for a **single selected day** — defaults to the highest-severity date in the window. Layout:

- Left 60% — **event stack**: each of the day's events rendered as an editorial pull-quote card (same `var(--cut-md)` style as Band C, smaller). Per card:
  - Layer label as a mono uppercase kicker (**STALLED ENERGY**).
  - `var(--font-secondary)` event phrase (**"Mars parks on your culminating point"**).
  - Body paragraph: the plain-English "Why this fires" I'd have put in the original Screen-4 deep-dive — tied to the engine's severity number ("this pulls the day's sky 22 points toward unrest") but written in the editorial voice.
- Right 40% — **Bucket Spark Panel**: 7 horizontal bars (one per bucket: SKY ON THE AXIS · LATITUDE CROSSINGS · STALLED ENERGY · SEASONAL FIELD · DETONATOR · FINAL DEGREES · GEOMETRIC PATTERN). Each a thin `var(--surface-border)` track with a filled portion proportional to the bucket. Malefic-leaning buckets in `var(--color-spiced-life)`, benefic-leaning in `var(--sage)`. Hover a bar → its constituent events highlight in the left stack.
- Below both columns — **severity-modifier strip** if any fires: full-width band, charcoal on eggshell (or inverse), mono caption: *"TIER SHIFTED UP ×1 — OOB MARS + OOB MOON. Research-cited amplifier."*
- Below that — **small inline map** showing the destination with its 4 fixed angle lines (stylized as dotted `var(--color-y2k-blue)` meridians) and any active paran latitude bands (horizontal `var(--color-spiced-life)` at 0.4 opacity). Caption: *"Your location sits on four permanent lines. Today's sky is lighting these up."*

### Optional Band E — Compare locations

Only shown when the user picked 2–3 cities in Step 1:
- A 3-column grid, each column = one city.
- Each column contains a mini Verdict Slab + mini Timeline Strip.
- This is the "same window, different places" view, letting the user see that e.g. Valencia is Turbulent over May while Auckland is Unsettled.

---

# Design system hard rules (from `.agents/skills/astro-design/SKILL.md` — non-negotiable)

- **Typography:** only CSS variables. `var(--font-primary)` for hero slabs and cube buttons, `var(--font-secondary)` for editorial pull-quotes and step headings, `var(--font-body)` for paragraphs, `var(--font-mono)` for kickers/tags/metadata, `var(--font-display-alt-1)` (MONIGUE) for ebook-style titles inside cards, `var(--font-display-alt-2)` (SLOOP SCRIPT) for oversized decorative overlaps on every band.
- **Color:** only CSS variables. Planet accents only via tailwind `bg-planet-*` / `text-planet-*` classes. **Zero hex literals** in JSX.
- **Shape:**
  - `var(--cut-sm|md|lg|xl)` clip-paths for Y2K tech cards (event cards, tier pills, radio tiles).
  - `var(--shape-organic-1..3)` border-radius for editorial imagery inside cards.
  - `var(--shape-asymmetric-md|lg)` for CTAs (match the Continue button style already in `ReadingFlow.tsx`).
  - **Never** use generic `rounded-lg` with soft shadows. No SaaS defaults.
- **Color-block alternation:** adjacent cards and stacked bands must alternate `eggshell` / `charcoal` / `black` backgrounds. No same-color stack.
- **Script overlaps:** at least one oversized `var(--font-display-alt-2)` word per band, positioned absolutely with `pointer-events: none`, opacity 0.15–0.9, `font-size: clamp(8rem, 16vw, 14rem)`. Follow the `EbookConcept` overlap in `app/design-system/page.tsx:238`.
- **Severity tier palette** — use everywhere a tier shows (pill, timeline column, verdict slab, dashboard reading row):

  | Tier | Bg | Text | Accent |
  |---|---|---|---|
  | Calm | `var(--color-eggshell)` | `var(--color-charcoal)` | `var(--sage)` |
  | Unsettled | `var(--color-acqua)` | `var(--color-charcoal)` | `var(--color-y2k-blue)` |
  | Turbulent | `var(--color-cream)` | `var(--color-charcoal)` | `var(--gold)` |
  | Severe | `var(--color-spiced-life)` | `var(--color-charcoal)` | `var(--color-black)` |
  | Extreme | `var(--color-black)` | `var(--color-eggshell)` | `var(--color-spiced-life)` |

- **Voice:** Editorial / predictive / almanac — not dashboard. Never write *"Score: 66"*. Write *"the 27th reads Severe"* or *"the sky sits two steps above the floor through mid-May, then cracks on the 12th."* Mono text carries the precise numbers; serif/script carries the verdicts.
- **Animation:** reuse the existing `framer-motion` slide variants from `ReadingFlow.tsx` for wizard transitions. Reuse the GSAP enter animations from `HomeClient.tsx` (hero, banner, explore cards staggered) for the reading page — the brand is high-motion.

---

# Components to build

```
app/components/
  ExploreButtons.tsx            + export SkyWeatherButton (new Explore card)
  WeatherReadingFlow.tsx        new wizard component (or extend ReadingFlow.tsx)

app/(frontend)/(app)/
  reading/[id]/
    WeatherReading.tsx          rendered when persisted reading.category === "geodetic-weather"
    components/
      VerdictSlab.tsx                 Band A — tier-colored hero
      TimelineZineStrip.tsx           Band B — 30-day strip (THE hero component)
      DatesToWatchGrid.tsx            Band C — top-3–5 severe days as editorial cards
      DayDeepDive.tsx                 Band D — single day event stack + bucket panel
      EventPullQuoteCard.tsx          reused in Band C and Band D
      BucketSparkPanel.tsx            7-bar bucket panel
      FixedAnglesRibbon.tsx           small-caps mono fixed-angle line under city inputs
      TierPill.tsx                    tier-colored pill (Y2K cut corner)
      CompareLocationsGrid.tsx        Band E — optional 3-column compare

app/api/readings/generate/route.ts   extend to handle readingCategory: "geodetic-weather"
                                     (fan-out to /api/geodetic-weather per day, persist forecast)
```

---

# Acceptance bar

1. **Dashboard smoke** — visit `/dashboard`; see the new **SKY / WEATHER** card in the Explore grid. Click it → lands on the wizard at `/reading/new?type=weather`.
2. **Wizard smoke** — enter *Valencia, Spain*, select *30 days*, pick *Floods & storms*, click Generate. After a spinner you land on `/reading/[id]?type=weather`.
3. **Verdict Slab** renders with the worst-tier color, the window stats strip reads *"X SEVERE · Y TURBULENT · Z UNSETTLED · W CALM"* summing to 30.
4. **Timeline zine strip** shows 30 columns, tier-tinted, with planet-glyph sigils on days where events fire. Clicking a column scrolls/jumps to the Deep-Dive section for that day.
5. **Dates to Watch** surfaces 3–5 cards, each with a plain-English explanation, tier pill, and a link to the Deep-Dive.
6. **Back on the dashboard**, the reading now appears in `YOUR READINGS` as a row with a tier-tinted mini ScoreRing, the city name, and *"Next 30d · N Severe days"*.
7. **Visually nothing looks like a SaaS dashboard** — every band uses cut-corner Y2K shapes or stark color blocks, every band has a SLOOP SCRIPT overlap somewhere, no hex literals exist in any new JSX, editorial voice throughout.
8. **Mobile** — the wizard slides cleanly, the timeline strip scrolls horizontally, every band stacks gracefully, SLOOP SCRIPT overlaps scale.

Build real working code. For any missing visuals, use `generate_image` with the Astro-Brand base prompt — *"90s editorial photography, high contrast film flash, stark backgrounds, retro vintage objects, bright neon accents alongside moody shadows"* — never gray placeholders.
