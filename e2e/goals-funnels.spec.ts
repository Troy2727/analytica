import { test, expect } from "@playwright/test";
import { buildSessions } from "@/lib/analytics";
import { formatRate } from "@/lib/format";
import { funnelStats, goalStats, matchesPattern, normalizePath, sessionPaths, validatePattern } from "@/lib/goals";
import type { PageView } from "@/types";

// Pure functions only. Flows with stored goals and funnels need migration 009 applied.

let clock = 0;
const view = (session: string | null, path: string): PageView => ({
  id: String(++clock),
  domain: "site.test",
  page: `https://site.test${path}`,
  created_at: new Date(Date.UTC(2026, 0, 1, 12, 0, clock)).toISOString(),
  client_session_id: session,
});
const sessionOf = (id: string, ...paths: string[]) => paths.map((p) => view(id, p));

// S5's view has no session id, so it never counts.
const FIXTURE = [
  ...sessionOf("S1", "/pricing", "/signup", "/thanks"),
  ...sessionOf("S2", "/pricing", "/blog", "/signup"),
  ...sessionOf("S3", "/signup", "/pricing"),
  ...sessionOf("S4", "/pricing", "/pricing"),
  view(null, "/pricing"),
  ...sessionOf("S6", "/home"),
];
const paths = (views: PageView[]) => sessionPaths(buildSessions(views));
const sessions = paths(FIXTURE);

test("patterns are normalized and validated", () => {
  expect(normalizePath("pricing")).toBe("/pricing");
  expect(normalizePath("  /Pricing/  ")).toBe("/pricing");
  expect(normalizePath("/Pricing?plan=a#top")).toBe("/pricing");
  expect(normalizePath("https://Example.com/Docs/")).toBe("/docs");
  expect(normalizePath("/")).toBe("/");
  expect(normalizePath("/a//b")).toBe("/a/b");
  expect(normalizePath("/blog**")).toBe("/blog*");
  for (const bad of ["", "   ", "/a b", `/${"a".repeat(200)}`, "/<script>"]) expect(validatePattern(bad)).toBeNull();
  expect(validatePattern("Pricing/")).toBe("/pricing");
  expect(matchesPattern("/%41", "/a")).toBe(true);
});

test("wildcards match any run of characters; the whole path must match", () => {
  for (const path of ["/blog", "/blog/x", "/blogger"]) expect(matchesPattern("/blog*", path)).toBe(true);
  expect(matchesPattern("/blog*", "/bl")).toBe(false);
  expect(matchesPattern("/blog/*", "/blog/a/b")).toBe(true);
  expect(matchesPattern("/blog/*", "/blog")).toBe(false);
  expect(matchesPattern("/*pricing", "/fr/pricing")).toBe(true);
  expect(matchesPattern("/*pricing", "/pricing")).toBe(true);
  expect(matchesPattern("/*", "/")).toBe(true);
  expect(matchesPattern("/a.b", "/axb")).toBe(false);
  expect(matchesPattern("/a*b*c", "/abc")).toBe(true);
  expect(matchesPattern("/a*b*c", "/ac")).toBe(false);
  expect(matchesPattern("/ab*ba", "/aba")).toBe(false); // prefix and suffix can't overlap
});

test("only a leading origin is stripped; an encoded asterisk stays literal; wildcards are capped", () => {
  expect(normalizePath("/go/https://x.com/pricing")).toBe("/go/https:/x.com/pricing");
  expect(matchesPattern("/pricing", "/go/https://x.com/pricing")).toBe(false);
  expect(matchesPattern("/a%2Ab", "/a*b")).toBe(true);
  expect(matchesPattern("/a%2Ab", "/axb")).toBe(false);
  expect(validatePattern(`/${"a*".repeat(10)}`)).not.toBeNull();
  expect(validatePattern(`/${"a*".repeat(11)}`)).toBeNull();
});

test("goal uniques, total and conversion rate count tracked sessions only", () => {
  expect(sessions).toHaveLength(5);
  expect(goalStats(sessions, "/pricing")).toEqual({ uniques: 4, total: 5, rate: 80 });
  expect(goalStats(sessions, "/sign*")).toEqual({ uniques: 3, total: 3, rate: 60 });
  expect(goalStats(sessions, "/nothing")).toEqual({ uniques: 0, total: 0, rate: 0 });
  expect(goalStats([], "/pricing")).toEqual({ uniques: 0, total: 0, rate: null });
});

test("funnel steps must be reached in order within a session", () => {
  const stats = funnelStats(sessions, ["/pricing", "/signup", "/thanks"]);
  expect(stats.steps.map((s) => s.visitors)).toEqual([4, 2, 1]);
  expect(stats.steps.map((s) => s.rateFromFirst)).toEqual([100, 50, 25]);
  expect(stats.steps.slice(1).map((s) => [s.rateFromPrevious, s.droppedCount, s.droppedPercent])).toEqual([
    [50, 2, 50],
    [50, 1, 50],
  ]);
  expect(stats.entryShare).toBe(80);
  expect(stats.overall).toBe(25);
});

test("one page view advances at most one step", () => {
  const onlyPost = paths(sessionOf("A", "/blog/post"));
  expect(funnelStats(onlyPost, ["/blog*", "/blog/post"]).steps.map((s) => s.visitors)).toEqual([1, 0]);
  const both = paths(sessionOf("B", "/blog", "/blog/post"));
  expect(funnelStats(both, ["/blog*", "/blog/post"]).steps.map((s) => s.visitors)).toEqual([1, 1]);
});

test("empty ranges give zeros and no rates", () => {
  const none = funnelStats([], ["/a", "/b"]);
  expect(none.steps.map((s) => [s.visitors, s.rateFromFirst])).toEqual([
    [0, null],
    [0, null],
  ]);
  expect(none.entryShare).toBeNull();
  expect(none.overall).toBeNull();
  const unreached = funnelStats(sessions, ["/nothing", "/pricing"]);
  expect(unreached.steps.every((s) => s.rateFromFirst === null)).toBe(true);
  expect(unreached.overall).toBeNull();
});

test("rates show one decimal at most", () => {
  expect(formatRate(12.5)).toBe("12.5%");
  expect(formatRate(38)).toBe("38%");
  expect(formatRate(0)).toBe("0%");
  expect(formatRate(0.03)).toBe("<0.1%");
  expect(formatRate(null)).toBe("—");
});
