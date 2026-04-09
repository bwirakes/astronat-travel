# Prompt 15 — Reading History Page

**Phase:** 1 — Mockup | **Priority:** P0

---

## Read These First

1. **`.agents/skills/astro-design/SKILL.md`** — Design system. Read fully before any UI work.
2. **`app/globals.css`** — CSS tokens. Never hardcode values.
3. **`docs/prompts/13-shared-components.md`** — Uses `Pill`, `ScoreRing`, `VerdictLabel`.

---

## What to Build

**Route:** `app/readings/page.tsx`

A list page showing all past readings with scores. Links to individual reading pages.

**Demo mode:** Support `?demo=true` with 3 sample readings.

---

## Page Layout

### Header
```tsx
<Pill>HISTORY</Pill>
<h1 style={{ fontFamily: 'var(--font-primary)', fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
  YOUR READINGS
</h1>
```

### Reading Cards (list)

Each card is a clickable row linking to `/reading/[id]`:

```tsx
<Link href={`/reading/${reading.id}${isDemo ? '?demo=true' : ''}`}
  style={{
    display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
    padding: 'var(--space-md)',
    background: 'var(--surface)',
    border: '1px solid var(--surface-border)',
    borderRadius: 'var(--shape-asymmetric-md)',
    marginBottom: 'var(--space-sm)',
    textDecoration: 'none', color: 'inherit',
    transition: 'transform 0.2s var(--ease)',
  }}>
  <ScoreRing score={reading.macroScore} size={56} />
  <div style={{ flex: 1 }}>
    <h3 style={{ fontFamily: 'var(--font-secondary)', fontSize: '1.25rem' }}>
      {reading.destination}
    </h3>
    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
      {reading.date} · {reading.travelType}
    </p>
  </div>
  <VerdictLabel score={reading.macroScore} />
  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
    View ›
  </span>
</Link>
```

### Empty State

When no readings exist:

```tsx
<div style={{ textAlign: 'center', padding: 'var(--space-xl) 0' }}>
  <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
    No readings yet. Start your first reading.
  </p>
  <Link href="/flow" className="btn btn-primary" style={{ borderRadius: 'var(--shape-asymmetric-md)' }}>
    Start a reading →
  </Link>
</div>
```

---

## Mock Data

```ts
const MOCK_READINGS = [
  { id: 'demo-1', destination: 'Tokyo, Japan', macroScore: 87, date: 'Mar 15, 2026', travelType: 'Trip' },
  { id: 'demo-2', destination: 'Paris, France', macroScore: 62, date: 'Mar 10, 2026', travelType: 'Relocation' },
  { id: 'demo-3', destination: 'Bali, Indonesia', macroScore: 91, date: 'Mar 5, 2026', travelType: 'Trip' },
]
```

---

## Design Checklist

- [ ] Page header uses `var(--font-primary)` uppercase
- [ ] `Pill` tag "HISTORY" above headline
- [ ] Cards use `var(--shape-asymmetric-md)` border-radius
- [ ] ScoreRing at 56px per card
- [ ] VerdictLabel on each card
- [ ] Empty state with CTA to `/flow`
- [ ] Hover: subtle `transform: scale(1.01)`
- [ ] `?demo=true` supported, links propagate demo param
- [ ] Icons: Lucide SVGs only — no emojis
