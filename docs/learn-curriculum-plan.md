# Astronat Academy — Editorial & Pedagogy Plan

**Scope:** the `/learn` route — index + 9 topic pages.
**Reviewer stance:** editor + 101-level teacher. Read every page imagining a reader who has never opened an astrology book before.
**Target reading level:** smart adult, zero astrology vocabulary. Curious but skeptical.
**Date drafted:** 2026-05-02

---

## TL;DR — what's wrong, and what to do about it

The Academy looks premium and reads confidently, but it does not currently behave like a curriculum. It behaves like nine standalone landing pages that share a brand. A first-time learner can't enter cleanly, can't see a path, and can't tell which claims are tradition, which are math, and which are the product's voice.

Three structural problems sit underneath every smaller issue:

1. **No on-ramp.** The index drops the reader straight into nine equally-weighted topics. There is no "start here," no "what astrology is," no glossary. Page 1 (whichever you click) assumes you already know what a sign, a house, an aspect, a glyph, an angle, a cusp, and a "degree" are.
2. **Inconsistent voice on credibility.** The index promises *"absolute astronomical authority,"* *"mathematically sound,"* *"first principles,"* *"how the cosmos operates as a physical machine."* The pages then teach Hellenistic-tradition material (benefic/malefic, dignities, rulerships) as if it were physics, with zero source attribution and zero acknowledgement that the claims are interpretive. This is the single biggest credibility wound. A reader who knows even a little will bounce; a reader who knows nothing will feel sold-to.
3. **Wildly uneven depth.** Two pages are placeholder stubs (Constellations: ~115 lines of decorative SVGs and one-liners; Viewing the Stars: ~57 lines, two headings, almost no content). Three pages are dense and ambitious (Natal Chart, Aspects, Houses). The others sit somewhere in between. The "Academy" promise can't survive that variance.

The plan below proposes (a) a unified spine, (b) a credibility model that lets you keep the poetic voice without overclaiming, (c) a per-page rewrite brief, and (d) a phased rollout. Implementation work is deferred — this document is for alignment first.

---

## Part 1 — The unified spine

### 1.1 A learning order, not a directory

Right now the index is a 3×3 grid of equal cards. Replace this with an explicit, numbered curriculum. Beginners need a path; the grid suggests there isn't one.

**Proposed order (Foundations → Mechanics → Application):**

> **Module 0 · Start Here** — *new page* — "What astrology is, what it isn't, and how to read this Academy"
>
> **Module 1 · Foundations**
> 1. Viewing the Stars — what's actually overhead (astronomy first)
> 2. The Zodiac — the 12 signs as a measurement system
> 3. The Constellations — the star groups behind the signs (and why they're not the same thing)
>
> **Module 2 · The Natal Chart**
> 4. The Natal Chart — the snapshot
> 5. The 12 Houses — where things happen
> 6. Planetary Aspects — how planets talk to each other
> 7. The Great Divide — benefics, malefics, and dignity
>
> **Module 3 · Place & World**
> 8. Astrocartography — the chart relocated
> 9. Geodetic Astrology — the chart of the Earth itself

Why this order: foundations earn the right to use vocabulary that downstream pages currently assume. Today the Natal Chart page leans on "house," "aspect," "dignity," and "glyph" before any of those have been introduced — readers either bail or skim. With this order, by the time a learner hits the Natal Chart, every term it uses has been seeded.

**Concrete index changes:**
- Replace the unordered grid with a numbered, three-module layout.
- Add a "Start Here" tile pinned at the top (not in the grid).
- Add per-card chips: `~6 min read` · `Module 1 · Lesson 2` · `Beginner / Intermediate`.
- Add "Previous / Next" navigation at the bottom of every page so the curriculum is walkable, not just discoverable.
- Move the "Updated April 14, 2026" line out of the bottom statement card and onto each page individually (curriculum dating is page-level).

### 1.2 A "how to read this Academy" page (Module 0)

This single new page does more for credibility than any rewrite. It should:

- Define the difference between **astronomy** (the geometry of the sky — measurable, predictive, falsifiable) and **astrology** (the human practice of assigning meaning to that geometry — interpretive, traditional, not falsifiable in the scientific sense).
- State the Academy's stance plainly: *we teach the astronomy literally and the astrology in the tradition it came from.* That's the honest version of the current "physical machine" tagline, and it loses none of the brand confidence.
- Name the traditions you draw from (Hellenistic, modern psychological, modern mundane). One paragraph each. Without this, every classical term in the curriculum (benefic, malefic, dignity, rulership, lots, angles) is effectively unsourced.
- Set expectations: *"The signs and aspects you'll learn here are interpretive frameworks with ~2,000 years of practitioner refinement. We present them as a coherent system, not as scientifically proven causes."* That sentence, once written, costs you nothing and earns you the right to teach with confidence everywhere else.
- Provide the single-page glossary (see 1.4).

### 1.3 The credibility model — the "two voices" rule

Adopt a written editorial rule and apply it page-by-page:

| Voice | When to use it | Example |
|---|---|---|
| **Astronomy voice** — declarative, measured, sourced | Anything geometric: positions, longitudes, angles, the Moon's 27.3-day sidereal cycle, why eclipses happen, why the zodiac is 30°-wide bands of ecliptic longitude. | "The Moon completes one orbit relative to the stars in **27.3 days** (sidereal month)." |
| **Astrology voice** — traditional, interpretive, attributed | Anything symbolic: rulerships, dignity, benefic/malefic, house meanings, aspect meanings. | "In the **Hellenistic tradition**, Venus and Jupiter are called 'benefics' — planets whose effects were considered favorable." |

The rule: *every interpretive claim gets attributed to a tradition or to the product's voice, never to "the cosmos."* Today's pages constantly say things like *"the Moon is what you need to feel safe"* and *"this city changes you in a specific, predictable way"* in the same authoritative register as factual claims about angles. That's the conflation that costs trust.

This rule does **not** require boring the prose. It requires one phrase added per claim: *"Traditionally,…" / "In the Hellenistic system,…" / "In our reading,…" / "Many modern astrologers describe…"* — these are cheap and they buy enormous credibility.

### 1.4 A single shared glossary

Roughly 30 terms appear across the curriculum without first-use definitions:

> **Sky terms:** ecliptic, zodiac, constellation, longitude (celestial vs. terrestrial), declination, ascendant (ASC), descendant (DSC), midheaven (MC), imum coeli (IC), angle, cusp, degree, orb, transit, glyph.
>
> **Chart terms:** natal chart, sign, house, planet, luminary, aspect, conjunction/sextile/square/trine/opposition, modality (cardinal/fixed/mutable), element (fire/earth/air/water), dignity, rulership, domicile, exaltation, detriment, benefic/malefic.
>
> **Place terms:** astrocartography, geodetic, mundane.

Build one `/learn/glossary` page (or a sticky right-rail panel). Every time a term first appears in any topic page, link the term to the glossary entry. This is more useful than re-defining inline in every page (which doubles content and creates inconsistency).

### 1.5 The reader-persona test

Every page should pass this test before shipping: *"Could a smart 25-year-old who has never looked at an astrology chart get to the bottom of this page without opening another tab to look something up?"*

Today, **none** of the nine pages pass this test. The fix is mostly: define-on-first-use, link-to-glossary, name-the-tradition, add-one-worked-example.

---

## Part 2 — Page-by-page rewrites

For each page: **what it is now**, **what's broken**, **what to keep**, **what to change**. Treat this as a brief for whoever does the rewrite.

### Module 0 · Start Here *(new page)*

**Goal:** earn trust in 4 minutes. Set the worldview, the sourcing, and the path.

**Sections:**
1. Astronomy vs. astrology — what each one is, what each one isn't.
2. The traditions we teach from (Hellenistic, modern psychological, mundane). One short paragraph each, with one named source per tradition (e.g., Chris Brennan's *Hellenistic Astrology* for the classical lineage; Liz Greene / Dane Rudhyar for modern psychological; Charles Carter / Nick Campion for mundane). One source per paragraph is enough — it transforms the credibility profile of the entire site.
3. How to read this Academy — module structure, ~6 min/lesson, glossary linked everywhere.
4. What astrology cannot do — the honesty paragraph. *"This won't predict lottery numbers, diagnose illness, or replace therapy. What it can do is give you a vocabulary for self-observation that has been refined for two millennia."*
5. CTA: "Start with Lesson 1 →"

---

### Lesson 1 · Viewing the Stars  *(currently the weakest stub)*

**What it is now:** 57 lines. Two headings ("Watch the Moon," "Learn Your Transits"), 2–3 sentences each. Outro pushes the user to `/dashboard`. Reads like a placeholder.

**What's broken:**
- It's filed as "practical application" but teaches no practice. "Notice your emotional weather" is not actionable.
- The hero claims *"astrology is a live event happening above you right now"* and then teaches nothing about what's actually overhead.
- It ends the curriculum (currently). For a 101 reader, this should *open* the curriculum.

**Reframe:** This becomes **Lesson 1 — astronomy first.** Before any signs or houses, teach the reader to literally look up.

**New structure:**
1. **What's overhead right now** — the ecliptic explained with a diagram. The plane of the solar system, traced across the sky. This single concept anchors everything that follows.
2. **The two lights** — Sun and Moon. Why they move differently. Solar day vs. sidereal day, in plain language.
3. **The wandering stars** — what "planet" originally meant (Greek *planētēs* = wanderer). The five visible to the naked eye. Why the outer three (Uranus, Neptune, Pluto) entered the system later and what that means for tradition.
4. **The Moon as your training wheel** — the Moon changes signs every ~2.3 days. This is the easiest cycle to feel. Suggest one concrete practice: note the Moon's sign each morning for 28 days.
5. **What a "transit" actually is** — define cleanly: a planet currently in the sky forming an angle to a planet's position in your birth chart. Worked example.
6. CTA: → Lesson 2 (The Zodiac).

**Voice:** mostly astronomy voice. This page earns the curriculum the right to be poetic later by being precise here.

---

### Lesson 2 · The Zodiac

**What it is now:** 67 lines. Static grid of 12 cards, one per sign, with date range, modality tag, and a sophisticated 100-word paragraph each. Descriptions are good but heavy on psychological vocabulary ("shadow," "psyche," "modality") that hasn't been introduced.

**What's broken:**
- Hero says *"the 'how' of astrology"* and *"the modality through which planetary energy is expressed"* — both phrases use jargon as if it were plain English.
- The modality system (Cardinal / Fixed / Mutable × Fire / Earth / Air / Water) is named in tags but never explained on the page. A first-time reader sees "Cardinal Earth" and has no anchor.
- Date ranges are given without explaining *why* those dates (tropical zodiac vs. astronomical constellation positions — see Constellations note below).
- Inconsistent shadow/gift/practice framing across the 12 cards.

**Keep:** the dense, sophisticated per-sign descriptions. They are the strongest writing in the curriculum.

**Add:**
- A **two-paragraph opener** before the grid: (1) the zodiac is a 360° band of ecliptic longitude divided into twelve 30° sectors; (2) signs ≠ constellations. They shared origin ~2,000 years ago and have since drifted apart due to precession. Acknowledging this *once* defuses the most common skeptic objection and earns trust.
- A **modality primer** before the grid: a 3×4 table showing the 12 signs as the intersection of (Cardinal/Fixed/Mutable) × (Fire/Earth/Air/Water). One-line definitions for each modality and element. Now the tag "Cardinal Earth" means something.
- **Standardize the per-card structure** to: keyword · modality · season · gift · shadow · one-line practice. Apply uniformly to all 12.

**Voice:** astrology voice, but with the astronomy footnote up front.

---

### Lesson 3 · The Constellations  *(currently a stub)*

**What it is now:** 115 lines, mostly decorative animated SVG dot-patterns. 1–3 sentences per constellation. Index card promises "deep sky geometry and the mythology of the stars" — the page delivers neither geometry nor mythology, just one-line vibes.

**What's broken:**
- Doesn't answer the obvious 101 question: *"Wait — are constellations the same as zodiac signs?"* (Answer: no, and the difference is the precession of the equinoxes, which is the single most interesting astronomy fact in the curriculum.)
- Cites *"88 modern constellations recognized by astronomy"* once, then teaches only 12. A reader is left wondering why.
- The mythology promised in the index is absent — there's no Greek/Babylonian/Egyptian context, just adjectives.

**What to teach (explicitly 101):**
1. **Constellations are real, signs are calendrical.** A constellation is a star pattern; a sign is a 30° slice of ecliptic longitude. They share names because the signs were named after the constellations behind them around 100 BCE.
2. **Precession** — the ~26,000-year wobble of Earth's axis. The signs and the constellations have since drifted by roughly one full sign. Today the Sun is "in Aries" (sign) for the first month of spring, but visually rises against the stars of Pisces. This is the most important astronomy fact in the curriculum and currently goes unmentioned.
3. **Tropical vs. sidereal zodiac.** Western astrology uses the tropical zodiac (anchored to the equinoxes); Vedic uses the sidereal (anchored to the stars). One paragraph; name both.
4. **The 12 constellations as star patterns** — keep the SVG drawings, but pair each with: brightest star (with magnitude), approximate distance in light-years, the myth (Greek and one non-Greek where possible), best month to spot from northern + southern hemispheres.
5. **Briefly: the other 76 constellations.** Why they exist, how the IAU codified them in 1922.

**Voice:** astronomy voice throughout. This is the page where the science genuinely shines — let it.

---

### Lesson 4 · The Natal Chart

**What it is now:** 601 lines. The longest and most ambitious page. Walks through a worked example (Jakarta, 1988-08-17) covering all ten planets with sign · house · dignity · description.

**What's broken:**
- Strong assumption that the reader knows what a sign, a house, a dignity, an aspect, a conjunction, an orb, and a glyph are. With the curriculum reordered, signs and modality are now established; houses come *next*, but this page references them.
- Tonal whiplash: opens with *"a photograph of the sky"* (lovely, accurate) then immediately drops *"DOMICILE,"* *"8th house,"* *"conjunct Saturn."*
- The aspect legend at the top (Trine/Square/Opposition/Conjunction) is shown as decoration before aspects have been introduced.
- Every claim is in unsourced authoritative voice.

**Keep:** the worked example structure. Concrete birth data is the right pedagogical move — beginners learn faster from one chart than from ten abstractions.

**Change:**
- Open with **what a chart literally is**: a 2D projection of the 3D sky at one moment from one location, viewed from inside Earth looking out. A diagram of the projection is worth more than a paragraph.
- Replace the aspect legend at the top with a "you'll meet aspects in Lesson 6" pointer. Don't preview content the reader can't yet use.
- For houses, write: *"Houses divide the sky into 12 sectors based on the horizon at your birth location. We'll cover them in detail in the next lesson — for now, treat 'house' as 'a life-area where this planet's themes show up.'"* One sentence buys the right to use the word.
- Apply the **two-voices rule** to every planet section. *"Traditionally, Mars governs ___."* / *"In our reading of this chart, Mars in Cancer means ___."* / *"Astronomically, Mars takes ~687 days to orbit the Sun."*
- Add a **chart legend / how-to-read-the-wheel** sidebar: glyphs, the order of houses, which way the chart is read (counterclockwise from the ASC).
- Cut or move the dignity tags ("DOMICILE," "EXALTATION") to a side panel until Lesson 7 — they're meaningless on first encounter.

---

### Lesson 5 · The 12 Houses

**What it is now:** 507 lines. Twelve houses with keyword · ruling domains · natural sign · natural ruler · description. Plus a thoughtful "Applied Astrology" section ("Empty House Myth," "Follow the Landlord," case study).

**What's broken:**
- Hero claims houses are *"physical geometry"* — partially true, but the page never shows the geometry. A diagram of the wheel divided by horizon and meridian would do the work the prose can't.
- Doesn't acknowledge that **multiple house systems exist** (Placidus, Whole Sign, Equal, Koch, etc.). For a "first principles" curriculum this is a credibility gap; one paragraph naming the systems and stating which one Astronat uses (and why) is essential. This is *the* most-debated topic in modern astrology and the page is silent on it.
- "Natural sign" and "natural ruler" are introduced without explanation. They're shorthand for the house-sign correspondence (1st = Aries = Mars, etc.) but the reader doesn't know that.
- The "Landlord" metaphor in the Applied section is excellent — promote it earlier.

**Keep:** the Applied Astrology section in full. It's the strongest "how do I actually use this" content in the entire curriculum. Promote its visibility.

**Change:**
- Open with the **geometry diagram**: horizon (ASC/DSC) + meridian (MC/IC) divide the sky into four quadrants; each quadrant subdivides into three houses. Show this. Stop telling.
- Add a **"which house system?"** paragraph. Name three (Placidus, Whole Sign, Equal). State Astronat's choice. Link to a deeper essay if one exists.
- Standardize each house card: number · keyword · life domain · natural sign · ruling planet · short interpretation · one example "if your X is here, expect Y."
- Move the case study (Alex's career) earlier — it's currently the reward at the end. It should be the model the reader watches you build.

---

### Lesson 6 · Planetary Aspects

**What it is now:** 426 lines. Intro + five major aspects (Conjunction, Sextile, Square, Trine, Opposition), each with a substantial paragraph and a scrolling animated wheel.

**What's broken:**
- Opens with *"Imagine two people in a room"* — good. Then immediately uses *"angular relationships between planets in your chart"* without anchoring "angular" geometrically. A 30-second visual of a circle with the five angles drawn would carry it.
- "Major aspect" is labeled but the existence of **minor aspects** (semi-sextile, quintile, sesquiquadrate, etc.) is never acknowledged. State that these exist, that they're outside scope, and why. Otherwise the reader wonders if "five" is the whole story.
- **Orbs are never explained.** An aspect is rarely exact; tradition allows a tolerance ("orb") of usually 6–10° depending on the aspect and the planet. This is genuinely first-principles material and it's missing.
- Internal contradiction in the Trine description, flagged by the audit: gifts arrive automatically *and* must be forced into use. Resolve in one sentence.

**Keep:** the scrollytelling design and the metaphors (open door, contractor, tug-of-war). They work.

**Change:**
- Add a **geometry primer** at the top: a 360° circle with the five angles overlaid (0°, 60°, 90°, 120°, 180°). Label each.
- Add an **"orbs"** sub-section. One paragraph, one example.
- Add an **"aspects we don't cover"** footnote naming the minors and pointing to a future lesson.
- Apply two-voices rule: *"In Hellenistic astrology, the square is called a 'tetragon' and was considered a hard aspect because it joins signs of different elements and the same modality."* That kind of sentence costs nothing and is worth the world.

---

### Lesson 7 · The Great Divide (Benefics / Malefics)

**What it is now:** 363 lines. Four planets (Venus, Jupiter, Mars, Saturn) categorized as Lesser/Greater Benefic/Malefic. Strong contractor metaphor.

**What's broken:**
- The terms "benefic" and "malefic" are **Hellenistic** — and that fact is never named. This is the most obviously-classical material in the curriculum, and it's presented in product voice as if Astronat invented it. Crediting the tradition costs nothing and gains everything.
- The category covers four planets (Venus, Jupiter, Mars, Saturn) but says nothing about the others. Mercury is traditionally **neutral** ("benefic when with benefics, malefic with malefics"); the Sun and Moon are luminaries, not classified; the outers (Uranus, Neptune, Pluto) postdate the tradition entirely. Without saying this, the system feels incomplete and arbitrary.
- The page heading-vs-tagline mismatch the audit flagged ("Benefics vs Benefics") is a copy bug.
- Concept of **dignity** (where a planet is strong vs. weak — domicile, exaltation, detriment, fall) is not introduced here, but should be. It's the natural extension of "this planet helps" and the natal chart page already uses the word.

**Keep:** the four planet portraits.

**Change:**
- Open with a one-paragraph **history**: "These categories come from Hellenistic astrology (~1st century BCE through 7th century CE). They were systematized in texts like Vettius Valens' *Anthologies* and Ptolemy's *Tetrabiblos*. Modern astrology has reinterpreted but not replaced them."
- Add the **complete picture**: a small table — Venus & Jupiter (benefic), Mars & Saturn (malefic), Mercury (neutral), Sun & Moon (luminaries), outer planets (post-classical, generally treated as transpersonal). Now the system is closed.
- Introduce **dignity** as a sub-section: *"A planet's strength varies by sign. Tradition gives each planet a 'home' (domicile), a 'best fit' (exaltation), and their opposites (detriment, fall)."* One small reference table. This single addition unlocks everything in the natal chart page.
- Resolve the outro contradiction the audit flagged ("you need both" vs. "balance is required"): pick one frame.

---

### Lesson 8 · Astrocartography

**What it is now:** 384 lines. Four planet/angle examples (Pluto DSC, Moon DSC, Sun IC, Jupiter ASC) for one chart, each with distance from a target city, an "importance" rating, and an interpretation. Includes orbs (<200/1000/2000 km).

**What's broken:**
- The biggest problem: the page **claims a city "changes you in a specific, predictable way"** — predictive language that the system can't honor. Soften to traditional/interpretive voice. *"Astrologers since Jim Lewis (who systematized this technique in the 1970s) have associated proximity to a planet's line with intensification of that planet's themes in life there."* Crediting Lewis costs nothing and is true.
- **The geometry is asserted, never shown.** A planet's "line" is the locus of points on Earth where that planet was on a given angle (ASC/MC/DSC/IC) at the moment of birth. This is genuinely beautiful math and it's currently invisible. A diagram + one paragraph would carry it.
- The 200/1000/2000 km orb thresholds appear without justification. State that these are convention (varying by practitioner) and which convention Astronat uses.
- Says "40+ lines" exist (10 planets × 4 angles) but only teaches 4. Show the full list, even if you don't interpret all of it.
- Reuses jargon from the Natal Chart page (8th house, conjunct Saturn) without anchoring.

**Keep:** the use of one concrete worked chart. Excellent pedagogy.

**Change:**
- Open with the **mechanism**: define a planet's line geometrically, in two sentences. Show it.
- **Attribute the technique** to Jim Lewis (1970s).
- Replace "specific, predictable way" with "the regions astrologers have traditionally associated with…"
- Add a **"all 40 lines" reference table** even if collapsed by default.
- State Astronat's orb convention explicitly.

---

### Lesson 9 · Geodetic Astrology

**What it is now:** 371 lines. Maps the zodiac onto Earth's longitudes, anchoring 0° Aries to Greenwich, then 30° per sign east. Twelve zone descriptions. Outro: *"This isn't mysticism — it's geometry."*

**What's broken:**
- The outro line is the credibility crisis of the curriculum in miniature. The longitude-to-degree mapping *is* geometry. The claim that this mapping causes character traits in cities is *not* geometry — it's interpretive astrology and needs to be named as such. Right now the page uses geometric framing to launder a metaphysical claim. Fix: keep the geometry assertion for the *mapping*, but switch to traditional voice for the *meaning*.
- **No history.** Geodetic astrology has multiple competing systems (Sepharial 1925, Powell, Johndro, the Greenwich-anchored system used here). Naming this is the difference between "we made this up" and "we're using one of three established systems."
- **Choice of Greenwich is non-obvious.** Greenwich became the prime meridian by international convention in 1884. Anchoring 0° Aries to it is a 20th-century convention, not an ancient one. A 101 reader should know this.
- The strict claim *"the same zodiac zone shapes London regardless of when you were born"* needs the same interpretive softening as Lesson 8.

**Keep:** the longitude-band visualization is conceptually elegant.

**Change:**
- Open with **the history**: where the technique comes from, who proposed alternative anchorings (Sepharial vs. Greenwich-anchored modern systems).
- State Astronat's chosen system **and why**.
- Replace the "isn't mysticism — it's geometry" outro with something like: *"The mapping is geometric. The interpretation is a tradition. Both are useful; they are not the same kind of claim."* This sentence is the spine of the entire credibility fix and could appear, in some form, on every page.

---

## Part 3 — Credibility infrastructure

These four small additions, applied across every page, do more than any single rewrite:

1. **Sources panel.** Each page ends with a "Further reading" block: 2–4 books or papers. Even one named source per page (Brennan, Greene, Rudhyar, Lewis, Carter, Campion, Hand, George) transforms the perceived rigor of the curriculum.
2. **Tradition tag.** A small chip near each major section: `Hellenistic` · `Modern Western` · `Mundane` · `Astronomy`. The reader instantly sees what kind of claim they're about to read.
3. **"Last reviewed" date per page.** Move the curriculum-wide "Updated April 14, 2026" off the index and onto each page individually.
4. **A standing disclaimer in the footer of every Academy page.** One sentence: *"Astrology is an interpretive tradition, not a scientific theory. We teach it as a coherent symbolic system with deep historical roots."* This sentence buys you the right to write everything else with full poetic confidence.

---

## Part 4 — Visual & UX consistency

The audit flagged real UX inconsistency: Aspects, Constellations, and Malefic/Benefic use scrollytelling; Zodiac is a static grid; Houses is hybrid; Viewing the Stars is essentially a hero. Pick a default pattern per content type and apply it uniformly:

- **Reference / glossary content** (Zodiac, Constellations, Houses): **structured grid + table**, no scrollytelling.
- **Sequential teaching** (Aspects, Malefic/Benefic, Natal Chart walkthrough): **scrollytelling** is great, keep it.
- **Mechanism / how-it-works** (Astrocartography, Geodetic, Viewing the Stars): **diagram-led**, with the diagram as the primary teaching artifact, not decoration.

Add globally:
- **Module / Lesson chip** at the top of every page (`Module 2 · Lesson 4`).
- **Estimated reading time.**
- **Previous / Next** at the bottom.
- **Glossary popovers** on first use of every defined term.
- **Tradition chip** on every major section (see Part 3).

---

## Part 5 — Phased rollout

A staged plan so this doesn't all have to ship at once.

**Phase 1 — credibility floor** *(low effort, high trust gain)*
1. Write Module 0 (Start Here).
2. Build the glossary.
3. Add the standing footer disclaimer to every page.
4. Add tradition chips and the "last reviewed" date per page.
5. Reword the 6–8 highest-risk overclaims (e.g., *"specific, predictable way,"* *"isn't mysticism — it's geometry,"* *"absolute astronomical authority"*).

**Phase 2 — restructure** *(medium effort, fixes the on-ramp)*
1. Re-order the index into three modules with explicit numbering.
2. Add Previous/Next nav.
3. Rewrite Viewing the Stars as Lesson 1 (currently the worst stub, becomes a foundational page).
4. Rewrite Constellations to include precession, tropical vs. sidereal, and real myth/star data.

**Phase 3 — depth pass** *(higher effort, biggest payoff)*
1. Natal Chart: add the projection diagram, apply two-voices rule, move dignity to sidebar.
2. Houses: add the geometry diagram and the "which house system" paragraph; promote the case study.
3. Aspects: add geometry primer, orbs section, minor-aspects footnote.
4. Malefic/Benefic: add Hellenistic attribution, complete the planet picture, introduce dignity.
5. Astrocartography & Geodetic: add mechanism diagrams, attribute to Lewis / Sepharial, soften predictive claims.

**Phase 4 — visual consistency pass**
1. Standardize the per-page chrome (chips, nav, glossary popovers).
2. Pick the default pattern per content type and apply it.
3. Final editorial sweep against the reader-persona test.

---

## Part 6 — One-paragraph editorial principles

For whoever sits down to write the rewrites, here are the rules in one screen:

> Write to a smart 25-year-old who has never opened an astrology book. Define every term on first use; link every defined term to the glossary. Distinguish two voices: **astronomy voice** for anything geometric or measurable (declarative, sourced) and **astrology voice** for anything interpretive (attributed to a tradition or to "our reading"). Never let interpretive claims wear astronomical clothing. Cite at least one named human source per page. Lead with the diagram when teaching mechanism. Lead with the worked example when teaching application. Keep the poetic register — but earn it by being literal first. End every page with: *what you just learned*, *what comes next*, and *further reading*.

---

## Appendix A — The promise vs. the delivery (current state)

The index page sets these expectations:

> *"Sacred Intelligence."*
> *"We don't just read charts; we teach you how the cosmos operates as a physical machine."*
> *"Master the first principles of the stars through our high-fidelity guides."*
> *"Statically shared, mathematically sound, and visually premium. No generic horoscopes — just absolute astronomical authority."*

Against the actual content:

| Promise | Reality | Gap |
|---|---|---|
| "Physical machine" | Mostly interpretive, no mechanism shown | Add diagrams; switch to two-voices rule |
| "First principles" | No on-ramp, jargon used unintroduced | Add Module 0 + glossary |
| "Mathematically sound" | Math implied (orbs, distances) but never derived | Add geometry diagrams to Aspects, Astrocartography, Geodetic |
| "Astronomical authority" | Astrology taught in product voice with no sources | Cite traditions and named authorities per page |
| "High-fidelity guides" | Two pages are stubs (Constellations, Viewing the Stars) | Promote Viewing to Lesson 1; rewrite Constellations |

Closing this gap is what this plan is for.

---

## Appendix B — Source recommendations (one named work per topic)

Even mentioning one of these per page is a credibility transformation. None require you to agree with them — they're the lineage you're writing inside of, and acknowledging the lineage is what makes the writing trustworthy.

- **Foundations / Hellenistic:** Chris Brennan, *Hellenistic Astrology: The Study of Fate and Fortune* (2017).
- **Natal & psychological:** Liz Greene, *Saturn: A New Look at an Old Devil* (1976); Stephen Arroyo, *Astrology, Psychology, and the Four Elements* (1975).
- **Houses & technique:** Robert Hand, *Horoscope Symbols* (1981); Deborah Houlding, *The Houses: Temples of the Sky* (1998).
- **Aspects:** Sue Tompkins, *Aspects in Astrology* (1989).
- **Astrocartography:** Jim Lewis, *The Psychology of Astro*Carto*Graphy* (1992).
- **Mundane / geodetic:** Nick Campion, *The Book of World Horoscopes* (1988); Charles Carter, *An Introduction to Political Astrology* (1951).
- **Astronomy (so the astronomy claims are sourced too):** any current edition of the *Astronomical Almanac* (USNO/HMNAO); Jean Meeus, *Astronomical Algorithms* (2nd ed., 1998).

---

*End of plan. Implementation deferred pending alignment.*
