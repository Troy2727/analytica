-- Real-user Core Web Vitals: one row per page load, sent by the tracking script
-- when the page is hidden or unloaded. A metric the browser can't measure (e.g.
-- LCP in older Safari) is NULL. Inserts are public like page_views; the CHECKs
-- bound the attacker-controlled fields. Apply before deploying the matching
-- /api/track route.

CREATE TABLE web_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  page TEXT NOT NULL CHECK (char_length(page) <= 2048),
  lcp_ms INTEGER CHECK (lcp_ms BETWEEN 0 AND 120000),
  inp_ms INTEGER CHECK (inp_ms BETWEEN 0 AND 120000),
  cls NUMERIC(8, 4) CHECK (cls BETWEEN 0 AND 100),
  fcp_ms INTEGER CHECK (fcp_ms BETWEEN 0 AND 120000),
  ttfb_ms INTEGER CHECK (ttfb_ms BETWEEN 0 AND 120000),
  country TEXT CHECK (country IS NULL OR char_length(country) <= 100),
  device_type TEXT CHECK (device_type IS NULL OR char_length(device_type) <= 50),
  browser_name TEXT CHECK (browser_name IS NULL OR char_length(browser_name) <= 50),
  client_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (COALESCE(lcp_ms, inp_ms, fcp_ms, ttfb_ms) IS NOT NULL OR cls IS NOT NULL)
);

CREATE INDEX idx_web_vitals_domain_created ON web_vitals(domain, created_at);

ALTER TABLE web_vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert web_vitals" ON web_vitals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners read web_vitals" ON web_vitals
  FOR SELECT USING (
    domain IN (SELECT name FROM websites WHERE user_id = (SELECT auth.uid()))
  );

-- Same demo-site protection as page_views and visits (see 011).
CREATE POLICY "Owners delete web_vitals" ON web_vitals
  FOR DELETE USING (
    domain IN (SELECT name FROM websites WHERE user_id = (SELECT auth.uid()))
    AND domain <> 'analytica-phi.vercel.app'
  );
