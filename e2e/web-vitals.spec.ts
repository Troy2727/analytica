import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { formatVital, groupVitals, parseVitals, percentile, rate, summarize } from "@/lib/web-vitals";
import type { WebVital } from "@/types";

// --- Metric math (pure functions, no page) ---

const row = (values: Partial<WebVital>): WebVital => ({
  id: "1",
  domain: "site.test",
  page: "https://site.test/",
  lcp_ms: null,
  inp_ms: null,
  cls: null,
  fcp_ms: null,
  ttfb_ms: null,
  country: null,
  device_type: null,
  browser_name: null,
  client_session_id: null,
  created_at: "2026-01-01T12:00:00.000Z",
  ...values,
});

test("percentiles use the nearest rank", () => {
  const values = [5, 1, 4, 2, 3, 6, 7, 8, 9, 10];
  expect(percentile(values, 50)).toBe(5);
  expect(percentile(values, 75)).toBe(8);
  expect(percentile(values, 99)).toBe(10);
  expect(percentile([], 75)).toBeNull();
});

test("ratings follow Google's thresholds, boundaries counting as the better rating", () => {
  expect(rate("lcp", 2500)).toBe("good");
  expect(rate("lcp", 2501)).toBe("needs-improvement");
  expect(rate("lcp", 4001)).toBe("poor");
  expect(rate("inp", 200)).toBe("good");
  expect(rate("cls", 0.1)).toBe("good");
  expect(rate("cls", 0.26)).toBe("poor");
});

test("a summary skips loads that didn't measure the metric and reads NUMERIC strings", () => {
  const rows = [row({ lcp_ms: 1000, cls: "0.05" }), row({ lcp_ms: 3000 }), row({ lcp_ms: 5000, cls: "0.3" }), row({})];
  expect(summarize(rows, "lcp", 50)).toEqual({ value: 3000, rating: "needs-improvement", goodShare: 33, samples: 3 });
  expect(summarize(rows, "cls", 75)).toEqual({ value: 0.3, rating: "poor", goodShare: 50, samples: 2 });
  expect(summarize(rows, "inp", 75)).toEqual({ value: null, rating: null, goodShare: null, samples: 0 });
});

test("groups are ordered by loads", () => {
  const rows = [row({ device_type: "mobile" }), row({ device_type: "desktop" }), row({ device_type: "mobile" })];
  expect(groupVitals(rows, (r) => r.device_type ?? "").map((g) => [g.label, g.rows.length])).toEqual([
    ["mobile", 2],
    ["desktop", 1],
  ]);
});

test("values are formatted per unit", () => {
  expect(formatVital("lcp", 1234)).toBe("1.23 s");
  expect(formatVital("inp", 180.4)).toBe("180 ms");
  expect(formatVital("cls", 0.081)).toBe("0.08");
  expect(formatVital("ttfb", null)).toBe("—");
});

test("the track route keeps valid metrics and drops bad ones", () => {
  expect(parseVitals({ lcp: 1234.6, cls: 0.123456, inp: -1, fcp: "900", ttfb: 1e9 })).toEqual({
    lcp_ms: 1235,
    inp_ms: null,
    cls: 0.1235,
    fcp_ms: null,
    ttfb_ms: null,
  });
  expect(parseVitals({ lcp: Number.NaN })).toBeNull();
  expect(parseVitals({})).toBeNull();
});

// --- The tracking script in a real browser ---

const SCRIPT = readFileSync(path.join(__dirname, "../public/tracking-script.js"), "utf8");
const ENDPOINT = "https://analytica-phi.vercel.app/api/track";

type Sent = Record<string, unknown> & { event: string };

async function openSite(page: Page, attributes = ""): Promise<Sent[]> {
  const sent: Sent[] = [];
  await page.route(ENDPOINT, async (route) => {
    sent.push(JSON.parse(route.request().postData() ?? "{}"));
    await route.fulfill({ status: 201, body: "{}", headers: { "access-control-allow-origin": "*" } });
  });
  const html = `<html><body>
    <h1 style="font-size:64px">A large heading that is the largest paint</h1>
    <button id="slow">slow</button>
    <script>
      document.getElementById("slow").addEventListener("click", function () {
        var end = Date.now() + 300;
        while (Date.now() < end) {}
      });
      // An unexpected shift: a banner pushes the content down after load.
      setTimeout(function () {
        var banner = document.createElement("div");
        banner.style.height = "300px";
        document.body.insertBefore(banner, document.body.firstChild);
      }, 300);
    </script>
    <script defer data-domain="site.test" ${attributes} src="https://site.test/t.js"></script></body></html>`;
  await page.route("https://site.test/**", (route) =>
    route.request().url().endsWith("/t.js")
      ? route.fulfill({ contentType: "application/javascript", body: SCRIPT })
      : route.fulfill({ contentType: "text/html", body: html })
  );
  await page.goto("https://site.test/page");
  await expect.poll(() => sent.filter((s) => s.event === "pageview").length).toBe(1);
  return sent;
}

const hide = (page: Page) => page.evaluate(() => window.dispatchEvent(new Event("pagehide")));

test.describe("tracking script: web vitals", () => {
  test.skip(({ isMobile, browserName }) => isMobile || browserName !== "chromium", "Chromium measures every metric");

  test("sends one web_vitals event with every metric when the page is hidden", async ({ page }) => {
    const sent = await openSite(page);
    await page.waitForTimeout(800); // let the layout shift happen
    await page.click("#slow");
    await page.waitForTimeout(300);
    await hide(page);
    await expect.poll(() => sent.filter((s) => s.event === "web_vitals").length).toBe(1);
    await hide(page);
    await page.waitForTimeout(300);

    const vitals = sent.filter((s) => s.event === "web_vitals");
    expect(vitals).toHaveLength(1);
    const v = vitals[0];
    expect(v.url).toBe("https://site.test/page");
    expect(v.domain).toBe("site.test");
    expect(v.sessionId).toMatch(/^session-[0-9a-f]{16}$/);
    for (const key of ["lcp", "fcp", "ttfb"]) expect(typeof v[key]).toBe("number");
    expect(v.cls as number).toBeGreaterThan(0);
    expect(v.inp as number).toBeGreaterThanOrEqual(250);
  });

  test('data-web-vitals="false" turns it off', async ({ page }) => {
    const sent = await openSite(page, 'data-web-vitals="false"');
    await page.waitForTimeout(500);
    await hide(page);
    await page.waitForTimeout(500);
    expect(sent.filter((s) => s.event === "web_vitals")).toHaveLength(0);
  });
});
