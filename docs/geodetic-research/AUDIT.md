# Geodetic Reading — End-to-End Audit

Author: reviewer · Date: 2026-04-19
Scope: compare the current AstroNat geodetic implementation against the
two source documents (`Geodetic_101.pdf`, `Geodetic_Weather_Patterns.pdf`)
and the live reading at `/reading/21c5f5a1-…`.

> **Split into two product specs (2026-04-19):** see
> [`GEODETIC_WEATHER_PAGE.md`](./GEODETIC_WEATHER_PAGE.md) for the mundane
> weather-forecasting product, and
> [`PERSONAL_GEODETIC_PAGE.md`](./PERSONAL_GEODETIC_PAGE.md) for the
> personal relocation / timing product. Each spec closes with a per-
> dimension recovery table aimed at ≥ 4.5 / 5.

---

## 0. The core identity crisis

Before diving into detail, the root problem:

> **The intake is one product and the output is another.**

The wizard in `WeatherReadingFlow.tsx` asks:

- *"Where should the sky watch?"* → pick cities
- *"For how many days ahead?"* → pick 7 / 30 / 90
- *"Anything specific to watch for?"* → **floods · fires · earthquakes · atmospheric disruption · civil tension · all**

Those are the exact five categories from `Geodetic_Weather_Patterns.pdf`, which
is a **mundane / weather-forecasting** doctrine: planet + element + modality
+ ACG angle → a *physical earth event* (eruption, flood, seismic swarm).

The output — `Brief` + `BestWindows` + `Movements` — is a **personal travel
almanac**: "best overall", "meet new people", "quiet rest", "book 10 nights
May 12–22".

A reader who asked "watch for earthquakes in Dubai over the next 30 days"
lands on a page that says "Dubai is a complex city for growth and deep
personal reflection this spring" with three booking windows. That is a
product-fit failure, not a prose failure. Everything else flows from it.

Two legitimate paths forward (pick one):

1. **Keep it as personal geodetic timing** — throw out the weather-intake
   goals, replace them with "best time to…" goals (launch, sign, travel,
   retreat, reconcile). Rewrite `Geodetic_Weather_Patterns.pdf` out of the
   brief entirely.
2. **Keep it as mundane weather** — throw out "travel windows" and
   "best overall" framing. Output becomes "pressure map for Dubai: Feb 27 –
   Mar 2 seismic risk, Mar 15 – Mar 22 flood signature, with explicit
   Planet / Element / Modality / Angle columns from the PDF's master table".

The two should **not** share a wizard. The rest of this audit assumes
path (1) — personal timing — because that is what the output is already
trying to be.

---

## 1. Output inconsistencies (table)

| # | Where | What the app says | What the PDFs require | Severity |
|---|---|---|---|---|
| 1 | Intake step 3 | Goals are weather-event categories (floods, fires, earthquakes, atmospheric, civil) | For personal timing: life domains (career, relationships, rest, community) keyed to house rulers | **blocker** |
| 2 | `LinesEditorial.tsx` captions | `captionFor(planet, angle)` is a static lookup: "Venus on IC → home, belonging, aesthetic" | Must adapt to the **chart ruler's new house** after relocation (PDF p.3: "Taurus rising in Jakarta → Venus in 3rd; Libra rising in NYC → Venus in 9th") | **high** |
| 3 | AI prompt voice rules | Bans "degrees", "orbs", "10th house", "angular", "conjunct" | PDF uses them all: *"within 5° orb of ASC/MC/IC/DSC", "10 degrees in 12th house", "late-degree (20–29°) in fixed signs"* — orbs and degrees **are** the craft | **high** |
| 4 | Key-moment "Chain:" lines | "Chain: Eclipse aftershock → New focus → Renewal" (flagged by user) | A chain names ruler → aspect → house → domain: *"Chain: Taurus MC → Venus rules → Venus now in 9th → publishing / foreign ties light up"* | **high** |
| 5 | Ignored inputs | `windowDays` (7/30/90) and `goalFilter` are captured but don't change the output | Window should bias which techniques apply (7d = transits only; 30d = transits + lunations; 90d = add progressions, station cycles per PDF p.5) | **high** |
| 6 | Paran lines | Mentioned in prompt guidance only; never surfaced in UI | PDF p.3 specifically calls out **paran latitudes to avoid** as a first-class output column for the chart (Brandon example: Uranus Rising / Mars Anticulminating at 30°N45') | **high** |
| 7 | Late-degree rule | Not encoded | PDF p.5: "late-degree placements (20–29°) in fixed signs will be affected by squares, oppositions, conjunctions" — this is a *timing rule*, not a footnote | **medium** |
| 8 | World Points | Nowhere in the UI | PDF p.2: 8th-harmonic hot points (0° cardinals, 15° fixed, 7.5° mutable, 22.5° cardinals). A user's natal planet on one = public-visibility signature | **medium** |
| 9 | ACG vs Geodetic distinction | LinesEditorial caption says "§ 1 — THE GEODETIC READING" but the map inside is **ACG** (time-sensitive lines) | Two distinct layers per PDF: ACG lines (time-sensitive, natal-planet-specific) and Geodetic lines (permanent, city sits under one sign). The current layout mislabels the first as "geodetic" | **medium** |
| 10 | Fallback copy | `DEFAULT_INTERPRETATION.verdict` = *"A mixed window — the dates below are the ones that matter most"* | Should at minimum name the city and the permanent geodetic sign it sits under (derivable from `lon`, zero AI needed) | **medium** |
| 11 | `TimingDecisions.tsx` | 100% hardcoded editorial (same text for every reader, every city, every window) | Framework is fine to leave as reference, but should be **below the fold** with a "How this is built" label, not presented as tailored advice | **medium** |
| 12 | Chart-ruler relocation | Not displayed anywhere | PDF calls it *"everything"*: "Chart ruler determines everything." The relocated rising sign and the house its ruler lands in is the trip's dominant topic. | **high** |
| 13 | 5° orb cutoff | Prompt says it; UI shows lines up to 1500km | 5° of arc on an angle ≈ ~550 km at mid-latitudes. 1500 km is ~14° — well past the threshold where angularity still dominates | **medium** |
| 14 | "Chain:" syntax | Model is asked to emit one but sometimes emits decorative filler ("New focus → Renewal") | Needs a concrete schema: `fact → ruler/aspect → implication`. Reject at validation time if any link is empty or generic | **medium** |
| 15 | Weather-patterns encoding | Not referenced at all | Even if we take path (1), the planet × element × angle matrix (PDF weather patterns p.2) is the richest source of *voice-specific* verbs (Saturn → pressure; Neptune → dissolution; Mars → ignition). Currently we ignore it. | **medium** |
| 16 | "Moscow is a complex city for growth and deep personal reflection this spring" | User screenshot | Generic, could apply to any city in any season, uses banned words ("growth", "reflection") — AI is producing magazine filler when the signal is empty | **high** |

---

## 2. Canned / boring copy — specific examples and rewrites

### 2a. The user's flagged line
> *"The atmosphere feels refreshed after the recent solar eclipse. You find it easier to decide on a new path forward. Chain: Eclipse aftershock → New focus → Renewal."*

**Why it's hollow:** every noun is abstract. "Atmosphere", "new path",
"renewal" are meaningless unless tied to: *which eclipse (degree + sign)*,
*which house of the relocated chart it fell in*, *which natal planet it
touched within 5°*. The Chain is three synonyms for "change", not a logical
trace.

**What it should look like** (for Brandon, Taurus rising in Jakarta, visiting
Dubai, in the 28 Feb 2026 window from PDF p.5):

> *"Uranus at 27° Taurus sits on Dubai's Midheaven from Feb 27 to Mar 2.
> Because Dubai falls under the Taurus geodetic column, this transit is
> doubled here — on the axis and in the sign. Expect abrupt shifts in
> anything Dubai means to you publicly: contracts, announcements, work
> reputation. Chain: Dubai → Taurus column → Uranus crosses Taurus MC →
> Venus (your chart ruler) is squared by this → work commitments get
> rewritten, not refined."*

Note what changed: three proper nouns (Dubai, Taurus, Uranus), one date
range, one house-by-implication (the MC = public/work), one chart-ruler
hook. Zero filler.

### 2b. `captionFor("Venus", "IC")` returns `"Direct hit — home, belonging, aesthetic."`

**Why it's hollow:** it's a lookup, not a reading. The same caption fires
whether the user is a water-Venus native spending three days in Ubud or a
mutable-Venus native signing a 20-year mortgage in Dubai.

**What it should do:** accept `{ planet, angle, natalHouseOfPlanet,
relocatedHouseOfPlanet, chartRulerDelta }` and pick language from a 4-axis
table. If Venus-rules-your-chart and IC puts Venus in your relocated 4th,
that's a permanent-home signal. If Venus is your 5th-house (romance/creation)
native planet and relocation lands it on the IC, it's a creative-retreat
signal. Those are different trips.

### 2c. `DEFAULT_INTERPRETATION.hook`
> *"Your AI summary has not run yet for this reading. Click regenerate above…"*

**Why it's bad:** it's a technical apology, not a reading. A user who sees
this has no idea whether their data is broken, the model is down, or they
need to pay. Plus the word "regenerate" exposes implementation.

**What it should do:** without AI at all, you can compose a real paragraph
from numbers already in `weatherForecast`: *"Dubai sits in the Cancer
geodetic column. The next 30 days include 4 severe days clustering around
Feb 28. The rest of the window runs steady. Detailed moment analysis will
load in a few seconds."*

### 2d. `TimingDecisions.tsx` — "When to move."

Four static bullets and seven static steps, identical for every user.
This should either be: (a) collapsed into a `<details>` at the bottom of the
page ("How this reading is built"), or (b) populated *from* the reading —
showing which of the seven steps actually fired for this user
("✓ Step 3 — mapped 10 natal planets to longitudes; ✓ Step 5 — confirmed by
2 of 3 rule-of-three sources").

---

## 3. Encoding the Weather Patterns PDF (even in a personal-timing product)

The **Planet × Element × Modality × Angle** matrix on PDF p.2 is the cleanest
voice-lookup we have. We should wire it in — not as weather predictions, but
as the *verbs* a planet uses when it hits an angle at a place.

| Planet | Verbs | "On MC" means | "On IC" means | "On ASC" means | "On DSC" means |
|---|---|---|---|---|---|
| Sun | ignites, surges, activates | visibility is lit up | identity takes root | you show up brighter | partners become the lens |
| Moon | pulls, floods, softens | moods shape public work | home, sleep, inherited ground | body softens, emotions surface | attunement to those around you |
| Mercury | rewires, flips, fractures | voice and ideas are heard | learning from the past returns | quick, sharper, verbal | negotiation moves fast |
| Venus | eases, sweetens, saturates | aesthetics shape reputation | literal home, belonging | warmer presence | deals land, relationships flow |
| Mars | pushes, ignites, cracks | drive made public | friction under the floor | physical, short fuse | people push back harder |
| Jupiter | expands, broadens, overshoots | growth in visibility | foundations grow, family expands | confidence widens | generous partnerships |
| Saturn | presses, slows, stiffens | career structure, slow work | weight on roots, duty | disciplined, sometimes stiff | partnerships heavier than usual |
| Uranus | flips, disrupts, rewires | sudden career pivot | household upheaval | you behave unpredictably | shocks from the other side |
| Neptune | dissolves, blurs, saturates | calling clarifies OR dissolves | dreamy home, maritime feel | body / skin porous, empathic | partners idealize or deceive |
| Pluto | pressures, transforms, drains | career rebirth under pressure | buried family material surfaces | deep body change | power dynamics named |

This table is *per planet*, not per planet × angle × natal-house. The
next level of richness is crossing it with the user's natal chart-ruler:

- If the transiting planet **rules the user's relocated ASC**, double the volume.
- If the transiting planet is **late-degree (26–29°)** in a **fixed sign**,
  mark it "final pressure — forced finish" (PDF p.5).
- If the transiting planet is **out-of-bounds**, mark it "amplified,
  outside its usual register" (existing code already has `oobPlanets`).

---

## 4. Progressive flow — desktop

### 4a. What works
- The 3-step wizard is clean, the typography is strong, the city chooser is
  good. Don't change.
- The Ubud-style editorial brief is on the right track. Score in the
  top-right, meta line in mono, big serif with a script flourish.

### 4b. What's broken
- **Intake promises a weather product, output delivers a timing product.**
  See §0. Fix the intake goals first.
- The `§ 2 — The geodetic lens (permanent)` zones component still carries
  photo-era styling (faint tiles, sinusoidal curve) that doesn't match the
  Ubud editorial frame. Visually the page goes cream/serif → dark/SVG →
  cream/serif and breaks the eye.
- `TimingDecisions` is dropped in as if it were personal advice. It needs a
  "Reference" heading and to sit below the Colophon as an appendix, or it
  should be removed and turned into a standalone `/guide/geodetic` page.
- The Gantt on desktop is strong but the bar labels ("The arrival", "Soft
  focus") are AI-generated mood words, not technique names. Show the
  technique name primary, the mood word secondary.
- There is **no chart-ruler readout** on the page. The PDF calls this
  *everything*. It should live in the Brief as a single line: *"In Dubai
  you become Leo rising; your chart ruler, the Sun, now sits in your 9th
  house — publishing, teaching, long travel."*

### 4c. Proposed desktop flow
1. **Brief** (keep) + **Chart-ruler line** (new, one sentence)
2. **Best travel windows** (keep, but add "why" hover = the transit stack)
3. **Why this place, this season** (keep, tighten hook)
4. **The timeline** (Gantt — promote technique names, keep mood as subtitle)
5. **Movements** (keep, enforce Chain schema in the AI prompt)
6. **The geodetic reading** split into two clear sub-sections:
   - 6a. *Permanent lines* — which geodetic sign this city sits in, plus
     natal planets that fall on the city's longitude within 2°
   - 6b. *Time-sensitive lines* — ACG list, sorted by km from city, capped
     at 5° of arc (~550km), not 1500km
7. **Paran risks** (new) — latitudes the user should avoid within ±3°
8. **World-point contacts** (new) — any natal planet at 0° cardinal / 15°
   fixed / 7.5° mutable / 22.5° cardinal, with a one-line "public-visibility"
   note
9. **Colophon** (keep)
10. **Reference: how this reading is built** (move `TimingDecisions` here,
    collapsed by default)

### 4d. What to cut
- The goal filter UI on the intake, if we go the personal-timing route —
  replace with life-domain goals.
- `Stage2Interpretation.tsx` (dead).
- `AlmanacHero.tsx`, `TopDatesStrip.tsx`, `SummaryHighlight.tsx`,
  `DetailsBundle.tsx`, `LinesSection.tsx` (dead after the Ubud rewrite).
- The hardcoded `captionFor()` lookup — replace with a schema-driven
  caption the model fills.

---

## 5. Progressive flow — mobile

### 5a. What works
- The wizard is touch-sized and the "cut" buttons feel native.
- `Brief`'s chrome bar wraps gracefully.

### 5b. What's broken
- `Brief` title: `THE MOSCOW opening` — on 375px the word "opening" often
  wraps under "MOSCOW" at a font size that's wider than the row. Needs a
  `minmax(0,1fr)` + `font-size` clamp that actually respects the viewport.
- `BestWindows` — three cards in a single rounded container collapse to a
  stack on mobile, but the right-edge of each card loses its border and the
  last card's score number sometimes clips.
- Score pill + title row stacks in an awkward order: title is on top, score
  below. Below a 500px breakpoint, the score is the one thing that should
  lead because it's the payoff.
- `LinesEditorial` — 2-col map + list drops to 1 col. Map is ~375px wide,
  fine. But the line list rows use `grid-template-columns: auto 1fr auto`
  which squeezes the caption into a 2-word column on narrow screens. The
  distance readout ("47KM", "EXACT") is the least valuable, cut it on mobile.
- `Movements` left spine is 100px wide fixed → eats a third of a mobile
  viewport for a single digit. Collapse the spine into an inline `01 — `
  prefix on the title on narrow screens.
- `GanttTimelineSection` — the Gantt is wider than the viewport. It needs
  a horizontal scroll container with a visible fade at the edges, not the
  current behavior (truncates).
- The `TimingDecisions` numbered list is fine on mobile, but the hierarchy
  (§3 kicker → H2 → intro → list → §4 kicker → H2 → intro → list) is
  *two* dense static lectures back-to-back. Cut one or collapse.

### 5c. Proposed mobile order
1. Brief — score + band FIRST, title SECOND, meta THIRD
2. Best windows — single scrollable card-stack with swipe affordance
3. Why this place — max 3 sentences on mobile
4. Timeline — horizontal-scroll Gantt with sticky "today" marker
5. Movements — collapsed cards, tap to expand
6. Lines — map first, short list second, hide distance column
7. Colophon
8. (Reference — behind a `<details>`)

---

## 6. Recommendations (ranked)

Do these in order. Each is independently shippable.

### Tier 1 — must fix
1. **Resolve the intake/output identity.** Pick personal-timing or mundane-
   weather, rewrite the other one out. The goal selector today promises
   earthquakes and delivers brunch-booking windows.
2. **Make the chart-ruler relocation a first-class output.** One line in
   the Brief. One line in each `keyMoment`. This is the single most high-
   signal element in `Geodetic_101.pdf` and the app does not mention it.
3. **Enforce the Chain schema at validation time.** Reject responses whose
   Chain links are ≤2 words each, don't name a planet or house, or reuse
   words from the body. The current model emits placeholder chains because
   nothing rejects them.
4. **Re-introduce controlled technical vocabulary.** Allow: degree, orb,
   house (spelled out), conjunct/square/trine/opposition, ingress, station,
   retrograde. The current "no orbs, no degrees" rule strips the craft.
   Replace with: *"If you name a degree or orb, immediately explain what
   that value means in plain words."* That's translation, not suppression.
5. **Cap ACG lines at a true 5° orb** (~550 km mid-latitudes), not 1500 km.
6. **Replace `captionFor()` with a generated caption** the model fills per
   line, conditioned on the natal-house the planet rules and the relocated-
   house it lands in.

### Tier 2 — high value
7. Wire the **weather-pattern verb table** (§3 above) into the prompt so
   each planet has its own verbs — Saturn presses, Neptune dissolves,
   Uranus flips.
8. Add a **paran-latitude** output row for the city. The PDF names specific
   parans as avoid-bands.
9. Add **world-point contacts** (8th harmonic) as an output row.
10. Respect `windowDays`: at 7 days, show transits only; at 30, add
    lunations + ingresses; at 90, add progressions + station cycles.
11. Move `TimingDecisions` to a reference tab / collapsed section.
12. Fix mobile: score-first order, horizontal-scroll Gantt, inline movement
    numbering.

### Tier 3 — craft polish
13. Fallback copy should compose from real numbers ("Dubai sits in the
    Cancer geodetic column; 4 severe days in the next 30…"), never ship a
    marketing apology.
14. Replace Gantt mood labels ("The arrival", "Soft focus") with the
    technique name primary, mood secondary.
15. Add an "as of now" timestamp inside `generatedLabel` — a reading is
    a snapshot; users should feel when it was taken.
16. Delete dead components (list in §4d).

---

## 7. Score

| Dimension | Score / 5 | Notes |
|---|---|---|
| Faithfulness to `Geodetic_101.pdf` | 2 | Chart-ruler missing; paran latitudes missing; world points missing; orb/degree vocabulary banned. |
| Faithfulness to `Geodetic_Weather_Patterns.pdf` | 1 | Intake promises its outputs, actual output ignores the whole doctrine. Weather-pattern matrix unused. |
| Intake → Output coherence | 1 | The wizard asks "watch for earthquakes"; the result is a travel almanac. |
| Prose quality (AI copy) | 2 | Reads like Medium astrology — "renewal", "reflection", empty Chains. Filler nouns, weak verbs. |
| Technical scaffolding (types / schema / prompt structure) | 4 | Schema is clean, prompt is well-structured, persistence is sane. The frame is ready; the *content rules* aren't. |
| Desktop UX | 3 | Ubud pivot is the right direction. Chart-ruler line missing. `§ 2` visual register breaks. |
| Mobile UX | 2 | Title wraps, score order wrong, Gantt clips, spine eats viewport. |
| Overall | **2.1 / 5** | A pretty frame around a confused product. The research is strong; the encoding of that research into behavior is what's missing. |

---

## 8. One-sentence summary

The app has a working Ubud-style frame and good bones, but it is simultaneously
asking *"where will it flood?"* and answering *"book ten nights in May"* — and
in between, it has banned the exact technical vocabulary (orbs, degrees, house
numbers, chart-ruler) that the source documents name as the craft.

---

## 9. The engine — a separate, larger finding

Asked to compare the experience to the compute engine, the finding inverts
the audit: **there is no engine shipping on this branch.** Every reading a
user has ever seen is random noise dressed in astrology vocabulary.

### 9a. What the runner expects

`lib/readings/geodetic-weather.ts` fetches `${origin}/api/geodetic-weather`
for every day in the window (1 call × N cities × windowDays, i.e. up to 90
per reading). On `!res.ok` — or any thrown error — it silently falls
through to `mockDayForecast` and keeps going:

```ts
try {
  const res = await fetch(`${origin}/api/geodetic-weather`, { … });
  if (res.ok) result = await res.json();
} catch {
  // fall through to mock
}
if (!result || typeof result.score !== "number") {
  result = mock.mockDayForecast({ … });
}
```

### 9b. What actually exists

- No `/app/api/geodetic-weather/route.ts` anywhere in the repo. The fetch
  404s every day, every request, every reading.
- `app/lib/geodetic-weather-mock.ts` header explicitly says: *"Used by
  /api/readings/generate when the real engine (computeGeodeticWeather) is
  not yet available on this branch — the engine lives on
  feat/geodetic-weather."* The TODO to replace it ships to production.
- `scripts/smoke-geodetic-weather.ts` exists but targets an external host.

### 9c. What the mock actually returns

Every field the AI reasons over is synthesised from `mulberry32(seed)`:

| Field the UI shows | Where it comes from |
|---|---|
| `score` per day | `62 + sin(dayIdx × 0.21) × 18 + (rng()-0.5) × 22` — no ephemeris |
| `severity` tier (Calm/Severe/Extreme) | Quantile of the random score above |
| `events[].label` like *"Neptune on fixed MC (orb 1.6°)"* | `pick(rng, ["Neptune", "Saturn", "Pluto", "Mars"])` — planet chosen at random from a 4-item array |
| `events[].orb` | `(rng() × 2 + 0.4).toFixed(1)` — not a real arc |
| Eclipse event at *"°longitude band"* | `Math.floor(rng() × 180 + 180)` — made up |
| Paran at latitude | "at this latitude" string, no latitude math |
| Late-degree Pluto at *"27.8° Capricorn"* | `(26 + rng() × 3.9).toFixed(1)` — degree invented |
| OOB planets + declinations | `23 + rng() × 3` |
| World-point transits | `pick(rng, ["Uranus", "Pluto"])` + `pick(rng, ["Aries", "Cancer", "Libra", "Capricorn"])` |

None of these numbers correspond to the actual sky on the date in question.
A user reading for April 19, 2026 in Dubai gets the same *shape* of
forecast they would get for any other date in any other city — same PRNG,
different seed.

### 9d. The angles math on the intake screen is also wrong

`mockFixedAngles(lat, lon)` is what the wizard uses to print
`MC 27°Tau · ASC 12°Leo` under each picked city on step 1:

```ts
export function mockFixedAngles(lat: number, lon: number): GWFixedAngles {
  const mc = ((lon % 360) + 360) % 360;
  const ic = (mc + 180) % 360;
  const asc = (mc + 90) % 360;  // ← this is not the geodetic ASC
  const dsc = (asc + 180) % 360;
}
```

The **correct** formula already exists in `app/lib/geodetic.ts`:

```ts
const φ = lat * π/180;
const dOA = asin( tan(φ) × tan(ε) );   // ε = obliquity of the ecliptic
ascLon = (mcLon − 90 + dOA + 360) mod 360;
```

The shortcut `asc = mc + 90` is only true at the equator (lat = 0).
For Moscow at 55.75°N the actual geodetic ASC is **~17° off** what the
wizard shows. For Reykjavik at 64°N it's ~25° off. The first piece of
technical credibility the user sees — "this app knows where I'm going" —
is wrong before they ever click Generate.

### 9e. Consequences that ripple through the audit

This reframes most earlier findings:

1. The *"Chain: Eclipse aftershock → New focus → Renewal"* filler isn't
   just the model being lazy — the model is correctly summarising the
   only thing it was given, which is a random eclipse string at a random
   longitude. There is no real signal for it to translate.
2. The `captionFor()` lookup feels dead because the data behind it is
   dead. Even if we rip it out, the replacement has nothing real to key
   off.
3. `windowDays` being ignored (§1 row 5) is consistent with this: the
   engine can't respect a 7 vs 90 day window because the "engine" is a
   coin flip run 7 or 90 times.
4. The `5° orb cutoff` recommendation (§6 tier 1) is a no-op until orbs
   are actual arcs between planet positions and angles.
5. `app/lib/geodetic.ts` — the file with the real math — is imported
   exactly once in the weather path (via `getProfile` → `SwissEphSingleton`
   → `computeRealtimePositions`), and even there it only produces
   `natalPlanets`, not the transit sky.

### 9f. What a minimum-viable real engine needs

In order of dependency, not effort:

1. **Ephemeris inside the request.** Swiss Ephemeris is already in-repo
   (`SwissEphSingleton`). Use it to produce, for each day in the window,
   the ecliptic longitudes of Sun, Moon, Mercury, Venus, Mars, Jupiter,
   Saturn, Uranus, Neptune, Pluto, North Node, Chiron, and (if available)
   Eris + BML. Cache by date (not by user): transit sky is universal.
2. **Geodetic angles per city.** `geodeticMCLongitude()` and
   `geodeticASCLongitude()` already exist and are correct. Call them, drop
   `mockFixedAngles`.
3. **Angle-transit detector.** For each (day × planet × {ASC, MC, IC, DSC}),
   compute real orb in degrees; emit an `angle-transit` event only if
   ≤5° per the PDF rule.
4. **Geodetic-column detector.** The city's MC sign is
   `floor(lon / 30)`. Any day where a transiting planet is *in that sign*
   is a geodetic-column hit — permanent lens, always fires when true.
5. **Late-degree detector.** Any transiting planet at 26–29° of any
   *fixed* sign when the city also sits in a fixed column — PDF p.5 rule.
6. **Paran-latitude detector.** For each (transiting planet pair × day),
   compute the latitude at which both cross an angle simultaneously. If
   |cityLat − paranLat| ≤ 3°, emit a `paran` event.
7. **World-point detector.** Any transiting planet within 2° of 0°/15°
   cardinal-fixed or 7.5°/22.5° cardinal — PDF p.2.
8. **Station detector.** Ephemeris first derivative crossing zero within
   N days of the forecast window.
9. **Eclipse detector.** Saros data is public; match the eclipse point to
   the city's longitude band.
10. **Scoring.** Once events are real, *then* the bucket/tier logic the
    mock fakes becomes meaningful. Until step 1 ships, any scoring change
    is cosmetic.

### 9g. Updated score

| Dimension | Previous | Revised | Why |
|---|---|---|---|
| Faithfulness to `Geodetic_101.pdf` | 2 | **0** | No ephemeris → no real transits → no real geodetic reading, period. |
| Faithfulness to `Geodetic_Weather_Patterns.pdf` | 1 | **0** | Same reason. |
| Intake → Output coherence | 1 | 1 | Unchanged — identity crisis is orthogonal. |
| Prose quality | 2 | 2 | Unchanged — but downgrades what "good prose" could even *mean* here. |
| Technical scaffolding | 4 | 3 | Still clean, but one critical integration (engine) is a stub with a TODO shipping to prod. |
| Desktop UX | 3 | 3 | Unchanged. |
| Mobile UX | 2 | 2 | Unchanged. |
| **Overall** | **2.1 / 5** | **1.3 / 5** | The frame still stands, but it's decorating a room with no furniture. |

### 9h. Revised top-1 recommendation

All the tier-1 items in §6 above (chart-ruler, chain schema, vocabulary,
5° cap, caption generation) assume a real engine behind them. They should
be deferred until after:

> **Ship a real `/api/geodetic-weather` route that calls Swiss Ephemeris
> and returns real angle-transits, geodetic-column hits, late-degree hits,
> parans, world points, stations, and eclipses. Delete `geodetic-weather-mock.ts`
> from the runtime path (keep for tests only).**

Until then, everything downstream — the AI voice, the UX hierarchy, the
intake identity — is rearranging deck furniture on a boat that is not
yet in the water.

