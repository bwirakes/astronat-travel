# Prompt 07 — Profile Persistence (Supabase PostgreSQL)

**Phase:** 1 | **Deadline:** May 14, 2026 | **Priority:** P0

---

## Read These First

1. **`docs/prd/mvp-requirements.md`** — Data model section. Schema is defined here.
2. **`docs/prd/onboarding-flow.md`** — "Data captured → DB" notes on each screen.
3. **`lib/supabase/client.ts`** and **`lib/supabase/server.ts`** — Created in Prompt 01 (Auth).

> This prompt assumes the Supabase client helpers from `01-auth.md` are already set up.

---

## What to Build

The database layer that persists all user data collected during Phase 1 flows.

---

## Schema

Run these migrations in the Supabase SQL editor (Dashboard → SQL Editor):

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── profiles ───────────────────────────────────────────────────
-- One row per user. Linked to Supabase auth.users via id.
CREATE TABLE public.profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name        TEXT NOT NULL,
  birth_date        DATE NOT NULL,
  birth_time        TIME NOT NULL DEFAULT '12:00:00',
  birth_time_known  BOOLEAN NOT NULL DEFAULT true,
  birth_city        TEXT NOT NULL,
  birth_lat         FLOAT8,
  birth_lon         FLOAT8,
  life_goals        JSONB NOT NULL DEFAULT '[]',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── searches ───────────────────────────────────────────────────
-- One row per destination a user has scored.
CREATE TABLE public.searches (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  destination   TEXT NOT NULL,
  dest_lat      FLOAT8,
  dest_lon      FLOAT8,
  travel_date   DATE,
  travel_type   TEXT NOT NULL DEFAULT 'trip' CHECK (travel_type IN ('trip', 'relocation')),
  macro_score   INTEGER,
  verdict       TEXT,
  score_detail  JSONB,  -- full house-matrix result
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── partner_profiles ───────────────────────────────────────────
-- Lightweight partner data for couples scoring (no auth required).
CREATE TABLE public.partner_profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label             TEXT NOT NULL DEFAULT 'Partner',  -- "Partner", "Spouse", etc.
  first_name        TEXT NOT NULL,
  birth_date        DATE NOT NULL,
  birth_time        TIME NOT NULL DEFAULT '12:00:00',
  birth_time_known  BOOLEAN NOT NULL DEFAULT true,
  birth_city        TEXT NOT NULL,
  birth_lat         FLOAT8,
  birth_lon         FLOAT8,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── purchases ──────────────────────────────────────────────────
-- Filled by Phase 2 (Stripe webhook). Create now so schema is ready.
CREATE TABLE public.purchases (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  product           TEXT NOT NULL DEFAULT 'single_reading',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Row-Level Security (RLS)

Enable RLS on all tables and add policies:

```sql
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- profiles: users can only see/edit their own row
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- searches: users can only see/edit their own searches
CREATE POLICY "Users can read own searches"
  ON public.searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own searches"
  ON public.searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- partner_profiles: same — users can only see/edit their own partner profiles
CREATE POLICY "Users can manage own partner profiles"
  ON public.partner_profiles FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- purchases: users can only see their own purchases
CREATE POLICY "Users can read own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);
```

---

## TypeScript Types

Create `lib/types/database.ts`:

```ts
export type Profile = {
  id: string
  first_name: string
  birth_date: string         // ISO date string "YYYY-MM-DD"
  birth_time: string         // "HH:MM:SS"
  birth_time_known: boolean
  birth_city: string
  birth_lat: number | null
  birth_lon: number | null
  life_goals: string[]
  created_at: string
  updated_at: string
}

export type Search = {
  id: string
  user_id: string
  destination: string
  dest_lat: number | null
  dest_lon: number | null
  travel_date: string | null
  travel_type: 'trip' | 'relocation'
  macro_score: number | null
  verdict: string | null
  score_detail: Record<string, unknown> | null
  created_at: string
}

export type PartnerProfile = {
  id: string
  owner_id: string
  label: string
  first_name: string
  birth_date: string
  birth_time: string
  birth_time_known: boolean
  birth_city: string
  birth_lat: number | null
  birth_lon: number | null
  created_at: string
}

export type Purchase = {
  id: string
  user_id: string
  stripe_session_id: string | null
  product: string
  created_at: string
}
```

---

## Data Access Helpers

Create `lib/db.ts` with typed helper functions:

```ts
import { createClient } from '@/lib/supabase/server'
import type { Profile, Search, PartnerProfile } from '@/lib/types/database'

// Get authenticated user's profile
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}

// Create profile after first signup
export async function createProfile(profile: Omit<Profile, 'created_at' | 'updated_at'>): Promise<Profile | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single()
  return data
}

// Update life goals
export async function updateLifeGoals(userId: string, goals: string[]): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('profiles')
    .update({ life_goals: goals, updated_at: new Date().toISOString() })
    .eq('id', userId)
}

// Save a destination search + score
export async function saveSearch(search: Omit<Search, 'id' | 'created_at'>): Promise<Search | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('searches')
    .insert(search)
    .select()
    .single()
  return data
}

// Get recent searches for App Home
export async function getRecentSearches(userId: string, limit = 3): Promise<Search[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('searches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

// Save a partner profile
export async function savePartnerProfile(partner: Omit<PartnerProfile, 'id' | 'created_at'>): Promise<PartnerProfile | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('partner_profiles')
    .insert(partner)
    .select()
    .single()
  return data
}

// Get partner profiles for couples flow
export async function getPartnerProfiles(ownerId: string): Promise<PartnerProfile[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('partner_profiles')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
  return data ?? []
}
```

---

## Wire Up Flows

After creating the schema and helpers, wire them up across Phase 1 features:

| Feature | DB Action |
|---------|----------|
| Onboarding Screen 2 | `createProfile()` with birth data |
| Onboarding Screen 4 | `updateLifeGoals()` |
| Onboarding Screen 6 | `saveSearch()` with macroScore + verdict |
| App Home | `getRecentSearches()` for "Recent Readings" |
| Life Goals page | `updateLifeGoals()` on save |
| Couples flow | `savePartnerProfile()` on form submit |
| Birthday Optimizer | `saveSearch()` with birthday date + scores |

---

## Verification Checklist

- [ ] All 4 tables created in Supabase SQL editor
- [ ] RLS enabled on all tables, all policies applied
- [ ] TypeScript types in `lib/types/database.ts`
- [ ] Helper functions in `lib/db.ts`
- [ ] Onboarding Screen 2 creates profile on submit
- [ ] Onboarding Screen 4 saves life goals
- [ ] Onboarding Screen 6 saves search + score
- [ ] App Home loads recent searches from DB
- [ ] Life Goals page reads from and writes to `profiles.life_goals`
- [ ] Couples flow saves partner profile
