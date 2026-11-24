-- Goal and funnel definitions for a website. Only the definitions are stored;
-- conversions are computed in the browser from page views. Owner-only for
-- every operation (same auth.uid() form as 006); anon gets nothing.
-- Apply manually to the live Supabase project.

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  pattern TEXT NOT NULL CHECK (char_length(pattern) BETWEEN 1 AND 200 AND pattern LIKE '/%'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  steps TEXT[] NOT NULL CHECK (
    cardinality(steps) BETWEEN 2 AND 8
    AND array_position(steps, NULL) IS NULL
  ),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Array elements can't be checked with a subquery in a CHECK, so use a function.
CREATE FUNCTION public.valid_funnel_steps(steps TEXT[]) RETURNS BOOLEAN
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT bool_and(step LIKE '/%' AND char_length(step) <= 200) FROM unnest(steps) AS step
$$;
ALTER TABLE funnels ADD CONSTRAINT funnels_steps_valid CHECK (public.valid_funnel_steps(steps));

CREATE UNIQUE INDEX goals_website_name ON goals(website_id, lower(name));
CREATE UNIQUE INDEX funnels_website_name ON funnels(website_id, lower(name));

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage goals" ON goals
  FOR ALL
  USING (website_id IN (SELECT id FROM websites WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (website_id IN (SELECT id FROM websites WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Owners manage funnels" ON funnels
  FOR ALL
  USING (website_id IN (SELECT id FROM websites WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (website_id IN (SELECT id FROM websites WHERE user_id = (SELECT auth.uid())));
