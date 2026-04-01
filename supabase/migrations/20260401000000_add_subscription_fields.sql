-- ─── Add subscription tracking fields to profiles ───────────────────────────
-- Tracks whether a user has an active paid subscription and when it expires.
-- These are written by the Stripe webhook (service role) and read server-side.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_subscribed       BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT        DEFAULT NULL,          -- 'active' | 'trialing' | 'past_due' | 'canceled' | null
  ADD COLUMN IF NOT EXISTS subscription_id     TEXT        DEFAULT NULL,          -- Stripe subscription ID
  ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ DEFAULT NULL;         -- current_period_end from Stripe

-- Index for fast lookups on subscription status
CREATE INDEX IF NOT EXISTS idx_profiles_is_subscribed ON public.profiles(is_subscribed);
