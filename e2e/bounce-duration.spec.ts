import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { buildSessions, pageSessionStats, sessionMetrics } from "@/lib/analytics";
import { buildBuckets } from "@/lib/buckets";
import { formatDuration, formatPercent } from "@/lib/format";
import { withinTimeframe } from "@/lib/timeframe";
import type { Engagement, PageView } from "@/types";

// --- Metric math (pure functions, no page) ---

const at = (seconds: number) => new Date(Date.UTC(2026, 0, 1, 12, 0, seconds)).toISOString();
const view = (session: string | null, page: string, seconds = 0): PageView => ({
  id: `${session}-${page}-${seconds}`,
  domain: "site.test",
  page: `https://site.test/${page}`,
  created_at: at(seconds),
  client_session_id: session,
});
const engaged = (session: string, page: string, ms: number): Engagement => ({
  id: `${session}-${page}-${ms}`,
  domain: "site.test",
  page: `https://site.test/${page}`,
  client_session_id: session,
  engaged_ms: ms,
  created_at: at(0),
});

test("bounce rate counts single-page sessions and ignores rows without a session", () => {
  const views = [view("A", "a"), view("B", "a"), view("B", "b"), view("C", "a"), view("C", "b"), view("C", "c"), view(null, "a")];
  expect(sessionMetrics(buildSessions(views)).bounceRate).toBe(33);
  expect(sessionMetrics([])).toEqual({ bounceRate: null, visitDuration: null });
});

test("visit duration averages first-to-last page view, bounces counting as zero", () => {
  const views = [view("A", "a", 0), view("A", "b", 90), view("B", "a", 30)];
  expect(sessionMetrics(buildSessions(views)).visitDuration).toBe(45);
});

test("per-page bounce uses entry pages; time on page averages per-session sums", () => {
  const views = [view("A", "home", 0), view("B", "home", 0), view("B", "pricing", 5)];
  const stats = pageSessionStats(views, [
    engaged("A", "home", 2000),
    engaged("A", "home", 3000),
    engaged("A", "home", 1000),
    engaged("B", "home", 6000),
  ]);
  expect(stats.get("home")).toEqual({ bounceRate: 50, timeOnPage: 6 });
  expect(stats.get("pricing")).toBeUndefined(); // never an entry page, no engagement: the UI shows "—"
});

test("chart buckets: out-of-window rows are dropped first; a bucket without sessions is null", () => {
  const now = Date.UTC(2026, 0, 2);
  const inWindow = withinTimeframe([view("A", "a", 0), { ...view("B", "a"), created_at: new Date(now - 3 * 86400000).toISOString() }], "last 1 day", now);
  expect(inWindow.map((v) => v.client_session_id)).toEqual(["A"]); // B is 3 days old
  const buckets = buildBuckets([view(null, "a", 0)], [], true);
  expect(buckets[0]).toMatchObject({ pageViews: 1, bounceRate: null, visitDuration: null });
});

test("durations and percents format for the dashboard", () => {
  expect([0, 7, 90, 124, 300, 3903].map(formatDuration)).toEqual(["0s", "7s", "1m 30s", "2m 04s", "5m 00s", "1h 5m 3s"]);
  expect(formatDuration(null)).toBe("—");
  expect(formatPercent(57.5)).toBe("58%");
  expect(formatPercent(null)).toBe("—");
});

// --- Track route validation (rejected before any database write) ---

test.describe("track route", () => {
  test.skip(({ isMobile }) => isMobile, "API checks run once");

  test("engagement for another domain is rejected", async ({ request }) => {
    const res = await request.post("/api/track", {
      data: { event: "engagement", domain: "example.com", url: "https://not-example.org/", sessionId: "session-0123456789abcdef", engagedMs: 5000 },
    });
    expect(res.status()).toBe(400);
    expect(await res.json()).toEqual({ error: "Domain mismatch" });
  });

  test("engagement needs a valid session id and a positive time", async ({ request }) => {
    const base = { event: "engagement", domain: "example.com", url: "https://example.com/" };
    for (const sessionId of [undefined, "abc", "session-XYZ"]) {
      const res = await request.post("/api/track", { data: { ...base, sessionId, engagedMs: 5000 } });
      expect(res.status()).toBe(400);
      expect(await res.json()).toEqual({ error: "Invalid session" });
    }
    for (const engagedMs of [0, -5, "abc", null]) {
      const res = await request.post("/api/track", { data: { ...base, sessionId: "session-0123456789abcdef", engagedMs } });
      expect(res.status()).toBe(400);
      expect(await res.json()).toEqual({ error: "Invalid engagement" });
    }
  });

  test("an invalid session id does not change domain checks", async ({ request }) => {
    const res = await request.post("/api/track", {
      data: { event: "pageview", domain: "example.com", url: "https://not-example.org/", sessionId: "bogus" },
    });
    expect(res.status()).toBe(400);
    expect(await res.json()).toEqual({ error: "Domain mismatch" });
  });
});

// --- Tracking script on a stubbed site (no network, nothing stored) ---

const SCRIPT = readFileSync(path.join(__dirname, "../public/tracking-script.js"), "utf8");
const ENDPOINT = "https://analytica-phi.vercel.app/api/track";
const SESSION = /^session-[0-9a-f]{16}$/;

interface Sent {
  event: string;
  url: string;
  sessionId: string;
  engagedMs?: number;
  contentType: string;
}

/** Serve a fake site with the script and capture what it sends. */
async function openSite(page: Page, initScript?: () => void): Promise<Sent[]> {
  const sent: Sent[] = [];
  // Headless pages can report no focus or visibility; let tests drive both.
  await page.addInitScript(() => {
    const w = window as unknown as { __hidden?: boolean };
    Object.defineProperty(document, "visibilityState", { get: () => (w.__hidden ? "hidden" : "visible") });
    document.hasFocus = () => !w.__hidden;
  });
  if (initScript) await page.addInitScript(initScript);
  await page.route(ENDPOINT, async (route) => {
    const req = route.request();
    sent.push({ ...JSON.parse(req.postData() ?? "{}"), contentType: req.headers()["content-type"] ?? "" });
    await route.fulfill({ status: 201, body: "{}", headers: { "access-control-allow-origin": "*" } });
  });
  await page.route("https://site.test/**", (route) =>
    route.request().url().endsWith("/t.js")
      ? route.fulfill({ contentType: "application/javascript", body: SCRIPT })
      : route.fulfill({
          contentType: "text/html",
          body: '<html><body><script defer data-domain="site.test" src="https://site.test/t.js"></script></body></html>',
        })
  );
  await page.goto("https://site.test/a");
  await expect.poll(() => sent.filter((s) => s.event === "pageview").length).toBe(1);
  return sent;
}

const events = (sent: Sent[]) => sent.map((s) => s.event);

test.describe("tracking script", () => {
  test.skip(({ isMobile }) => isMobile, "script checks run once");

  test("every request carries the session id; a new visitor starts a session", async ({ page }) => {
    const sent = await openSite(page);
    expect(events(sent)).toEqual(["session_start", "pageview"]);
    expect(sent[0].sessionId).toMatch(SESSION);
    expect(sent[1].sessionId).toBe(sent[0].sessionId);
  });

  test("an expired session is replaced on the next navigation, and navigating renews it", async ({ page }) => {
    const sent = await openSite(page);
    const first = sent[0].sessionId;
    await page.evaluate(() => {
      localStorage.setItem("session_expiration_timestamp", String(Date.now() - 1000));
      history.pushState({}, "", "/b");
    });
    await expect.poll(() => sent.filter((s) => s.event === "pageview").length).toBe(2);
    const after = sent.slice(2).filter((s) => s.event !== "engagement");
    expect(events(after)).toEqual(["session_end", "session_start", "pageview"]);
    expect(after[0].sessionId).toBe(first);
    expect(after[1].sessionId).toMatch(SESSION);
    expect(after[1].sessionId).not.toBe(first);
    expect(after[2].sessionId).toBe(after[1].sessionId);

    await page.evaluate(() => history.pushState({}, "", "/c"));
    await expect.poll(() => sent.filter((s) => s.event === "pageview").length).toBe(3);
    expect(sent[sent.length - 1].sessionId).toBe(after[1].sessionId);
    const expiry = Number(await page.evaluate(() => localStorage.getItem("session_expiration_timestamp")));
    expect(expiry - Date.now()).toBeGreaterThan(9 * 60 * 1000);
  });

  test("blocked localStorage still yields a session id and no errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const sent = await openSite(page, () => {
      Storage.prototype.getItem = () => {
        throw new Error("blocked");
      };
      Storage.prototype.setItem = () => {
        throw new Error("blocked");
      };
    });
    expect(sent.every((s) => SESSION.test(s.sessionId))).toBe(true);
    expect(errors).toEqual([]);
  });

  test("engagement is sent for the old page before the next page view, as text/plain", async ({ page }) => {
    const sent = await openSite(page);
    await page.waitForTimeout(1500);
    await page.evaluate(() => history.pushState({}, "", "/b"));
    await expect.poll(() => sent.filter((s) => s.event === "pageview").length).toBe(2);
    const tail = sent.slice(2);
    expect(events(tail)).toEqual(["engagement", "pageview"]);
    expect(tail[0].url).toBe("https://site.test/a");
    expect(tail[0].sessionId).toBe(sent[0].sessionId);
    expect(tail[0].engagedMs).toBeGreaterThanOrEqual(1000);
    expect(tail[0].engagedMs).toBeLessThan(3000);
    expect(tail[0].contentType).toContain("text/plain");
  });

  test("hiding the page sends engagement after a second, and carries shorter time over", async ({ page }) => {
    const sent = await openSite(page);
    const hide = () =>
      page.evaluate(() => {
        (window as unknown as { __hidden: boolean }).__hidden = true;
        document.dispatchEvent(new Event("visibilitychange"));
      });
    const show = () =>
      page.evaluate(() => {
        (window as unknown as { __hidden: boolean }).__hidden = false;
        document.dispatchEvent(new Event("visibilitychange"));
      });

    // Under a second: nothing sent.
    await page.waitForTimeout(400);
    await hide();
    await page.waitForTimeout(300);
    expect(sent.filter((s) => s.event === "engagement")).toHaveLength(0);

    // Hidden time does not count; the carried 400ms plus 800ms more crosses the threshold.
    await page.waitForTimeout(1000);
    await show();
    await page.waitForTimeout(800);
    await hide();
    await expect.poll(() => sent.filter((s) => s.event === "engagement").length).toBe(1);
    const ms = sent.find((s) => s.event === "engagement")!.engagedMs!;
    expect(ms).toBeGreaterThanOrEqual(1000);
    expect(ms).toBeLessThan(2000);
  });
});
