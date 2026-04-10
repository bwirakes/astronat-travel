# Task: Finalize the Geodetic & Mundane Astrology Page Migration

## Context
We are finalizing the migration of our static HTML mockup for the Geodetic & Mundane Astrology page into a production-ready Next.js `page.tsx` route. The groundwork has been laid, but we need to integrate the final V2 mockup content, extract the SVGs, and ensure pixel-perfect brand alignment.

## Objective
Update `/app/geodetic/page.tsx` by migrating the final SVG assets and copy from the V2 HTML mockup, ensuring strict adherence to the Astro-Brand design system and full responsiveness.

## Resources & Files to View
1. **Target File**: `/app/geodetic/page.tsx`
2. **V2 Mockup**: `file:///Users/brandonwirakesuma/Downloads/astronat-geodetic-mundane-v2%20(1).html`
3. **Design Guidelines**: `.agents/skills/astro-design/SKILL.md` (and related `globals.css`)
4. **Reference Log**: Review conversation "Migrating Geodetic Astrology Page" context for earlier architectural decisions.

---

## Instructions

### 1. Extract & Convert Complex SVGs
The current `page.tsx` file contains placeholder tags (`___GEO_SVG___`, `___ELON_SVG___`, `___TRUMP_SVG___`) inside the map components. 
- You must extract the three raw `<svg>` map elements from the `astronat-geodetic-mundane-v2 (1).html` mockup.
- Convert these elements into valid React JSX (update `class` to `className`, `stroke-width` to `strokeWidth`, `stroke-dasharray` to `strokeDasharray`, etc.).
- Inject the valid JSX into `GeodeticMapSVG`, `ElonMapSVG`, and `TrumpMapSVG` inside `page.tsx`. Ensure all nested shapes, `<defs>`, and CSS `<style>` blocks within the SVG are properly converted to JSX or removed if redundant.

### 2. 1:1 Content Parity
- Audit the text in `page.tsx` against the `astronat-geodetic-mundane-v2 (1).html` file.
- **Keep the exact same wording** as the HTML mockup. Pay close attention to the Hero CTA phrasing, the Research Notes text, and the specific geodetic equivalency values (degrees/longitudes) for the case studies. No copy should be altered or omitted.

### 3. Astro-Brand Integrity
- Read `.agents/skills/astro-design/SKILL.md`.
- Ensure all styling strictly relies on the design tokens in `globals.css`. 
- Validate that components are using the correct organic/asymmetric M3 border radii (e.g., `var(--shape-asymmetric-md)` or clipping paths) instead of standard Tailwind `.rounded-lg`.
- Maintain the high-contrast editorial magazine style, using overlapping script fonts (`--font-display-alt-2`) like "The world", ensuring they do not overflow ungracefully.

### 4. Responsiveness 
- Look at the CSS media queries at the bottom of the `<style>` tag in the V2 HTML.
- Guarantee that the grid layouts break down gracefully on mobile and tablet breakpoint (`<960px` and `<600px`). Ensure no horizontally scrolling overspills happen, especially inside the grid elements containing the SVG maps.

## Definition of Done
- The page compiles cleanly with `bun run dev` (no Next.js or React hydration errors from the SVGs).
- Copy is indistinguishable from the V2 HTML.
- UI responds flawlessly when tested at 375px window width.
