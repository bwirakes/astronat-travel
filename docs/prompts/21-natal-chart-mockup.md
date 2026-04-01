# Prompt: Scroll-Animated Natal Birth Chart Mockup Page

## Overview
Create an interactive, scroll-driven mockup page at `/mockup-natal` that teaches a user how to read their natal birth chart by progressively revealing each planet's placement as they scroll. The overall aesthetic and interaction model should exactly match the ACG 101 mockup (`/mockup-acg`).

## Birth Data
- **Name**: Demo user
- **Born**: Jakarta, August 17, 1988, 10:15 PM WIB (UTC+7)
- **Zodiac**: Sun in Leo, Moon in Aquarius, Rising in Aries (example placements)

## Architecture & Technical Stack
Use the same proven architecture from the ACG mockup:

1. **`position: fixed` background** — A dark, premium chart wheel SVG stays pinned to the screen at all times. Do NOT use CSS `sticky` — it breaks with scroll-driven GSAP.
2. **Scrollable spacer sections** — Transparent `<section>` elements scroll over the fixed background. Each section represents 1 planet.
3. **Individual `ScrollTrigger` per section** — Each planet section has its own GSAP `ScrollTrigger` using explicit `onEnter` / `onLeave` / `onEnterBack` / `onLeaveBack` callbacks (NOT `toggleActions` which breaks on later sections).
4. **`gsap.set()` for initial state** — Set initial `autoAlpha: 0, y: 50` on cards. Do NOT use Tailwind `invisible` class (conflicts with GSAP `autoAlpha`).
5. **Line/element drawing with `strokeDasharray`/`strokeDashoffset`** — Animate SVG paths for house lines, planet glyphs, and aspect lines using scroll-scrubbed `strokeDashoffset`.

## Background: The Chart Wheel
The fixed background should be a dark, editorial-quality natal chart wheel SVG:
- 12 house segments radiating from center
- House numbers (1-12) labeled
- Zodiac signs around the outer rim
- Initially empty of planets — planets are added as you scroll
- Use the Astro-Brand color tokens (`var(--gold)`, `var(--sage)`, `var(--color-y2k-blue)`, etc.)
- Dark background matching `var(--color-black)`

## Scroll Sequence (All 10 Planets)
Each planet gets its own scroll section (`min-h-screen` with `py-20` padding). As the user scrolls into each section:

### Animation per planet:
1. **Planet glyph appears** in its correct house position on the chart wheel (fade + scale from center)
2. **Zodiac sign highlight** — the zodiac segment containing this planet briefly glows
3. **Explanation card slides in** from alternating sides (left/right) with:
   - Planet name + zodiac sign badge (colored)
   - House number + house theme (e.g., "7th House — Partnerships")
   - Dignity status (Domicile, Exalted, Detriment, Fall, Peregrine)
   - 2-3 sentence editorial description of what this placement means
   - Key themes as small tags

### Planet order (following traditional sequence):
1. **Sun** — Core identity, ego, life purpose
2. **Moon** — Emotions, instincts, inner world
3. **Mercury** — Communication, thinking, learning
4. **Venus** — Love, beauty, values, pleasure
5. **Mars** — Drive, ambition, conflict, energy
6. **Jupiter** — Expansion, luck, wisdom, abundance
7. **Saturn** — Discipline, structure, karma, limits
8. **Uranus** — Revolution, innovation, sudden change
9. **Neptune** — Intuition, dreams, spirituality, illusion
10. **Pluto** — Transformation, power, death/rebirth

### Planets remain visible
Once a planet appears on the wheel, it stays. By the end of the scroll, all 10 planets are visible on the complete chart.

## Critical GSAP Lessons Learned (from ACG mockup)
These are hard-won bugs that MUST be avoided:

1. **NEVER use `overflow-clip` or `overflow-hidden` on the scroll container** — this breaks `position: sticky` and can interfere with ScrollTrigger calculations.
2. **NEVER use a single GSAP timeline for the entire page** — individual `ScrollTrigger.create()` per section is far more reliable for long scroll sequences.
3. **NEVER use `toggleActions: "play reverse play reverse"`** — it causes cards after the first 2-3 to never appear. Use explicit `onEnter`/`onLeave`/`onEnterBack`/`onLeaveBack` callbacks instead.
4. **NEVER use Tailwind's `invisible` class with GSAP `autoAlpha`** — they conflict. Use `gsap.set(el, { autoAlpha: 0 })` in the useGSAP hook instead.
5. **Line drawing must use `fromTo`** — not just `to` — so that scrolling back re-hides the line correctly.
6. **Sections need `min-h-screen` not `min-h-[120vh]`** — the latter creates too much dead space on mobile. Use `py-20` for breathing room.
7. **Cards should use `bg-black/70 backdrop-blur-xl`** — ensures readability over ANY background.
8. **Use named constants for coordinates** (e.g., `const JAKARTA_X = 400`) — makes repositioning trivial.

## Design System (Astro-Brand)
- **Typography**: `font-primary` for headlines (uppercase, tight tracking), `font-body` for descriptions, `font-mono` for labels/badges
- **Colors**: Use CSS variables — `var(--gold)`, `var(--sage)`, `var(--color-spiced-life)`, `var(--color-acqua)`, `var(--color-y2k-blue)`, `var(--color-planet-mars)`, `var(--text-tertiary)`
- **Cards**: `rounded-2xl bg-black/70 border border-white/10 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]`
- **Badges**: `font-mono text-[10px] uppercase tracking-widest` with planet-colored borders
- **Glows**: Use CSS `drop-shadow` and `box-shadow` with planet-specific rgba colors

## Intro & Outro
- **Intro section** (1 screen): "Reading Your Birth Chart" hero text + "Born in Jakarta, August 17, 1988 at 10:15 PM" + brief explanation of what a natal chart is + "10 planets • 12 houses • Your cosmic blueprint"
- **Outro section** (1 screen): "Your Chart Is Complete" + summary of key placements + CTA button "Get Your Full Reading"

## Responsive Requirements
- Cards: `max-w-lg` with `px-6 md:px-12 lg:px-20`
- Chart wheel: Scale within viewport using SVG `viewBox` and `preserveAspectRatio="xMidYMid meet"`
- Text sizes: `text-sm md:text-base` for body, `text-4xl md:text-5xl` for planet headers

## File Location
Save as `app/mockup-natal/page.tsx` — use the same import pattern as the ACG mockup (Navbar, GSAP, ScrollTrigger, next/image).
