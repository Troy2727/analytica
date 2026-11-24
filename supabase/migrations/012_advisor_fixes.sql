-- Fixes from `supabase db advisors`.

-- Trigger functions were callable over /rest/v1/rpc by anyone. Triggers keep
-- firing without EXECUTE; the privilege is only checked when one is created.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_demo_auth_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_demo_website() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_demo_discord_id() FROM PUBLIC, anon, authenticated;

-- auth.uid() was re-evaluated for every row; wrapped in a SELECT it runs once per query.
ALTER POLICY "Users manage own websites" ON websites
  USING ((SELECT auth.uid())::text = user_id::text);

ALTER POLICY "Users manage own events" ON events
  USING (
    domain IN (
      SELECT name FROM websites WHERE user_id::text = (SELECT auth.uid())::text
    )
  );

ALTER POLICY "Users manage own data" ON users
  USING ((SELECT auth.uid())::text = id::text);
