# Prompt 07 — Couples & Family Scoring

> ⚠️ **MERGED:** This feature has been merged into the unified New Reading wizard. See **`17-new-reading.md`** (`?type=couples`). This document is kept as **reference** for comparison layout, VerdictLabel component, and Nat's accuracy rules.

**Phase:** 1 | **Deadline:** May 9, 2026 | **Priority:** P2

---

## Read These First

1. **`.agents/skills/astro-design/SKILL.md`** — Design system. Read fully before any UI work.
2. **`app/globals.css`** — CSS tokens. Never hardcode values.
3. **`docs/prd/analysis-layers.md`** — How the scoring engine layers work.
4. **`app/api/house-matrix/`** — The scoring engine. Will be called for each person + the composite.
5. **`app/api/natal/`** — Natal chart endpoint. Called for partner's birth data.

---

## What to Build

**Route:** `app/couples/page.tsx`

A comparison flow where the user adds a partner's birth data and sees a combined/comparative destination score.

**Phase 1 scope:** Full UI flow with real scoring. Use **Option B: Weighted Synastry** — average individual `macroScores`, highlight where one person dramatically differs from the other.

---

## User Flow

```
Enter partner's birth data
→ Enter destination (or reuse from profile)
→ See: Your Score | Partner Score | Composite Score
→ Expand each person's breakdown
```

---

## UI Structure

```
app/couples/
  page.tsx          ← Server component (fetch user profile)
  CouplesClient.tsx ← Client component (partner form + results)
```

---

## Part 1: Partner Input Form

A clean form to capture partner's birth data. Use the same design as onboarding Screen 2:

```tsx
<section style={{ background: 'var(--surface)', padding: 'var(--space-xl)', border: '1px solid var(--surface-border)' }}>
  {/* Section label */}
  <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.65rem', letterSpacing:'0.1em',
    color:'var(--text-tertiary)', textTransform:'uppercase' }}>PARTNER'S CHART</span>

  {/* Fields */}
  <div className="input-group">
    <label className="input-label">Partner's name</label>
    <input type="text" className="input-field" placeholder="Their first name" />
  </div>

  <div className="input-group">
    <label className="input-label">Date of birth</label>
    <input type="date" className="input-field" />
  </div>

  <div className="input-group">
    <label className="input-label">Time of birth</label>
    <input type="time" className="input-field" />
    <label style={{ fontSize:'0.7rem', color:'var(--text-tertiary)' }}>
      <input type="checkbox" /> I don't know the time (will use 12:00 noon)
    </label>
  </div>

  <div className="input-group">
    <label className="input-label">City of birth</label>
    <input type="text" className="input-field" placeholder="Type a city..." />
  </div>
</section>
```

---

## Part 2: Comparison Results

Show three score columns side-by-side on desktop, stacked on mobile.

### Score Header Row

```tsx
<div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'var(--space-sm)' }}>
  {/* User card */}
  <div style={{ background:'var(--color-charcoal)', clipPath:'var(--cut-md)', padding:'var(--space-md)', textAlign:'center' }}>
    <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.65rem', color:'var(--text-tertiary)' }}>YOU</span>
    <ScoreRing score={userScore} size={80} />
    <VerdictLabel score={userScore} />
  </div>

  {/* Composite card — center, most prominent */}
  <div style={{ background:'var(--color-y2k-blue)', clipPath:'var(--cut-md)', padding:'var(--space-md)', textAlign:'center' }}>
    <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.65rem', color:'rgba(255,255,255,0.7)' }}>TOGETHER</span>
    <ScoreRing score={compositeScore} size={96} color="white" />
    <VerdictLabel score={compositeScore} light />
  </div>

  {/* Partner card */}
  <div style={{ background:'var(--color-charcoal)', clipPath:'var(--cut-md)', padding:'var(--space-md)', textAlign:'center' }}>
    <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.65rem', color:'var(--text-tertiary)' }}>PARTNER</span>
    <ScoreRing score={partnerScore} size={80} />
    <VerdictLabel score={partnerScore} />
  </div>
</div>
```

**Composite score calculation:**
```ts
const compositeScore = Math.round((userScore + partnerScore) / 2)
```

### Conflict Callout

If scores differ by > 20 points, show a prominent callout:

```tsx
{Math.abs(userScore - partnerScore) > 20 && (
  <div style={{ padding:'var(--space-md)', background:'var(--accent-soft)',
    border:'1px solid var(--accent)', borderRadius:'var(--radius-md)',
    marginTop:'var(--space-md)' }}>
    <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.65rem', color:'var(--accent)' }}>
      ⚠️ NOTABLE DIFFERENCE
    </span>
    <p style={{ marginTop:'0.5rem', fontSize:'0.85rem' }}>
      This destination scores much better for one of you. Consider the highlighted house differences below.
    </p>
  </div>
)}
```

### Verdict Label Component

Create a reusable `VerdictLabel` component used across ALL features:

```tsx
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

export function VerdictLabel({ score, light = false }: { score: number, light?: boolean }) {
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

> ⚠️ **Create this `VerdictLabel` component in `app/components/VerdictLabel.tsx` and use it everywhere.** It ensures 100% consistency across App Home, Onboarding, Birthday Optimizer, Couples, and any future flows.

### Individual House Breakdowns

Below the score header, show expandable accordions for each person's house scores:

```
▶ Your Analysis — Dubai
  H1 Identity: 72/100 — Mercury in Gemini on ASC ← Productive
  H10 Career: 88/100 — Jupiter conjunct MC ← Highly Productive
  ...

▶ Partner's Analysis — Dubai
  H1 Identity: 41/100 — Saturn square ASC ← Challenging
  ...
```

Reuse the existing `.expandable-*` CSS classes from `globals.css`.

---

## Nat's Accuracy Rules (Apply to Both Scores)

From Nat's expert feedback — apply to every line in both the user and partner breakdown:

| Rule | Implementation |
|------|---------------|
| Show dignities | Add pill tag: `DOMICILE` / `EXALTED` / `DETRIMENT` / `FALL` next to each planet |
| Distance tiers | `0-100mi: Strong` · `100-300mi: Moderate` · `300-500mi: Weak` |
| Degree from angle | Show `"2.3° from MC"` next to each ACG line |
| Transit labels | Tag every card with `[PERSONAL]` `[MUNDANE]` `[GEODETIC]` |

---

## Design Checklist

- [ ] Partner form uses `.input-field`, `.input-label`, `.input-group` classes
- [ ] 3-column score header: You → Together (Y2K Blue center) → Partner
- [ ] Composite card is most visually prominent (larger ScoreRing, blue bg)
- [ ] `VerdictLabel` component created in `app/components/VerdictLabel.tsx`
- [ ] Conflict callout shown when score difference > 20
- [ ] Individual house breakdowns in expandable accordions (existing `.expandable-*` classes)
- [ ] Nat's accuracy rules applied: dignities, distance tiers, degree orb, transit labels
- [ ] No hardcoded colors or fonts — CSS variables only
- [ ] Cards use `clip-path: var(--cut-md)`
