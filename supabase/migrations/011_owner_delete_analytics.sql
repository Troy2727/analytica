-- Deleting a website left its page_views and visits behind: both tables had no
-- DELETE policy, so RLS silently matched zero rows. Let owners delete them,
-- except for the demo site, whose password is public (see 005).
CREATE POLICY "Owners delete page_views" ON page_views
  FOR DELETE USING (
    domain IN (SELECT name FROM websites WHERE user_id = (SELECT auth.uid()))
    AND domain <> 'analytica-phi.vercel.app'
  );

CREATE POLICY "Owners delete visits" ON visits
  FOR DELETE USING (
    website_id IN (SELECT name FROM websites WHERE user_id = (SELECT auth.uid()))
    AND website_id <> 'analytica-phi.vercel.app'
  );
