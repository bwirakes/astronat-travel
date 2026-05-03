# Astronat Academy — UI/UX Framework

**Companion to:** [learn-curriculum-plan.md](./learn-curriculum-plan.md)
**Scope:** the structural, visual, and interaction grammar of every `/learn/*` page.
**Approach:** first-principles design. Audit what exists. Extract the de-facto system. Codify it. Show the per-page mapping.
**Date drafted:** 2026-05-02

---

## Reading order

1. [First principles](#1-first-principles--what-a-lesson-is) — what a lesson is and why every page should be built the same way
2. [The 3-Act Lesson Template](#2-the-3-act-lesson-template) — the canonical page shape: Intro → Teach → Next
3. [Shared primitives](#3-shared-primitives--what-to-build-and-reuse) — the components every lesson reuses
4. [The Teaching Artifact taxonomy](#4-the-teaching-artifact-taxonomy) — four patterns; pick one per lesson
5. [Design tokens](#5-design-tokens) — typography, color, motion, spacing
6. [Per-page deep dive](#6-per-page-deep-dive) — current state → target structure for all 9 pages
7. [Implementation map](#7-implementation-map) — what to extract, what to refactor, what to leave alone

---

## 1. First principles — what a lesson is

A `/learn/*` page is not a marketing page. It is a **lesson**. That word carries three commitments:

1. **A lesson has a defined entry and exit.** A learner should know within 2 seconds *where they are*, *what's about to be taught*, and *what they'll know at the end*. Today, most pages drop the reader directly into a poetic hero with no orientation.
2. **A lesson teaches one thing well, not many things partly.** Every lesson should have a single primary teaching artifact — one diagram, one wheel, one map, one matrix — that the rest of the page serves. Today's pages mix metaphors (a chart is a "photograph," then a "machine," then a "blueprint," then a "weave"). Pick one *visual* spine per page; the prose can vary.
3. **A lesson hands off cleanly.** Every lesson ends with an explicit "you just learned X · next is Y · here's why Y follows X." Today, only some pages have a Next link, the labels are inconsistent, and Viewing the Stars dumps the user into `/dashboard` mid-curriculum.

From these three commitments, the rest of the framework follows mechanically.

### The five consistency rules

Every lesson, without exception:

> **R1. Same shell.** Every lesson uses the same outer frame (`LessonShell`). Page chrome is invariant.
> **R2. Same 3 acts.** Every lesson has Intro → Teach → Next, in that order. No exceptions.
> **R3. One teaching artifact per lesson.** One primary visual device, picked from the four canonical patterns.
> **R4. Tokens, not tweaks.** Typography, color, spacing, and motion come from named tokens. Per-page customization is limited to **the topic accent color** and **the choice of teaching artifact** — nothing else.
> **R5. Glossary popovers everywhere.** Any term defined in the glossary is rendered as a `<GlossaryTerm>` on first use per page.

These five rules are the entire framework. The rest of this document operationalizes them.

---

## 2. The 3-Act Lesson Template

Every page is structurally identical. The visible content varies; the skeleton does not.

```
┌─────────────────────────────────────────────────────┐
│  PAGE HEADER  (sticky, shared across all of /learn) │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ACT 1 · INTRO                                      │
│   - Lesson chip   (Module 2 · Lesson 4)             │
│   - Eyebrow       (color-coded to topic)            │
│   - Headline      (font-primary, ~text-7rem)        │
│   - Lede          (1–2 sentences, plain language)   │
│   - Learning objectives  (3 bullets, "you will…")   │
│   - Prereqs chip  (links to required prior lessons) │
│   - Reading time  (~6 min)                          │
│   - Scroll cue    (animate-bounce, optional)        │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ACT 2 · TEACH                                      │
│   - Concept-zero card  (one-paragraph anchor)       │
│   - Teaching artifact  (one of four patterns)       │
│      - Concept cards walk readers through it        │
│   - Worked example     (shared component)           │
│   - Recap strip        (3 bullets, "you now know…") │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ACT 3 · NEXT                                       │
│   - Tradition / sources panel                       │
│   - Glossary terms used on this page                │
│   - Previous / Next pagination card                 │
│   - Disclaimer footer  (shared)                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Why exactly these elements

Every element earns its place by serving one of the three lesson commitments:

| Element | Serves | Why |
|---|---|---|
| Lesson chip | Orientation | Tells the reader where they are in the curriculum |
| Learning objectives | Entry contract | Tells the reader what they will know at the end |
| Prereqs chip | Curriculum integrity | Stops a learner from landing on Lesson 6 with no scaffolding |
| Reading time | Reader respect | Sets a time budget |
| Concept-zero card | First-principles entry | The plain-language anchor before any jargon |
| Teaching artifact | The lesson itself | One visual carries the load |
| Worked example | Pedagogy | Beginners learn from one example faster than from ten abstractions |
| Recap strip | Closure | Closes the entry contract |
| Sources panel | Credibility (R-rule from curriculum plan) | Makes the lineage visible |
| Glossary list | Reusability | Every term that appeared, in one place, linked |
| Pagination card | Continuity | The handoff to the next lesson |
| Disclaimer footer | Standing claim | One sentence on every page about what astrology is |

### What gets removed

Today's pages contain elements this template explicitly drops:

- **Decorative full-screen scroll heroes** that show no content. (Replaced by Act 1's Intro card.)
- **Multiple competing CTAs in the outro** (today: "Back to Learn" + "Next: Topic" + sometimes "Return to Dashboard"). Replaced by a single canonical pagination card.
- **Per-page invented chrome** (Houses' inline FAQ section, Natal Chart's aspect legend in the hero). Either promoted into a shared primitive or moved to Act 2 as concept cards.

---

## 3. Shared primitives — what to build and reuse

Three components already exist (`LearnIntroCard`, `LearnSectionCard`, `LearnOutroCard` — used inconsistently in Zodiac, Constellations, Viewing the Stars). Five pages bypass them and inline their own variants. The framework standardizes on a single set.

### 3.1 The shell

```tsx
<LessonShell
  module="Module 2"
  lessonNumber={4}
  topic="Natal Charts"
  topicAccent="var(--color-y2k-blue)"   // the only per-page color knob
  readingTime="8 min"
  prevHref="/learn/zodiac"
  nextHref="/learn/houses"
  prevLabel="The Zodiac"
  nextLabel="The 12 Houses"
>
  <LessonIntro ... />
  <LessonTeach ... />
  <LessonNext ... />
</LessonShell>
```

**Responsibilities of `LessonShell`:**
- Renders `<PageHeader title="Academy" />` and the persistent breadcrumb (`Academy · Module 2 · Lesson 4`).
- Sets the topic accent CSS var on a wrapper so all child components can `var(--lesson-accent)`.
- Renders the standing footer disclaimer (one line, every page, see curriculum plan §3).
- Provides scroll-restoration and a single `<main>` element with consistent paddings.

This replaces the `min-h-screen bg-[var(--bg)] text-[var(--text-primary)] font-body pb-32` boilerplate copy-pasted across all 9 pages today.

### 3.2 Intro primitives

```tsx
<LessonIntro
  eyebrow="Cosmic Blueprint"            // short — 2 words ideal
  title={["The Cosmic", "Blueprint"]}    // array becomes line-broken h1
  italicLine={1}                          // which line gets italic-accent treatment
  lede="Your natal chart is a snapshot of the sky at the moment you were born — read from the spot you were born."
  objectives={[                           // 3 bullets max, all "you will…"
    "Read the wheel layout: signs, houses, planets, angles.",
    "Distinguish the snapshot (chart) from the live sky (transits).",
    "Walk through one chart end-to-end.",
  ]}
  prereqs={[                              // 0–2 prior lessons
    { label: "The Zodiac", href: "/learn/zodiac" },
  ]}
  scrollCue                               // shows the bouncing "Scroll to Begin"
/>
```

This single component subsumes:
- The eyebrow + headline + sub pattern that appears 9 times today with subtle variations.
- The "Scroll to Begin" bounce CTA from Aspects/Houses.
- The aspect-legend block currently inlined in the Natal Chart hero (which doesn't belong there — see §6.4).

### 3.3 Teach primitives

```tsx
<LessonTeach>
  <ConceptZero>
    Before any jargon. The natal chart is a 2D map of the 3D sky as it
    looked at the moment of your birth, viewed from your birth location.
  </ConceptZero>

  <TeachingArtifact pattern="pinned-wheel" data={natalChartData} />

  <ConceptStack>
    <ConceptCard ... />     {/* paired with each artifact step */}
    <ConceptCard ... />
    {/* etc */}
  </ConceptStack>

  <WorkedExample
    title="Born 17 Aug 1988, Jakarta — read end-to-end"
    chart={exampleChartData}
  />

  <Recap items={[
    "The chart is a snapshot, not a forecast.",
    "Signs say how, houses say where, planets say what.",
    "Aspects are the conversations between planets.",
  ]} />
</LessonTeach>
```

**`<ConceptZero>`** — the single paragraph that anchors the lesson before any teaching artifact runs. Astronomy voice. Plain language. Always the second thing the reader sees after the Intro headline.

**`<TeachingArtifact pattern={...}>`** — a polymorphic component that picks one of four canonical patterns (see §4). The wheel SVGs, the world map, the longitude band, the constellation dot-paths — all live behind this single API.

**`<ConceptCard>`** — the alternating left/right card already in use, standardized:

```tsx
<ConceptCard
  side="left"                             // alternates per card; framework auto-flips
  badge={<PlanetGlyph planet="Sun" />}    // optional symbolic anchor
  kicker="Identity"                        // 2-word
  title="The Sun"
  meta={[                                  // structured metadata strip
    { label: "Sign", value: "Leo" },
    { label: "House", value: "5" },
    { label: "Dignity", value: "Domicile", tone: "positive" },
  ]}
  body={<>...</>}                          // ReactNode; supports <GlossaryTerm>
  traditionTag="Hellenistic"               // R-rule: every interpretive claim attributed
  watermark="☉"                            // huge faded glyph behind the card
/>
```

This single component replaces the seven different card variants currently in use across the 9 pages (per the audit).

**`<WorkedExample>`** — promoted from Houses' "Case Study: Alex's Career" pattern. Every page that teaches application gets one. Same structure: setup, what we're looking for, the read, the takeaway.

**`<Recap>`** — three bullets. Closes the lesson's entry contract. Today, no page has this; every page should.

### 3.4 Next primitives

```tsx
<LessonNext>
  <SourcesPanel
    sources={[
      { author: "Brennan, Chris", title: "Hellenistic Astrology", year: 2017 },
      { author: "Hand, Robert", title: "Horoscope Symbols", year: 1981 },
    ]}
  />
  <GlossaryUsed terms={["ecliptic", "ascendant", "domicile", "aspect"]} />
  <PaginationCard
    prev={{ href: "/learn/zodiac", title: "The Zodiac", subtitle: "Module 1 · Lesson 2" }}
    next={{ href: "/learn/houses", title: "The 12 Houses", subtitle: "Module 2 · Lesson 5" }}
    bridge="Houses tell us where in your life each planet's themes show up."
  />
</LessonNext>
```

**`<PaginationCard>`** is the single canonical handoff. It replaces the variations in today's pages:

| Page | Today's outro CTA | Problem |
|---|---|---|
| Natal Chart | "← Back to Learn" + "Next: The 12 Houses →" | OK, but two equal-weight buttons |
| Houses | "Learn: Your Natal Chart →" | Sends reader *backwards* |
| Aspects | "Next: Malefic vs Benefic" | Single button, no Previous |
| Malefic/Benefic | "Return to Directory" | Dead-ends the curriculum |
| Zodiac | "Final: View the Stars" | Mislabels its position |
| Viewing the Stars | "Return to Dashboard" | Exits the Academy mid-curriculum |
| Constellations | "Explore Aspects" | Inconsistent verb |

The new `<PaginationCard>` always shows: small Previous chip on the left, large Next card on the right, and a one-sentence **bridge** that explains *why* the next lesson follows this one. The bridge is the part most missing today; it's what turns a directory into a curriculum.

### 3.5 Inline reading primitives

These are the small, in-prose components that appear inside `<ConceptCard>` body content:

- **`<GlossaryTerm term="ecliptic">ecliptic</GlossaryTerm>`** — dotted-underline hover popover. First-use per page. Hover/tap shows the glossary entry; click opens `/learn/glossary#ecliptic`.
- **`<TraditionChip tradition="Hellenistic" />`** — small color-coded chip. Hellenistic = warm gold, Modern Western = blue, Mundane = sage, Astronomy = white/neutral. One per major claim.
- **`<SourceLine author="Lewis, Jim" year={1976}>Astrocartography systematized in</SourceLine>`** — the cheap, in-prose attribution that the curriculum plan calls for.
- **`<Aside>`** — a left-bordered note for "see also" / parenthetical material. Replaces the today's-pages habit of jamming asides into the main flow.
- **`<DiagramFigure>`** — the standard wrapper for any figure (SVG, photo, table) with a caption and an optional source line. Every diagram on every page goes through this.

### 3.6 Page header primitives

Two new pieces sit in the **page header** above Act 1:

- **`<LessonChip>`** — `Module 2 · Lesson 4 · 8 min`. Pinned at the top.
- **`<ProgressRail>`** — a slim 9-segment rail at the very top showing curriculum progress. Slot for the active lesson is filled with the topic accent color. This is the single best UX intervention for "where am I in the curriculum?" — and it costs almost nothing to render.

### 3.7 Component map (today → tomorrow)

A condensed map of what to keep, what to retire, what to extract:

| Today's component | Status | Replacement |
|---|---|---|
| `LearnIntroCard` (used 3x) | **Promote** | Becomes `<LessonIntro>` (used 9x) |
| `LearnSectionCard` (used 3x) | **Promote** | Becomes `<ConceptCard>` (used everywhere) |
| `LearnOutroCard` (used 1x — Houses) | **Promote** | Becomes part of `<PaginationCard>` |
| Inline `<AstronatCard variant="black" shape="cut-md">` content cards (Aspects, Malefic/Benefic, Houses) | **Retire pattern** | Replaced by `<ConceptCard>` |
| Inline `bg-black/70 backdrop-blur-xl` cards (Astrocartography, Geodetic) | **Retire pattern** | Replaced by `<ConceptCard>` |
| `NatalWheelSVG` | **Keep** | Becomes one of four `<TeachingArtifact pattern>` implementations |
| `AcgMap` / world-map components | **Keep** | Becomes a `<TeachingArtifact pattern="world-map">` impl |
| `PageHeader` | **Keep, extend** | Add `LessonChip` + `ProgressRail` slots |
| `AstronatCard`, `PlanetIcon`, `SignIcon` | **Keep** | Used inside `<ConceptCard>` |
| GSAP `useGSAP` scroll triggers (5 different inline implementations) | **Consolidate** | One shared `useScrollReveal` hook |

---

## 4. The Teaching Artifact taxonomy

Every lesson picks **exactly one** of four patterns for its primary visual. Per-lesson choice is fixed in the framework — no page invents a new one. This is the single biggest source of UI inconsistency today (the Aspects, Malefic/Benefic, Constellations pages use scrollytelling; Zodiac is a static grid; Houses is hybrid; Viewing the Stars is a hero image with no artifact). The taxonomy ends that.

### Pattern A · Pinned Wheel

> **Use when:** the lesson is *about* the natal chart wheel itself, or about a system overlaid on it (planets, houses, aspects, dignity).

A fixed-position SVG wheel sits behind the scrolling content. As the reader scrolls each `<ConceptCard>`, the wheel highlights one element (a planet, a house, an aspect). Theme-aware (light/dark).

**Lessons that use this:** Natal Chart, Houses, Aspects, Malefic/Benefic.

**Implementation:** `<TeachingArtifact pattern="pinned-wheel" data={...} activeStep={i} />`. The `<ConceptCard>` triggers `setActiveStep` via shared `useScrollReveal`. One wheel implementation; four lessons drive it differently via the `data` prop.

**Today's state:** Each of the four lessons rolls its own wheel SVG with subtle differences (sizes: 820px / 720px; theme handling: similar but copy-pasted; aspect line drawing: only in Natal Chart and Aspects). Consolidate into one `NatalWheelSVG` with feature flags.

### Pattern B · Sticky Diagram + Scrolling Concepts

> **Use when:** the lesson teaches a sequence of named objects (constellations, signs, zones) that share the same visual treatment.

The diagram (sticky on desktop, top-anchored on mobile) updates as the reader scrolls a column of `<ConceptCard>` entries to its right. Each card highlights its corresponding object on the diagram.

**Lessons that use this:** Constellations (the dot-pattern of each constellation), Zodiac (the 30°-wedge of each sign on the ecliptic band), Geodetic Astrology (the longitude band with the active zone highlighted).

**Implementation:** `<TeachingArtifact pattern="sticky-diagram" diagram={...}>` wraps a `<ConceptStack>` of cards.

### Pattern C · World Map with Lines

> **Use when:** the lesson teaches a place-based system.

A fixed-position world map (already exists as `AcgMap`). Lines and zones are drawn / highlighted as the reader scrolls cards.

**Lessons that use this:** Astrocartography, Geodetic Astrology (alternative to Pattern B — choose based on whether the lesson emphasizes lines or zones).

**Implementation:** `<TeachingArtifact pattern="world-map" lines={[...]} zones={[...]} activeStep={i} />`.

### Pattern D · Sky Hero (the practical pattern)

> **Use when:** the lesson is observational and the "artifact" is the actual sky — Moon, planets, constellations, the ecliptic.

A diagram-led page where the primary visual is a sequence of "what to look for at this hour, this season, from this hemisphere" panels. Less scroll-reactive; more illustrated guide.

**Lessons that use this:** Viewing the Stars (the only one).

**Implementation:** `<TeachingArtifact pattern="sky-hero" panels={[...]} />`.

### How to pick

```
Is the lesson about the chart wheel itself or things drawn on it?
   → Pattern A (Pinned Wheel)
Is the lesson about a sequence of named objects with shared treatment?
   → Pattern B (Sticky Diagram)
Is the lesson about a place / region / map?
   → Pattern C (World Map with Lines)
Is the lesson about looking up at the actual sky?
   → Pattern D (Sky Hero)
```

If a lesson seems to need two patterns, it's two lessons.

### What this kills

The bespoke per-page artifacts and animations that exist today: the inline `strokeDashoffset` animations in Astrocartography, the `setActiveZoneId` state in Geodetic, the `setActiveHouse` in Houses, the GSAP planet-scale animations in Malefic/Benefic. All of these become **one** `useScrollReveal` hook plus **one** of four `TeachingArtifact` implementations.

---

## 5. Design tokens

The audit revealed a *near-system*: pages mostly agree on typography, color, spacing, and motion, but each pasted the values inline. Codify the tokens so they can never drift.

### 5.1 Typography

| Token | Class string | Use |
|---|---|---|
| `text-display-xl` | `font-primary text-7xl md:text-[10rem] leading-[0.75] tracking-tighter uppercase` | Index-only super-display |
| `text-display-lg` | `font-primary text-5xl md:text-[6rem] lg:text-[7rem] leading-[0.85] tracking-tight uppercase` | Lesson hero h1 |
| `text-display-md` | `font-primary text-5xl md:text-7xl uppercase` | Section h2 |
| `text-display-sm` | `font-primary text-4xl md:text-6xl tracking-tight` | Concept card titles |
| `text-eyebrow` | `font-mono text-[10px] md:text-xs uppercase tracking-[0.2em]` | Eyebrow chip text |
| `text-kicker` | `font-mono text-[10px] uppercase tracking-[0.25em]` | Card kickers |
| `text-meta` | `font-mono text-[9px] uppercase tracking-widest` | Tags, pills, dates |
| `text-prose` | `font-body text-base md:text-lg leading-relaxed` | Body copy |
| `text-prose-sm` | `font-body text-sm md:text-base leading-relaxed` | Concept card body |
| `text-quote` | `font-secondary text-2xl md:text-3xl italic` | Pull quotes / FAQ headers |

Eight tokens, not 30 inline class strings. One file.

### 5.2 Color

The de-facto palette already exists as CSS vars. Three additions formalize the system:

```css
/* Per-lesson accent (set by LessonShell) */
--lesson-accent: var(--color-y2k-blue);

/* Tradition tags (new, codifies §3.5) */
--tradition-hellenistic: var(--gold);
--tradition-modern:      var(--color-y2k-blue);
--tradition-mundane:     var(--sage);
--tradition-astronomy:   var(--text-primary);
```

The per-topic accent palette stays as it is today (one CSS var per lesson):

| Lesson | Accent |
|---|---|
| Viewing the Stars | `var(--gold)` |
| The Zodiac | `var(--color-y2k-blue)` |
| Constellations | `var(--gold)` |
| Natal Chart | `var(--color-y2k-blue)` |
| Houses | `var(--sage)` |
| Aspects | `var(--color-acqua)` |
| Malefic/Benefic | `var(--color-spiced-life)` |
| Astrocartography | `var(--color-acqua)` |
| Geodetic Astrology | `var(--color-spiced-life)` |

Each lesson's accent is consumed via `var(--lesson-accent)` inside `<ConceptCard>`, the eyebrow border, the watermark, the tradition chip when relevant, and the next-link button. No component should read a topic-specific var directly.

### 5.3 Motion

Three reveal recipes. Every animation on every page uses one:

| Token | Effect | Easing | Duration |
|---|---|---|---|
| `reveal/card` | `autoAlpha 0→1, y 40→0` | `power2.out` | `0.6s` |
| `reveal/object` | `autoAlpha 0→1, scale 0.85→1` | `back.out(1.7)` | `0.9s` |
| `reveal/line` | `strokeDashoffset length→0` | `power3.out` | `1.4s` |

These map 1:1 to what GSAP is already doing on the four wheel-pages. They become a single `useScrollReveal({ recipe: "card" | "object" | "line", ... })` hook so the inline `gsap.fromTo` boilerplate doesn't have to be re-pasted per page.

### 5.4 Spacing

| Token | Value | Use |
|---|---|---|
| `lesson/section-y` | `py-20 md:py-32` | Vertical rhythm between Acts |
| `lesson/card-pad` | `p-8 md:p-12` | ConceptCard padding |
| `lesson/gutter-x` | `px-6 md:px-12 lg:px-20` | Page gutters |
| `lesson/intro-max` | `max-w-2xl` | Intro/outro card width |
| `lesson/concept-max` | `max-w-lg` | ConceptCard width |
| `lesson/wheel-size` | `min(100vh, 820px)` for Pattern A; `min(80vh, 720px, 90vw)` for Pattern B | Teaching artifact sizing |

### 5.5 Shape

The `AstronatCard` primitive already exposes `shape`. Constrain framework usage to exactly three shapes per role:

- **Concept cards:** `shape="cut-md"`
- **Statement / outro cards:** `shape="asymmetric-md"`
- **Pagination cards:** `shape="organic"`

Variants (`charcoal | surface | black | y2k-blue | glass`) become role-driven, not chosen per page.

---

## 6. Per-page deep dive

For each lesson: **current UI state**, **target structure under the framework**, **specific component changes**. Refer to the curriculum plan for content rewrites; this section addresses structure and components only.

### 6.1 Module 0 · Start Here *(new page)*

**Current:** does not exist.

**Target:** uses `LessonShell` with `pattern="none"` (no teaching artifact). Two `<ConceptCard>` rows: "Astronomy vs. Astrology" and "Traditions we teach from." A custom `<CurriculumMap>` block (the only bespoke component on this page) shows all 9 lessons with progress dots. Pagination has no Previous; Next points to Lesson 1.

**Components introduced here:** `<CurriculumMap>` (a single new block; sits in this page only).

### 6.2 Lesson 1 · Viewing the Stars

**Current:** 57 lines. A single hero image, two paragraph blocks, an outro to `/dashboard`. No `<LearnIntroCard>` despite being one of the three pages that already uses the shared learn primitives.

**Target:** uses `LessonShell` with `pattern="sky-hero"`. Five `<ConceptCard>` panels (ecliptic, two lights, wandering stars, Moon practice, transit definition). A new `<HemispherePanel>` shared component (north / south view toggle for "what to look for tonight") becomes the artifact. Pagination Next → Module 1 · Lesson 2 (Zodiac) with bridge: "Now that you know what's overhead, the next lesson covers how astrologers measure it."

**New shared component introduced:** `<HemispherePanel>` (also future-usable on any astronomy-driven page).

### 6.3 Lesson 2 · The Zodiac

**Current:** 67 lines. Static 3-col grid of 12 sign cards. No scrollytelling. Uses `LearnIntroCard` and `LearnOutroCard`. The audit flagged this as the only page with no animation, which makes it feel "lower-effort" against scrollytelling neighbors.

**Target:** uses `LessonShell` with `pattern="sticky-diagram"`. The sticky diagram is a 360° ecliptic band with all 12 signs as 30° wedges; the active wedge lights up as the reader scrolls. The 12 cards become 12 `<ConceptCard>`s in a single column. Adds the **modality 3×4 table** (specified in the curriculum plan §6 Lesson 2) before the cards begin — implemented as a new `<ModalityMatrix>` shared component. Pagination Next → Constellations.

**Migration:** the sign descriptions stay verbatim. The 3-col grid is replaced by the sticky-diagram pattern. `SignIcon` remains, used inside `<ConceptCard badge>`.

### 6.4 Lesson 3 · Constellations

**Current:** 115 lines. Animated SVG dot-patterns for 12 constellations. Each gets 1–3 sentences. Today's outro pushes to `/learn/aspects`.

**Target:** uses `LessonShell` with `pattern="sticky-diagram"`. The sticky diagram becomes the **constellation viewer** — same SVG dot-pattern artistry, but now driven by the active scroll step. Adds the **precession diagram** (specified in curriculum plan §6 Lesson 3) as a `<DiagramFigure>` between Concept Zero and the constellation walkthrough. The dot-pattern SVGs become a new `<ConstellationPlot>` shared component, instantiated 12 times.

**New shared component introduced:** `<ConstellationPlot star-data>`. Reusable on Viewing the Stars too.

### 6.5 Lesson 4 · Natal Chart

**Current:** 601 lines. Pinned-wheel pattern with 10 planets walked through. Inline aspect legend in the hero. Custom inline `NatalWheelSVG`. Nine planet sections; one outro.

**Target:** uses `LessonShell` with `pattern="pinned-wheel"`. The aspect legend is **removed from the hero** (a Lesson 6 preview that doesn't belong here) and replaced with the proper `<LessonIntro objectives>` block. The 10 planet sections become 10 `<ConceptCard>`s; the framework auto-flips left/right. Dignity tags (DOMICILE, EXALTATION) become a `<DignityChip>` inside the `meta` strip — visible but not foregrounded until Lesson 7 introduces the term. Adds a `<WorkedExample>` at the end (the Jakarta 1988 chart, walked end-to-end as a single integrated read — currently the page has the data but not the integrated read).

**Migration plan:** This is the most-rewritten page in terms of content but the *least*-rewritten in UI — the wheel-and-cards pattern survives. The work is mostly extracting `NatalWheelSVG` and the GSAP scroll-trigger logic into shared primitives.

### 6.6 Lesson 5 · Houses

**Current:** 507 lines. Pinned-wheel pattern with 12 house sections. Has the strongest "applied" content (Empty House Myth, Follow the Landlord, Alex case study) — currently *after* the 12 cards. Uses `LearnOutroCard` (the only page that does).

**Target:** uses `LessonShell` with `pattern="pinned-wheel"`. The Applied Astrology block is **promoted to a `<WorkedExample>` and moved up** — between Concept Zero and the 12-house walkthrough. New shared component: `<HouseSystemNote>` — a small `<Aside>`-style note explaining "Astronaut uses the Whole Sign system; other systems include Placidus, Equal, Koch" (specified in curriculum plan §6 Lesson 5). The 12 house cards become 12 `<ConceptCard>`s.

**Migration plan:** existing wheel SVG becomes a `pinned-wheel` artifact data variant ("show houses, not planets"). The custom `LearnOutroCard` instance retires in favor of `<PaginationCard>`.

### 6.7 Lesson 6 · Aspects

**Current:** 426 lines. Pinned-wheel pattern with 5 aspect sections, each animating two planets and a line on the wheel. Uses inline `AstronatCard variant="black" shape="cut-md"`.

**Target:** uses `LessonShell` with `pattern="pinned-wheel"`. The 5 aspect sections become 5 `<ConceptCard>`s. **New `<AnglePrimer>` block** (specified in curriculum plan §6 Lesson 6) inserted between Concept Zero and the 5 cards: a 360° circle with the five angles (0/60/90/120/180°) labeled — the reader sees the geometry before the interpretation. **New `<OrbsExplainer>` block** between aspect 2 and 3 (a one-paragraph callout introducing orbs).

**Migration plan:** the existing wheel-and-line animation pattern is the cleanest in the codebase — it becomes the canonical Pattern A reference implementation.

### 6.8 Lesson 7 · The Great Divide (Malefic/Benefic)

**Current:** 363 lines. Pinned-wheel pattern with 4 planet sections (Venus, Jupiter, Mars, Saturn).

**Target:** uses `LessonShell` with `pattern="pinned-wheel"`. The 4 planet sections become 4 `<ConceptCard>`s. **New `<TraditionPrimer>` block** at the top (one-paragraph Hellenistic origin, per curriculum plan §6 Lesson 7). **New `<DignityTable>` shared component** at the bottom of Act 2 — the small reference table of domicile/exaltation/detriment/fall that this lesson introduces and downstream pages can link to. Adds a 5th implicit `<ConceptCard>` titled "What about the others?" covering Mercury (neutral), luminaries, and outers — closing the system that today feels arbitrary.

**Migration plan:** wheel logic identical to Aspects. The `<DignityTable>` is the new asset; once built, Natal Chart can link its DOMICILE/EXALTATION chips here.

### 6.9 Lesson 8 · Astrocartography

**Current:** 384 lines. World-map artifact (already exists as `AcgMap`-style), four planetary lines walked through. Inline "ASC/MC/DSC/IC" legend.

**Target:** uses `LessonShell` with `pattern="world-map"`. The four-angles legend (ASC/MC/DSC/IC) is moved out of the inline body into a new `<AnglesLegend>` shared component (also reusable on Geodetic). The four planet/line sections become 4 `<ConceptCard>`s. **New `<AllLinesReference>` collapsible block** at the bottom of Act 2 — listing all 40 lines (10 planets × 4 angles) so readers see the full system, not just the four taught.

**Migration plan:** consolidate today's bespoke map into the shared `<TeachingArtifact pattern="world-map">` adapter.

### 6.10 Lesson 9 · Geodetic Astrology

**Current:** 371 lines. Twelve longitude-zone sections with active-zone highlighting. State-driven (`activeZoneId`).

**Target:** uses `LessonShell` with `pattern="sticky-diagram"` (the longitude band is the diagram) — **not** `pattern="world-map"`, because the artifact is fundamentally a 1D longitude scale, not a 2D map. The 12 zone sections become 12 `<ConceptCard>`s. **New `<HistoryNote>` block** at the top introducing Sepharial / Powell / Greenwich-anchored alternatives (per curriculum plan §6 Lesson 9). The "geometry vs. mysticism" outro line is replaced by the curriculum plan's standing line: *"The mapping is geometric. The interpretation is a tradition. Both are useful; they are not the same kind of claim."*

---

## 7. Implementation map

The order in which to refactor, so the framework lands without big-bang risk.

### Phase 1 · Tokens + shell *(low risk, unblocks everything)*

1. Add design tokens (typography, motion, spacing, color) to a single CSS module + Tailwind config.
2. Build `<LessonShell>`, `<LessonChip>`, `<ProgressRail>`, footer disclaimer.
3. Build `<LessonIntro>`, `<LessonNext>`, `<PaginationCard>`.
4. Migrate the index page to use the new tokens (no functional change).

**Files added:**
- `app/(frontend)/(app)/learn/_components/LessonShell.tsx`
- `app/(frontend)/(app)/learn/_components/LessonIntro.tsx`
- `app/(frontend)/(app)/learn/_components/LessonNext.tsx`
- `app/(frontend)/(app)/learn/_components/PaginationCard.tsx`
- `app/(frontend)/(app)/learn/_components/LessonChip.tsx`
- `app/(frontend)/(app)/learn/_components/ProgressRail.tsx`
- `app/styles/learn-tokens.css`

### Phase 2 · Concept primitives

1. Build `<ConceptZero>`, `<ConceptCard>`, `<ConceptStack>`, `<Recap>`, `<WorkedExample>`.
2. Build inline-reading primitives: `<GlossaryTerm>`, `<TraditionChip>`, `<SourceLine>`, `<Aside>`, `<DiagramFigure>`.
3. Migrate the **Zodiac** page to the new primitives (smallest content, lowest risk).

**Files added:**
- `app/(frontend)/(app)/learn/_components/ConceptCard.tsx`
- `app/(frontend)/(app)/learn/_components/ConceptZero.tsx`
- `app/(frontend)/(app)/learn/_components/Recap.tsx`
- `app/(frontend)/(app)/learn/_components/WorkedExample.tsx`
- `app/(frontend)/(app)/learn/_components/GlossaryTerm.tsx`
- `app/(frontend)/(app)/learn/_components/TraditionChip.tsx`
- `app/(frontend)/(app)/learn/_components/SourceLine.tsx`
- `app/(frontend)/(app)/learn/_components/DiagramFigure.tsx`

### Phase 3 · Teaching artifact

1. Build the `<TeachingArtifact pattern="…">` polymorphic component with one shared `useScrollReveal` hook.
2. Move existing `NatalWheelSVG` behind `pattern="pinned-wheel"`.
3. Build `pattern="sticky-diagram"` (powers Zodiac, Constellations, Geodetic).
4. Move existing world-map components behind `pattern="world-map"`.
5. Build `pattern="sky-hero"` (powers Viewing the Stars).
6. Migrate Aspects (cleanest existing pinned-wheel) to validate the API.

**Files added:**
- `app/(frontend)/(app)/learn/_components/TeachingArtifact.tsx`
- `app/(frontend)/(app)/learn/_components/artifacts/PinnedWheel.tsx`
- `app/(frontend)/(app)/learn/_components/artifacts/StickyDiagram.tsx`
- `app/(frontend)/(app)/learn/_components/artifacts/WorldMap.tsx`
- `app/(frontend)/(app)/learn/_components/artifacts/SkyHero.tsx`
- `app/(frontend)/(app)/learn/_components/useScrollReveal.ts`

### Phase 4 · Lesson-specific primitives

These are introduced once each, in the lesson that needs them, but go in `_components/` because a future lesson (or a glossary page) may reuse them:

- `<ModalityMatrix>` (Zodiac)
- `<ConstellationPlot>` (Constellations, Viewing the Stars)
- `<DignityTable>` (Malefic/Benefic, Natal Chart links to it)
- `<AnglesLegend>` (Astrocartography, Geodetic)
- `<HemispherePanel>` (Viewing the Stars)
- `<AnglePrimer>` (Aspects)
- `<OrbsExplainer>` (Aspects)
- `<HouseSystemNote>` (Houses)
- `<AllLinesReference>` (Astrocartography)
- `<HistoryNote>` (Geodetic)
- `<TraditionPrimer>` (Malefic/Benefic)
- `<CurriculumMap>` (Module 0)

### Phase 5 · Page-by-page migration

In curriculum order — so by the time a lesson is migrated, every term it uses has been introduced upstream:

1. Module 0 · Start Here *(new)*
2. Lesson 1 · Viewing the Stars *(was the worst stub; now Lesson 1 in new order)*
3. Lesson 2 · Zodiac
4. Lesson 3 · Constellations
5. Lesson 4 · Natal Chart
6. Lesson 5 · Houses
7. Lesson 6 · Aspects
8. Lesson 7 · Malefic/Benefic
9. Lesson 8 · Astrocartography
10. Lesson 9 · Geodetic

### Phase 6 · Index + glossary

1. Rebuild the `/learn` index as the curriculum landing (numbered 3-module layout from curriculum plan §1.1).
2. Build the `/learn/glossary` page — the corpus of every `<GlossaryTerm>` used across the lessons.
3. Add the `<ProgressRail>` to every page now that all 9 lessons exist in their final structure.

---

## Closing note — what consistency buys

The biggest risk in a multi-page editorial product is that each page becomes its own brand. The audit shows this risk has already partly materialized — Aspects feels like a different product than Zodiac, which feels like a different product than Viewing the Stars. The fix is not stylistic conformity. It's the same skeleton with different muscles.

If a learner can answer these three questions on every page within 5 seconds, the framework is doing its job:

1. **Where am I?** → `LessonChip` + `ProgressRail`
2. **What will I know at the end?** → `LessonIntro` objectives
3. **What do I do next?** → `PaginationCard` with bridge

Everything in this document is in service of those three answers being yes-yes-yes on all 9 pages.

---

*End of UI/UX framework. Implementation deferred pending alignment with curriculum plan.*
