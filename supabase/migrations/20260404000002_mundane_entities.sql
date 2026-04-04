-- ─── 1. Mundane Entities Table ───────────────────────────
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

-- RLS: Public read, No write except by server
ALTER TABLE public.mundane_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read mundane entities"
  ON public.mundane_entities FOR SELECT
  USING (true);

-- ─── 2. Add entity_id to natal_charts ────────────────────
ALTER TABLE public.natal_charts
  ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES public.mundane_entities(id) ON DELETE CASCADE;

-- Update constraint to allow entity_id as a valid owner
ALTER TABLE public.natal_charts DROP CONSTRAINT IF EXISTS natal_charts_owner_check;
ALTER TABLE public.natal_charts ADD CONSTRAINT natal_charts_owner_check 
  CHECK (user_id IS NOT NULL OR partner_id IS NOT NULL OR entity_id IS NOT NULL);

-- Update RLS to allow public to view entity natal charts
-- Since we already have an RLS policy for "Users can manage own natal charts", we add one for reading entities.
CREATE POLICY "Public can read entity natal charts"
  ON public.natal_charts FOR SELECT
  USING (entity_id IS NOT NULL);
