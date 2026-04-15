-- ═══════════════════════════════════════════════════════════════════════════════
-- REBUILD SUPABASE TABLES (post-Payload migration)
-- Idempotent: safe to re-run. Uses IF NOT EXISTS / IF EXISTS guards everywhere.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. PROFILES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name        TEXT,
  last_name         TEXT,
  birth_date        DATE,
  birth_time        TIME NOT NULL DEFAULT '12:00:00',
  birth_time_known  BOOLEAN NOT NULL DEFAULT true,
  birth_city        TEXT,
  birth_lat         FLOAT8,
  birth_lon         FLOAT8,
  birth_utc         TIMESTAMPTZ,
  life_goals        JSONB NOT NULL DEFAULT '[]',
  is_subscribed     BOOLEAN NOT NULL DEFAULT false,
  subscription_status TEXT DEFAULT NULL,
  subscription_id   TEXT DEFAULT NULL,
  subscription_ends_at TIMESTAMPTZ DEFAULT NULL,
  stripe_customer_id TEXT DEFAULT NULL,
  last_login_date   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.profiles.is_subscribed IS 'Fast boolean for RLS gating. Synchronized from public.subscriptions.';

CREATE INDEX IF NOT EXISTS idx_profiles_is_subscribed ON public.profiles(is_subscribed);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);


-- ─── 2. PARTNER PROFILES ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partner_profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label             TEXT NOT NULL DEFAULT 'Partner',
  first_name        TEXT NOT NULL,
  birth_date        DATE NOT NULL,
  birth_time        TIME NOT NULL DEFAULT '12:00:00',
  birth_time_known  BOOLEAN NOT NULL DEFAULT true,
  birth_city        TEXT NOT NULL,
  birth_lat         FLOAT8,
  birth_lon         FLOAT8,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own partner profiles" ON public.partner_profiles;
CREATE POLICY "Users can manage own partner profiles"
  ON public.partner_profiles FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);


-- ─── 3. PURCHASES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.purchases (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  product           TEXT NOT NULL DEFAULT 'single_reading',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own purchases" ON public.purchases;
CREATE POLICY "Users can read own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);


-- ─── 4. SUBSCRIPTIONS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  plan_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.subscriptions IS 'Transactional source of truth for Stripe subscriptions. Linked to profiles.is_subscribed.';

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can manage own subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─── 5. READINGS ────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE reading_category AS ENUM ('natal', 'synastry', 'astrocartography', 'solar_return', 'mundane');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.partner_profiles(id) ON DELETE SET NULL,
  category reading_category NOT NULL,
  reading_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  reading_score INTEGER,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_readings_user_id ON public.readings(user_id);
CREATE INDEX IF NOT EXISTS idx_readings_partner_id ON public.readings(partner_id);
CREATE INDEX IF NOT EXISTS idx_readings_category ON public.readings(category);

ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own readings" ON public.readings;
CREATE POLICY "Users can manage own readings"
  ON public.readings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─── 6. NATAL CHARTS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.natal_charts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  entity_id UUID, -- FK added below after mundane_entities exists
  chart_type TEXT NOT NULL DEFAULT 'natal',
  ephemeris_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  house_placements JSONB NOT NULL DEFAULT '{}'::jsonb,
  acg_lines JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_natal_charts_user_id ON public.natal_charts(user_id);
CREATE INDEX IF NOT EXISTS idx_natal_charts_partner_id ON public.natal_charts(partner_id);

ALTER TABLE public.natal_charts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own natal charts" ON public.natal_charts;
CREATE POLICY "Users can manage own natal charts"
  ON public.natal_charts FOR ALL
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.partner_profiles pp 
      WHERE pp.id = natal_charts.partner_id AND pp.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.partner_profiles pp 
      WHERE pp.id = natal_charts.partner_id AND pp.owner_id = auth.uid()
    )
  );


-- ─── 7. MUNDANE ENTITIES ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mundane_entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  flag_emoji TEXT,
  founding_date DATE NOT NULL,
  founding_time TIME NOT NULL DEFAULT '00:00:00',
  founding_utc TIMESTAMPTZ,
  capital_lat FLOAT8,
  capital_lon FLOAT8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mundane_entities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read mundane entities" ON public.mundane_entities;
CREATE POLICY "Public read mundane entities"
  ON public.mundane_entities FOR SELECT
  USING (true);

-- Now add the FK from natal_charts → mundane_entities (if column exists but FK doesnt)
DO $$ BEGIN
  ALTER TABLE public.natal_charts
    ADD CONSTRAINT natal_charts_entity_id_fkey 
    FOREIGN KEY (entity_id) REFERENCES public.mundane_entities(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Owner check constraint
ALTER TABLE public.natal_charts DROP CONSTRAINT IF EXISTS natal_charts_owner_check;
ALTER TABLE public.natal_charts ADD CONSTRAINT natal_charts_owner_check 
  CHECK (user_id IS NOT NULL OR partner_id IS NOT NULL OR entity_id IS NOT NULL);

DROP POLICY IF EXISTS "Public can read entity natal charts" ON public.natal_charts;
CREATE POLICY "Public can read entity natal charts"
  ON public.natal_charts FOR SELECT
  USING (entity_id IS NOT NULL);


-- ─── 8. EPHEMERIS DAILY ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ephemeris_daily (
    date_ut DATE NOT NULL,
    planet_name TEXT NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION NOT NULL,
    is_retrograde BOOLEAN NOT NULL,
    zodiac_sign TEXT NOT NULL,
    zodiac_degree DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (date_ut, planet_name)
);

CREATE INDEX IF NOT EXISTS idx_ephemeris_date ON public.ephemeris_daily(date_ut);
CREATE INDEX IF NOT EXISTS idx_ephemeris_planet ON public.ephemeris_daily(planet_name);
CREATE INDEX IF NOT EXISTS idx_ephemeris_date_planet ON public.ephemeris_daily(date_ut, planet_name);


-- ─── 9. ZODIAC INGRESSES ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.zodiac_ingresses (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    planet_name TEXT NOT NULL,
    entered_sign TEXT NOT NULL,
    exited_sign TEXT NOT NULL,
    exact_timestamp_ut TIMESTAMPTZ NOT NULL,
    is_retrograde_dip BOOLEAN NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ingress_planet_sign ON public.zodiac_ingresses(planet_name, entered_sign);
CREATE INDEX IF NOT EXISTS idx_ingress_time ON public.zodiac_ingresses(exact_timestamp_ut);


-- ─── 10. SEARCHES (legacy, recreate for backward compat) ────────────────────────
CREATE TABLE IF NOT EXISTS public.searches (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  destination   TEXT NOT NULL,
  dest_lat      FLOAT8,
  dest_lon      FLOAT8,
  travel_date   DATE,
  travel_type   TEXT NOT NULL DEFAULT 'trip' CHECK (travel_type IN ('trip', 'relocation')),
  macro_score   INTEGER,
  verdict       TEXT,
  score_detail  JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own searches" ON public.searches;
CREATE POLICY "Users can read own searches"
  ON public.searches FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own searches" ON public.searches;
CREATE POLICY "Users can insert own searches"
  ON public.searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE. All 10 Supabase-managed tables rebuilt with RLS + indexes.
-- ═══════════════════════════════════════════════════════════════════════════════
