-- Outbound link clicks and file downloads, sent automatically by the tracking
-- script. Kept apart from API-sent custom events (`events`): they never reach
-- the Events tab or Discord. Inserts are public like page_views; the CHECKs
-- bound the attacker-controlled fields. Apply before deploying the matching
-- /api/track route.

CREATE TABLE link_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('outbound', 'download')),
  -- Same shape the route stores: http(s), no whitespace, query or fragment.
  url TEXT NOT NULL CHECK (char_length(url) <= 2048 AND url ~ '^https?://' AND url !~ '[[:space:]?#]'),
  page TEXT CHECK (page IS NULL OR char_length(page) <= 2048),
  client_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_link_events_domain_created ON link_events(domain, created_at);

ALTER TABLE link_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert link_events" ON link_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners read link_events" ON link_events
  FOR SELECT USING (
    domain IN (SELECT name FROM websites WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Owners delete link_events" ON link_events
  FOR DELETE USING (
    domain IN (SELECT name FROM websites WHERE user_id = (SELECT auth.uid()))
  );
