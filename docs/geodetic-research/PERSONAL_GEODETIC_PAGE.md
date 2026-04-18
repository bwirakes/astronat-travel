# Personal Geodetic — Final Reading Page Spec

Scope: **personal relocation + timing**. Answers: *"What does this place do
to ME over this window? What will my chart ruler care about? When should I
go? When should I avoid it?"*

This is what the current output *tries* to be (travel windows, best/worst
dates, movements) but can't, because the intake asks weather questions
and the engine ships noise.

Audience: travellers, relocators, people making a personal decision
anchored to a place + a time. **Helena-Woods-style.**

Reference: `Geodetic_101.pdf` pages 3–5 (Brandon-in-Jakarta example, chart-
ruler relocation, paran lines to avoid, case studies).

---

## 1. Engine inputs — same engine, different question

This product uses the **same** `computeGeodeticWeather()` engine, but
combines its output with the user's natal chart to produce something the
mundane reading does not:

- Natal planets (already in `reading.details.natalPlanets`).
- `birthDateTimeUTC`, `birthLon`, `birthLat`.
- Relocated Ascendant and its sign at the destination.
- Chart ruler — the traditional ruler of that relocated sign.
- That planet's natal house vs. its relocated house.

All of the above is computable from existing helpers in `app/lib/
geodetic.ts` + `lib/astro/transits.ts`. No new engine needed.

The mundane event stream (`events[]`) is filtered through a *personal
relevance lens*: an event matters to you if it involves a planet that
rules, aspects, or sits within 5° of one of your relocated angles. All
other events are still computed but demoted.

### 1a. New derived values (none of these need AI)

```ts
interface PersonalLens {
  relocatedAscSign: string;       // "Libra"
  chartRulerPlanet: string;        // "Venus"
  chartRulerNatalHouse: number;    // 3
  chartRulerRelocatedHouse: number;// 9
  chartRulerHouseDelta: string;    // "3 → 9: publishing, teaching, foreign ties"

  activeAngleLines: Array<{        // natal planets within 5° of relocated angle
    planet: string; angle: "ASC"|"DSC"|"MC"|"IC"; orbDeg: number;
  }>;

  parannLatitudes: Array<{         // per PDF — "paran lines to avoid"
    planets: [string, string];
    latitudeDeg: number;
    distanceFromCityDeg: number;
  }>;

  worldPointContacts: Array<{      // natal planet ≤2° of 0°/15°/7.5°/22.5° zodiac
    planet: string; pointType: "cardinal"|"fixed"|"mutable";
    orbDeg: number;
  }>;
}
```

Compute once at reading generation time. Persist in `reading.details.
personalLens`.

---

## 2. Final reading page — structure

Frame: **"your chart meets this place."** Editorial, Ubud-leaning, but
every section opens with a personal hook, not a generic one.

### 2a. Section 1 — Brief
Kicker: `YOUR READING · {CITY}, {REGION}`
H1: `The {CITY} {flourish}` — flourish script word, AI-chosen, per current
Ubud design.
Sub-heading (**new**, required, ≤20 words):

> *"In {City} you become {relocatedAscSign} rising. Your chart ruler,
> {Planet}, moves from your natal {N}th to your relocated {M}th — {domain}."*

This is the line the PDF calls *"everything."* It's pure computation
(no AI). Example output:

> *"In Dubai you become Leo rising. Your chart ruler, the Sun, moves from
> your natal 5th to your relocated 1st — identity sharpens, body forward."*

Score pill: top-right as today (`{score}/100 · {band}`).
Meta row: coords, dates, windows, generated — as today.

### 2b. Section 2 — Best travel windows
Kicker: `BEST WINDOWS`. Composite card, same as Ubud — three ranked
ranges. But:
- **Rank labels are life-domain-derived, not generic.** The engine picks
  from a list conditioned on which houses are being activated:
  `"Best for rest"`, `"Best for connection"`, `"Best for deep work"`,
  `"Best for launches"`, `"Best for endings"`. No more "Best overall" /
  "Meet new people".
- **Score is the PERSONAL score**, not the macro tier. Same engine output,
  but weighted so events touching the user's chart ruler or natal planets
  score higher, and events on angles the user has nothing near score
  lower.
- Each window's `note` names the specific planet + angle + date:
  *"Venus crosses your Descendant Apr 4–9; Moon trines your natal Mars
  Apr 6. Best window for connection."*

### 2c. Section 3 — Why this place, for this chart
Kicker: `§ 1 · THE GEODETIC READING`

Two-column editorial block (Ubud screenshot model):

- **Left**: AcgMap pinned to destination. Show only the **5 nearest
  planetary lines** (≤5° arc = ≤550 km at mid-latitudes). Drop the
  1500km cap.
- **Right**: the natal-angle-contacts list from `personalLens.activeAngleLines`.
  Each line: planet glyph, `{Planet} on the {Angle}`, orb in degrees AND
  kilometres, *generated* caption. No more hardcoded `captionFor()`.

Caption generation rule (single AI call per line, ≤15 words, strict
schema):

```
captionFor({
  planet, angle,
  natalHouseOfPlanet,       // e.g. 5 for Venus natal
  relocatedHouseOfPlanet,   // e.g. 9 for Venus relocated
  isChartRuler,             // boolean
})
→ "Venus rules you here; home ground literally shifts how you bond."
```

The prompt names the 4 inputs and requires the caption to reference at
least one of them. If it doesn't, validation fails and we retry.

### 2d. Section 4 — Chart ruler's journey (new)
Kicker: `§ 2 · THE RULER TRAVELS`

This is the PDF's dominant teaching and it's currently absent. Two blocks:

- Block A (deterministic): a labelled diagram of the user's natal wheel
  with the chart ruler highlighted in its natal house, next to a second
  wheel for the relocated chart with the ruler in its new house. Lines
  between them showing the delta.
- Block B (one AI sentence, strict schema): *"Chain: {City} → you become
  {ASC sign} → {Ruler} rules → natal house {N} ({natalDomain}) →
  relocated house {M} ({relocatedDomain}) → {implication for this trip}."*

Strict schema requires every `→` to have a concrete noun (planet name,
sign, house number, domain). Validation rejects any empty or
adjective-only link ("New focus → Renewal" fails).

### 2e. Section 5 — Movements (keep, hardened)
Kicker: `§ 3 · MOVEMENTS`

Keep the existing narrative chapters. Three hard rules added to the
prompt:

1. **Every movement must name a planet transiting within 5° of an angle
   or within 2° of a world-point.** If the engine produced no such
   event, the movement slot goes empty — never filler.
2. **The Chain rule** from §2d extends: every movement ends with a Chain
   sentence using the same strict schema.
3. **No mood-only titles.** "Soft focus" fails. "Jupiter on your
   Descendant, Apr 6" passes. The subtitle is allowed to be mood-word.

### 2f. Section 6 — Paran risks (new)
Kicker: `§ 4 · LATITUDE BAND WARNINGS`

Per PDF p.3 ("paran lines to avoid"). A compact list: any paran latitude
within 3° of the city, with the planet pair and why (malefic or
benefic). For Brandon-in-Dubai this is the "Uranus Rising / Mars
Anticulminating at 30°N45'" readout.

Deterministic, pulled directly from engine `events[]` where `layer ===
"paran"`.

### 2g. Section 7 — World-point contacts (new)
Kicker: `§ 5 · PUBLIC VISIBILITY SIGNATURES`

Per PDF p.2 (8th-harmonic world points). For every natal planet at:
- 0° cardinal (Ari/Can/Lib/Cap)
- 15° fixed (Tau/Leo/Sco/Aqu)
- 7.5° mutable (Gem/Vir/Sag/Pis)
- 22.5° cardinal

…print a single line: *"Your natal Mars at 15° Leo sits on a world point.
Public moves amplify; what you do here echoes farther than it should."*

### 2h. Section 8 — The timeline
Kicker: `§ 6 · WHEN`. Reuse the mundane `PressureTimeline` heatmap, but
colour-weighted by personal relevance (events touching your chart score
stronger). The baseline mundane tier is still visible underneath as a
thin reference stripe.

### 2i. Section 9 — Advice
Kicker: `§ 7 · IF YOU'RE DECIDING`. Two short lines from AI:
- `bestWindow` — one sentence, names a concrete window and a concrete
  signature.
- `watchWindow` — one sentence, names what to avoid and when.

### 2j. Section 10 — Colophon
Data sources, engine version, backtest accuracy for mundane layer,
timestamp.

### 2k. What is NOT on this page
- No weather-type risk matrix (floods / fires / seismic). That's the
  mundane report.
- No "Situation report" frame. This is a personal reading.
- No `TimingDecisions` static framework copy. Move to `/guide/geodetic`.
- No photo hero, no moody-landscape.
- No "Chain: Eclipse aftershock → New focus → Renewal" style filler —
  validation blocks it.

---

## 3. What ships, in order, to reach 4.5 / 5

### Step 1 — Engine on main (same as §Weather Step 1)
Merging `feat/geodetic-weather` enables everything downstream for both
products.

### Step 2 — Intake rewrite (personal goals)
`WeatherReadingFlow.tsx` step 3 for the personal path. Goals become:
- `rest` — downweight Mars/Uranus on angles, upweight Moon/Venus IC
- `connect` — upweight Venus/Jupiter DSC
- `launch` — upweight Sun/Mercury MC, avoid Mercury Rx
- `retreat` — upweight 12th-house activations
- `reconcile` — upweight Venus returns, soft aspects
- `all` — no weight

Same goal-filter plumbing as weather, different rubric.

### Step 3 — Personal lens computation (new module)
`app/lib/readings/personal-lens.ts` (new). Pure function, takes
`{natalPlanets, birthLon, birthLat, destLat, destLon, dateUtc}`, returns
the `PersonalLens` struct from §1a. Uses existing `geodetic.ts` helpers.

### Step 4 — Schema changes
`lib/ai/schemas.ts` for the personal reading:

```ts
WeatherReadingSchema  // keep for weather-mundane
+
PersonalReadingSchema = z.object({
  titleFlourish: z.string(),
  chartRulerLine: z.string(),        // AI fills, but rejected if no planet+house mentioned
  hook: z.string(),
  travelWindows: z.array(...).min(1).max(3),
  lineCaptions: z.array(                // one AI caption per nearest planetary line
    z.object({ planet, angle, caption: z.string() })
  ).min(0).max(5),
  rulerJourneyChain: z.string(),        // Chain: sentence, validated
  keyMoments: z.array(...).min(2).max(5),
  advice: z.object({ bestWindow, watchWindow }),
});
```

Validation post-parse: every `keyMoments[].body` and `rulerJourneyChain`
are re-parsed against the strict Chain schema: each `→` segment must
contain at least one proper noun from an approved list (planet names,
sign names, "the {N}th", etc.). Fail → retry with stricter prompt.

### Step 5 — Update `lib/ai/voice.ts`
Reverse the over-restriction:

- **Allow**: degrees, arc-minutes, orbs in degrees, house numbers spelled
  ("the 9th"), planet glyphs, aspect names (conjunct, square, trine,
  sextile, opposition, quincunx).
- **Require**: whenever a technical term appears, pair it with a plain-
  language gloss on the same or next sentence.
- **Still forbid**: "universe", "vibrations", "manifesting", "energy
  (noun)", "should", "try to".

### Step 6 — New reading page components
Under `app/(frontend)/(app)/reading/[id]/components/weather/personal/`:

- `PersonalBrief.tsx` — §2a.
- `PersonalBestWindows.tsx` — §2b (composite card with domain-derived ranks).
- `LinesEditorialV2.tsx` — §2c (replaces current `LinesEditorial.tsx`;
  captions come from AI, not hardcoded).
- `RulerJourney.tsx` — §2d (new — dual-wheel diagram + Chain sentence).
- `MovementsSectionV2.tsx` — §2e (prompt + validation hardened).
- `ParanRisks.tsx` — §2f (new).
- `WorldPoints.tsx` — §2g (new).
- `PersonalTimeline.tsx` — §2h (wraps `PressureTimeline` with relevance
  weighting).
- `AdviceBlock.tsx` — §2i.
- `PersonalColophon.tsx` — §2j.

`WeatherReading.tsx` dispatcher:
```ts
if (reading.details?.weatherForecast?.intent === "mundane")
  return <MundaneReading … />;
return <PersonalReading … />;
```

### Step 7 — Delete dead components
`AlmanacHero.tsx`, `TopDatesStrip.tsx`, `SummaryHighlight.tsx`,
`DetailsBundle.tsx`, `LinesSection.tsx`, `Stage1Summary.tsx`,
`Stage2Interpretation.tsx`, `Stage3FullReport.tsx`, `Prologue.tsx`,
`VerdictSlab.tsx`, the static `TimingDecisions.tsx`. None are imported
anywhere after §Step 6.

### Step 8 — Validation harness
For the personal product, validation must check:
1. `chartRulerLine` references a planet name AND a house number.
2. `rulerJourneyChain` has ≥4 `→` links, each with ≥1 proper noun.
3. Every `keyMoments[].body` ends with a Chain sentence of the same shape.
4. Every `lineCaptions[].caption` references at least one of: planet
   name, angle name, house number, or "rules you" (chart-ruler marker).

Retries: ≤2 with "be more specific" suffix. If still failing, persist
with a shipped-but-flagged status so a human can review.

### Step 9 — QA scenarios
Run the Brandon-in-Jakarta and Trump-in-Europe cases from the PDF as
acceptance tests:

- Brandon/Dubai Feb 27 – Mar 2 2026 should surface:
  - Chart ruler: Venus moves 3rd → 9th
  - Uranus on Dubai MC within 5°
  - Late-degree (27°) fixed-sign flag
  - Paran warning at 30°N45'
  - A `keyMoment` with Chain naming all four
- Trump/Helsinki should surface:
  - Relocated ASC still Leo (fixed permanent match)
  - Mars on geodetic ASC for this band
  - A `keyMoment` calling out the fixed-sign match as a **feature**, not
    a transit

Both tests pass before the PR merges. This is the Helena-Woods
expert-check.

---

## 4. Score recovery — dimension by dimension

| Dimension | Current | Target | How |
|---|---|---|---|
| Faithfulness to `Geodetic_101.pdf` | 0 | 5.0 | Chart ruler relocation as §2a + §2d is the single biggest unlock. Parans, world points, late-degree all now first-class. |
| Faithfulness to `Geodetic_Weather_Patterns.pdf` | 0 | 3.5 | Personal product doesn't need the full weather matrix — its job is personal, not physical. 3.5 because the planet-verb table still informs the Movements voice. |
| Intake → Output coherence | 1 | 4.5 | Intake asks a personal goal (rest/connect/launch), output reranks windows by that goal. User's question is visible in the answer. |
| Prose quality | 2 | 4.5 | Chain validation blocks filler. Technical vocabulary allowed + glossed. Every AI field has a strict schema with retry. |
| Engine / tech | 3 | 5.0 | Same engine as mundane. Personal lens is pure computation. No mock. |
| Desktop UX | 3 | 4.5 | Keep Ubud frame. Add dual-wheel ruler-journey visual. Chart-ruler line is the first thing the user reads. |
| Mobile UX | 2 | 4.5 | Single-column stack. Dual-wheel becomes a single wheel with a planet-movement animation. Lines list drops distance column. |
| **Overall** | **1.3** | **4.5** | |

---

## 5. End-to-end trace (the demo script)

Brandon (born Jakarta, Aug 17 1988, 22:15) is considering 3 weeks in
Dubai Feb 27 – Mar 19 2026.

1. `/reading/new` → Dubai, 30 days, goal: `launch` (he's taking something
   public).
2. Wizard POSTs with `readingCategory: "personal-geodetic"` (new),
   `weather.goalFilter: "launch"`.
3. `runPersonalGeodetic()` (new sibling to `runGeodeticWeather()`) fetches
   `/api/geodetic-weather` per day, computes `personalLens` once,
   filters/ranks events by personal relevance.
4. Persists. Redirects.
5. Page renders:
   - Section 1: *"In Dubai you become Leo rising. Your chart ruler, the
     Sun, moves from your natal 5th to your relocated 1st — identity
     forward, visibility up."*
   - Section 2: three windows. Window 1 `"Best for launches: Mar 2 – Mar
     7, Sun trines your natal Jupiter Mar 5"`.
   - Section 3: map + 4 lines. Uranus-MC caption: *"Your Uranus is on
     Dubai's Midheaven within 3°; your public work gets rewired while
     you're here."*
   - Section 4: dual-wheel. Chain: *"Chain: Dubai → you become Leo rising
     → Sun rules → natal 5th (creative acts) → relocated 1st (identity)
     → your creative risks become identity statements here."*
   - Section 5: 4 movements. Each has a Chain. None are hollow.
   - Section 6: paran warning at 30°N45' — Dubai is at 25°N, comfortable.
     "No paran risks in range."
   - Section 7: Brandon has Mars at 15° Leo — a fixed world point — so
     "Public moves amplify" line fires.
   - Section 8: heatmap shows Feb 27 – Mar 2 as yellow-orange (mundane
     Severe), but filtered for personal relevance — weighted lighter
     because Uranus-on-MC is **his** signal, not generic noise.
   - Section 9: `bestWindow: "Mar 2 – Mar 7 for a visible launch"`.
     `watchWindow: "Feb 27 – Mar 2 — wait out the Uranus shake"`.
6. Everything above is traceable to an ephemeris computation + the user's
   natal chart. Zero filler.

This is the product the PDFs describe and the user originally asked for.

---

## 6. Open questions for the user

Before implementation begins:

1. Do you want the `launch / rest / connect / retreat / reconcile` goal
   vocabulary, or a different set closer to the Helena-Woods product
   language?
2. Should the mundane product live at `/weather/{id}` and the personal at
   `/reading/{id}`, or share one URL with an intent-discriminator? The
   current schema allows either — `reading.category` can be `"mundane"`
   or `"personal-geodetic"`.
3. For the chart-ruler line: do you want **traditional** rulers (Sun/Leo,
   Moon/Cancer, Mercury/Gem+Vir, Venus/Tau+Lib, Mars/Ari+Sco, Jupiter/
   Sag+Pis, Saturn/Cap+Aqu) or **modern** (adding Uranus/Aqu, Neptune/
   Pis, Pluto/Sco)? This affects which planet gets followed for relocated-
   house deltas.

Defaults in this spec: traditional rulers (per PDF), dual URL, Helena-
style vocabulary.
