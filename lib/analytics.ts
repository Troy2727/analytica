import type { ChangeKind } from "@/lib/compare";
import { compactNumber, formatDuration, formatPercent } from "@/lib/format";
import type { Engagement, LinkEvent, LocationTally, PageView, Tally, Visit } from "@/types";

const UNKNOWN = "Unknown";

/** Count occurrences of each key, most frequent first. */
export function tally<T>(rows: T[], keyOf: (row: T) => string): Tally[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = keyOf(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

/** Path of a tracked URL without the leading slash ("" for the home page). */
export function pathOf(page: string): string {
  try {
    return new URL(page.includes("://") ? page : `https://${page}`).pathname.slice(1);
  } catch {
    return page.replace(/^[a-z]+:\/\/[^/]*/i, "").replace(/^\/+/, "");
  }
}

/** A tracked URL without its query string or fragment. */
export function withoutQuery(page: string): string {
  return page.split(/[?#]/)[0];
}

export const topPages = (views: PageView[]) => tally(views, (v) => pathOf(v.page));

export const topSources = (visits: Visit[]) =>
  tally(visits, (v) => (v.source && v.source !== "direct" ? v.source : "Direct Traffic"));

export const topOperatingSystems = (views: PageView[]) =>
  tally(views, (v) => v.operating_system || UNKNOWN);

export const topDevices = (views: PageView[]) => tally(views, (v) => v.device_type || UNKNOWN);

export const topBrowsers = (views: PageView[]) => tally(views, (v) => v.browser_name || UNKNOWN);

export const topCountries = (views: PageView[]) => tally(views, (v) => v.country || UNKNOWN);

/** Visits per city, keeping the region and country for display. */
export function topCities(views: PageView[]): LocationTally[] {
  const places = new Map<string, LocationTally>();
  for (const view of views) {
    const city = view.city || UNKNOWN;
    const region = view.region || UNKNOWN;
    const country = view.country || UNKNOWN;
    const key = [city, region, country].join("|");
    const place = places.get(key) ?? { label: city, count: 0, city, region, country };
    place.count += 1;
    places.set(key, place);
  }
  return [...places.values()].sort((a, b) => b.count - a.count);
}

/** Average pages viewed per session, one decimal place. */
export function pagesPerSession(views: PageView[], visits: Visit[]): string {
  return visits.length ? (views.length / visits.length).toFixed(1) : "0";
}

/** A visitor's page views sharing one tracking-script session id, oldest first. */
export type Session = PageView[];

/** Group page views into sessions. Rows without a session id (sent before ids existed) are left out. */
export function buildSessions(views: PageView[]): Session[] {
  const sessions = new Map<string, Session>();
  for (const view of views) {
    if (!view.client_session_id) continue;
    const session = sessions.get(view.client_session_id) ?? [];
    session.push(view);
    sessions.set(view.client_session_id, session);
  }
  const time = (view: PageView) => new Date(view.created_at).getTime();
  return [...sessions.values()].map((session) => session.sort((a, b) => time(a) - time(b)));
}

const durationOf = (session: Session) =>
  (new Date(session[session.length - 1].created_at).getTime() - new Date(session[0].created_at).getTime()) / 1000;

/**
 * Bounce rate: whole-number percent of sessions with exactly one page view.
 * Visit duration: mean seconds from first to last page view, bounces counting as 0.
 * Both are null when there are no sessions.
 */
export function sessionMetrics(sessions: Session[]): { bounceRate: number | null; visitDuration: number | null } {
  if (!sessions.length) return { bounceRate: null, visitDuration: null };
  const bounces = sessions.filter((session) => session.length === 1).length;
  const totalSeconds = sessions.reduce((sum, session) => sum + durationOf(session), 0);
  return {
    bounceRate: Math.round((bounces / sessions.length) * 100),
    visitDuration: Math.round(totalSeconds / sessions.length),
  };
}

export interface PageSessionStats {
  bounceRate: number | null; // of sessions that entered on this page
  timeOnPage: number | null; // mean engaged seconds per (session, page)
}

/** Per-path bounce rate (entry pages only) and time on page (from engagement rows). */
export function pageSessionStats(views: PageView[], engagement: Engagement[]): Map<string, PageSessionStats> {
  const entries = new Map<string, { sessions: number; bounces: number }>();
  for (const session of buildSessions(views)) {
    const path = pathOf(session[0].page);
    const entry = entries.get(path) ?? { sessions: 0, bounces: 0 };
    entry.sessions += 1;
    if (session.length === 1) entry.bounces += 1;
    entries.set(path, entry);
  }

  const engagedMs = new Map<string, Map<string, number>>(); // path -> session -> ms
  for (const row of engagement) {
    const path = pathOf(row.page);
    const bySession = engagedMs.get(path) ?? new Map<string, number>();
    bySession.set(row.client_session_id, (bySession.get(row.client_session_id) ?? 0) + row.engaged_ms);
    engagedMs.set(path, bySession);
  }

  const stats = new Map<string, PageSessionStats>();
  for (const path of new Set([...entries.keys(), ...engagedMs.keys()])) {
    const entry = entries.get(path);
    const sums = [...(engagedMs.get(path)?.values() ?? [])];
    stats.set(path, {
      bounceRate: entry ? Math.round((entry.bounces / entry.sessions) * 100) : null,
      timeOnPage: sums.length ? Math.round(sums.reduce((a, b) => a + b, 0) / sums.length / 1000) : null,
    });
  }
  return stats;
}

/** Pages per session as a number, or null with no visits (for comparisons). */
export function pagesPerSessionValue(views: PageView[], visits: Visit[]): number | null {
  return visits.length ? views.length / visits.length : null;
}

interface MetricInfo {
  label: string;
  format: (value: number | null) => string;
  lowerIsBetter: boolean;
  changeKind: ChangeKind;
  /** The metric over a set of rows, so current and previous periods share one definition. */
  value: (views: PageView[], visits: Visit[]) => number | null;
}

/** The chartable metrics: how to label, format, compare and compute each. */
export const METRICS = {
  visits: {
    label: "Visitors",
    format: (n) => compactNumber(n ?? 0),
    lowerIsBetter: false,
    changeKind: "relative",
    value: (_views, visits) => visits.length,
  },
  pageViews: {
    label: "Page Views",
    format: (n) => compactNumber(n ?? 0),
    lowerIsBetter: false,
    changeKind: "relative",
    value: (views) => views.length,
  },
  bounceRate: {
    label: "Bounce Rate",
    format: formatPercent,
    lowerIsBetter: true,
    changeKind: "points",
    value: (views) => sessionMetrics(buildSessions(views)).bounceRate,
  },
  visitDuration: {
    label: "Visit Duration",
    format: formatDuration,
    lowerIsBetter: false,
    changeKind: "relative",
    value: (views) => sessionMetrics(buildSessions(views)).visitDuration,
  },
} satisfies Record<string, MetricInfo>;

export type Metric = keyof typeof METRICS;

/** Most-clicked outbound links or downloaded files, top 50. */
export const topLinks = (rows: LinkEvent[], kind: LinkEvent["kind"]) =>
  tally(
    rows.filter((row) => row.kind === kind),
    (row) => row.url
  ).slice(0, 50);

/** How many times each custom event name was recorded. */
export function countByEventName(events: { event_name: string }[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const { event_name } of events) {
    if (event_name) counts[event_name] = (counts[event_name] ?? 0) + 1;
  }
  return counts;
}
