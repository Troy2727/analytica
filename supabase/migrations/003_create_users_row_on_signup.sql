-- websites.user_id references users(id), but users rows were only created when
-- someone generated an API key in Settings, so "Add Website" failed for new users.
-- Create the row at sign-up and backfill existing accounts.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, COALESCE(NEW.email, ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.users (id, email)
SELECT id, COALESCE(email, '') FROM auth.users
ON CONFLICT (id) DO NOTHING;
