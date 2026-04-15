-- ─── 1. Add fields to profiles ───────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS last_login_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS birth_utc TIMESTAMPTZ;

-- ─── 2. Subscriptions Table ──────────────────────────────
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

-- Index for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);

-- RLS for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- ─── 3. Readings Table ───────────────────────────────────
-- Replacing old searches table conceptual usage
CREATE TYPE reading_category AS ENUM ('natal', 'synastry', 'astrocartography', 'solar_return', 'mundane');

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

-- Indexes for readings
CREATE INDEX IF NOT EXISTS idx_readings_user_id ON public.readings(user_id);
CREATE INDEX IF NOT EXISTS idx_readings_partner_id ON public.readings(partner_id);
CREATE INDEX IF NOT EXISTS idx_readings_category ON public.readings(category);

-- RLS for readings
ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own readings"
  ON public.readings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── 4. Natal Charts Caching Table ───────────────────────
CREATE TABLE IF NOT EXISTS public.natal_charts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  chart_type TEXT NOT NULL DEFAULT 'natal', -- 'natal', 'composite'
  ephemeris_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  house_placements JSONB NOT NULL DEFAULT '{}'::jsonb,
  acg_lines JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT natal_charts_owner_check CHECK (user_id IS NOT NULL OR partner_id IS NOT NULL)
);

-- Indexes for natal_charts
CREATE INDEX IF NOT EXISTS idx_natal_charts_user_id ON public.natal_charts(user_id);
CREATE INDEX IF NOT EXISTS idx_natal_charts_partner_id ON public.natal_charts(partner_id);

-- RLS for natal_charts
ALTER TABLE public.natal_charts ENABLE ROW LEVEL SECURITY;

-- Note: Since partner_profiles is owned by the user, if the natal_chart belongs to a partner_profile,
-- the user should be able to view it. But for speed and simplicity, we allow the main user to manage 
-- natal_charts where user_id matches their auth.uid() OR where the partner_id belongs to a partner_profile they own.

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

-- Note: we do NOT drop `searches` right away to prevent breaking the live UI until the frontend migrates entirely to `readings`.
