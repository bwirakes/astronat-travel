-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

-- Create the stripe wrapper definition
CREATE FOREIGN DATA WRAPPER stripe_wrapper
  HANDLER stripe_fdw_handler
  VALIDATOR stripe_fdw_validator;

-- Add a column to profiles to link to Strip Customer
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

-- Import foreign schema
IMPORT FOREIGN SCHEMA stripe 
  LIMIT TO ("customers", "subscriptions", "checkout_sessions", "products", "prices") 
  FROM SERVER stripe_server 
  INTO stripe;

-- Create a secure public view that joins profiles to their active subscriptions
-- This means we can query `supabase.from('user_subscription_status')` directly from our Next.js backend!
CREATE OR REPLACE VIEW public.user_subscription_status AS
  SELECT 
    p.id AS user_id,
    s.id AS subscription_id,
    s.attrs->>'status' AS status,
    s.current_period_end
  FROM public.profiles p
  JOIN stripe.subscriptions s ON s.customer = p.stripe_customer_id
  WHERE s.attrs->>'status' IN ('active', 'trialing');

-- Grant select to authenticated users so they can read their own status
GRANT SELECT ON public.user_subscription_status TO authenticated, service_role;

