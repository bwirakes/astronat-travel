CREATE TABLE IF NOT EXISTS public.scoring_test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_place TEXT NOT NULL,
  birth_lat DOUBLE PRECISION NOT NULL,
  birth_lon DOUBLE PRECISION NOT NULL,
  birth_date DATE NOT NULL,
  birth_time TIME NOT NULL,
  travel_location TEXT NOT NULL,
  travel_lat DOUBLE PRECISION NOT NULL,
  travel_lon DOUBLE PRECISION NOT NULL,
  travel_time TIME NOT NULL DEFAULT '12:00:00',
  travel_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  macro_score INTEGER NOT NULL,
  macro_verdict TEXT NOT NULL,
  house_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
  event_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_input JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_output JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scoring_test_results_user_id
  ON public.scoring_test_results(user_id);

CREATE INDEX IF NOT EXISTS idx_scoring_test_results_created_at
  ON public.scoring_test_results(created_at DESC);

ALTER TABLE public.scoring_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scoring test results"
  ON public.scoring_test_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scoring test results"
  ON public.scoring_test_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);
