// Row shapes for the Supabase tables the app reads (see supabase/migrations).

export interface Website {
  id: string;
  name: string; // the bare domain, e.g. "example.com"
  user_id: string;
  created_at: string;
}

/** One row per tracked page load (`page_views`). */
export interface PageView {
  id: string;
  domain: string;
  page: string;
  created_at: string;
  city?: string;
  region?: string;
  country?: string;
  operating_system?: string;
  device_type?: string;
  browser_name?: string;
}

/** One row per browser session (`visits`); `website_id` holds the domain. */
export interface Visit {
  session_id: string;
  event: "session_start" | "session_end" | "pageview";
  created_at: string;
  source: string | null;
}

export interface EventField {
  name: string;
  value: string;
  inline?: boolean;
}

/** A custom event sent to /api/events (`events`). */
export interface CustomEvent {
  id: string;
  event_name: string;
  website_id: string;
  message: string;
  created_at: string;
  fields?: EventField[];
  domain?: string;
}

/** The `users` row: API key and optional Discord ID for event DMs. */
export interface UserData {
  id: string;
  api: string;
  discord_id?: string;
}

/** Lighthouse results, stored as columns on `websites`. Times are in ms. */
export interface PerformanceMetrics {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
  speedIndex: number;
}

/** A label and how many times it occurred, for the "top N" lists. */
export interface Tally {
  label: string;
  count: number;
}

export interface LocationTally extends Tally {
  city: string;
  region: string;
  country: string;
}
