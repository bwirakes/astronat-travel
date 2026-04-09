# Prompt 16 — Natal Chart Viewer

**Phase:** 1 — Mockup | **Priority:** P3

---

## Read These First

1. **`.agents/skills/astro-design/SKILL.md`** — Design system. Read fully before any UI work.
2. **`app/globals.css`** — CSS tokens. Never hardcode values.
3. **`app/components/NatalChart.tsx`** — Existing natal chart component. Reuse — do not rebuild.
4. **`docs/prompts/13-shared-components.md`** — Uses `Pill`.

---

## What to Build

**Route:** `app/chart/page.tsx`

A standalone page showing the user's natal chart wheel and a table of all planet positions. This is a power-user reference page.

**Demo mode:** Support `?demo=true` with a realistic mock natal chart dataset.

---

## Page Layout

### Header
```tsx
<Pill>YOUR CHART</Pill>
<h1 style={{ fontFamily: 'var(--font-primary)', fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
  YOUR CHART
</h1>
```

### Natal Chart Wheel

Reuse the existing `NatalChart` component. Wrap it centered:

```tsx
<div style={{ maxWidth: '500px', margin: '0 auto', padding: 'var(--space-lg) 0' }}>
  <NatalChart data={chartData} />
</div>
```

### Planet Positions Table

| Planet | Sign | House | Degree | Dignity |
|--------|------|-------|--------|---------|
| ☉ Sun | Leo | H10 | 15°23' | `DOMICILE` |
| ☽ Moon | Cancer | H7 | 22°41' | `DOMICILE` |
| ☿ Mercury | Virgo | H11 | 8°12' | `DOMICILE` |
| ♀ Venus | Libra | H12 | 3°54' | `DOMICILE` |
| ♂ Mars | Aries | H5 | 19°08' | `DOMICILE` |
| ♃ Jupiter | Sagittarius | H2 | 27°33' | `DOMICILE` |
| ♄ Saturn | Capricorn | H3 | 11°47' | `DOMICILE` |
| ♅ Uranus | Aquarius | H4 | 6°29' | `DOMICILE` |
| ♆ Neptune | Pisces | H5 | 1°15' | `DOMICILE` |
| ♇ Pluto | Scorpio | H1 | 24°02' | `DOMICILE` |

**Table styling:**
```tsx
<table style={{
  width: '100%', borderCollapse: 'collapse',
  fontFamily: 'var(--font-body)', fontSize: '0.85rem',
}}>
  <thead>
    <tr style={{ borderBottom: '1px solid var(--surface-border)', textAlign: 'left' }}>
      <th style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Planet</th>
      <th style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Sign</th>
      <th style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>House</th>
      <th style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Degree</th>
      <th style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Dignity</th>
    </tr>
  </thead>
  <tbody>
    {planets.map((p, i) => (
      <tr key={p.name} style={{ background: i % 2 === 0 ? 'var(--surface)' : 'transparent' }}>
        <td style={{ padding: 'var(--space-sm)' }}>{p.glyph} {p.name}</td>
        <td style={{ padding: 'var(--space-sm)' }}>{p.sign}</td>
        <td style={{ padding: 'var(--space-sm)' }}>{p.house}</td>
        <td style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-mono)' }}>{p.degree}</td>
        <td style={{ padding: 'var(--space-sm)' }}>
          {p.dignity && <Pill>{p.dignity.toUpperCase()}</Pill>}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

**Alternating row backgrounds:** odd rows `var(--surface)`, even rows transparent.

---

## Mock Data

```ts
const MOCK_CHART = {
  planets: [
    { name: 'Sun', glyph: '☉', sign: 'Leo', house: 'H10', degree: "15°23'", dignity: 'domicile' },
    { name: 'Moon', glyph: '☽', sign: 'Cancer', house: 'H7', degree: "22°41'", dignity: 'domicile' },
    { name: 'Mercury', glyph: '☿', sign: 'Virgo', house: 'H11', degree: "8°12'", dignity: 'domicile' },
    { name: 'Venus', glyph: '♀', sign: 'Libra', house: 'H12', degree: "3°54'", dignity: 'domicile' },
    { name: 'Mars', glyph: '♂', sign: 'Aries', house: 'H5', degree: "19°08'", dignity: 'domicile' },
    { name: 'Jupiter', glyph: '♃', sign: 'Sagittarius', house: 'H2', degree: "27°33'", dignity: 'domicile' },
    { name: 'Saturn', glyph: '♄', sign: 'Capricorn', house: 'H3', degree: "11°47'", dignity: 'domicile' },
    { name: 'Uranus', glyph: '♅', sign: 'Aquarius', house: 'H4', degree: "6°29'", dignity: 'domicile' },
    { name: 'Neptune', glyph: '♆', sign: 'Pisces', house: 'H5', degree: "1°15'", dignity: 'domicile' },
    { name: 'Pluto', glyph: '♇', sign: 'Scorpio', house: 'H1', degree: "24°02'", dignity: 'domicile' },
  ],
}
```

---

## Design Checklist

- [ ] `NatalChart` component reused — not rebuilt
- [ ] Planet table uses alternating row backgrounds
- [ ] Dignity shown via `Pill` component
- [ ] Table headers use `var(--font-mono)` uppercase
- [ ] `?demo=true` supported with mock data
- [ ] Icons: Lucide SVGs only — no emojis (except astrological planet glyphs which are standard Unicode)
