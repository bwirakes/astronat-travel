---
name: astro-editorial
description: Audit and tighten Astronat editorial views (couples reading, /reading/[id] pages, dashboards, long-form spreads) for Monocle-grade visual hierarchy, scan order, contrast, and information density. Use when reviewing visual clarity, asking "what's still weak", "why does this feel flat", "make this scan better", or after a styling pass to verify hierarchy holds. Pairs with `astro-design` — that skill covers tokens, fonts, palette; this one composes information density and scan order with those tokens. Returns a prioritized fix list mapped to existing `globals.css` vars.
---

# Astro Editorial Hierarchy

Pairs with `astro-design` (tokens & vibe). That skill answers *what colors / fonts / shapes are available*. This skill answers *how to compose them so the eye lands on the right thing first*.

**Monocle, in two lines:** generous whitespace + tight type discipline + colored hairlines + uppercase mono kickers + serif scores + editorial cadence over SaaS density. The page should *scan* before it *reads*.

---

## Principles (load-bearing)

1. **Number tier is monotonic by importance.** Hero score (largest) > section verdict > item score > supporting label > kicker. If a section-level number renders at item scale, fix it.
2. **Demote derived metrics.** Δ, average, ratio, total — render visibly smaller than the values they're computed from. A small chip *between* primaries, not a third equal column.
3. **Parallel structures need one instant tone cue.** When two columns / cards stand side-by-side (Harmonious | Tense, YOU | PARTNER, Best | Avoid), the eye must know which side it's on without re-reading the kicker. A 2px left border in the column accent is the cheapest tool that works.
4. **Body prose lives at `--text-primary`.** Not `--text-secondary` (that's for kickers and labels). `lineHeight ≥ 1.7`. **No italics, ever** — italic body type is harder for ESL/dyslexic readers. Bold only the literal takeaway; for list items, bold the first 2–4 words to anchor the scan.
5. **Data viz needs physical weight.** Bars below ~12px feel like underlines. Tiny mono numerics ("ORB 2.4°") at row edges are invisible — replace with a 3-dot tightness scale or visual indicator, keep the numeric beside it.
6. **One signal per active state.** Tab bars / selectors that change three things at once (border color + bg fill + weight bump) read as noisy and the inactive state often looks active. Pick one strong signal.
7. **Cards beat hairlines for multi-line list items.** Subtle bg tint + `--radius-xs` + `--space-lg` padding signals "one complete thought." Hairlines only work for short single-line rows.
8. **Color is semantic, not decorative.**
   - `--sage` → positive / good (peak, harmonious)
   - `--color-spiced-life` → caution / friction (tense, hard)
   - `--gold` → warning / significant gap (Δ ≥ 15)
   - `--color-y2k-blue` → "you" / primary identity
   - `--color-acqua` → neutral / mixed
   Deploy these for *identity across sections*, not random tints.
9. **Whitespace tier is consistent.** Chapter `clamp(56–88px)` > section `clamp(28–48px)` > subsection `var(--space-lg)` > row `var(--space-md)` > inline `var(--space-sm)`. Mixing breaks rhythm.
10. **Never use generic SaaS shadow drops or `rounded-md`+ on editorial cards.** Stick to `--radius-xs` (4px) or `--radius-sm` (8px) max. Beyond that, use the asymmetric / cut shapes from `astro-design`.

---

## Font job assignment

| Job | Token | Notes |
|---|---|---|
| Scores, hero numerics, takeaway sentences | `var(--font-primary)` | Perfectly Nineties serif |
| Section / item titles, h1–h3 | `var(--font-primary)` | Same family, different scale |
| Body prose, AI leads, notes | `var(--font-body)` | Garet at weight 300, never weight 400+ for prose |
| Kickers, labels, `/100`, ORB, dates-as-label | `var(--font-mono)` | IBM Plex, `letter-spacing: 0.18–0.22em`, uppercase |
| Decorative drop caps, oversized overlays | `var(--font-display-alt-1/2)` | Monigue / Pinyon — magazine moments only |

**Common mistakes:**
- Putting body prose in `--font-primary` — feels grand but reads as a wall.
- Putting a score in `--font-body` — flattens the hierarchy.
- Mono used for body sentences — illegible at long form.

---

## Audit method (3 steps)

1. **Walk top-to-bottom.** For each section, trace where the eye lands first → second → third. Mark each mismatch against the importance order.
2. **Categorize each finding** — number-tier bug / parallelism missing / data-viz too thin / contrast too low / signal too noisy / cards-vs-hairline mistake. Categories help the user batch fixes.
3. **Map fixes to tokens.** Every recommendation references an existing `--space-*`, `--color-*`, `--text-*`, `--radius-*` var. If the fix needs a value not in the token set, flag it — the token system is the constraint.

---

## Output format

Numbered list, top-to-bottom. For each finding:

- **§ Section name** — one-sentence diagnosis (the hierarchy bug, not a generic complaint).
- **Why** — what the eye does today vs what it should do, in one sentence.
- **Fix** — concrete CSS / structural move with token names. No "consider", no "could perhaps". Name the move.

End with a **top-3 priority cut**: cross-cutting items (number tier, derived-metric demotion, contrast) over leaf-level polish.

### Worked example

> **§02 Verdict header** — section-level score renders as a single 0.62rem mono caps line ("MIXED · 47/100") next to its rationale.
> **Why** — the eye lands on the rationale first; the verdict score, which should anchor the section, reads as a kicker.
> **Fix** — replace the mono caps line with a hero-style chip: `var(--font-primary)` at `clamp(2rem, 3.6vw, 2.8rem)` in `timings.accent`, then mono `/100` in `--text-tertiary`, then a verdict pill (`5px 12px`, `border-radius: 9999px`, border in accent, bg in `color-mix(in oklab, accent 6%, transparent)`) pushed right with `marginLeft: auto`.

---

## Common moves (cookbook)

- **Demote a derived metric** — `gridTemplateColumns: "1fr auto 1fr"`. Middle column = small chip: mono `Δ` kicker → outlined pill with the number → `APART` sub-kicker. No dividers (the chip *is* the connector).
- **Section-level score chip** — `clamp(2rem, 3.4vw, 2.6rem)` primary in accent + mono `/100` in tertiary + verdict pill on the right.
- **Score-wins-the-row in cards** — date becomes mono kicker on the left (`0.7rem`, `--text-secondary`, `letter-spacing: 0.18em`, uppercase); score promotes to ~`1.5rem` primary in column accent on the right.
- **Row left-edge accent** — `borderLeft: 2px solid {accent}` + `padding-left: var(--space-md)`. Two parallel columns instantly differentiate.
- **Body contrast bump** — `--text-secondary` → `--text-primary`, `lineHeight: 1.6 → 1.75`. Apply to all body paragraphs (lead, notes, meaning, summary). In light mode these tokens are equal so the visible delta is dark-mode only — but always set primary so dark mode is legible.
- **Bar height** — `6px → 14px` with `1px solid var(--surface-border)` frame and `borderRadius: 2`. Trough tinted `color-mix(in oklab, var(--surface-border) 70%, var(--bg))`.
- **Card container** — `background: color-mix(in oklab, var(--surface-border) 28%, var(--bg))`, `borderRadius: var(--radius-xs)`, `padding: var(--space-lg)`, `gap: var(--space-md)` between cards. Drop hairlines.
- **3-dot tightness scale** — row of three 7×7px circles, filled count maps to thresholds, fill in column accent, numeric in mono `0.65rem` next to it.
- **Promoted list indices** — `clamp(1.4rem, 2vw, 1.8rem)` primary in `--color-y2k-blue` at `font-weight: 500`. Trios feel like chapter markers, not bullet labels.
- **Markdown bold renderer** — supply a small `RichText` component that splits on `\*\*([^*]+)\*\*` and renders matched segments as `<strong style={{ fontWeight: 700, color: 'var(--text-primary)' }}>`. Defensively strip `*italic*` / `_italic_` markers before rendering.
- **AiLead chunking** — split string children on `\n\n` and render each as a separate `<p>` with `gap: var(--space-md)`. Lets the model author multi-paragraph leads instead of dense walls.
- **Sentence discipline (ESL floor)** — average 10–15 words, hard cap 22. Drop-cap openers under 14 words because the floated capital slows parsing. These are prompt rules, not view rules — codify in the AI prompt for the section.

---

## Out of scope

- Copy / voice / tone — different concern.
- Brand identity (palette, fonts, logos) — that's `astro-design`.
- Information architecture (what content goes where).
- Accessibility / focus rings / ARIA / contrast ratios.
- Mobile-specific responsive bugs — audit those separately.

If asked for code: deliver as targeted edits, not a rewrite. The audit is the value; large rewrites destroy the surrounding work.
