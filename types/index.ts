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
  client_session_id?: string | null; // the tracking script's session id; null on rows from before it was sent
}

/** One row per browser session (`visits`); `website_id` holds the domain. */
export interface Visit {
  session_id: string;
  event: "session_start" | "session_end" | "pageview";
  created_at: string;
  source: string | null;
  client_session_id?: string | null;
}

/** Visible, focused time on one page view, sent in pieces (`page_engagement`). */
export interface Engagement {
  id: string;
  domain: string;
  page: string;
  client_session_id: string;
  engaged_ms: number;
  created_at: string;
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

/** A goal: tracked sessions that visit a page matching `pattern` (`goals`). */
export interface Goal {
  id: string;
  website_id: string;
  name: string;
  pattern: string; // normalized path, `*` as wildcard
  created_at: string;
}

/** A funnel: 2 to 8 page patterns visited in order within a session (`funnels`). */
export interface Funnel {
  id: string;
  website_id: string;
  name: string;
  steps: string[];
  created_at: string;
}

/** An outbound link click or file download, sent by the tracking script (`link_events`). */
export interface LinkEvent {
  id: string;
  domain: string;
  kind: "outbound" | "download";
  url: string; // origin + path, no query or fragment
  page: string | null;
  client_session_id: string | null;
  created_at: string;
}

/**
 * What a public share link returns (`/api/share/<domain>/<token>`): one website's
 * traffic with ids removed, URLs without query strings, and session ids replaced
 * by labels that only mean something within one response.
 */
export interface SharedPayload {
  domain: string;
  timeframe: string;
  pageViews: Omit<PageView, "id" | "domain">[];
  visits: Pick<Visit, "created_at" | "source">[];
  engagement: Omit<Engagement, "id" | "domain">[];
  activeUsers: number;
  metrics: PerformanceMetrics | null;
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
