import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { errorLocation, groupErrors, parseJsError, sparkline } from "@/lib/js-errors";
import type { JsError } from "@/types";

// --- Grouping and validation (pure functions, no page) ---

const row = (values: Partial<JsError>): JsError => ({
  id: "1",
  domain: "site.test",
  page: "https://site.test/",
  name: "TypeError",
  message: "x is undefined",
  stack: null,
  file: null,
  line: null,
  col: null,
  country: null,
  operating_system: null,
  device_type: null,
  browser_name: null,
  client_session_id: null,
  created_at: "2026-01-01T12:00:00.000Z",
  ...values,
});

test("the track route keeps a bounded error and rejects one without a message", () => {
  expect(parseJsError({ name: " RangeError ", message: "m".repeat(2000), stack: "s", file: "https://a.test/x.js", line: 3, col: -1 })).toEqual({
    name: "RangeError",
    message: "m".repeat(1000),
    stack: "s",
    file: "https://a.test/x.js",
    line: 3,
    col: null,
  });
  expect(parseJsError({ name: "", message: "", stack: 5, line: 1.5 })).toEqual({
    name: "Error",
    message: "",
    stack: null,
    file: null,
    line: null,
    col: null,
  });
  expect(parseJsError({ name: "Error" })).toBeNull();
});

test("errors group by name and message, most frequent first, with distinct sessions", () => {
  const groups = groupErrors([
    row({ id: "a", client_session_id: "s1", created_at: "2026-01-01T10:00:00Z" }),
    row({ id: "b", name: "RangeError", message: "too deep" }),
    row({ id: "c", client_session_id: "s1", created_at: "2026-01-01T11:00:00Z" }),
    row({ id: "d", client_session_id: "s2", created_at: "2026-01-01T09:00:00Z" }),
    row({ id: "e", message: "y is undefined" }),
  ]);
  expect(groups.map((g) => [g.name, g.message, g.occurrences.length, g.sessions])).toEqual([
    ["TypeError", "x is undefined", 3, 2],
    ["RangeError", "too deep", 1, 0],
    ["TypeError", "y is undefined", 1, 0],
  ]);
  expect(groups[0].occurrences.map((r) => r.id)).toEqual(["c", "a", "d"]);
  expect(groups[0].lastSeen).toBe("2026-01-01T11:00:00Z");
});

test("the sparkline counts occurrences per slice of the range", () => {
  const start = Date.parse("2026-01-01T00:00:00Z");
  const end = start + 4 * 3600_000;
  const rows = ["00:10", "00:50", "02:30", "04:00", "05:00"].map((t) => row({ created_at: `2026-01-01T${t}:00Z` }));
  expect(sparkline(rows, start, end, 4)).toEqual([2, 0, 1, 1]);
});

test("the location is the stack's first frame, else the reported file", () => {
  const chrome = "TypeError: x\n    at boom (https://site.test/app.js:12:5)\n    at https://site.test/main.js:1:1";
  const firefox = "boom@https://site.test/app.js:12:5\n@https://site.test/main.js:1:1";
  expect(errorLocation({ stack: chrome, file: null, line: null, col: null })).toBe("https://site.test/app.js:12:5");
  expect(errorLocation({ stack: firefox, file: null, line: null, col: null })).toBe("https://site.test/app.js:12:5");
  expect(errorLocation({ stack: null, file: "https://site.test/a.js", line: 4, col: 2 })).toBe("https://site.test/a.js:4:2");
  expect(errorLocation({ stack: "no frames", file: null, line: null, col: null })).toBeNull();
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
    <script>
      function boom() { return undefined.value; }
      window.throwTypeError = function () { setTimeout(boom, 0); };
      window.rejectWith = function (reason) { Promise.reject(reason); };
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

const errorsIn = (sent: Sent[]) => sent.filter((s) => s.event === "js_error");

test.describe("tracking script: JavaScript errors", () => {
  test.skip(({ isMobile }) => isMobile, "Same script on every viewport");

  test("an uncaught error is sent once with its name, message, stack and location", async ({ page }) => {
    const sent = await openSite(page);
    await page.evaluate(() => (window as unknown as { throwTypeError: () => void }).throwTypeError());
    await expect.poll(() => errorsIn(sent).length).toBe(1);
    await page.evaluate(() => (window as unknown as { throwTypeError: () => void }).throwTypeError());
    await page.waitForTimeout(300);

    const errors = errorsIn(sent);
    expect(errors).toHaveLength(1); // the same error twice is reported once
    const e = errors[0];
    expect(e.name).toBe("TypeError");
    expect(typeof e.message).toBe("string");
    expect(e.message).not.toBe("");
    expect(e.stack).toContain("boom");
    expect(e.url).toBe("https://site.test/page");
    expect(e.domain).toBe("site.test");
    expect(e.sessionId).toMatch(/^session-[0-9a-f]{16}$/);
    expect(e.file).toBe("https://site.test/page");
    expect(typeof e.line).toBe("number");
  });

  test("unhandled rejections are sent, and at most 10 per page load", async ({ page }) => {
    const sent = await openSite(page);
    await page.evaluate(() => {
      const w = window as unknown as { rejectWith: (reason: unknown) => void };
      w.rejectWith(new RangeError("too deep"));
      w.rejectWith({ code: 42 });
      for (let i = 0; i < 20; i++) w.rejectWith(`failure ${i}`);
    });
    await expect.poll(() => errorsIn(sent).length).toBe(10);
    await page.waitForTimeout(300);

    const errors = errorsIn(sent);
    expect(errors).toHaveLength(10);
    expect(errors[0]).toMatchObject({ name: "RangeError", message: "too deep" });
    expect(errors[1]).toMatchObject({ name: "UnhandledRejection", message: '{"code":42}', stack: null });
    expect(errors[2]).toMatchObject({ name: "UnhandledRejection", message: "failure 0" });
  });

  test('data-errors="false" turns it off', async ({ page }) => {
    const sent = await openSite(page, 'data-errors="false"');
    await page.evaluate(() => (window as unknown as { throwTypeError: () => void }).throwTypeError());
    await page.waitForTimeout(500);
    expect(errorsIn(sent)).toHaveLength(0);
  });
});
