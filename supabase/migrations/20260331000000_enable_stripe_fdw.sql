-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

-- Create the stripe wrapper definition
CREATE FOREIGN DATA WRAPPER stripe_wrapper
  HANDLER stripe_fdw_handler
  VALIDATOR stripe_fdw_validator;

-- Add a column to profiles to link to Stripe Customer
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Create server dynamically using Vault so we don't leak plaintext keys into pg_foreign_server
DO $$
DECLARE
  key_id UUID;
BEGIN
  -- We use the safe test key provided by the user for local dev.
  -- In production, you would run this manually with your live secret key via the SQL Editor.
  SELECT vault.create_secret(
    'sk_test_51TGqA9DCYzkth9F11SkxPCVls5XeuxmF7I98f9EkYQuYpFyTK7KVaoC2JVQ71EMz8p54m0bSn4Q12WCchK8R8oY400NnkaDkwr', 
    'stripe_secret', 
    'Stripe API key for FDW'
  ) INTO key_id;
  
  EXECUTE format(
    'CREATE SERVER IF NOT EXISTS stripe_server FOREIGN DATA WRAPPER stripe_wrapper OPTIONS (api_url ''https://api.stripe.com/v1/'', api_key_id ''%s'')',
    key_id
  );
END $$;

-- Create secure schema
CREATE SCHEMA IF NOT EXISTS stripe;

-- Import foreign schema (for ADMIN / SQL-editor auditing use only — NOT used for auth gating)
IMPORT FOREIGN SCHEMA stripe 
  LIMIT TO ("customers", "subscriptions", "checkout_sessions", "products", "prices") 
  FROM SERVER stripe_server 
  INTO stripe;

-- ─── ARCHITECTURE DECISION: Subscription Source of Truth ─────────────────────
--
-- The stripe.* foreign tables above exist for ADMIN AUDITING only.
-- You can query them via the Supabase SQL Editor to inspect live Stripe data.
--
-- ❌ We deliberately do NOT expose a public view over stripe.subscriptions because:
--   1. Every query makes a live HTTP call to the Stripe API → slow & rate-limited.
--   2. Edge middleware (middleware.ts) cannot hit the DB directly, so a view is useless
--      for auth gating at the network edge.
--   3. RLS policies on foreign (FDW) tables are not enforced reliably.
--
-- ✅ WEBHOOK IS THE SOURCE OF TRUTH
--    The Stripe Webhook handler (app/api/stripe/webhook/route.ts) listens to:
--      • checkout.session.completed         → subscription created, mark active
--      • customer.subscription.created/updated → sync status + expiry
--      • customer.subscription.deleted       → mark canceled / revoke access
--
--    It writes directly into native Postgres columns on public.profiles:
--      - is_subscribed        BOOLEAN      (true when active | trialing)
--      - subscription_status  TEXT         ('active' | 'trialing' | 'past_due' | 'canceled')
--      - subscription_id      TEXT         (Stripe subscription ID for API lookups)
--      - subscription_ends_at TIMESTAMPTZ  (current_period_end; shown in UI as renewal date)
--
--    These columns are fast, local, and can be read by anything — middleware, RSCs,
--    client components. Added in: 20260401000000_add_subscription_fields.sql
-- ─────────────────────────────────────────────────────────────────────────────
