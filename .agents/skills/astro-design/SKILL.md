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

**Baseline references:**
- `astro_brand_guidelines.md` — Canonical brand identity & token specs
- `ASTRO-BRAND_STRATEGY_NAT_H..pdf` — Original brand strategy PDF
- `app/globals.css` — Single source of truth for all CSS tokens
- `app/design-system/page.tsx` — Living token showcase & ebook concepts

---

## 1. Typography

Use the exact CSS variables provided. **Never hardcode font-family strings.**

| Role | Variable | Asset | Usage |
|------|----------|-------|-------|
| **Primary/Display** | `var(--font-primary)` | BETTER DAYS | Massive hero headers, loud structural text, step numbers |
| **Secondary/Serif** | `var(--font-secondary)` | PERFECTLY NINETIES | Sub-headers, editorial pull-quotes, step titles |
| **Body** | `var(--font-body)` | GARET | All paragraph, utilitarian, and kicker text |
| **Display Alt 1** | `var(--font-display-alt-1)` | MONIGUE | High-contrast stylistic serif overlap, ebook titles |
| **Display Alt 2** | `var(--font-display-alt-2)` | SLOOP SCRIPT | Oversized decorative cursive overlaps |
| **Mono** | `var(--font-mono)` | IBM Plex Mono | Micro labels, tags, metadata text |

### Typography Hierarchy Rules
- **H1**: `--font-primary`, uppercase, `clamp(3.2rem, 6.5vw, 6rem)`, tight line-height (0.82–0.95)
- **H2**: `--font-secondary`, normal case, `2.5rem`
- **H3**: `--font-secondary`, `1.75rem` for step titles
- **H4**: `--font-body`, uppercase, tracked `0.12em`, used as section kickers
- **H5/H6**: `--font-body` / `--font-mono`, tiny uppercase kickers and micro labels

---

## 2. Color & Theme

**Rule: Never hardcode hex values. Always use CSS variables from `globals.css`.**

### Brand Palette
| Name | Variable | Hex | Usage |
|------|----------|-----|-------|
| **Charcoal** | `var(--color-charcoal)` | #1B1B1B | Dark bg / light mode text |
| **Y2K Blue** | `var(--color-y2k-blue)` | #0456fb | Primary CTA accent, decorative overlaps, pill highlights |
| **Acqua** | `var(--color-acqua)` | #CAF1F0 | Soft pastel accent, data tags |
| **Black** | `var(--color-black)` | #000000 | Deepest background / ebook dark variant |
| **Eggshell** | `var(--color-eggshell)` | #F8F5EC | Light bg / dark mode text / ebook light variant |
| **Spiced Life** | `var(--color-spiced-life)` | #E67A7A | Warm pink-red accent |
| **Neon Green** | `var(--sage)` | #00FD00 | High-contrast callout, quality states |
| **Gold** | `var(--gold)` | #C9A96E | Celestial accent, italic emphasis |

### Planet Color System
Always use Tailwind planet classes, never hardcode:
`bg-planet-sun`, `bg-planet-moon`, `bg-planet-mercury`, `bg-planet-venus`, `text-planet-mars`, `bg-planet-jupiter`, `bg-planet-saturn`, `bg-planet-uranus`, `bg-planet-neptune`, `bg-planet-pluto`

### Color Block Composition (from Ebook)
The brand uses **stark color-block alternation** to create rhythm:
- Alternate between `Eggshell`, `Charcoal`, and `Black` backgrounds for adjacent cards/sections
- When placing content side-by-side (e.g., ebook concepts), each card uses a **different** background color
- Use the reversed text color for maximum contrast: Eggshell bg → Charcoal text, Black bg → Eggshell text

---

## 3. Shape Library & Spatial Composition

### Core Principle
Use bold, unexpected layouts. Implement overlaps, distinctive asymmetry, strong framing, and an editorial magazine layout feel. **Stay away from generic grid-based "SaaS" layouts. Never use generic shadow drops or subtle soft-rounded 12px borders.**

### Shape Options (from `globals.css` + M3)

**Option A: Asymmetric Rounded (The "Astro-Organic" Vibe)** ← Recommended for CTAs, cards
- Combine M3 rounded classes asymmetrically:
  ```
  rounded-tl-[var(--radius-xl)] rounded-tr-[var(--radius-xs)]
  rounded-br-[var(--radius-xl)] rounded-bl-[var(--radius-sm)]
  ```
- Or use predefined vars: `border-radius: var(--shape-asymmetric-md)` / `var(--shape-asymmetric-lg)`

**Option B: Cut Shapes (The "Y2K Tech" Vibe)** ← Recommended for hero images, feature cards
- CSS `clip-path` with predefined variables: `var(--cut-sm)`, `var(--cut-md)`, `var(--cut-lg)`, `var(--cut-xl)`
- Example: `className="... [clip-path:var(--cut-lg)]"`
- Creates chamfered/beveled corners that feel like Y2K tech hardware

**Option C: Organic Blob Shapes (The "Ebook" Vibe)** ← For editorial image containers
- Use `border-radius` with the organic blob formula from `globals.css`:
  ```css
  border-radius: var(--shape-organic-1);
  /* Resolves to: 40% 60% 70% 30% / 40% 50% 60% 50% */
  ```
- Creates irregular, amorphous image containers seen in the ebook layouts
- Best for: cropped portrait photos, editorial imagery within cards

**Option D: Standard Symmetric Rounded**
- Standard Tailwind `rounded-` classes mapped to M3 scale (`rounded-none` through `rounded-full`)
- Use sparingly — only for pills and tags

### Ebook-Inspired Layout Patterns

1. **Overlapping Script Elements**: Place oversized `SLOOP SCRIPT` or `MONIGUE` text absolutely to overlap photos/cards. Use `var(--color-y2k-blue)` at 0.65–0.9 opacity, `font-size: clamp(8rem, 16vw, 14rem)`, `pointer-events: none`.

2. **Content-Over-Image Cards**: Stack a text block at the bottom of a full-bleed image with a solid color bar background (`var(--color-black)` or `var(--color-y2k-blue)`).

3. **Pill Tags**: Small rounded pills for categories — use `--font-mono`, `0.65rem`, border `1px solid currentColor`, `border-radius: 20px`, padding `0.3rem 0.8rem`. For highlights: `bg: var(--color-y2k-blue)`, `color: white`.

4. **Table of Contents Pattern**: Stack page numbers left-aligned with `--font-secondary` titles, separated by `1px solid var(--surface-border)` dividers.

5. **Photo Grid Mixing**: Combine organic blob-shaped images with standard rectangular images in the same grid — the mixture creates visual tension.

---

## 4. Brand SVG & Image Assets

### SVG Avatar/Logo Inventory (`/public/avatar/` and `/public/`)

| Asset | Path | Usage |
|-------|------|-------|
| **Logo Stacked** | `/logo-stacked.svg` or `/avatar/logo-stacked.svg` | Primary logo mark, navbar |
| **Saturn Monogram** | `/saturn-monogram.svg` or `/avatar/saturn-monogram.svg` | Avatar icon, compact identity |
| **Saturn O Stars** | `/saturn-o-stars.svg` or `/avatar/saturn-o-stars.svg` | Decorated avatar variant |
| **Saturn O** | `/saturn-o.svg` or `/avatar/saturn-o.svg` | Minimal saturn ring icon |

**Usage rules for SVGs:**
- In dark mode, apply `filter: invert(1)` via CSS/inline style to flip white ↔ black
- Display inside circular containers: `border-radius: 50%`, `bg: var(--color-black)`, `padding: var(--space-md)`
- Never stretch — maintain aspect ratio with `width` and `height` props

### Editorial Photo Assets (`/public/`)

| Asset | Path | Mood |
|-------|------|------|
| **Hero** | `/astronat-hero.jpg` | Vespa + cypress, warm travel vibe |
| **Girl Sunglasses** | `/girl_sunglasses.png` | Zebra print blazer, editorial fashion |
| **Green Phone** | `/green_phone.png` | Neon vintage rotary phone, Y2K tech |
| **Pastel Suits** | `/pastel_suits.png` | Community / Aquarian pastel group shot |
| **Moody Landscape** | `/moody-landscape.jpg` | Misty mountains at dusk |
| **Onboarding Hero** | `/onboarding-hero.png` | Flow onboarding visual |

---

## 5. Component Strategy (Shadcn + Tailwind)

We use Shadcn UI and Tailwind CSS for rapid build-out. Whenever you build a component:
- Proactively use Tailwind classes over custom CSS
- Deconstruct Shadcn borders using the Astro-Brand aesthetic (flat, bold colors, stark contrasts)
- **NEVER** use generic shadow drops or subtle soft-rounded 12px SaaS borders
- Use M3 cut shapes or asymmetric radii instead of standard `rounded-lg`
- All `border-color` via `var(--surface-border)`, never hardcoded

### Ebook Card Component Pattern
```tsx
// Alternating color-block ebook cards with organic image, script overlap, and pill tags
<div style={{
  backgroundColor: 'var(--color-eggshell)', // or --color-black or --color-charcoal
  color: 'var(--color-charcoal)',            // inverse for contrast
  padding: 'var(--space-lg)',
  position: 'relative',
  overflow: 'hidden',
}}>
  {/* Organic blob image */}
  <div style={{ borderRadius: 'var(--shape-organic-1)', overflow: 'hidden' }}>
    <Image src="/girl_sunglasses.png" alt="..." fill style={{ objectFit: 'cover' }} />
  </div>

  {/* Title — MONIGUE */}
  <h3 style={{ fontFamily: 'var(--font-display-alt-1)', fontSize: '2.5rem' }}>TITLE</h3>

  {/* Decorative overlap — SLOOP SCRIPT */}
  <span style={{
    position: 'absolute', fontFamily: 'var(--font-display-alt-2)',
    fontSize: '10rem', color: 'var(--color-y2k-blue)',
    opacity: 0.9, top: '55%', right: '-10%',
    pointerEvents: 'none', lineHeight: '0.5',
  }}>A</span>

  {/* Pill tags */}
  <div style={{ display: 'flex', gap: '0.5rem' }}>
    <span style={{
      border: '1px solid currentColor', borderRadius: '20px',
      padding: '0.3rem 0.8rem', fontSize: '0.65rem',
      fontFamily: 'var(--font-mono)',
    }}>1ST</span>
    <span style={{
      backgroundColor: 'var(--color-y2k-blue)', color: 'white',
      borderRadius: '20px', padding: '0.3rem 0.8rem',
      fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
    }}>MC RULER</span>
  </div>
</div>
```

---

## 6. Generative Imagery & Media

When UIs require images, avatars, or visual assets, **always proactively use the `generate_image` tool** rather than gray placeholders.

**Base Prompt Architecture:**
`"90s editorial fashion photography, high contrast film flash, stark backgrounds, retro vintage objects, bright neon accents alongside moody shadows."`

*Examples:*
- "90s editorial photography, a person holding a vintage bright neon green rotary phone receiver against a pitch black background, stark contrast, retro film aesthetic, flash photography."
- "90s editorial fashion photography, young woman looking confidently with dark sunglasses, wearing a black and white zebra print blazer top, charcoal background."

**NEVER** use generic AI aesthetics or cookie-cutter design components. Make it memorable, distinctive, and entirely unique to Nat H's Astro-Brand.
