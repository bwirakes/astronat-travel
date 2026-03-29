# Prompt 13 — Shared Component Extraction

**Phase:** 1 — Prerequisite | **Priority:** P0

---

## Read These First

1. **`.agents/skills/astro-design/SKILL.md`** — Design system. Read fully before any UI work.
2. **`app/globals.css`** — CSS tokens. Never hardcode values.
3. **`app/flow/page.tsx`** — Source for existing inline components to extract.

---

## What to Build

Before building any remaining mockup pages, extract these shared components from `app/flow/page.tsx` into `app/components/`:

| Component | Source | File to Create | Reuse In |
|-----------|--------|---------------|----------|
| `Pill` | `flow/page.tsx:164` | `app/components/Pill.tsx` | Reading results, birthday, couples, chart |
| `Starburst` | `flow/page.tsx:50` | `app/components/Starburst.tsx` | Birthday optimizer, reading results |
| `ProgressBar` (pips) | `flow/page.tsx:194` | `app/components/ProgressBar.tsx` | Any multi-step flow |
| `VerdictLabel` | New (from prompt 07 spec) | `app/components/VerdictLabel.tsx` | All score displays |
| `ScoreRing` | `app/components/ScoreRing` (exists) | Already exists | All score displays |

---

## VerdictLabel Component

```tsx
// app/components/VerdictLabel.tsx
const VERDICT_SCALE = [
  { min: 80, label: 'Highly Productive', color: 'var(--sage)' },
  { min: 65, label: 'Productive', color: 'var(--color-y2k-blue)' },
  { min: 50, label: 'Mixed', color: 'var(--gold)' },
  { min: 35, label: 'Challenging', color: 'var(--color-spiced-life)' },
  { min: 0,  label: 'Hostile', color: 'var(--color-planet-mars)' },
]

export function getVerdict(score: number) {
  return VERDICT_SCALE.find(v => score >= v.min) ?? VERDICT_SCALE[4]
}

export function VerdictLabel({ score, light = false }: { score: number; light?: boolean }) {
  const verdict = getVerdict(score)
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
      letterSpacing: '0.08em', textTransform: 'uppercase',
      color: light ? 'white' : verdict.color,
    }}>
      {verdict.label}
    </span>
  )
}
```

## Pill Component

```tsx
// app/components/Pill.tsx
export function Pill({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'personal' | 'mundane' | 'geodetic' }) {
  const colors = {
    default: { border: 'currentColor', bg: 'transparent' },
    personal: { border: 'var(--color-y2k-blue)', bg: 'rgba(4,86,251,0.1)' },
    mundane: { border: 'var(--gold)', bg: 'rgba(201,169,110,0.1)' },
    geodetic: { border: 'var(--color-acqua)', bg: 'rgba(202,241,240,0.1)' },
  }
  const c = colors[variant]
  return (
    <span style={{
      border: `1px solid ${c.border}`, borderRadius: '20px',
      padding: '0.3rem 0.8rem', fontSize: '0.65rem',
      fontFamily: 'var(--font-mono)', display: 'inline-block',
      background: c.bg,
    }}>
      {children}
    </span>
  )
}
```

---

## Demo Mode Pattern

Every remaining page must support `?demo=true`:

```tsx
export default async function Page({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const params = await searchParams;
  const isDemo = params.demo === 'true';
  if (!isDemo) {
    // real auth + data fetch
  } else {
    // use mock data
  }
}
```

**All nav links from the home dashboard should append `?demo=true` when in demo mode.**

---

## Checklist

- [ ] `Pill` extracted to `app/components/Pill.tsx`
- [ ] `Starburst` extracted to `app/components/Starburst.tsx`
- [ ] `ProgressBar` extracted to `app/components/ProgressBar.tsx`
- [ ] `VerdictLabel` created at `app/components/VerdictLabel.tsx`
- [ ] All components use CSS variable tokens only
- [ ] Demo mode pattern documented and ready for all pages
