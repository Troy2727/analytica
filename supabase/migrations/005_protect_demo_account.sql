-- The demo account's password is published in the README. Keep visitors from
-- locking others out, deleting the demo site, or pointing the Discord bot at
-- arbitrary users.
CREATE OR REPLACE FUNCTION public.protect_demo_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.email = 'demo@example.com' AND (
    NEW.encrypted_password IS DISTINCT FROM OLD.encrypted_password
    OR NEW.email IS DISTINCT FROM OLD.email
    OR NEW.email_change IS DISTINCT FROM OLD.email_change
  ) THEN
    RAISE EXCEPTION 'The demo account cannot change its email or password';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_demo_auth_user
  BEFORE UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.protect_demo_auth_user();

CREATE OR REPLACE FUNCTION public.protect_demo_discord_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.email = 'demo@example.com' AND NEW.discord_id IS DISTINCT FROM OLD.discord_id THEN
    RAISE EXCEPTION 'The demo account cannot set a Discord ID';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_demo_discord_id
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.protect_demo_discord_id();

CREATE OR REPLACE FUNCTION public.protect_demo_website()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.name = 'analytica-phi.vercel.app'
     AND OLD.user_id = (SELECT id FROM public.users WHERE email = 'demo@example.com') THEN
    RAISE EXCEPTION 'The demo website cannot be deleted';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER protect_demo_website
  BEFORE DELETE ON public.websites
  FOR EACH ROW EXECUTE FUNCTION public.protect_demo_website();
