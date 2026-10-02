-- website_id stores the site's domain (e.g. "example.com"), not a UUID.
-- The tracking/events routes insert the domain and every reader filters by it,
-- so the UUID type made every visits/events insert and query fail.
ALTER TABLE visits ALTER COLUMN website_id TYPE TEXT USING website_id::text;
ALTER TABLE events ALTER COLUMN website_id TYPE TEXT USING website_id::text;
