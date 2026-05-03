-- Auto-create a profiles row whenever a user is created in auth.users.
-- This eliminates "ghost users" who exist in auth but never finished
-- onboarding — the row is now guaranteed at signup time, and onboarding
-- becomes a pure UPDATE rather than an INSERT.
--
-- Pulls first_name from Google OAuth metadata when available so the
-- onboarding form can pre-fill it.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'given_name',
      NEW.raw_user_meta_data->>'first_name',
      split_part(NEW.raw_user_meta_data->>'full_name', ' ', 1),
      split_part(NEW.raw_user_meta_data->>'name', ' ', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill any pre-existing auth users that are missing a profiles row.
-- Idempotent: ON CONFLICT DO NOTHING means re-running is safe.
INSERT INTO public.profiles (id)
SELECT u.id FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;
