-- Restore the standard Supabase grants on schema public.
--
-- Root cause: a prior migration stripped default privileges, so the
-- `authenticated` and `anon` roles had no USAGE on schema public, which
-- caused PostgREST updates from the browser to fail with:
--   "permission denied for schema public"
-- RLS is already enabled on every table in this schema; these grants only
-- unlock the PostgREST transport layer and still defer row-level access
-- decisions to the policies defined in earlier migrations.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public
  TO anon, authenticated, service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public
  TO anon, authenticated, service_role;

GRANT ALL ON ALL FUNCTIONS IN SCHEMA public
  TO anon, authenticated, service_role;

-- Apply to objects created by future migrations.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
