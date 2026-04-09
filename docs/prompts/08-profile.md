# Prompt 08 — User Profile

**Phase:** 1 | **Deadline:** May 14, 2026 | **Priority:** P1

---

## Read These First

1. **`.agents/skills/astro-design/SKILL.md`** — Design system. Read fully before any UI work.
2. **`app/globals.css`** — CSS tokens. Never hardcode values.
3. **`docs/prd/mvp-requirements.md`** — Data model Section.
4. **`docs/prompts/01-database.md`** — The `profiles` schema defines exactly what data is editable here.

---

## What to Build

**Route:** `app/profile/page.tsx`

A standalone page where authenticated users can view and edit their core birth data (Identity) and manage their account.

### Why is this separate from Life Goals (`app/goals`)?
Life Goals (`05-life-goals.md`) are the optimization targets. They change frequently based on what a user wants *right now*. 
Birth data (Profile) is immutable data about the user. It changes rarely (only if they made a mistake during onboarding).

---

## UI Layout

```
app/profile/
  page.tsx          ← Server component (fetch profile)
  ProfileForm.tsx   ← Client component (edit and save)
```

### Page Header
- Pill tag: `ACCOUNT` (`var(--font-mono)`)
- Headline: `"Your Profile"` — `var(--font-primary)`, uppercase
- Sub-line: `"Manage your birth data and account settings."`

### Section 1: Birth Data Form

Reuse the clean form styling (same input classes as `07-couples-family.md`):

```tsx
<section style={{ background: 'var(--surface)', padding: 'var(--space-xl)', border: '1px solid var(--surface-border)' }}>
  <div className="input-group">
    <label className="input-label">First name</label>
    <input type="text" className="input-field" defaultValue={profile.first_name} />
  </div>

  <div className="input-group">
    <label className="input-label">Date of birth</label>
    <input type="date" className="input-field" defaultValue={profile.birth_date} />
  </div>

  <div className="input-group">
    <label className="input-label">Time of birth</label>
    <input type="time" className="input-field" defaultValue={profile.birth_time} />
    <label style={{ fontSize:'0.7rem', color:'var(--text-tertiary)' }}>
      <input type="checkbox" defaultChecked={!profile.birth_time_known} /> I don't know the time (will use 12:00 noon)
    </label>
  </div>

  <div className="input-group">
    <label className="input-label">City of birth</label>
    {/* Autocomplete pointing to /api/geocode */}
    <input type="text" className="input-field" defaultValue={profile.birth_city} />
  </div>

  <button className="btn btn-primary" style={{ borderRadius: 'var(--shape-asymmetric-md)' }} onClick={saveProfile}>
    Save changes →
  </button>
</section>
```

> ⚠️ **Important:** If the user changes their birth data, be sure to clear the `natal_cache` column on their `profiles` row so the app recalculates their base chart on the next reading.

### Section 2: Account Management

Below the birth data, show a simple section for Supabase Auth management:

```tsx
<section style={{ marginTop: 'var(--space-xl)', padding: 'var(--space-xl)' }}>
  <h3 style={{ fontFamily: 'var(--font-secondary)', fontSize: '1.25rem', marginBottom: 'var(--space-md)' }}>
    Account
  </h3>
  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
    Logged in as {user.email}
  </p>
  
  <button className="btn" style={{ background: 'var(--color-charcoal)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)' }} onClick={signOut}>
    Sign out
  </button>
</section>
```

---

## Navigation Integration

In the top navigation bar (or App Home header), the user's avatar or name should link to `/profile`.

```tsx
<Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-y2k-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-primary)' }}>
    {profile.first_name[0]}
  </div>
  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>Profile</span>
</Link>
```

---

## Database Integration

```ts
// Update profile
const { error } = await supabase
  .from('profiles')
  .update({
    first_name: newName,
    birth_date: newDate,
    birth_time: newTime,
    birth_time_known: newTimeKnown,
    birth_city: newCity,
    birth_lat: newLat,
    birth_lon: newLon,
    natal_cache: null // CRITICAL: clear the cache if they change birth info
  })
  .eq('id', user.id)
```

---

## Design Checklist

- [ ] Page header uses `var(--font-primary)`
- [ ] Forms use standard `.input-field`, `.input-label`, `.input-group` classes
- [ ] Save button uses `var(--shape-asymmetric-md)` corner shapes
- [ ] Sign out button prominently visible
- [ ] Changing birth data clears the `natal_cache` column
- [ ] Avatar link added to navigation/header
