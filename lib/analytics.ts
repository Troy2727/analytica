import type { LocationTally, PageView, Tally, Visit } from "@/types";

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

/** How many times each custom event name was recorded. */
export function countByEventName(events: { event_name: string }[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const { event_name } of events) {
    if (event_name) counts[event_name] = (counts[event_name] ?? 0) + 1;
  }
  return counts;
}
