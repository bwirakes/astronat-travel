---
name: astro-design
description: Use for Astronat frontend UI design, redesign, polish, mockups, and component work. Builds product-native Astro-Brand interfaces with current app tokens, reusable components, and the /reading/[id] page as the canonical visual reference; pair with astro-editorial for post-build hierarchy audits.
license: Complete terms in LICENSE.txt
---

# Astro Design

Build Astronat interfaces that feel native to this app: editorial astrology, 90s/Y2K Aquarian brand energy, and practical product UX. The page should scan before it reads. It should feel authored, not assembled from default SaaS parts.

Use `astro-editorial` after a build or styling pass when the ask is an audit of hierarchy, scan order, density, or "why does this feel flat?"

## First Pass

Before designing or editing UI:

1. Inspect the route, nearby components, and current data shape.
2. Read the relevant tokens in `app/globals.css`.
3. Check `app/components/ui` and nearby feature components before creating new primitives.
4. Treat `/reading/[id]` as the strongest current reference, especially:
   - branded Y2K-blue hero artwork joined to a tab strip
   - mono kicker + custom glyph + serif heading section grammar
   - short body copy followed by practical guide rows
   - ledger rows for dense timing/data lists
   - mobile layouts with no horizontal scroll and no clipped labels

## Native App Rules

- Use existing tokens first: `--font-primary`, `--font-secondary`, `--font-body`, `--font-mono`, `--color-y2k-blue`, `--color-eggshell`, `--color-charcoal`, `--color-spiced-life`, `--color-acqua`, `--sage`, `--gold`, `--surface-border`, `--space-*`, `--radius-*`, `--cut-*`, `--shape-organic-1`, `--shape-asymmetric-*`.
- Use existing reusable components before writing new UI:
  - `AstroPill`
  - `AstronatCard`
  - `SectionHeader`
  - `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
  - `PlanetHoverCard`
  - `PlanetIcon`, `SignIcon`, `AspectIcon`
  - `MonocleSectionHeader`, `ThickRule`
  - `svg-shapes.tsx` artwork components
  - reading patterns in `TabSection`, `ReadingCopy`, `ReadingGuideRows`, `ReadingGuideFlow`, and `GuideRowBadge`
- Use lucide icons for normal controls when the app already uses lucide. Use custom Astro SVGs for brand/art moments.
- Keep new styles local to the route/component unless the same pattern is intentionally becoming system-wide.
- Prefer theme-aware CSS variables. Hardcoded brand colors are allowed only for fixed brand artwork panels, like the current reading hero.

## Visual Grammar

Typography:

- Display and section titles use `var(--font-primary)` or `var(--font-secondary)`.
- Body prose uses `var(--font-body)`, normal weight, high contrast, line-height about `1.6-1.75`.
- Labels, kickers, metadata, scores suffixes, and tabs use `var(--font-mono)` with uppercase tracking.
- Do not use italic body copy. Use bold only to anchor the literal takeaway.
- Do not scale font size directly with viewport width; use `clamp()` with sensible bounds.

Color:

- `--color-y2k-blue` is primary identity and app-native emphasis.
- `--sage` means supportive/good.
- `--color-spiced-life` means caution/friction.
- `--gold` means significant, celestial, or warning-worthy.
- `--color-acqua` is neutral/mixed/cool support.
- Color should carry meaning across the page, not decorate random cards.

Composition:

- Build editorial sections, not marketing panels. Use full-width bands, hairlines, ledgers, glyphs, and restrained surfaces.
- Cards are for repeated items, modals, compact tools, or genuinely framed content. Do not nest cards inside cards.
- Use asymmetric, cut, or organic shapes for memorable brand moments. Use `--radius-xs` or `--radius-sm` for dense editorial UI.
- Use one clear active-state signal for tabs/selectors. Avoid simultaneous fill + border + weight + shadow changes.
- Dense data should become ledger rows: label, primary value, note, score/status. Avoid bulky card grids for tabular information.
- Practical guidance should resolve into 2-3 short rows such as "Use this for", "Be careful with", and "Do next".

Responsive behavior:

- Design mobile and desktop together. Do not treat mobile as a squeezed desktop.
- Start with a 375px mobile sanity check, then verify tablet and desktop. The `/reading/[id]` mobile hero and tab strip are the reference for density, wrapping, and no-scroll behavior.
- Use stable responsive constraints: `minmax(0, 1fr)`, `clamp()`, `max-width`, `aspect-ratio`, and explicit grid areas for reflow.
- Keep primary actions, scores, and labels visible without horizontal scrolling. Long labels wrap deliberately; tiny labels must not become vertical letter stacks.
- Convert multi-column desktop layouts into ledgers, stacked guide flows, or single-column editorial sections on mobile.
- Keep tappable controls large enough, preserve focus-visible states, and make tab/segmented controls operable by keyboard and touch.
- Verify light and dark themes at mobile sizes; theme-aware surfaces often fail first when compacted.

## Canonical Reading Pattern

When building a major app surface, borrow the current reading page rhythm:

1. Hero artwork panel: fixed brand palette, large contextual title, a score/status pill, one practical CTA, and celestial/astro SVG texture.
2. Joined navigation strip: theme-aware surface directly attached to the hero, equal-width triggers, readable on 375px mobile.
3. Section opener: custom glyph + mono kicker + balanced serif heading.
4. Interpretation copy: short high-contrast body paragraphs, then practical guide rows or a guide flow.
5. Detail sections: ledgers, hairlines, accent borders, promoted numbers, and glyphs. Avoid generic dashboards.
6. Bridge navigation: when moving between sections, make the transition feel editorial rather than like a plain utility button.

## Hard Guardrails

- No generic SaaS card grids as the default layout.
- No default shadcn visual language; reshape it with Astronat tokens and local rhythm.
- No new global design system unless the user explicitly asks.
- No random gradient blobs, purple-blue marketing gradients, glassmorphism, or decorative glow as a substitute for composition.
- No gray placeholders for visual moments; use existing brand assets, astro glyphs, maps, charts, or generated imagery when appropriate.
- No hardcoded hex values except intentional fixed brand-art panels. Prefer variables and `color-mix()`.
- No horizontal scroll on mobile unless the user explicitly asks for a scrollable data table.
- No clipped, overlapping, or unreadable text. Long labels wrap deliberately.
- Do not rewrite surrounding UI just to satisfy an aesthetic preference. Match the route's existing ownership and component boundaries.

## Verification

Before calling the work done:

- Check desktop and mobile viewport behavior.
- Check at least 375px mobile, tablet, and desktop widths for reflow.
- Check light and dark themes when the route supports both.
- Verify focus-visible states on controls and tabs.
- Verify reduced-motion friendliness for animated flourishes.
- Scan for text overlap, clipped labels, and accidental horizontal scroll.
- Run relevant checks: `bun run lint`, a build when feasible, and focused tests such as `__tests__/design-system/*` when touching shared primitives.

## Output Style

When explaining design work, be concrete: name the token, component, or pattern used. If proposing changes before editing, describe the experience and reusable component shape rather than listing decorative CSS values.
