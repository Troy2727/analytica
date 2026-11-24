-- The tracking script now sends its session id with every request, and
-- reports engaged (visible and focused) time per page. Apply this before
-- deploying the matching /api/track route: it writes client_session_id.

ALTER TABLE page_views ADD COLUMN client_session_id TEXT;
ALTER TABLE visits ADD COLUMN client_session_id TEXT;

CREATE INDEX idx_page_views_domain_session ON page_views(domain, client_session_id);
CREATE INDEX idx_visits_website_session ON visits(website_id, client_session_id);

CREATE TABLE page_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  page TEXT,
  client_session_id TEXT NOT NULL,
  engaged_ms INTEGER NOT NULL CHECK (engaged_ms > 0 AND engaged_ms <= 1800000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_page_engagement_domain_created ON page_engagement(domain, created_at);
CREATE INDEX idx_page_engagement_domain_session ON page_engagement(domain, client_session_id);

ALTER TABLE page_engagement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert page_engagement" ON page_engagement
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners read page_engagement" ON page_engagement
  FOR SELECT USING (
    domain IN (SELECT name FROM websites WHERE user_id = (SELECT auth.uid()))
  );
