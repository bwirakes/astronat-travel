-- ─────────────────────────────────────────────────────────────────────────────
-- geodetic_predictions — shared, global catalog of weather predictions and
-- historical events surfaced on /weather. Not per-user. Manually curated.
-- ─────────────────────────────────────────────────────────────────────────────
-- Read: public (anon + authenticated, only is_published = true rows)
-- Write: service role only (no INSERT/UPDATE/DELETE policy for client roles)
--
-- Seed data lives in 20260516000100_geodetic_predictions_seed.sql so this
-- migration stays schema-only.

CREATE TABLE IF NOT EXISTS public.geodetic_predictions (
  id              TEXT PRIMARY KEY,

  -- WHEN
  prediction_date DATE NOT NULL,
  date_label      TEXT,

  -- WHAT
  title           TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  kind            TEXT NOT NULL DEFAULT 'forecast',

  -- SCORE
  pss             NUMERIC(4,3) NOT NULL,
  tier            TEXT NOT NULL,
  model_version   TEXT,

  -- WHERE
  area_label      TEXT,
  zones           JSONB NOT NULL DEFAULT '[]'::jsonb,
  bbox_lat_min    DOUBLE PRECISION,
  bbox_lat_max    DOUBLE PRECISION,
  bbox_lon_min    DOUBLE PRECISION,
  bbox_lon_max    DOUBLE PRECISION,

  -- ASTRO FINGERPRINT
  stars           JSONB NOT NULL DEFAULT '[]'::jsonb,
  pair            TEXT,
  geostress       TEXT,
  criteria        JSONB NOT NULL DEFAULT '{}'::jsonb,
  combo           TEXT,

  -- EDITORIAL
  notes           TEXT,
  editorial_body  TEXT,

  -- OUTCOME (historical rows)
  severity        INTEGER,
  deaths          INTEGER,
  damage_billions NUMERIC,
  source          TEXT,
  source_note     TEXT,

  -- LIFECYCLE
  is_published    BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints mirror weather-types.ts enums (flood, wildfire, storm_cyclone,
  -- earthquake, heatwave, tornado, winter_storm, compound) and the tier ramp
  -- defined in tierFromPss (critical, high, moderate, watch, low).
  CONSTRAINT geodetic_predictions_pss_range
    CHECK (pss >= 0 AND pss <= 1),
  CONSTRAINT geodetic_predictions_kind_valid
    CHECK (kind IN ('forecast', 'historical')),
  CONSTRAINT geodetic_predictions_tier_valid
    CHECK (tier IN ('critical', 'high', 'moderate', 'watch', 'low')),
  CONSTRAINT geodetic_predictions_event_type_valid
    CHECK (event_type IN (
      'flood', 'wildfire', 'storm_cyclone', 'earthquake',
      'heatwave', 'tornado', 'winter_storm', 'compound'
    ))
);

CREATE INDEX IF NOT EXISTS idx_geodetic_predictions_date
  ON public.geodetic_predictions (prediction_date DESC);
CREATE INDEX IF NOT EXISTS idx_geodetic_predictions_type
  ON public.geodetic_predictions (event_type);
CREATE INDEX IF NOT EXISTS idx_geodetic_predictions_tier
  ON public.geodetic_predictions (tier);
CREATE INDEX IF NOT EXISTS idx_geodetic_predictions_kind_published
  ON public.geodetic_predictions (kind) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_geodetic_predictions_pss
  ON public.geodetic_predictions (pss DESC);

-- Auto-bump updated_at on row update.
CREATE OR REPLACE FUNCTION public.geodetic_predictions_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_geodetic_predictions_updated_at
  ON public.geodetic_predictions;
CREATE TRIGGER trg_geodetic_predictions_updated_at
  BEFORE UPDATE ON public.geodetic_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.geodetic_predictions_touch_updated_at();

-- RLS: public read of published rows; writes via service role only.
ALTER TABLE public.geodetic_predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone reads published predictions"
  ON public.geodetic_predictions;
CREATE POLICY "anyone reads published predictions"
  ON public.geodetic_predictions FOR SELECT
  USING (is_published = true);

-- Anon + authenticated explicit SELECT grant (the policy gates rows; the grant
-- gates the role being allowed to SELECT at all).
GRANT SELECT ON public.geodetic_predictions TO anon, authenticated;
