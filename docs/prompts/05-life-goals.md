# Prompt 05 — Life Goals Feature

**Phase:** 1 | **Deadline:** May 2, 2026 | **Priority:** P1

---

## Read These First

1. **`.agents/skills/astro-design/SKILL.md`** — Design system. Read fully before any UI work.
2. **`app/globals.css`** — All CSS token variables. Never hardcode values.
3. **`docs/prd/onboarding-flow.md`** — Screen 4 spec (Life Goals), engine mapping table.
4. **`docs/prd/analysis-layers.md`** — How goals map to house/planet scoring weights.

---

## What to Build

**Route:** `app/goals/page.tsx`

A standalone page where authenticated users can view and edit their Life Goals. These goals drive which houses, planets, and transit types are weighted in every reading and score.

Life Goals are **not** just a preference setting — they are the core personalization engine. When a user says "Career", the house-matrix engine weights H10 and H6 higher. When they say "Love", it weights H5 and H7.

---

## UI Structure

```
app/goals/
  page.tsx      ← Server component (fetch current goals from profile)
  GoalsClient.tsx ← Client component (multi-select cards, save)
```

### Page Header

- Pill tag: `PERSONALIZATION` (mono font, bordered)
- Headline: `"What are you seeking?"` — `var(--font-primary)`, uppercase
- Sub-line: `"Your goals shape every reading. Select up to 3."` — `var(--font-body)`

### Goal Cards Grid

**Layout:** 2-column grid on desktop, 1-column on mobile.

Each card:
- Shape: `clip-path: var(--cut-sm)` (Y2K cut corners)
- **Unselected:** `background: var(--surface)`, `border: 1px solid var(--surface-border)`
- **Selected:** `background: var(--color-y2k-blue)`, `border: 1px solid var(--color-y2k-blue)`, `color: white`
- Hover: scale `1.02` via `transform`, transition `0.2s var(--ease)`

| Goal | Icon | What it activates | House Focus |
|------|------|--------------------|-------------|
| Love & Relationships | 💕 | Venus lines + aspects, 5th/7th house cusp rulers | H5, H7 |
| Career & Ambition | 💼 | MC lines, Saturn/Jupiter, 10th/6th house rulers | H10, H6 |
| Community & Friendships | 🤝 | Social planet transits, 11th/3rd house | H11, H3 |
| Timing & Life Transitions | ⏱️ | Active personal transits, profections, travel windows | Transits |
| Personal Growth | 🌱 | Neptune/Jupiter, 9th/12th house | H9, H12 |
| Relocation / Living | 🏠 | IC lines, 4th house ruler, long-term patterns | H4 |

**Card internals:**
```tsx
<button
  onClick={() => toggleGoal(goal.key)}
  style={{
    clipPath: 'var(--cut-sm)',
    background: selected.includes(goal.key) ? 'var(--color-y2k-blue)' : 'var(--surface)',
    border: `1px solid ${selected.includes(goal.key) ? 'var(--color-y2k-blue)' : 'var(--surface-border)'}`,
    color: selected.includes(goal.key) ? 'white' : 'var(--text-primary)',
    padding: 'var(--space-md)',
    textAlign: 'left',
    transition: 'all 0.2s var(--ease)',
    cursor: 'pointer',
  }}
>
  <span style={{ fontSize: '2rem', display: 'block', marginBottom: 'var(--space-xs)' }}>
    {goal.icon}
  </span>
  <h3 style={{ fontFamily: 'var(--font-secondary)', fontSize: '1.25rem' }}>
    {goal.label}
  </h3>
  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem',
    color: selected.includes(goal.key) ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)',
    marginTop: 'var(--space-xs)',
  }}>
    {goal.description}
  </p>
</button>
```

### Max Selection Warning

When user selects a 4th goal, show an inline message:
```
"Max 3 goals selected. Deselect one to change your focus." 
```
Style: `var(--color-spiced-life)` text, `var(--font-mono)` font, small.

### Save Button

```tsx
<button
  className="btn btn-primary"
  style={{ borderRadius: 'var(--shape-asymmetric-md)' }}
  onClick={saveGoals}
>
  Save goals →
</button>
```

On save: PATCH `profiles.life_goals` via Supabase client. Show success toast: "Goals saved ✨".

Then show a prominent CTA:

```tsx
{saveSuccess && (
  <div style={{
    marginTop: 'var(--space-lg)',
    padding: 'var(--space-md)',
    background: 'var(--color-y2k-blue)',
    borderRadius: 'var(--shape-asymmetric-md)',
    textAlign: 'center',
  }}>
    <p style={{ fontFamily: 'var(--font-body)', color: 'white', marginBottom: 'var(--space-sm)' }}>
      Now find the best cities for your goals
    </p>
    <button
      className="btn"
      style={{
        background: 'white', color: 'var(--color-y2k-blue)',
        borderRadius: 'var(--shape-asymmetric-md)',
        fontFamily: 'var(--font-secondary)',
      }}
      onClick={() => router.push('/new-reading?type=goals')}
    >
      Find cities for these goals →
    </button>
  </div>
)}
```

> **Key UX point:** Life Goals page isn't a dead-end. After saving, it drives the user to produce a reading.

---

## How Goals Affect Scoring

Show an informational section below the cards explaining how each selected goal changes the reading:

```tsx
{selected.length > 0 && (
  <div style={{ marginTop: 'var(--space-xl)', padding: 'var(--space-md)',
    background: 'var(--surface)', border: '1px solid var(--surface-border)' }}>
    <h4>How your goals shape your reading</h4>
    {selected.map(goal => (
      <div key={goal} style={{ marginTop: 'var(--space-sm)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
          color: 'var(--color-y2k-blue)' }}>
          {goalLabels[goal]}
        </span>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {goalDescriptions[goal]}
        </p>
      </div>
    ))}
  </div>
)}
```

---

## API Integration

```ts
// Read current goals (server component)
const { data: profile } = await supabase
  .from('profiles')
  .select('life_goals')
  .eq('id', user.id)
  .single()

// Save goals (client action)
const { error } = await supabase
  .from('profiles')
  .update({ life_goals: selectedGoals })
  .eq('id', userId)
```

---

## Design Checklist

- [ ] Pill tag `PERSONALIZATION` in `var(--font-mono)` above headline
- [ ] Headline in `var(--font-primary)` uppercase
- [ ] Cards use `clip-path: var(--cut-sm)` cut shape
- [ ] Selected cards: `var(--color-y2k-blue)` background
- [ ] Max 3 selection warning shown in `var(--color-spiced-life)`
- [ ] Save button uses `var(--shape-asymmetric-md)`
- [ ] Goals explainer section shown when goals are selected
- [ ] Goals persisted to `profiles.life_goals` via Supabase
- [ ] No hardcoded hex values or font strings
