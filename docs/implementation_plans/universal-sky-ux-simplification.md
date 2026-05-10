# Universal Sky — UX Simplification Plan

## Context

The universal-sky surfaces shipped to two tabs of the V4 reading view:
- **Place tab §03** "Sky weather right now" — currently a 6-block list (intro paragraph → Retrograde now → Coming up → Big sky aspects → Lunar nodes → Eclipse window).
- **Timing tab Gantt** — currently a single dense chart mixing personal transits + universal sky rows on one 90-day axis.

A first-time-user pass on `/reading/d228b33a-...#place-field` and `#timing` exposed three problems:

1. **Too wordy.** The Place §03 has 30+ words of conceptual intro before any actionable signal, and every sub-block uses astrology jargon ("Mercury Rx in Pisces · detriment", "Uranus sextile Neptune") with no plain-English translation.
2. **No "what does this mean for me?"** Nothing in either surface ties the sky data to the user's stated goal (e.g. romance, career, growth). The reader has to do the inference work themselves.
3. **Gantt overload.** With 8-12 personal transits + ~9 sky rows on a single axis, scanning is hard. The user explicitly asked for date-range tabs (0-30 / 30-60 / 60-90) and per-row plain-English explanation.

This doc plans the redesign. The redesign has three layers: (a) component restructure (KPI cards + tabbed Gantt), (b) deterministic plain-English templates as a baseline so the UI ships even if AI fails, (c) AI-authored copy via an extension to `teacher-reading.ts` that ties each event to the user's goal.

## User profile we have to work with

`reading.details` already carries everything we need to personalize copy:
- `goalIds: string[]` — user-picked goals from `/reading/new` (e.g. `["romance"]`, `["career", "timing"]`). Each maps via [GOAL_DEFINITIONS](app/lib/reading-tabs.ts#L41) to `{label, eventIndex, outcome, action}` — already used by overview/timing copy. We'll reuse this mapping for sky-event lay copy.
- `travelDate`, `travelType` — for trip-vs-relocation register branching.
- `birth.{date,time,city,lat,lon}` — only used for natal chart computation; not surfaced in sky copy directly.
- `teacherReading.tabs["place-field"|"timing"]` — existing AI prose, sets the voice we have to match.

Two concrete personalization rules emerge:
- **For Place §03 KPI cards**: the second sentence of each card body is the goal-tied action ("Romance: don't sign anything new"). Pull `GOAL_DEFINITIONS[primaryGoalId].action` and let the AI specialize it for the specific sky event.
- **For Timing Gantt rows**: the inline lay-copy is one short clause that mentions the goal when the event is highly goal-relevant (Mercury Rx mentions communication-heavy goals; Saturn Rx mentions career; Venus Rx mentions romance/wealth).

## Surface 1 — Place tab Sky Weather (KPI cards)

### Goal

A first-time user should understand within 10 seconds: (a) is the sky tilted *for* or *against* my trip, (b) what specifically matters, (c) what to do about it.

### New layout

```
§03  SKY WEATHER

Pressure window — slow before you sign           ← verdictHeadline (large, weight 600)
Mercury slows through Cancer this trip. With     ← verdictLead (1-2 sentences,
your romance goal, hold off on anything binding    ties to user's primary goal)
until late July.

┌─────────────────────────┐ ┌─────────────────────────┐
│ RETROGRADE              │ │ ECLIPSE WINDOW          │   ← cards (responsive
│ Mercury reverses        │ │ Solar eclipse coming    │     2-col grid; stacks
│ in Cancer               │ │ Aug 12 in Leo           │     to 1-col on mobile)
│ Jun 29 — Jul 23         │ │ Active now → Aug 26     │
│                         │ │                         │
│ Plans get edited        │ │ Big public-life reset.  │
│ mid-trip; double-check  │ │ Skip launches; let      │
│ bookings.               │ │ details settle.         │
│                         │ │                         │
│ Romance: text before    │ │ Romance: keep low-      │
│ you sign, not after.    │ │ stakes for two weeks.   │
│                         │ │                         │
│ ⚠ tense                 │ │ ⚠ tense                 │   ← impactBadge
└─────────────────────────┘ └─────────────────────────┘
┌─────────────────────────┐
│ BIG SKY ASPECT          │
│ Uranus + Pluto trine    │
│ Through your trip       │
│                         │
│ Quiet structural shift  │
│ in the background.      │
│ Not loud, but durable.  │
│                         │
│ ✓ supportive            │
└─────────────────────────┘

[Show all sky details ▾]                         ← collapsible "raw" view
                                                   (current 6-block list,
                                                   for power users)
```

### Card structure

Each KPI card shows ONE sky event with five elements:
1. **Eyebrow** (mono, 0.55rem): `RETROGRADE` / `ECLIPSE WINDOW` / `BIG SKY ASPECT` / `INGRESS` / `NODE PRESSURE`.
2. **Title** (1.05rem, weight 500, plain English): "Mercury reverses in Cancer", NOT "Mercury Rx Cancer (detriment)".
3. **Date range** (mono, 0.7rem, tertiary color): "Jun 29 — Jul 23".
4. **Body** (0.95rem, two short paragraphs):
   - Para 1 (1-2 sentences): what this is, lay-language, no jargon.
   - Para 2 (1 sentence): goal-tied action, prefixed with the goal label ("Romance:", "Career:", etc.).
5. **Impact badge** (tiny pill, bottom): `✓ supportive` (sage), `⚠ tense` (spiced/red), `· neutral` (border only).

### Card selection (which 3-4 events to surface)

Universal-sky data has 5+ kinds of events. Cap the cards at **4** to keep the panel scannable. Selection rule:

```typescript
function selectKpiEvents(sky: UniversalSkyState): RankedEvent[] {
    // Score every candidate event by absolute severity. Higher score → keeps card.
    const candidates: RankedEvent[] = [
        ...sky.retrogrades.map(r => ({
            kind: "retrograde", planet: r.planet, sign: r.sign, dignity: r.dignity,
            severity: rxSeverity(r),  // already computed in scoring-engine
            isOngoing: true,
        })),
        ...sky.retrogradeWindows
            .filter(w => !w.isOngoingAtRef)  // upcoming Rx
            .map(w => ({ kind: "retrograde-upcoming", ..., severity: rxSeverity(w) * 0.8 })),
        ...(sky.eclipses.inSolarWindow ? [{ kind: "eclipse", subKind: "solar", severity: 0.9 }] : []),
        ...(sky.eclipses.inLunarWindow ? [{ kind: "eclipse", subKind: "lunar", severity: 0.6 }] : []),
        ...sky.aspects
            .filter(a => a.type === "square" || a.type === "opposition" || a.type === "trine")
            .map(a => ({ kind: "aspect", ..., severity: aspectSeverity(a) })),
        ...sky.nodeAspects
            .filter(n => n.isMalefic)
            .map(n => ({ kind: "node-aspect", ..., severity: 0.5 })),
        // Ingresses included only if the planet is Sun/Mercury/Venus/Mars
        // (slow-planet ingresses are too rare to surface as KPIs).
        ...sky.ingresses
            .filter(i => ["sun", "mercury", "venus", "mars"].includes(i.planet))
            .map(i => ({ kind: "ingress", ..., severity: 0.3 })),
    ];
    candidates.sort((a, b) => b.severity - a.severity);
    return candidates.slice(0, 4);
}
```

Boring days produce 1-2 cards; loaded days (e.g. Oct 2026 with 5 retrogrades) get 4. Empty state (zero events) renders the verdict line only with a "the sky is unusually quiet" lead — no cards.

### Verdict headline (4-8 words)

Computed deterministically from the rank-1 event + overall sky-mod magnitude:

```typescript
function deriveVerdict(events: RankedEvent[], totalMod: number): {
    headline: string;
    impactBadge: "supportive" | "tense" | "neutral";
} {
    if (!events.length) return { headline: "The sky is quiet — your move", impactBadge: "neutral" };
    if (totalMod >= 3)  return { headline: "Tailwind window — open the door",   impactBadge: "supportive" };
    if (totalMod <= -3) return { headline: "Pressure window — slow before you sign", impactBadge: "tense" };
    return { headline: "Mixed sky — pick your moments", impactBadge: "neutral" };
}
```

The AI later replaces this with a specialized headline tied to the user's primary goal.

## Surface 2 — Timing tab Gantt (date-bucket tabs + lay copy)

### Goal

A first-time user should be able to: (a) filter to "what affects my trip in the first month" without scanning a 90-day axis, (b) understand each row in plain English without astrology knowledge, (c) keep the existing chart-receipt power-view available.

### New layout

```
§03  TIMING

[Now (0–30d) ●]  [Soon (30–60d)]  [Later (60–90d)]  [All]   ← tab bar
                                                              segmented control,
                                                              "Now" default

────  PERSONAL TRANSITS  ────────────────────────────────

  ♀ Venus warms your social life      Jun 8 → Jun 16
    └ A green light for spontaneity
    [bar] ······························
                                                  TRIP

  ♂ Mars stirs friction at work       Jun 12 → Jun 20
    └ Push hard, but expect pushback
    [bar] ··································

────  UNIVERSAL SKY  ────────────────────────────────────

  ☿ Mercury reverses in Cancer        Jun 29 → Jul 23
    └ Edits, rebookings, second drafts
    [striped bar] ─ ─ ─ ─ ─

  ☉ Solar eclipse window active        through Aug 26
    └ Public-life reset; let the dust settle
    [striped pin]

Hover any row for the chart receipts
```

Each row now has:
- **Title** (replaces `SKY · Retrograde`): plain English with subject-verb-object: "Mercury reverses in Cancer", "Mars stirs friction at work".
- **One-line body** (below title, smaller, italic): the goal-tied takeaway in <12 words.
- **Bar** (unchanged): same date-axis positioning, same color/striping rules to keep personal-vs-sky distinction.

### Tab logic

```typescript
const TABS = [
  { id: "now",    label: "Now (0–30d)",   range: [0, 30]  },
  { id: "soon",   label: "Soon (30–60d)", range: [30, 60] },
  { id: "later",  label: "Later (60–90d)",range: [60, 90] },
  { id: "all",    label: "All",           range: [-7, 90] },  // matches existing TRIP window
];

function rowsInTab(rows: GanttRow[], tab: Tab): GanttRow[] {
  const [a, b] = tab.range;
  return rows.filter(r => {
    // Include if any part of the row's [entryDay, exitDay] overlaps [a, b].
    // Zero-width events (ingresses, station pins) overlap when their exactDay is in [a, b].
    return Math.max(r.entryDay, a) <= Math.min(r.exitDay, b);
  });
}
```

Tab counts ("Now (0-30d) · 6 events") shown in the segment label so users know whether to switch tabs. Empty tab → small "no events in this window" copy, not blank.

For relocation readings (365-day axis), tabs become: `Mo 1-3` / `Mo 4-6` / `Mo 7-9` / `Mo 10-12` / `All`.

### Sectioning within a tab

Keep the existing "personal first, sky beneath, dashed divider between" pattern. Inside each section, sort rows by `exactDay` ascending. If a section is empty within the active tab, hide its header.

### Hover behavior unchanged

The existing tooltip with full chart-receipt (entry/exact/exit dates, orb, dignity tag, italic meaning line) stays — it's the power-user view. The inline one-line body is the casual-user view. Two layers of disclosure.

## Surface 3 — AI prompt + schema extensions

### Why AI copy, not just templates

Deterministic templates ship Phase 1 — they're fine for "Mercury Rx → reread agreements" generic advice. But the *quality* gap closes when the copy is specialized to the user's goal AND the specific sign + dignity. Examples of the difference:

- Generic: "Mercury Rx — reread agreements."
- AI-authored: "Mercury reverses through Cancer, the sign of home and family. With your romance goal, this rebooking-prone window is for soft conversations, not hard launches."

The AI already writes per-tab, per-line, and per-aspect copy in [teacher-reading.ts](.claude/worktrees/fix-auckland-zodiac-map/lib/ai/prompts/teacher-reading.ts). We add a new BLOCK and matching schema fields.

### Input shape (extends `TeacherReadingInput`)

Add a `universalSky` block to [ai-input-builder.ts](.claude/worktrees/fix-auckland-zodiac-map/lib/readings/ai-input-builder.ts) so the AI sees a curated, ranked event list — not the raw `UniversalSkyState`. The builder's job is to do the ranking + key-stamping; the prompt's job is just to write copy.

```typescript
universalSky?: {
  /** Top 4 events ranked by absolute severity, ready for KPI cards. */
  topEvents: Array<{
    /** Stable identifier for prose lookup. */
    key: string;            // e.g. "rx-mercury-cancer-2026-06-29"
    kind: "retrograde" | "retrograde-upcoming" | "eclipse" | "aspect"
        | "node-aspect" | "ingress";
    /** Astrology-accurate label (the AI will rewrite into plain English). */
    rawHeadline: string;    // "Mercury retrograde in Cancer"
    dateRange: string;      // "Jun 29 — Jul 23" or "active through Aug 26"
    /** Absolute severity 0-1, drives card ordering. AI doesn't need to read. */
    severity: number;
    /** Helpful structured detail the AI can name in prose. */
    sign?: string;
    dignity?: string;       // for retrograde — drives intensity language
    aspectType?: string;    // for aspect / node-aspect
    secondaryPlanet?: string;
    /** Whether the event overlaps the trip window (entryDay ≤ travelDay ≤ exitDay). */
    duringTrip: boolean;
  }>;
  /** Per-Gantt-row keys, one per UniversalSkySpan we'll render in the timing
   *  tab. Smaller copy budget per item — the AI writes one short title +
   *  one-line body per key. */
  spanKeys: Array<{
    key: string;            // matches universalSkySpans[].key (we add this field)
    kind: "retrograde" | "ingress" | "eclipse" | "station";
    rawLabel: string;       // "Mercury retrograde in Cancer"
    dateRange: string;
    duringTrip: boolean;
  }>;
  /** Headline severity tier so the prompt can decide overall tone. */
  overallTone: "supportive" | "tense" | "mixed" | "quiet";
};
```

The ranker lives in `app/lib/universal-sky-rank.ts` (new) — pure function over `UniversalSkyState` + `goalIds[]` + `travelDateISO`.

### Output shape (extends `TeacherReadingSchema`)

```typescript
universalSky: z.object({
    /** 4-8 word headline. Goal-tied when goalIds is non-empty. */
    verdictHeadline: z.string().min(8).max(80),
    /** 1-2 sentences. Frames the trip's sky relative to the user's primary goal. */
    verdictLead: z.string().min(40).max(280),
    /** One card per `topEvents[].key` from input. Order matches input
     *  (which is severity-sorted), so the UI doesn't need to re-rank. */
    cards: z.array(z.object({
        key: z.string(),                 // matches topEvents[].key
        title: z.string().min(8).max(40),  // 4-8 plain-English words
        plainBody: z.string().min(60).max(220),  // 2 sentences: what + lay
        goalAction: z.string().min(20).max(120),  // 1 sentence: tied to user's goal
        impactBadge: z.enum(["supportive", "tense", "neutral"]),
    })).min(0).max(4),
    /** One short row per `spanKeys[].key` for the Timing Gantt. Tiny copy
     *  budget — these render inline below the row title. */
    spanCopy: z.array(z.object({
        key: z.string(),
        title: z.string().min(8).max(36),
        body: z.string().min(15).max(90),    // 1 short clause, ≤12 words ideal
    })).optional(),
}).optional()
```

The block is `optional()` so cached pre-extension readings still validate. UI falls back to deterministic templates when the field is absent.

### New prompt block

Add `BLOCK_UNIVERSAL_SKY` to [teacher-reading.ts](.claude/worktrees/fix-auckland-zodiac-map/lib/ai/prompts/teacher-reading.ts):

```
# Universal Sky (REQUIRED when universalSky.topEvents is present)

This block writes the §03 "Sky weather" cards on the Place tab AND the
inline lay-copy under each row of the Timing tab Gantt. The reader is
NOT an astrologer. Translate ruthlessly.

## verdictHeadline (4-8 words)
- Lead with the dominant tone: tailwind / pressure / mixed / quiet.
- Tie to goal when present: "Pressure window — slow before you sign"
  for romance; "Tailwind for visible work" for career.
- NEVER use planet names in the headline.

## verdictLead (1-2 sentences)
- Sentence 1: name the rank-1 event in plain English ("Mercury slows
  through Cancer this trip"). Use sign as a flavor anchor only — no
  dignity jargon.
- Sentence 2 (when goalIds non-empty): translate to the user's primary
  goal action ("With your romance goal, hold off on anything binding").
- Skip sentence 2 when overallTone === "quiet".

## cards (one per topEvents[].key, IN INPUT ORDER)
- title: 4-8 words, subject-verb-object plain English. Use the planet
  name (Mercury, Saturn, Pluto) but NOT astrology terms (Rx, dignity,
  domicile, fall). Examples:
    "Mercury reverses in Cancer"          (rank 1, retrograde)
    "Solar eclipse coming Aug 12"         (eclipse)
    "Uranus and Pluto in quiet alliance"  (trine — frame the kind)
- plainBody: 2 sentences. Sentence 1 is what the event *is* in lived
  terms ("Plans get edited mid-trip; double-check bookings"). Sentence
  2 widens the consequence ("Slow communication wins this month").
- goalAction: 1 sentence prefixed with the goal label and a colon.
  Examples (user goalIds === ["romance"]):
    "Romance: text plans before you sign, not after."
    "Career: keep launches on the calendar but hold the press release."
- impactBadge: supportive when the event helps the user's goal; tense
  when it hinders; neutral when it's a structural background event.

## spanCopy (one per spanKeys[].key, all of them)
- title: 3-5 plain-English words ("Mercury reverses", "Solar eclipse").
  No planet names other than the one driving the row. No date ranges
  (the row already shows the date).
- body: ONE short clause, ≤12 words. The lived takeaway. Examples:
    "Edits, rebookings, second drafts."
    "Public-life reset; let the dust settle."
    "Soft alignment in the background."

# Astrology-translation table (use as plain-English defaults)
- Retrograde     → "reverses" / "slows" / "loops back through"
- Ingress        → "moves into"
- Conjunction    → "joins"
- Sextile        → "supports"
- Square         → "presses on" / "stirs friction with"
- Trine          → "aligns with"
- Opposition     → "stretches across from"
- Station        → "turns" (Rx station: "starts to slow"; direct: "wakes up")
- Eclipse        → "eclipse" stays; gloss as "big reset"
- Detriment/fall → "uncomfortably placed" or "in unfamiliar territory"

# Forbidden in this block
- "Rx", "Mercury Rx", any ℞ symbol, dignity tier names, orb degrees,
  modality names ("cardinal", "fixed", "mutable"), element names
  ("water sign"), "domicile", "exalted", "peregrine".
- Mentions of houses (the universal sky is location-agnostic — house
  copy belongs on the place-field tab's other sections).
```

### Prompt block ordering

Insert `BLOCK_UNIVERSAL_SKY` after `BLOCK_GEODETIC_PLACE_CHARACTER` and before `BLOCK_WHAT_SHIFTS_PERSONALISATION` so it's grouped with the other location/sky-related blocks.

## Component file changes

### Modify

- [UniversalSkySection.tsx](app/(frontend)/(app)/reading/[id]/components/v4/tabs/UniversalSkySection.tsx) — replace 6-block list with verdict + KPI cards layout. The current "raw" view becomes a collapsed `<details>` block hidden under "Show all sky details ▾".
- [TimingTab.tsx](app/(frontend)/(app)/reading/[id]/components/v4/tabs/TimingTab.tsx) — add tab bar above the Gantt; filter rows by `dayOffset` overlap with the active bucket. Inline lay-copy renders below each row's planet label.
- [reading-viewmodel.ts](app/lib/reading-viewmodel.ts) — pass through `vm.teacherReading?.universalSky` so the components can read AI copy. Build a `vm.universalSkyCards: KpiCard[]` from the AI output (or deterministic fallback) so the component is dumb.
- [ai-input-builder.ts](lib/readings/ai-input-builder.ts) — call new `rankSkyEvents()` and add `universalSky` block to the input.
- [teacher-reading.ts](lib/ai/prompts/teacher-reading.ts) — add `BLOCK_UNIVERSAL_SKY`, register in `BLOCKS` array.
- [schemas.ts](lib/ai/schemas.ts) — add the `universalSky` zod object to `TeacherReadingSchema`.

### Create

- `app/lib/universal-sky-rank.ts` — `rankSkyEvents(state, goalIds, travelDate)` returns `RankedEvent[]` for the AI input AND deterministic-fallback path.
- `app/lib/universal-sky-templates.ts` — deterministic plain-English copy templates per event kind. Used when AI copy is missing (cached readings, AI failure, schema-validation drop). One function: `templateForEvent(event, primaryGoal): { title, plainBody, goalAction, impactBadge }`.
- `app/(frontend)/(app)/reading/[id]/components/v4/tabs/SkyKpiCard.tsx` — the KPI card component. Pure presentational, receives one `KpiCard` prop.
- `app/(frontend)/(app)/reading/[id]/components/v4/tabs/TimingDateTabs.tsx` — the segmented control above the Gantt (small standalone component, easy to test).

### Add field

- `UniversalSkySpan.key: string` in [window-scoring.ts](app/lib/window-scoring.ts) — stable identifier so the AI's `spanCopy[].key` can be looked up at render time.

## Implementation phases

### Phase 1 — Deterministic shipping baseline (no AI dependency)

Goal: ship the new layouts with reasonable copy, even if the AI extension lands later.

1. Add `key: string` to `UniversalSkySpan`. Update `solveUniversalSkySpans` to populate it (`<kind>-<planet>-<entryISO>`).
2. Build `app/lib/universal-sky-rank.ts` with `rankSkyEvents()`.
3. Build `app/lib/universal-sky-templates.ts` with per-kind, per-goal lookup tables.
4. Build `SkyKpiCard.tsx` and `TimingDateTabs.tsx` components.
5. Replace `UniversalSkySection.tsx` body with verdict + KPI cards (using deterministic templates).
6. Replace `TimingTab.tsx` Gantt with tabbed Gantt + inline body lines.
7. Keep the existing 6-block raw view inside a `<details>` collapse.
8. Run the calibration script (`scripts/eval-universal-sky-impact.ts`) — score impact unchanged.
9. Smoke test: regenerate a reading, check both surfaces.

**Cost:** ~6-8 hours. Self-contained, no AI dependency, no schema changes.

### Phase 2 — AI-authored copy

1. Add `universalSky` block to `TeacherReadingInput` (input-builder.ts).
2. Add `universalSky` zod object to `TeacherReadingSchema`.
3. Add `BLOCK_UNIVERSAL_SKY` to teacher-reading.ts; register in `BLOCKS`.
4. Generate one fresh reading; inspect AI output via DevTools.
5. Wire AI copy into `UniversalSkySection` and `TimingTab`. Keep deterministic templates as a fallback when `vm.teacherReading?.universalSky?.cards?.find(c => c.key === ...)` returns nothing.
6. Quality pass: regenerate 4-5 readings across personas/destinations; sanity-check that the AI copy is plain-English and goal-tied.

**Cost:** ~6-8 hours. Loose-coupled — Phase 1 ships independent of Phase 2.

### Phase 3 — Polish (post-merge)

- Animation on tab switch (subtle fade, ~150ms).
- Empty-state copy review for each tab in TimingTab.
- A/B copy variants for verdict headlines (long-tail experiment).
- Progressive disclosure on the KPI cards: hover/tap reveals chart receipts (entry/exact/exit dates, dignity, etc.) for power users.

## Verification

1. **Deterministic templates produce sensible output for boundary cases:** Mercury Rx in detriment, Mercury Rx in domicile, no events, 5 events, all events in past, all events in future.
2. **AI copy passes the "no jargon" rule:** grep for "Rx", "domicile", "detriment", "orb", "modality", "fixed sign" in the AI output JSON. None should appear in any `cards[].plainBody`, `cards[].goalAction`, or `spanCopy[].body` field.
3. **Tab filtering math is correct:** unit-test `rowsInTab()` against a hand-built `[entryDay, exitDay]` matrix covering edges (event entirely before bucket / entirely after / partial overlap / zero-width inside / zero-width on boundary).
4. **First-time-user comprehension:** on the live reading at `/reading/{newId}#place-field`, a non-astrologer should be able to articulate (a) what's the verdict, (b) which event matters most, (c) what to do about it — within 30 seconds of landing.
5. **Backward compat:** old cached readings (without `universalSky` field on `teacherReading`) still render — fall back to deterministic templates with no broken UI.
6. **Calibration unchanged:** rerun `scripts/eval-universal-sky-impact.ts` — score distribution should be identical (this redesign is UI-only; scoring math is untouched).
