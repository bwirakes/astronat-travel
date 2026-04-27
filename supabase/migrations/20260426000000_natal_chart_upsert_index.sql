-- ─── NATAL CHARTS: unique constraint for upsert support ────────────────────────
-- Without this, saveNatalChart's upsert can't de-duplicate on (user_id, chart_type).
-- Also de-dupes any existing duplicate rows first (keep newest per user+type).

-- Step 1: Remove duplicate rows keeping only the most recently created per user+chart_type
DELETE FROM public.natal_charts nc
WHERE nc.id NOT IN (
  SELECT DISTINCT ON (user_id, chart_type) id
  FROM public.natal_charts
  WHERE user_id IS NOT NULL
  ORDER BY user_id, chart_type, created_at DESC
)
AND user_id IS NOT NULL;

-- Step 2: Add unique constraint (idempotent)
DO $$ BEGIN
  ALTER TABLE public.natal_charts
    ADD CONSTRAINT natal_charts_user_chart_type_unique UNIQUE (user_id, chart_type);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Step 3: Add updated_at column if it doesn't exist yet
DO $$ BEGIN
  ALTER TABLE public.natal_charts ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;
