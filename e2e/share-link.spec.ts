import { test, expect } from "@playwright/test";
import { withoutQuery } from "@/lib/analytics";

// Checks that need no database: malformed tokens are rejected before any lookup.
// Flows with a real link (create, view, revoke) need the 008 migration applied.

const BAD_TOKENS = ["short", "x".repeat(64), "A".repeat(64), "0".repeat(63), `${"a".repeat(64)}0`];

test("shared payload URLs drop query strings and fragments", () => {
  expect(withoutQuery("https://site.test/page?secret=1#x")).toBe("https://site.test/page");
  expect(withoutQuery("https://site.test/page#top")).toBe("https://site.test/page");
  expect(withoutQuery("https://site.test/")).toBe("https://site.test/");
});

test.describe("share links", () => {
  test.skip(({ isMobile }) => isMobile, "checked once");

  test("every malformed token gets the same 404 from the data route", async ({ request }) => {
    const bodies = new Set<string>();
    for (const token of BAD_TOKENS) {
      const res = await request.get(`/api/share/example.com/${token}?timeframe=bogus`);
      expect(res.status()).toBe(404);
      bodies.add(await res.text());
    }
    expect([...bodies]).toEqual([JSON.stringify({ error: "Not found" })]);

    // Next itself rejects malformed percent-escapes before the route runs (500, as for any route).
    const badEscape = await request.get(`/api/share/%E0%A4%A/${"a".repeat(64)}`);
    expect(badEscape.ok()).toBe(false);
  });

  test("data route and page are never indexed or publicly cached", async ({ request }) => {
    for (const path of [`/api/share/example.com/${BAD_TOKENS[0]}`, `/share/example.com/${BAD_TOKENS[0]}`]) {
      const res = await request.get(path);
      const headers = res.headers();
      expect(headers["x-robots-tag"]).toBe("noindex, nofollow");
      expect(headers["cache-control"]).toContain("no-store");
      expect(headers["cache-control"]).not.toContain("public");
      expect(headers["referrer-policy"]).toBe("no-referrer");
    }
  });

  test("a bad link shows the 404 page and loads no tracking", async ({ page }) => {
    const tracking: string[] = [];
    page.on("request", (req) => {
      if (/tracking-script\.js|\/api\/track|_vercel\/insights/.test(req.url())) tracking.push(req.url());
    });
    const res = await page.goto(`/share/example.com/${"f".repeat(63)}`);
    expect(res?.status()).toBe(404);
    await expect(page.getByText("404 - Data Not Found")).toBeVisible();
    const robots = await page.locator('meta[name="robots"]').evaluateAll((tags) => tags.map((t) => t.getAttribute("content")));
    expect(robots.length).toBeGreaterThan(0);
    for (const content of robots) expect(content).toContain("noindex");
    await page.waitForTimeout(1000);
    expect(tracking).toEqual([]);
  });

  test("other pages still load Analytica's own tracking script", async ({ page }) => {
    const loaded = page.waitForRequest(/tracking-script\.js/);
    await page.goto("/");
    await loaded;
  });
});
