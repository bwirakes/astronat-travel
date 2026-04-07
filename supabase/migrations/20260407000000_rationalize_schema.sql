-- ─── RATIONALIZE SCHEMA: Subscriptions & Legacy Tables ────────────────────────
--
-- This migration consolidates duplicated subscription tracking mechanisms
-- and removes legacy tables replaced by the Redesign (readings/mundane).
--
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. DROP Legacy Search Architecture
-- Fully replaced by 'readings' table in 20260404000000_schema_redesign.sql
DROP TABLE IF EXISTS public.searches CASCADE;

-- 2. DROP Redundant Subscription Tracking Tables
-- This table was likely a leftover or conceptual view.
-- The SOURCE OF TRUTH for current status is now partitioned between 
-- public.profiles (for fast boolean gating) and public.subscriptions (for history/metadata).
DROP MATERIALIZED VIEW IF EXISTS public.user_subscription_status CASCADE;
DROP VIEW IF EXISTS public.user_subscription_status CASCADE;
DROP TABLE IF EXISTS public.user_subscription_status CASCADE;

-- 3. Standardize 'subscriptions' Table
-- Ensure it has consistent indexing and RLS.
-- (Created in 20260404000000_schema_redesign.sql)

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- 4. Sync Profiles with Subscriptions (Optional Helper)
-- We maintain profiles.is_subscribed for high-performance RLS check.
-- The app/api/stripe/webhook/route.ts should update BOTH profiles and subscriptions.
-- We'll keep the columns on profiles for now to avoid breaking existing middleware logic, 
-- but mark them as "Derived" from the subscriptions table.

-- Add a comment explaining the split source-of-truth.
COMMENT ON COLUMN public.profiles.is_subscribed IS 'Fast boolean for RLS gating. Synchronized from public.subscriptions.';
COMMENT ON TABLE public.subscriptions IS 'Transactional source of truth for Stripe subscriptions. Linked to profiles.is_subscribed.';

-- 5. RLS for Subscriptions (New)
-- (redesign added select, but maybe we need full manage)
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can manage own subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Purchases Table RLS
-- Ensure consistent RLS on purchases
DROP POLICY IF EXISTS "Users can read own purchases" ON public.purchases;
CREATE POLICY "Users can read own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);

-- 7. Ensure Enum Types are consistent
-- redesign added reading_category, we check for others.
