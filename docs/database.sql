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
