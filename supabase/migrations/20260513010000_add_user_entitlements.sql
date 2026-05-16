-- Three-plan billing model:
-- - single_reading: one-time purchase that grants one paid reading credit
-- - explorer_monthly: recurring Stripe subscription
-- - founder_lifetime: one-time purchase that grants lifetime unlimited access

CREATE TABLE IF NOT EXISTS public.user_entitlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL CHECK (plan_code IN ('single_reading', 'explorer_monthly', 'founder_lifetime')),
  source TEXT NOT NULL DEFAULT 'stripe',
  stripe_customer_id TEXT,
  stripe_session_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  remaining_credits INTEGER CHECK (remaining_credits IS NULL OR remaining_credits >= 0),
  unlimited BOOLEAN NOT NULL DEFAULT false,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_entitlements_user_id ON public.user_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_entitlements_status ON public.user_entitlements(status);
CREATE INDEX IF NOT EXISTS idx_user_entitlements_plan_code ON public.user_entitlements(plan_code);
CREATE INDEX IF NOT EXISTS idx_user_entitlements_stripe_subscription_id
  ON public.user_entitlements(stripe_subscription_id);

ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own entitlements" ON public.user_entitlements;
CREATE POLICY "Users can read own entitlements"
  ON public.user_entitlements FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own entitlements" ON public.user_entitlements;
DROP POLICY IF EXISTS "Users can insert own entitlements" ON public.user_entitlements;
DROP POLICY IF EXISTS "Users can update own entitlements" ON public.user_entitlements;
DROP POLICY IF EXISTS "Users can delete own entitlements" ON public.user_entitlements;

-- Billing records are service-role managed. Users may inspect their own
-- subscription state, but must not be able to grant themselves access.
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can read own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can read own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);
