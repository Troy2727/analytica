-- JavaScript errors from visitors' browsers: one row per uncaught error or
-- unhandled promise rejection, sent by the tracking script (at most 10 per page
-- load). Inserts are public like page_views; the CHECKs bound the
-- attacker-controlled fields. Apply before deploying the matching /api/track route.

CREATE TABLE js_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  page TEXT NOT NULL CHECK (char_length(page) <= 2048),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  message TEXT NOT NULL CHECK (char_length(message) <= 1000),
  stack TEXT CHECK (stack IS NULL OR char_length(stack) <= 8000),
  file TEXT CHECK (file IS NULL OR char_length(file) <= 2048),
  line INTEGER CHECK (line IS NULL OR line >= 0),
  col INTEGER CHECK (col IS NULL OR col >= 0),
  country TEXT CHECK (country IS NULL OR char_length(country) <= 100),
  operating_system TEXT CHECK (operating_system IS NULL OR char_length(operating_system) <= 50),
  device_type TEXT CHECK (device_type IS NULL OR char_length(device_type) <= 50),
  browser_name TEXT CHECK (browser_name IS NULL OR char_length(browser_name) <= 50),
  client_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_js_errors_domain_created ON js_errors(domain, created_at);

ALTER TABLE js_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert js_errors" ON js_errors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners read js_errors" ON js_errors
  FOR SELECT USING (
    domain IN (SELECT name FROM websites WHERE user_id = (SELECT auth.uid()))
  );

-- Same demo-site protection as page_views and visits (see 011).
CREATE POLICY "Owners delete js_errors" ON js_errors
  FOR DELETE USING (
    domain IN (SELECT name FROM websites WHERE user_id = (SELECT auth.uid()))
    AND domain <> 'analytica-phi.vercel.app'
  );
