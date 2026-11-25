import { test, expect } from "@playwright/test";
import { buildSessions, sessionMetrics } from "@/lib/analytics";
import { applyFilters, filterValueLabel, inSessionsOf, parseFilters, removeFilter, setFilter, withFilters } from "@/lib/filters";
import type { Engagement, PageView, Visit } from "@/types";

// --- Filter math (pure functions, no page) ---

const at = (seconds: number) => new Date(Date.UTC(2026, 0, 1, 12, 0, seconds)).toISOString();
const view = (session: string | null, page: string, extra: Partial<PageView> = {}, seconds = 0): PageView => ({
  id: `${session}-${page}-${seconds}`,
  domain: "site.test",
  page: `https://site.test/${page}`,
  created_at: at(seconds),
  client_session_id: session,
  ...extra,
});
const visit = (session: string | null, source: string | null): Visit => ({
  session_id: `visit-${session}`,
  event: "session_start",
  created_at: at(0),
  source,
  client_session_id: session,
});

const US = { country: "US", city: "Austin", region: "Texas" };
const DE = { country: "DE", city: "Berlin", region: "Berlin" };
const views = [
  view("A", "", US, 0),
  view("A", "pricing", US, 60),
  view("B", "", DE),
  view("C", "pricing", DE),
  view(null, "pricing", US),
];
const visits = [visit("A", "google.com"), visit("B", "direct"), visit("C", "google.com"), visit(null, "google.com")];

test("no filters returns the rows untouched", () => {
  const result = applyFilters(views, visits, []);
  expect(result.pageViews).toBe(views);
  expect(result.visits).toBe(visits);
});

test("a page filter keeps whole sessions that viewed the page, so bounce rate still works", () => {
  const { pageViews, visits: kept } = applyFilters(views, visits, [{ dimension: "page", value: "pricing" }]);
  // Sessions A (two views) and C (one view), plus the session-less pricing view.
  expect(pageViews.map((v) => v.id)).toEqual(["A--0", "A-pricing-60", "C-pricing-0", "null-pricing-0"]);
  expect(kept.map((v) => v.client_session_id)).toEqual(["A", "C"]);
  expect(sessionMetrics(buildSessions(pageViews)).bounceRate).toBe(50);
});

test("a source filter links visits to page views by session", () => {
  const { pageViews, visits: kept } = applyFilters(views, visits, [{ dimension: "source", value: "google.com" }]);
  expect(new Set(pageViews.map((v) => v.client_session_id))).toEqual(new Set(["A", "C"]));
  // The session-less visit matches on its own; the session-less page view can't be linked.
  expect(kept.map((v) => v.client_session_id)).toEqual(["A", "C", null]);
});

test("Direct Traffic matches visits with no source or the direct source", () => {
  const { visits: kept } = applyFilters(views, [...visits, visit("D", null)], [{ dimension: "source", value: "Direct Traffic" }]);
  expect(kept.map((v) => v.client_session_id)).toEqual(["B", "D"]);
});

test("several filters must all match", () => {
  const filters = setFilter([{ dimension: "source", value: "google.com" }], { dimension: "country", value: "DE" });
  const { pageViews, visits: kept } = applyFilters(views, visits, filters);
  expect(pageViews.map((v) => v.client_session_id)).toEqual(["C"]);
  expect(kept.map((v) => v.client_session_id)).toEqual(["C"]);
});

test("city filters use city, region and country together", () => {
  const { pageViews } = applyFilters(views, visits, [{ dimension: "city", value: "Austin|Texas|US" }]);
  expect(pageViews.map((v) => v.client_session_id)).toEqual(["A", "A", null]);
  expect(filterValueLabel({ dimension: "city", value: "Austin|Texas|US" })).toBe("Austin");
});

test("missing values match the Unknown row", () => {
  const { pageViews } = applyFilters([view("X", "a"), view("Y", "a", { browser_name: "Firefox" })], [], [
    { dimension: "browser", value: "Unknown" },
  ]);
  expect(pageViews.map((v) => v.client_session_id)).toEqual(["X"]);
});

test("engagement and link rows follow the kept sessions", () => {
  const engaged = (session: string): Engagement => ({
    id: session,
    domain: "site.test",
    page: "https://site.test/",
    client_session_id: session,
    engaged_ms: 1000,
    created_at: at(0),
  });
  const kept = inSessionsOf([engaged("A"), engaged("B")], [view("A", "")]);
  expect(kept.map((row) => row.id)).toEqual(["A"]);
});

test("filters round-trip through the URL and keep other parameters", () => {
  const search = withFilters("?tab=general&page=old", [
    { dimension: "page", value: "pricing" },
    { dimension: "source", value: "Direct Traffic" },
  ]);
  expect(new URLSearchParams(search).get("tab")).toBe("general");
  expect(parseFilters(search)).toEqual([
    { dimension: "page", value: "pricing" },
    { dimension: "source", value: "Direct Traffic" },
  ]);
  expect(withFilters(search, removeFilter(parseFilters(search), "page"))).toBe("?tab=general&source=Direct+Traffic");
  expect(withFilters("?page=pricing", [])).toBe("");
});

test("setting a dimension again replaces its value", () => {
  expect(setFilter([{ dimension: "os", value: "Windows" }], { dimension: "os", value: "macOS" })).toEqual([
    { dimension: "os", value: "macOS" },
  ]);
  expect(filterValueLabel({ dimension: "page", value: "" })).toBe("/");
});
