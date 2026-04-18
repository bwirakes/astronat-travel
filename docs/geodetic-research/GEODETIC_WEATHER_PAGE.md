# Geodetic Weather — Final Reading Page Spec

Scope: **mundane / earth weather forecasting**. Answers: *"What astrological
pressure is on this location during this window? Floods? Fires? Seismic?
Storms? Civil tension?"*

This is the product the current intake wizard actually asks for (floods /
fires / earthquakes / atmospheric / civil) but never delivers.

Audience: researchers, climate-watchers, insurance / risk, astrologers
monitoring mundane events. **Not** personal travel.

Reference: `Geodetic_Weather_Patterns.pdf` is the canonical doctrine.

---

## 1. Engine — what's already there

On branch `feat/geodetic-weather` (3 commits: `57354aa`, `b25c9b7`,
`689a9a1`):

- `app/api/geodetic-weather/route.ts` — POST, returns one
  `GeodeticWeatherResult` per `{date, destLat, destLon}`.
- `app/lib/geodetic-weather.ts` — blender. Sums 7 layer buckets + tier
  shift + severity modifiers → a 0–100 score, an enumerated tier, and an
  attributed `events[]` list.
- `app/lib/geodetic/` — nine scoring modules, each independently testable:
  `angle-transits`, `paran-scoring`, `station-scoring`, `eclipse-scoring`,
  `world-points`, `late-degrees`, `fixed-stars`, `configurations`,
  `severity-modifiers`.
- `app/lib/geodetic/geodetic-events.ts` — hand-curated station + eclipse
  calendar (canonical dates, not computed).
- `app/lib/geodetic/__tests__/historical-events.fixtures.ts` — 31 real
  historical events (earthquakes, floods, fires, storms).
- `backtest-report.md` — **93% tier match** against the fixture set.
- `lib/astro/declination.ts` — OOB helper for severity modifier.

`lib/readings/geodetic-weather.ts` already fetches that route per day and
falls back to the mock on failure. **Once the engine commits land on
`main`, the mock stops firing automatically.** No UI wiring change
required to switch data sources — that's already plumbed.

### 1a. What the page consumes
Per city, per day:
- `score`, `severity` (tier), `severityPreShift`
- `events[]` → `{ layer, label, planets, orb?, severity, direction, note? }`
- `breakdown` → per-bucket integer contributions (angleTransits, parans,
  stations, eclipses, worldPoints, lateDegrees, configurations, tierShift)
- `severityModifiers[]` → OOB stacks + nodal imbalance
- `oobPlanets[]` — names + declinations
- `phasesActive[]` — engine phases present

This is enough signal to build a dense, non-filler reading with zero
AI help if we want. AI becomes decorative, not load-bearing.

---

## 2. Final reading page — structure

The page is an **atmospheric-conditions report**. Frame the whole thing
like a NOAA / ECMWF forecast briefing, not a travel column. Think
"weather discussion" + "situation report."

### 2a. Top of page — the headline (no hero photo)
- Kicker mono: `GEODETIC WEATHER · {CITY}, {REGION} · NEXT {N} DAYS`
- H1 serif: `The {City} Forecast.` (no script flourish — this is a
  report, not a column)
- Under that: a **pressure dial** (not a score dial): a 5-segment horizontal
  bar `Calm · Unsettled · Turbulent · Severe · Extreme`, active segment
  lit, tier label printed.
- Meta mono: `{lat}°N/S · {lon}°E/W · {startDate} → {endDate} · {generated}`
- Right side: window toggle `7D · 30D · 90D`.

### 2b. Section A — Executive summary
Kicker: `A · SITUATION`. Two deterministic paragraphs, no AI:

> *"Over the next {N} days, {city} shows {X} Severe days and {Y} Extreme
> days clustered around {MMM D} — {MMM D}. {Count} days fall in the
> {dominantLayer} category: {layer-plain-language}."*

Plus a one-line AI-written coda (single short sentence, not a paragraph)
naming the single highest-severity event across the window. This is the
only place the LLM writes a freeform sentence.

### 2c. Section B — Pressure timeline (promoted)
Kicker: `B · PRESSURE GRADIENT`. Full-width horizontal heatmap:
- One column per day, colour by tier (Calm green → Extreme black/red).
- Above each day: the top-event layer glyph (station = pause icon,
  eclipse = filled disc, paran = ÷ symbol, angle-transit = +, late-degree
  = ●●●).
- Hover/tap a column → a pop-down card that lists `events[]` with
  planet glyph, label, orb (in degrees, precisely), direction colour.
- No mood labels, no "The arrival" / "Soft focus" prose.

### 2d. Section C — Active layers table
Kicker: `C · ACTIVE LAYERS`. A table, deterministic rendering of
`breakdown` summed across days:

| Layer | Days firing | Peak severity | Top contributor |
|---|---|---|---|
| Angle-transits | 7 | Severe (Feb 28) | Uranus on Dubai MC (27°Tau) |
| Parans | 3 | Turbulent | Mars Rising / Saturn Setting 32°N |
| Stations | 2 | Severe (Mar 2) | Mercury station retrograde near IC |
| Eclipses | 0 | — | — |
| World points | 1 | Turbulent | Pluto at 0° Aquarius |
| Late-degrees | 4 | Severe | Pluto 28.6° Capricorn |
| Configurations | 1 | Turbulent | T-square Mars/Uranus/Node |

Each row is a pointer: tap → filtered view of that layer's events only.

### 2e. Section D — Event-type risk matrix (this is the product)
Kicker: `D · WHAT THIS LOOKS LIKE ON THE GROUND`. Translate the
PDF's **Planet × Element × Modality × ACG angle** matrix into actual risk
readouts. Per active event, print:

```
FEB 27 — MAR 2    TIER Severe
──────────────────────────────────────────────
Mars (Aquarius) ☍ Uranus (Taurus), both at 27°
Dubai sits on the Taurus geodetic column.
Angular at MC. Fixed-modality late degree.

Likely physical signatures for this signature and
latitude band:
  · Volcanic / seismic pressure release      ▰▰▰▱▱
  · Explosive weather (lightning, wind shear) ▰▰▰▱▱
  · Structural / infrastructure stress        ▰▰▱▱▱
  · Civil flashpoints                         ▰▰▱▱▱
  · Flood / storm                             ▱▱▱▱▱

Historical analog: Feb 2019 Tajikistan earthquake
(same modality + similar angular transit).
```

This is where the **Weather-Patterns PDF matrix** finally earns its keep.
Each planet × element × modality combo has a ranked risk profile
(engine-computed, not AI). The bars are hardcoded per signature in
`app/lib/geodetic/risk-profiles.ts` (new; see §3).

### 2f. Section E — The two lenses, side by side
Kicker: `E · WHY HERE`.

Two-column explainer, the only "prose" block on the page:
- Left: *Permanent lens* — "{city} sits under the {Sign} geodetic column.
  Any transit through {Sign} lights the whole column. For the next {N}
  days, {list of planets currently transiting {Sign}}."
- Right: *Time-sensitive lens* — "Four geodetic angles for {city} today:
  MC {deg sign}, IC {deg sign}, ASC {deg sign}, DSC {deg sign}. Transits
  within 5° of any angle fire an angle-transit event."

Both are 100% derived from `geodetic-weather-types.ts` helpers + engine
output. Zero AI, zero filler.

### 2g. Section F — OOB & severity modifiers
Kicker: `F · MODIFIERS IN PLAY`. A bulletted block listing every
`severityModifier` from the engine:
- "Mars out-of-bounds (declination +25.3°) — amplifier, Feb 15 – Mar 8"
- "Nodal imbalance: 8 planets north of the ecliptic — collective-resonance
  window"

This is the bit the PDF calls out as "escalators, not triggers" — they
tier-shift, they don't fire alone. Making them visible tells the user why
a day is one tier worse than its raw events would suggest.

### 2h. Section G — Historical analogs
Kicker: `G · WHEN THIS HAPPENED BEFORE`. Pull from the fixture set. For
each current event, find the 1–2 closest historical matches by (layer,
planet set, tier, latitude band). Show date, location, event name, and
a thumbnail of the news source if we have one.

This is the backtest's backtest fixtures paying back — we built them for
model validation, but they're excellent UX furniture.

### 2i. Section H — Colophon
Data sources, engine phase list, backtest accuracy (`93% tier match on
31 historical events`), timestamp. Everything the reader needs to
decide how much to trust the output.

### 2j. What is NOT on this page
- No travel windows.
- No "best overall / meet new people / quiet rest" cards.
- No chart ruler, no natal planets, no ACG lines for the user.
- No "book 10 nights".
- No italic flourish script, no Ubud styling.

This is a report. Reports don't flourish.

---

## 3. What ships, in order, to reach 4.5 / 5

### Step 1 — Land the engine on main (zero UI work)
Merge `feat/geodetic-weather` → `main`. `lib/readings/geodetic-weather.ts`
starts getting real data automatically via the existing fetch.

### Step 2 — Delete the mock from the runtime path
`app/lib/geodetic-weather-mock.ts` stays in tree, but `geodetic-weather.ts`
(the runner) drops the fallback to mock. Replace with a hard error
(`"Geodetic engine unavailable"`) so the user can see data quality
degradation instead of fake data.

### Step 3 — New intake (mundane-only)
Rewrite `WeatherReadingFlow.tsx` step 3. Goals become:
- `all` — full forecast
- `seismic` — emphasise Mars lines, Pluto+Mars, stations
- `hydro` — emphasise Jupiter-Cancer/Pisces, Neptune lines, Saturn+Neptune
- `atmospheric` — emphasise Uranus, Mercury, fronts
- `civil` — emphasise world points, Mars-angle, configurations

The `goalFilter` field is already plumbed through to `weatherForecast` on
the reading record. Wire it on the page to *emphasise* (bold + larger font)
the relevant layer rows in Section C and risk rows in Section D. Do not
filter out other layers — users want to know about civil tension even
when they asked about floods.

### Step 4 — Risk-profile lookup table (new file)
`app/lib/geodetic/risk-profiles.ts`. Encodes the PDF's
Planet × Element × Modality → physical expression table as typed data:

```ts
export interface RiskProfile {
  seismic: 0 | 1 | 2 | 3 | 4 | 5;
  hydro: 0 | 1 | 2 | 3 | 4 | 5;
  atmospheric: 0 | 1 | 2 | 3 | 4 | 5;
  civil: 0 | 1 | 2 | 3 | 4 | 5;
  fire: 0 | 1 | 2 | 3 | 4 | 5;
}

export function riskProfileFor(
  event: ActiveEvent,
  citySignColumn: string,
  cityLatBand: "polar" | "temperate" | "tropical",
): RiskProfile;
```

Pure function. Hand-authored from the PDF's master table. Backed by the
same 31-case fixture set used by the backtest.

### Step 5 — New reading page components
Under `app/(frontend)/(app)/reading/[id]/components/weather/mundane/`:

- `MundaneBrief.tsx` — section A (no flourish, pressure dial not score dial).
- `PressureTimeline.tsx` — section B (Gantt replacement; atomic heatmap).
- `ActiveLayers.tsx` — section C (deterministic table).
- `RiskMatrix.tsx` — section D (the centrepiece; renders risk-profile bars).
- `TwoLenses.tsx` — section E.
- `Modifiers.tsx` — section F.
- `HistoricalAnalogs.tsx` — section G (consumes fixture set).
- `MundaneColophon.tsx` — section H.

`WeatherReading.tsx` becomes a thin switch: if `reading.category ===
"mundane"` → render the mundane stack above; else → render the personal
stack (see `PERSONAL_GEODETIC_PAGE.md`).

### Step 6 — AI voice, scoped
Single freeform slot: one sentence in §2b. Schema:

```
situationLead: z.string().max(200)
```

Prompt: *"Name the single highest-severity event in the window, in one
declarative sentence, stating: planet (sign), aspect, date range, and
one physical-world signature from the risk profile. Use the provided
event data verbatim — never invent."*

Everything else is deterministic. This reverses the current design where
AI carries 90% of the page.

### Step 7 — Validate
- Pick 5 historical events from the fixture set.
- Generate the mundane reading for each at `dateUtc - 7 days`.
- Verify the reading would have flagged the event:
  - Tier ≥ Severe on the correct day ±1
  - Risk matrix has the correct event type scoring ≥ 4 / 5
  - Historical analogs section surfaces a similar past event
- Target: **5 / 5 hits** to claim prediction credibility.

---

## 4. Score recovery — dimension by dimension

| Dimension | Current | Target | How |
|---|---|---|---|
| Faithfulness to `Geodetic_101.pdf` | 0 | 4.5 | Engine returns real angle-transits, geodetic column hits, parans, world points, late-degrees. All derived from Swiss Ephemeris, not mock. |
| Faithfulness to `Geodetic_Weather_Patterns.pdf` | 0 | 5.0 | §2e risk matrix IS the PDF's master table, encoded as typed data, rendered per event. |
| Intake → Output coherence | 1 | 5.0 | New intake goals map 1:1 to output emphasis. User asks about floods, Section D highlights hydro risk first. |
| Prose quality | 2 | 4.5 | Prose reduced to one AI sentence. Everything else is deterministic. Can't go wrong if you don't ask it to. |
| Engine / tech | 3 | 5.0 | Mock deleted. Real engine. 93% tier-match backtest. |
| Desktop UX | 3 | 4.5 | Single-column narrow layout, NOAA-report frame, heatmap timeline. |
| Mobile UX | 2 | 4.5 | Single column scales naturally; heatmap gets horizontal scroll; risk bars stack. Nothing 2-col on mobile. |
| **Overall** | **1.3** | **4.7** | |

---

## 5. End-to-end trace (the demo script)

A researcher wants to check Dubai Feb 27 – Mar 28 for seismic risk.

1. `/reading/new` → picks Dubai → picks 30 days → picks "seismic".
2. Wizard POSTs to `/api/readings/generate` with `readingCategory:
   "geodetic-weather"`, `weather.goalFilter: "seismic"`.
3. `runGeodeticWeather()` calls `/api/geodetic-weather` for each of 30
   days. Engine computes via Swiss Ephemeris for each day.
4. Each day returns `GeodeticWeatherResult` with real events, real orbs,
   real layers.
5. Runner aggregates into `cities[0].days[]`, computes `macroScore`,
   calls one AI for the `situationLead` (single sentence).
6. Persists. Redirects to `/reading/{id}?type=weather`.
7. Page reads `reading.category === "mundane"` → renders the mundane
   stack.
8. User sees: pressure dial at "Severe", Section B shows a red spike
   on Feb 28, Section C table shows Angle-Transits peak with Uranus on
   Taurus MC cited, Section D risk matrix shows **seismic 4/5** because
   user asked about seismic, Section G surfaces Feb 2019 Tajikistan as
   analog.
9. Everything above is real data traceable back to an ephemeris
   computation. No filler, no "renewal", no travel window.

This is the product the PDFs describe.
