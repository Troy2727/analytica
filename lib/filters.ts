import { pathOf, sourceLabel, UNKNOWN } from "@/lib/analytics";
import { capitalize } from "@/lib/format";
import type { PageView, Visit } from "@/types";

/** What a General-tab breakdown row can filter by. */
export type Dimension = "page" | "source" | "country" | "city" | "os" | "device" | "browser";

/** "Only sessions where `dimension` is `value`." Values match the breakdown rows' keys. */
export interface Filter {
  dimension: Dimension;
  value: string;
}

export const DIMENSION_LABELS: Record<Dimension, string> = {
  page: "Page",
  source: "Source",
  country: "Country",
  city: "City",
  os: "OS",
  device: "Device",
  browser: "Browser",
};

const DIMENSIONS = Object.keys(DIMENSION_LABELS) as Dimension[];

/** A city row's key: city, region and country, so same-named cities stay apart. */
export const cityKey = (view: Pick<PageView, "city" | "region" | "country">) =>
  [view.city || UNKNOWN, view.region || UNKNOWN, view.country || UNKNOWN].join("|");

/** A page view's value for a page-view dimension (everything but source). */
const viewValue: Record<Exclude<Dimension, "source">, (view: PageView) => string> = {
  page: (view) => pathOf(view.page),
  country: (view) => view.country || UNKNOWN,
  city: cityKey,
  os: (view) => view.operating_system || UNKNOWN,
  device: (view) => view.device_type || UNKNOWN,
  browser: (view) => view.browser_name || UNKNOWN,
};

/** Text for a filter chip: pages get their slash back, cities lose the region and country. */
export function filterValueLabel({ dimension, value }: Filter): string {
  if (dimension === "page") return `/${value}`;
  if (dimension === "city") return value.split("|")[0];
  if (dimension === "device") return capitalize(value);
  return value;
}

/** Filters from a query string, one parameter per dimension (`?source=Google&page=pricing`). */
export function parseFilters(search: string): Filter[] {
  const params = new URLSearchParams(search);
  return DIMENSIONS.flatMap((dimension) => {
    const value = params.get(dimension);
    return value === null ? [] : [{ dimension, value }];
  });
}

/** `search` with its filter parameters replaced by `filters`; other parameters are kept. */
export function withFilters(search: string, filters: Filter[]): string {
  const params = new URLSearchParams(search);
  for (const dimension of DIMENSIONS) params.delete(dimension);
  for (const { dimension, value } of filters) params.set(dimension, value);
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** `filters` with one dimension set to `value` (a dimension holds one value at a time). */
export const setFilter = (filters: Filter[], next: Filter): Filter[] => [
  ...filters.filter((f) => f.dimension !== next.dimension),
  next,
];

export const removeFilter = (filters: Filter[], dimension: Dimension): Filter[] =>
  filters.filter((f) => f.dimension !== dimension);

/** Rows (engagement, link clicks) from the sessions left in `pageViews`; rows without a session are dropped. */
export function inSessionsOf<T extends { client_session_id?: string | null }>(rows: T[], pageViews: PageView[]): T[] {
  const ids = new Set(pageViews.map((view) => view.client_session_id));
  return rows.filter((row) => row.client_session_id && ids.has(row.client_session_id));
}

/**
 * Keep the sessions that match every filter: all their page views and visits.
 *
 * Filters select whole sessions (linked by `client_session_id`), so a page filter
 * means "sessions that viewed this page" and bounce rate and visit duration stay
 * meaningful. Rows without a session id can't be linked, so they are kept only when
 * they match every filter on their own (a page view can't match a source filter,
 * and a visit can't match a page-view filter).
 */
export function applyFilters<V extends PageView, S extends Pick<Visit, "source" | "client_session_id">>(
  pageViews: V[],
  visits: S[],
  filters: Filter[]
): { pageViews: V[]; visits: S[] } {
  if (!filters.length) return { pageViews, visits };

  const viewFilters = filters.filter((f): f is Filter & { dimension: Exclude<Dimension, "source"> } => f.dimension !== "source");
  const sourceFilter = filters.find((f) => f.dimension === "source");
  const viewMatches = (view: V) => viewFilters.every((f) => viewValue[f.dimension](view) === f.value);

  // Per filter, the sessions with at least one matching row; a session must be in every set.
  const sets: Set<string>[] = viewFilters.map((f) => {
    const ids = new Set<string>();
    for (const view of pageViews) if (view.client_session_id && viewValue[f.dimension](view) === f.value) ids.add(view.client_session_id);
    return ids;
  });
  if (sourceFilter) {
    const ids = new Set<string>();
    for (const visit of visits) if (visit.client_session_id && sourceLabel(visit.source) === sourceFilter.value) ids.add(visit.client_session_id);
    sets.push(ids);
  }
  const sessionMatches = (id: string) => sets.every((ids) => ids.has(id));

  return {
    pageViews: pageViews.filter((view) =>
      view.client_session_id ? sessionMatches(view.client_session_id) : !sourceFilter && viewMatches(view)
    ),
    visits: visits.filter((visit) =>
      visit.client_session_id
        ? sessionMatches(visit.client_session_id)
        : !viewFilters.length && sourceLabel(visit.source) === sourceFilter?.value
    ),
  };
}
