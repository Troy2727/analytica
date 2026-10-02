-- page_views and visits were readable by anyone holding the public anon key.
-- Only the owner of a website may read its analytics. Inserts stay public so
-- the tracking script keeps working.
DROP POLICY "Public read page_views" ON page_views;
DROP POLICY "Public read visits" ON visits;

CREATE POLICY "Owners read page_views" ON page_views
  FOR SELECT USING (
    domain IN (SELECT name FROM websites WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Owners read visits" ON visits
  FOR SELECT USING (
    website_id IN (SELECT name FROM websites WHERE user_id = (SELECT auth.uid()))
  );
