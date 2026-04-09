# Prompt 02 — Post-Login App Home

**Phase:** 1 | **Deadline:** April 10, 2026 | **Priority:** P0

---

## Read These First

1. **`.agents/skills/astro-design/SKILL.md`** — Full design system. Read every section before writing UI.
2. **`app/globals.css`** — All CSS tokens. Never hardcode hex or font values.
3. **`app/design-system/page.tsx`** — Living token showcase — use as visual reference.
4. **`docs/prd/mvp-requirements.md`** — App scope and feature list.
5. **`docs/prd/onboarding-flow.md`** — Life Goals mapping (used in the Goals card).

---

## What to Build

The post-login App Home (`app/home/page.tsx`) is the authenticated user's central hub. It is **not** a landing page or marketing page — it's an editorial product dashboard.

A user who logs in should immediately see their personalization (name, Sun sign) and have direct pathways to every product feature.

---

## Layout Structure

```
app/home/
  page.tsx          ← Server component (fetch user + profile from Supabase)
  HomeClient.tsx    ← Client component (interactive grid, animations)
  home.module.css   ← Page-specific styles (optional)
```

### Page Sections (top to bottom)

1. **Top bar** — Logo + user avatar dropdown (sign out option)
2. **Hero greeting** — Personalized, editorial-style
3. **Feature card grid** — 5 cards (see below)
4. **Quick action CTA** — "+ New Reading" floating button
5. **Recent readings** — last 3 destination scores (from `searches` table, empty state for new users)

---

## Feature Cards

Build 5 reading-type cards plus 3 utility links. Each reading card deep-links into `/new-reading?type=...`.

**Reading Cards** (primary grid, 2 columns desktop, 1 mobile):

| Card | Icon (Lucide) | BG Accent | Headline | Route |
|------|---------------|-----------|----------|-------|
| Score a Trip | `MapPin` | `var(--color-y2k-blue)` | "Your next destination" | `/new-reading?type=trip` |
| Find Where to Live | `Home` | `var(--color-acqua)` | "Your next chapter" | `/new-reading?type=relocation` |
| Birthday Optimizer | `Cake` | `var(--gold)` | "Where on your birthday?" | `/new-reading?type=birthday` |
| Read for Two | `Users` | `var(--color-spiced-life)` | "Score for couples" | `/new-reading?type=couples` |
| Goals Search | `Target` | `var(--sage)` | "Cities for your goals" | `/new-reading?type=goals` |

**Utility links** (smaller row below the grid):

| Link | Icon | Route |
|------|------|-------|
| My Readings | `BookOpen` | `/readings` |
| My Chart | `Star` | `/chart` |
| Profile | `User` | `/profile` |

**Card component spec (from `astro-design` SKILL.md ebook pattern):**
```tsx
<div style={{
  backgroundColor: 'var(--color-eggshell)', // alternates per card
  color: 'var(--color-charcoal)',
  padding: 'var(--space-lg)',
  clipPath: 'var(--cut-md)',
  position: 'relative',
  overflow: 'hidden',
}}>
  {/* Large background emoji/glyph for visual texture */}
  <span style={{
    position: 'absolute', fontSize: '8rem', opacity: 0.06,
    bottom: '-1rem', right: '-1rem', lineHeight: 1,
    fontFamily: 'var(--font-display-alt-2)',
  }}>A</span>

  {/* Pill tag */}
  <span style={{
    border: '1px solid currentColor', borderRadius: '20px',
    padding: '0.3rem 0.8rem', fontSize: '0.65rem',
    fontFamily: 'var(--font-mono)', display: 'inline-block',
    marginBottom: 'var(--space-sm)',
  }}>FEATURE</span>

  {/* Card headline */}
  <h3 style={{ fontFamily: 'var(--font-secondary)', fontSize: '1.75rem' }}>
    Headline text
  </h3>

  {/* CTA */}
  <button className="btn btn-primary">Go →</button>
</div>
```

---

## Hero Greeting

Personalized headline using Supabase profile data:

```tsx
// Fetch from Supabase server component
const { data: profile } = await supabase
  .from('profiles')
  .select('first_name, birth_date')
  .eq('id', user.id)
  .single()

const sunSign = getSunSign(profile.birth_date) // existing utility
```

UI:
- Display: `"Hello, [First Name]."` in `var(--font-primary)`, clamp(3rem, 6vw, 5rem)
- Sub-line: `"[Sun Sign glyph] [Sun Sign] Sun"` in `var(--font-body)`, gold color
- Decorative Sloop Script letter overlapping the headline (use `var(--font-display-alt-2)`, absolute-positioned, `var(--color-y2k-blue)` at 0.15 opacity)

**New user fallback (no profile yet):**
- Redirect to `/onboarding` — middleware handles this automatically

---

## Quick Action CTA

Floating fixed button at bottom-right:

```tsx
<button
  className="btn btn-primary"
  style={{
    position: 'fixed', bottom: 'var(--space-xl)', right: 'var(--space-xl)',
    borderRadius: 'var(--shape-asymmetric-md)',
    backgroundColor: 'var(--color-y2k-blue)',
    color: 'white',
    zIndex: 100,
  }}
  onClick={() => router.push('/new-reading')}
>
  + New Reading
</button>
```

> This opens the **type selection** screen of the New Reading wizard (Prompt 17).
> Each feature card above skips the type selector by deep-linking `?type=trip`, etc.

---

## Recent Readings

Fetch from `searches` table joined with scores. If empty (new user), show an editorial empty state card:

```
"Your first reading is waiting."
→ [Start a new reading]
```

For existing readings, show:
- Destination city name
- macroScore ring (reuse `ScoreRing` component if it exists)
- Verdict label using the **consistent scoring color scale**:

| Score | Verdict | Color |
|-------|---------|-------|
| ≥ 80 | Highly Productive | `var(--sage)` — neon green |
| 65–79 | Productive | `var(--color-y2k-blue)` |
| 50–64 | Mixed | `var(--gold)` |
| 35–49 | Challenging | `var(--color-spiced-life)` |
| < 35 | Hostile | `var(--color-planet-mars)` |

> ⚠️ **Always use this exact verdict scale and color mapping in every score display across the app.** DO NOT invent new labels or colors.

---

## Animation

Use `framer-motion` (already installed) for:
- Card grid stagger entry: `initial={{ opacity: 0, y: 20 }}`, `animate={{ opacity: 1, y: 0 }}`, stagger `0.08s` per card
- Hero text fade: `initial={{ opacity: 0 }}`, `animate={{ opacity: 1 }}`, delay `0.2s`

---

## Design Checklist

- [ ] No hardcoded colors or fonts — CSS variables only
- [ ] Cards alternate bg: Eggshell → Charcoal → Black
- [ ] Cards use `clip-path: var(--cut-md)` (Y2K cut shape)
- [ ] Buttons use `var(--shape-asymmetric-md)` border-radius
- [ ] Score displays use the exact verdict scale and color mapping above
- [ ] Decorative Sloop Script overlap on hero headline
- [ ] Saturn logo in top bar
- [ ] Empty state for new users (no readings yet)
- [ ] framer-motion stagger animation on card grid
- [ ] Fixed "+ New Reading" button at bottom-right
