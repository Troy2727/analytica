-- One read-only public link per website. The token is generated here (two
-- random UUIDs, 64 hex characters), never by the client. Owners create, read
-- and revoke their links under RLS; the public share page and its data route
-- check tokens on the server with the service role, so anon gets no access.
-- Apply manually to the live Supabase project; the feature is inert until then.

CREATE TABLE share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL UNIQUE REFERENCES websites(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage share_links" ON share_links
  FOR ALL
  USING (website_id IN (SELECT id FROM websites WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (website_id IN (SELECT id FROM websites WHERE user_id = (SELECT auth.uid())));

-- Clients may only name the website when creating a link; the token is always the default.
REVOKE ALL ON share_links FROM anon, authenticated;
GRANT SELECT, DELETE ON share_links TO authenticated;
GRANT INSERT (website_id) ON share_links TO authenticated;
