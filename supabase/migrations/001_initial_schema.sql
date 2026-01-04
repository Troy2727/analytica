-- Analytica Database Schema Migration
-- Creates all tables for analytics tracking

-- Create event type enum
CREATE TYPE event_type AS ENUM ('session_start', 'session_end', 'pageview');

-- 1. Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  api TEXT UNIQUE,
  discord_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Websites table
CREATE TABLE websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- PageSpeed Insights metrics
  firstContentfulPaint INTEGER,
  largestContentfulPaint INTEGER,
  timeToInteractive INTEGER,
  cumulativeLayoutShift NUMERIC,
  totalBlockingTime INTEGER,
  performance INTEGER,
  accessibility INTEGER,
  bestPractices INTEGER,
  seo INTEGER,
  speedIndex INTEGER
);

-- 3. Page Views table
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  page TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Tracking metadata
  city TEXT,
  region TEXT,
  country TEXT,
  operating_system TEXT,
  device_type TEXT,
  browser_name TEXT
);

-- 4. Visits table
CREATE TABLE visits (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event event_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT,
  website_id UUID
);

-- 5. Events table (custom events)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  website_id UUID,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  fields JSONB,
  emoji TEXT,
  domain TEXT,
  description TEXT
);

-- Create indexes for frequently queried columns
CREATE INDEX idx_websites_user_id ON websites(user_id);
CREATE INDEX idx_websites_name ON websites(name);
CREATE INDEX idx_page_views_domain ON page_views(domain);
CREATE INDEX idx_page_views_created_at ON page_views(created_at);
CREATE INDEX idx_visits_website_id ON visits(website_id);
CREATE INDEX idx_visits_created_at ON visits(created_at);
CREATE INDEX idx_events_domain ON events(domain);
CREATE INDEX idx_events_website_id ON events(website_id);
CREATE INDEX idx_events_created_at ON events(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS Policies (adjust based on auth requirements)
-- Allow public read for analytics tracking
CREATE POLICY "Public read page_views" ON page_views FOR SELECT USING (true);
CREATE POLICY "Public insert page_views" ON page_views FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read visits" ON visits FOR SELECT USING (true);
CREATE POLICY "Public insert visits" ON visits FOR INSERT WITH CHECK (true);

-- Users manage their own websites
CREATE POLICY "Users manage own websites" ON websites
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Users manage events for their domains
CREATE POLICY "Users manage own events" ON events
  FOR ALL USING (
    domain IN (
      SELECT name FROM websites WHERE user_id::text = auth.uid()::text
    )
  );

-- Users manage their own data
CREATE POLICY "Users manage own data" ON users
  FOR ALL USING (auth.uid()::text = id::text);
