-- ─── Clear stale placementImplications from ephemeris_data ─────────────────
-- The old format was "With your natal X in Y in your Nth house of..."
-- The new Gemini prompt returns "[Sign] [Planet] means that..."
-- Nulling placementImplications forces a fresh interpretation fetch on next visit.

UPDATE public.natal_charts
SET ephemeris_data = ephemeris_data - 'placementImplications'
WHERE ephemeris_data ? 'placementImplications';
