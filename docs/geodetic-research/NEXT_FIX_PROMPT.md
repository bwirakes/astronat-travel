# Next-Session Prompt — Personal Reading Page Fixes

Paste this whole file as the first message of a fresh session after
pulling the branch `feat/geodetic-engine-complete`.

---

## Context

The personal geodetic reading page at
`app/(frontend)/(app)/reading/[id]/components/weather/WeatherReading.tsx`
currently renders ten sections for readings with `intent === "personal"`.
Three of those sections are producing visible problems.

The engine and personal-lens math are CORRECT as of the latest branch —
do not retouch `lib/astro/relocate.ts`, `app/lib/geodetic.ts`, or
`lib/readings/personal-lens.ts`. The fixes below are prose / layout /
content-mapping only.

Reference reading for manual testing:
`http://localhost:3000/reading/151b8c28-ffa3-4c77-b8b3-309e2ba3911d?type=weather`

Reference source doctrine:
`docs/geodetic-research/33b6e59a-8ab0-47a5-961e-9b5f4a1d0b46_Geodetic_101.pdf`

Prior eval docs (context for what the page is meant to show):
- `docs/geodetic-research/EVAL_151b8c28_v2.md` (Brandon / Dubai)
- `docs/geodetic-research/EVAL_TRUMP.md` (Trump / Helsinki)
- `docs/geodetic-research/PERSONAL_GEODETIC_PAGE.md` (spec)

---

## Issue 1 — wrong geographic label in the geodetic section

### Symptom
For a reading at **Helsinki** (25°E, Aries column), the geodetic-lens
section displays cities / regions from a different column (reported as
"Southeast Asia"). Helsinki is in the Aries meridian, and the Aries
zone's city list is `["London", "Lagos", "Accra", "Dublin"]` — none of
those are Southeast Asia, so the zone selector is picking the wrong
zone.

### Where to look
1. `app/(frontend)/(app)/reading/[id]/components/weather/GeodeticLinesSection.tsx`
   — this is the section that renders the "permanent lens" content for
   the destination. The bug is almost certainly a wrong mapping from
   `destLon` → zone.
2. `app/geodetic/data/geodeticZones.ts` — each zone has a `startLon`
   and a fixed 30° width. For Helsinki at 25°E, the correct zone is
   `Aries` (startLon 0). The selector should do
   `floor(((lon % 360) + 360) % 360 / 30)` and index into `GEODETIC_ZONES`.
3. `app/lib/geodetic.ts` — `geodeticMCSign(lon)` returns the right sign
   string. If `GeodeticLinesSection` is comparing against zone sign, use
   that. If it's using a lookup by city name, that's the bug — rip it
   out and use the longitude-based index.

### Acceptance
- Helsinki (25°E) → Aries zone → cities "London, Lagos, Accra, Dublin",
  keyword "The Pioneer Meridian".
- Dubai (55°E) → Gemini zone → cities "Dubai, Karachi, Tehran, Nairobi".
- Moscow (37°E) → Taurus zone.
- Tokyo (139°E) → Leo zone.

Write a tiny sanity helper that maps a few test longitudes to their
expected signs and assert in a Vitest `describe` block if one exists,
or inline in a comment-driven test.

---

## Issue 2 — the summary is mechanically correct but carries no
## meaning

### Symptom
The Brief currently reads:

> *"In Helsinki you become Sagittarius rising. Your chart ruler, Jupiter,
> moves from your natal 2nd to your relocated 6th — work, health, daily
> rhythm."*

The line is factually right but offers the reader no answer to *"so what?"*
The PDF (p.3) makes the same chart-ruler shift the lede of the whole
reading because the implication is the story, not the data point.

### The PDF's framing to steal

> *"Taurus rising in Jakarta puts Venus (chart ruler) in the 3rd house;
> in NYC the same person becomes Libra rising, still Venus-ruled, but
> Venus is now in the 9th house. Different house placements of your
> chart ruler changes the themes/topics of your trip."*

The PDF implies — but doesn't compute — that the 3rd→9th shift means
"short-form conversations and siblings-style relationships in Jakarta"
become "long-form teaching, publishing, and foreign ties in NYC". That
second sentence is what's missing from our output.

### What to build

Extend the brief-level renderer that produces the chart-ruler line to
add **one more sentence** that names the trip's **implication**, not
the house number. Two options:

**Option A — static implication table (ship first).**
Build a 12×12 table keyed by `(natalHouse, relocatedHouse)` that returns
one short implication sentence per delta. Example entries:

```
(2, 6):   "What you earn and value gets routed into daily work and
           health habits here — more structure, less accumulation."
(3, 9):   "Conversations and siblings-sized bonds at home become
           teachers, publishing, and foreign ties here."
(12, 10): "A private, hidden edge at home becomes fully public here.
           Same planet, new stage."
(2, 6) for Jupiter specifically:
          "Jupiter here widens daily work and health — growth through
           routine, not through risk-taking."
```

Keep each sentence ≤20 words. No jargon. This is the one line that
makes the reader nod.

**Option B — one AI sentence with a strict schema (ship second, if
Option A feels thin).**

Give the AI `{chartRulerPlanet, natalHouse, natalDomain, relocatedHouse,
relocatedDomain, city}` and ask for a single implication sentence, ≤20
words, that answers *"what does this trip tend to do to this person?"*

Strict schema:
```
chartRulerImplication: z.string().min(20).max(140)
```

Validator: reject if the sentence doesn't name at least one of:
- an action verb (turn, rewire, sharpen, soften, expand, contract, etc.)
- a concrete life domain noun (work, home, relationships, money, teaching, etc.)
- the city name OR the chart-ruler planet name

### Where to wire it

1. Either extend `lib/readings/personal-lens.ts` with a
   `chartRulerImplication(lens)` pure function (Option A), or add a
   new field to `WeatherReadingSchema` and the prompt in
   `lib/ai/prompts/geodetic-weather.ts` (Option B).
2. Pass through the runner `lib/readings/geodetic-weather.ts`.
3. Persist on `weatherForecast.personalLens` (Option A) or
   `interpretation.chartRulerImplication` (Option B).
4. Render the second sentence in
   `app/(frontend)/(app)/reading/[id]/components/weather/Brief.tsx`
   immediately below the existing chart-ruler line, same typography,
   one-line gap.

### Acceptance

Brandon / Dubai chart-ruler line after the fix:
> *"In Dubai you become Pisces rising. Your chart ruler, Jupiter, moves
> from your natal 2nd to your relocated 4th — home, roots, family, inner
> ground.*
> *Expect resources and values to quiet into domestic ground here —
> Dubai settles rather than multiplies."*

Trump / Helsinki after the fix:
> *"In Helsinki you become Scorpio rising. Your chart ruler, Mars, moves
> from your natal 12th to your relocated 10th — career, reputation,
> public standing.*
> *A Mars that runs quiet at home runs loud here — same planet, new
> stage."*

---

## Issue 3 — remove the two static reference sections

### Symptom
The reading ends with two long static blocks:
- § 3 — "When to move" (Timing Decisions)
- § 4 — "The framework" (how the reading is built)

Both render identical text on every reading, regardless of user or city.
They're pure editorial padding at the end of a personal reading where
the reader should instead be dropped at the colophon.

### What to remove

1. In
   `app/(frontend)/(app)/reading/[id]/components/weather/WeatherReading.tsx`,
   delete the block that renders `<TimingDecisions />` (currently under
   the heading "08 — § 3 + § 4 — TIMING + FRAMEWORK").
2. Delete the file
   `app/(frontend)/(app)/reading/[id]/components/weather/TimingDecisions.tsx`
   (no other importers — verify with grep before deleting).
3. Leave `Colophon` as the last section so the page still has a footer.

### Acceptance
Reading page order for `intent === "personal"` becomes:
1. Brief (with new chart-ruler implication line)
2. Best travel windows
3. Why this place, this season
4. Gantt timeline
5. Movements
6. § 1 — ACG lines (LinesEditorial)
7. § 2 — Ruler Journey (RulerJourney)
8. § 3 — Geodetic zones (GeodeticLinesSection) ← now correctly localised
9. Colophon

---

## How to test end-to-end

Dev server should already be running on `localhost:3000`. After the three
fixes:

1. Open the existing Brandon/Dubai reading:
   `/reading/151b8c28-ffa3-4c77-b8b3-309e2ba3911d?type=weather`
2. Click Regenerate (top right of the Brief) — this re-runs the
   `/api/readings/[id]/regenerate-weather` endpoint with the latest code.
3. Verify:
   - § 3 (Geodetic Lens) now lists Gemini zone cities for Dubai, not
     Southeast Asia.
   - Brief has two sentences — the mechanical chart-ruler line + the
     new implication line.
   - No "When to move" or "How this reading is built" sections anywhere
     on the page.
4. Create a second reading for Helsinki (use the wizard at `/reading/new`
   → "What this place does to me" → Helsinki → 30 days → any goal →
   generate). Verify the same three fixes on a second city with a
   different geodetic zone.

---

## Files guaranteed untouched by this work

Do **not** edit:
- `app/lib/geodetic.ts` (ASC formula is correct as of commit `e8facd9`)
- `app/lib/geodetic-weather.ts` (engine)
- `app/lib/geodetic/*` (scoring modules)
- `lib/astro/relocate.ts`
- `lib/readings/personal-lens.ts` (the math — only extend with the new
  implication helper if you pick Option A)
- `app/api/geodetic-weather/route.ts`

---

## Commit instructions

One commit per issue, in order:
1. `fix(geodetic-ui): localise geodetic zone to destination longitude`
2. `feat(reading): add chart-ruler implication sentence to Brief`
3. `refactor(reading): remove static timing + framework sections`
4. `feat(reading): surface 7-step geodetic framework as in-page signals`

Push as a new branch off `feat/geodetic-engine-complete`, named
`feat/reading-page-polish`.

---

## Issue 4 — the reading must demonstrate the 7-step framework

### Source doctrine

From `Geodetic_101.pdf` p.5 — the Geodetic Mapping Framework:

1. **Establish the base chart.** Natal, national, or event chart —
   accurate date, time, place.
2. **Calculate the geodetic frame.** Geodetic MC from longitude, ASC
   from table of houses + latitude, for the target location.
3. **Map natal planets to geodetic degrees.** Convert each natal planet's
   zodiacal position to a geographic longitude (30° zodiac per 30°
   earth longitude — so a planet at Leo 26.78° / 146.78° ecliptic
   corresponds to geographic longitude 146.78°E, roughly eastern Russia
   / Vladivostok).
4. **Identify active zones.** Find where current transit / eclipse /
   lunation degrees land on the world map using the same formula.
5. **Apply the rule of three.** Confirm with at least three independent
   signals (national chart contacts, additional timing layers, ACG
   lines) before interpreting.
6. **Layer temporal techniques.** Apply transits, progressions, solar
   arc directions to the geodetic frame for precise timing.
7. **Interpret the houses.** Read the geodetic house themes for the
   target location — which life domains are activated?

### Which principles are currently in the product

| # | Principle | Computed? | Visible on page? |
|---|---|---|---|
| 1 | Base chart | yes (birthDateTimeUTC, birth coords) | implicit in Colophon |
| 2 | Geodetic frame at destination | yes (correctly, as of commit e8facd9) | **no** — the numbers are in `personalLens` but never rendered |
| 3 | Natal planets → geographic longitude | **no** — not computed in `personalLens` | **no** |
| 4 | Active transit / eclipse / lunation zones for the window | yes (engine `events[]`) | partial — rendered inside Gantt and Movements, not tagged as "active zones" |
| 5 | Rule of three | no explicit tally | no |
| 6 | Progressions + solar arcs | **no** — engine is transit-only | no |
| 7 | Relocated house interpretation | yes (via `personalLens.chartRulerRelocatedHouse`) | yes (Ruler Journey section) |

### What to add

Four small, additive pieces. None touch the engine — all are reading-
page additions driven by data that is already persisted or trivially
derivable from what is.

#### 4a. Surface the geodetic frame (principle 2)

Just below the chart-ruler implication line in the Brief, add one mono-
kicker + two short facts:

> `THE GEODETIC FRAME FOR HELSINKI`
> MC · Aries 25° · the city's fixed career / public-standing column
> ASC · Leo 20° · the sign permanently rising over this longitude-and-latitude

These come from `personalLens.relocatedMcLon` / an engine call for
`geodeticASCLongitude`. **These are CITY facts, not user facts** — they
belong in the Brief because they ground the rest of the reading, but
the copy must say "the city's" not "your".

#### 4b. "Your Mars lands over…" — natal → geography (principle 3)

Extend `personal-lens.ts` with a new field:

```ts
natalPlanetGeography: Array<{
    planet: string;         // "Mars"
    planetLon: number;       // 146.78
    geographicLon: number;   // 146.78 — same number, different unit
    geographicLabel: string; // "E eastern Russia / Vladivostok band"
    angularMatch: boolean;   // true if this longitude is within 5° of
                             // the destination longitude OR 180° opposite
}>;
```

Pure function — no AI. The mapping is `geographicLon = planetLon` (since
0° Aries = 0° Greenwich). For the label, use a static lookup table
(ranges of degrees → human region) keyed to 30° bands. Example:

| Geographic longitude | Human label |
|---|---|
| 0–30°E | Europe / West Africa |
| 30–60°E | East Africa / Levant / Arabia |
| 60–90°E | Iran / Central Asia / India (west) |
| 90–120°E | India (east) / Tibet / SE Asia |
| 120–150°E | China / Mongolia / Korea / eastern Russia |
| 150–180°E | Russian Far East / NZ / Pacific |
| 180–150°W | Central Pacific / Alaska |
| 150–120°W | Pacific Northwest |
| 120–90°W | Western North America |
| 90–60°W | Central / Eastern North America |
| 60–30°W | South America / Atlantic |
| 30°W–0° | Atlantic / West Africa |

Render as a new `NatalGeography` section after the Ruler Journey:

> **§ 3 · WHERE YOUR PLANETS LAND**
> ♂ Mars 146.78° → Vladivostok / eastern Russia band
> ☉ Sun 82.93° → Iran / central Asia band
> ♀ Venus 115.74° → Southeast Asia band
> …

For each planet, if `angularMatch` is true (natal planet longitude within
5° of destination longitude or its opposite), add a small "**active
here**" tag. This is the visible rule-of-three signal that the
destination happens to fall on one of the user's natal-planet longitudes.

#### 4c. Rule-of-three confidence marker (principle 5)

Add a short "confidence strip" between the Brief and Best Windows.
Count how many independent signal families fire for this reading:

- Angle-transit hits (from `events` array, `layer === "angle-transit"`)
- Paran latitude matches (from events, `layer === "paran"`)
- Late-degree hits
- ACG lines near the destination (from the existing `LinesEditorial`
  data)
- Chart-ruler displacement vs. natal (non-zero if `chartRulerNatalHouse
  !== chartRulerRelocatedHouse`)
- World-point contacts (from `personalLens.worldPointContacts`)
- Natal-planet-geography match (from 4b)

If ≥3 of these fire, render a green pill: **"3 independent signatures
confirm this window"** with the list on hover/click. If <3, render a
yellow pill: **"Only N signature(s) — interpret loosely"**.

This is the engineering realisation of the PDF's "rule of three" —
don't read a transit as decisive unless multiple frameworks agree.

#### 4d. Flag principle 6 as deferred

Not in scope for this fix. Add a single-line note at the bottom of the
Colophon:

> Layers active: transits, parans, stations, eclipses, world points,
> configurations, late degrees. Progressions and solar-arc directions
> are not yet integrated.

That's all — honest acknowledgement of the gap, no placeholder UI.

### Acceptance for issue 4

After the fix, a reading for **Brandon / Dubai** shows:

1. Brief: existing chart-ruler line + new implication sentence (from
   issue 2) + new geodetic-frame line (from 4a).
2. Confidence strip (from 4c): pill tally of independent signatures.
3. Ruler Journey (existing).
4. **§ 3 — Where your planets land** (from 4b): list of natal planets
   mapped to geographic longitude bands, with an "active here" tag if
   any land on Dubai's longitude (55.29°E, i.e. 55.29° ecliptic).
5. § 4 — Geodetic zones (existing, now correctly localised per issue 1).
6. Colophon with the principle-6 acknowledgement (from 4d).

Brandon's natal Jupiter at 197.45° (Libra 17.45°) maps to geographic
longitude 197.45°E ≈ 162.55°W (mid-Pacific). Not near Dubai, so no
"active here" tag. But his natal Neptune at 185.84° and natal Mars at
146.78° map to longitudes in SE Asia / eastern Russia — relevant if he
were ever to travel there, and visible for future readings.

### Why this matters for the summary

The user feedback was that the summary "is missing the implications of
what this means." The 7-principle check tells us the summary is missing
three of seven foundational principles (2, 3, 5). Adding:
- the geodetic frame line (4a) fixes principle 2
- the natal-geography section (4b) fixes principle 3
- the confidence strip (4c) fixes principle 5

By the time the reader finishes the first 10 seconds of the page —
Brief + confidence strip — they've seen six of the seven principles
named, and the seventh (progressions) is honestly disclaimed in the
Colophon. That's what turns the reading from a one-line magic trick
into a diagnostic grounded in the PDF's craft.

---

## Updated commit order

1. `fix(geodetic-ui): localise geodetic zone to destination longitude` (issue 1)
2. `feat(reading): add chart-ruler implication sentence to Brief` (issue 2)
3. `refactor(reading): remove static timing + framework sections` (issue 3)
4. `feat(reading): surface geodetic frame + natal-geography + rule-of-three` (issue 4)
