import { test, expect } from "@playwright/test";
import { pagesPerSession, pagesPerSessionValue } from "@/lib/analytics";
import { buildBuckets, mergeBuckets, previousBucketMoment, shiftRows } from "@/lib/buckets";
import { changeOf, changeTone, formatChange } from "@/lib/compare";
import { formatRange } from "@/lib/format";
import { comparisonWindows } from "@/lib/timeframe";
import type { PageView, Visit } from "@/types";

// Pure functions only. Run with TZ=America/New_York to also check the midnight-label contrast in the daylight-saving case.

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

test("previous window is the same length, immediately before", () => {
  const asOf = Date.UTC(2026, 10, 23, 12);
  for (const [timeframe, ms] of [
    ["last 7 days", 7 * DAY],
    ["last 1 hour", HOUR],
    ["last 365 days", 365 * DAY],
  ] as const) {
    expect(comparisonWindows(timeframe, asOf)).toEqual({
      currentStart: asOf - ms,
      currentEnd: asOf,
      previousStart: asOf - 2 * ms,
      previousEnd: asOf - ms,
      windowMs: ms,
    });
  }
  expect(comparisonWindows("0", asOf)).toBeNull();
  expect(comparisonWindows("last fortnight", asOf)).toBeNull();
});

test("relative change rounds half away from zero and handles zero", () => {
  const cases: [number | null, number | null, number | null][] = [
    [110, 100, 10],
    [90, 100, -10],
    [1, 3, -67],
    [9, 8, 13],
    [7, 8, -13],
    [0, 0, 0],
    [5, 0, 100],
    [0, 5, -100],
    [1001, 1000, 0],
    [null, 5, null],
    [5, null, null],
  ];
  for (const [current, previous, expected] of cases) expect(changeOf("relative", current, previous)).toBe(expected);
});

test("rate change is in percentage points", () => {
  const cases: [number | null, number | null, number | null][] = [
    [58, 66, -8],
    [43, 68, -25],
    [70, 60, 10],
    [0, 0, 0],
    [12, 0, 12],
    [null, 40, null],
  ];
  for (const [current, previous, expected] of cases) expect(changeOf("points", current, previous)).toBe(expected);
});

test("tone inverts only when lower is better; badge text", () => {
  expect(changeTone(-29, false)).toBe("bad");
  expect(changeTone(29, false)).toBe("good");
  expect(changeTone(-25, true)).toBe("good");
  expect(changeTone(10, true)).toBe("bad");
  expect(changeTone(0, false)).toBe("neutral");
  expect(changeTone(0, true)).toBe("neutral");
  expect(formatChange(12, "relative")).toBe("12%");
  expect(formatChange(-8, "points")).toBe("8 pp");
  expect(formatChange(1500, "relative")).toBe("999%+");
  expect(formatChange(0, "relative")).toBe("0%");
});

test("pages per session as a number", () => {
  const views = Array.from({ length: 10 }, () => ({}) as PageView);
  const visits = Array.from({ length: 4 }, () => ({}) as Visit);
  expect(pagesPerSessionValue([], [])).toBeNull();
  expect(pagesPerSessionValue(views, visits)).toBe(2.5);
  expect(pagesPerSession(views, visits)).toBe("2.5");
});

const pv = (iso: string, session: string | null = null): PageView => ({
  id: iso,
  domain: "site.test",
  page: "https://site.test/",
  created_at: iso,
  client_session_id: session,
});

test("previous rows line up with their counterpart bucket", () => {
  // Hourly: a 1-day window; a previous row 1h into the previous window lands 1h into the current one.
  const windowMs = DAY;
  const currentStart = new Date(2026, 10, 22, 12).getTime();
  const current = buildBuckets([pv(new Date(currentStart + HOUR).toISOString())], [], true);
  const previous = buildBuckets(shiftRows([pv(new Date(currentStart - windowMs + HOUR).toISOString())], windowMs), [], true);
  const merged = mergeBuckets(current, previous);
  expect(merged).toHaveLength(1);
  expect(merged[0]).toMatchObject({ start: currentStart + HOUR, pageViews: 1, prev_pageViews: 1 });

  // A bucket only the previous side has: counts are 0, session values null.
  const onlyPrevious = mergeBuckets([], buildBuckets(shiftRows([pv(new Date(currentStart).toISOString(), "s")], windowMs), [], true));
  expect(onlyPrevious[0]).toMatchObject({ pageViews: 0, bounceRate: null, prev_pageViews: 1, prev_bounceRate: 100 });

  // Daily buckets work the same way.
  const day = new Date(2026, 10, 10).getTime();
  const daily = mergeBuckets(
    buildBuckets([pv(new Date(day + 5 * HOUR).toISOString())], [], false),
    buildBuckets(shiftRows([pv(new Date(day - 7 * DAY + 5 * HOUR).toISOString())], 7 * DAY), [], false)
  );
  expect(daily).toHaveLength(1);
  expect(daily[0]).toMatchObject({ start: day, pageViews: 1, prev_pageViews: 1 });
});

test("a bucket with no sessions has no bounce or duration", () => {
  const buckets = buildBuckets([pv(new Date(2026, 10, 22, 9).toISOString(), null)], [], true);
  expect(buckets[0]).toMatchObject({ pageViews: 1, bounceRate: null, visitDuration: null });
});

test("a daily previous label keeps its calendar date across a daylight-saving change", () => {
  // US clocks sprang forward on Mar 8, 2026. A 7-day shift back from Mar 11 should label Mar 4.
  const bucket = new Date(2026, 2, 11).getTime();
  const label = (ms: number) => new Date(ms).toLocaleDateString("en-US", { month: "long", day: "numeric" });
  expect(label(previousBucketMoment(bucket, 7 * DAY, false))).toBe("March 4");
  // What midnight-based labelling would wrongly show; only differs where the clocks changed (not in UTC, as on CI).
  if (new Date(bucket).getTimezoneOffset() !== new Date(bucket - 7 * DAY).getTimezoneOffset()) {
    expect(label(bucket - 7 * DAY)).toBe("March 3");
  }
});

test("legend ranges show times only for windows of a day or less", () => {
  const end = new Date(2026, 10, 23, 14).getTime();
  expect(formatRange(end - 7 * DAY, end)).toBe("Nov 16 – Nov 23");
  expect(formatRange(end - DAY, end)).toBe("Nov 22, 2:00 PM – Nov 23, 2:00 PM");
});
