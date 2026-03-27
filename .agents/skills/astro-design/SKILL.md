---
name: astro-design
description: Frontend design skill for Astronat, ensuring all web components adhere to the specific "Astro-Brand" strategy (Y2K, 90s, Aquarian values, creative authority).
license: Complete terms in LICENSE.txt
---

# Astro-Brand Frontend Design Skill

This skill guides the creation of distinctive, production-grade frontend interfaces for Astronat that embody the bold, retro-futuristic, and editorial Astro-Brand aesthetic.

## Design Thinking

Before coding, understand the core aesthetic:
- **Tone**: "I'm baby tattooed humblebrag mustache vinyl la croix keytar 90's ascot vexillologist 8-bit dreamcatcher. Poutine VHS yr quinoa direct trade, live-edge fit tilde hexagon asymmetrical hashtag banh mi vibecession."
- **Vibe**: 90s editorial photography vibe, Aquarian values, creative authority, high contrast, stark backgrounds, neon pop, Y2K tech.

Then implement working code that is:
- Production-grade and functional
- Visually striking and inherently "Astrological-Y2K"
- Cohesive with the `app/globals.css` design tokens

## Frontend Aesthetics Guidelines

### 1. Typography
Use the exact CSS variables provided:
- Primary/Display: `var(--font-primary)` ('BETTER DAYS')
- Secondary/Serif: `var(--font-secondary)` ('PERFECTLY NINETIES')
- Body: `var(--font-body)` ('GARET')
For stylistic flourishes, employ `var(--font-display-alt-1)` ('MONIGUE') or `var(--font-display-alt-2)` ('SLOOP SCRIPT').

### 2. Color & Theme
Rely on the Astro-Brand palette:
- Charcoal: `var(--color-charcoal)` (#1B1B1B)
- Y2K Blue: `var(--color-y2k-blue)` (#0456fb)
- Acqua: `var(--color-acqua)` (#CAF1F0)
- Black: `var(--color-black)` (#000000)
- Eggshell: `var(--color-eggshell)` (#F8F5EC)
- Spiced Life: `var(--color-spiced-life)` (#E67A7A)

Create stark, high-contrast layouts. Prefer Eggshell backgrounds with Charcoal/Black text, or pitch-black backgrounds with Eggshell text.

### 3. Spatial Composition
Use bold, unexpected layouts. Implement overlaps, distinctive asymmetry, strong framing, and an editorial magazine layout feel. Stay away from generic grid-based "SaaS" layouts.

### 4. Generative Imagery & Media
When UIs require images, avatars, or visual assets, **always proactively use the `generate_image` tool** (nano banana 2) rather than gray placeholders. Use the following prompting approach:
`"90s editorial fashion photography, high contrast film flash, stark backgrounds, retro vintage objects, bright neon accents alongside moody shadows."`

NEVER use generic AI aesthetics or cookie-cutter design components. Make it memorable, distinctive, and entirely unique to Nat H's Astro-Brand.
