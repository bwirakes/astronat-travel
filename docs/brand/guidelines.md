# Astro-Brand Frontend Design System & Brand Guidelines

This document serves as the single source of truth for the Astro-Brand aesthetic. It translates the original brand PDF into actionable frontend guidelines and CSS tokens that any LLM/AI agent can reference to build cohesive, on-brand interfaces.

## 1. Core Brand Identity & "Vibe Check"
- **Tone**: "I'm baby tattooed humblebrag mustache vinyl la croix keytar 90's ascot vexillologist 8-bit dreamcatcher. Poutine VHS yr quinoa direct trade, live-edge fit tilde hexagon asymmetrical hashtag banh mi vibecession."
- **Aesthetic Pillars**: 90s editorial photography, Aquarian values, creative authority, maximalist retro-futurism.
- **Visual Style**: High contrast, stark backgrounds (Eggshell or Pitch Black), striking typography combinations, organic shapes, and neon pops against moody shadows.

## 2. Design Tokens (CSS Variables)

All tokens are implemented in `app/globals.css`. Do not hardcode these values; always use the CSS variables.

### Color Palette
- **Charcoal**: `var(--color-charcoal)` (`#1B1B1B`) -> Primary dark mode text / Light mode background
- **Y2K Blue**: `var(--color-y2k-blue)` (`#0456fb`) -> Primary brand accent, highly saturated
- **Acqua**: `var(--color-acqua)` (`#CAF1F0`) -> Soft pastel accent
- **Black**: `var(--color-black)` (`#000000`) -> Deepest background
- **Eggshell**: `var(--color-eggshell)` (`#F8F5EC`) -> Primary light mode background / Dark mode text
- **Spiced Life**: `var(--color-spiced-life)` (`#E67A7A`) -> Warm pastel pink/red accent
- **Neon Green (Sage)**: `var(--sage)` (`#00FD00`) -> High-contrast callout color

### Typography Structure
- **Primary / Display**: `var(--font-primary)` 
  - *Asset*: `BETTER DAYS`
  - *Usage*: Massive hero headers, loud structural text.
- **Secondary / Serif**: `var(--font-secondary)`
  - *Asset*: `PERFECTLY NINETIES`
  - *Usage*: Sub-headers, editorial pull-quotes.
- **Body**: `var(--font-body)`
  - *Asset*: `GARET`
  - *Usage*: All paragraph and utilitarian text.
- **Display Alt 1**: `var(--font-display-alt-1)`
  - *Asset*: `MONIGUE`
  - *Usage*: High-contrast stylistic serif overlap.
- **Display Alt 2**: `var(--font-display-alt-2)`
  - *Asset*: `SLOOP SCRIPT`
  - *Usage*: Expressive cursive overlaps, decorative drops.

## 3. Structural & Component Patterns

- **Overlapping Elements**: The brand heavily utilizes oversized typography (often cursive `SLOOP SCRIPT` or `MONIGUE`) placed absolutely to overlap photos or main text.
- **Color Differentiation**: Use stark background color blocks (Eggshell, Charcoal, Black) to break up sections. When placing cards or Ebooks next to each other, alternate their background colors natively to establish rhythm.
- **Flatness**: Avoid heavy box-shadows. Rely on solid 1px borders (`var(--surface-border)`) and harsh background contrast for depth.

## 4. Generative Imagery Strategy
When mock assets, avatars, or component photos are required, **always use the `generate_image` tool** (Nano Banana 2). 

**Base Prompt Architecture:**
`"90s editorial fashion photography, high contrast film flash, stark backgrounds, retro vintage objects, bright neon accents alongside moody shadows."`

*Examples:*
- "90s editorial photography, a person holding a vintage bright neon green rotary phone receiver against a pitch black background, stark contrast, retro film aesthetic, flash photography."
- "90s editorial fashion photography, young woman looking confidently with dark sunglasses, wearing a black and white zebra print blazer top, charcoal background."
