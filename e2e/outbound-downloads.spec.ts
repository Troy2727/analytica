import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { topLinks } from "@/lib/analytics";
import { normalizeLinkUrl } from "@/lib/link-url";
import type { LinkEvent } from "@/types";

const SCRIPT = readFileSync(path.join(__dirname, "../public/tracking-script.js"), "utf8");
const ENDPOINT = "https://analytica-phi.vercel.app/api/track";

interface Sent {
  event: string;
  url: string;
  targetUrl?: string;
  sessionId: string;
  contentType: string;
}

const LINKS = `
  <a id="ext" href="https://other.test/a/b?x=1#f">ext</a>
  <a id="ext-span" href="https://other.test/span"><span id="inner">inner</span></a>
  <a id="blank" href="https://other.test/blank" target="_blank">blank</a>
  <a id="mail" href="mailto:a@b.test">mail</a>
  <a id="tel" href="tel:123">tel</a>
  <a id="js" href="javascript:void(0)">js</a>
  <a id="hash" href="#top">hash</a>
  <a id="nohref">nohref</a>
  <a id="ftp" href="ftp://other.test/f">ftp</a>
  <a id="internal" href="/other.html">internal</a>
  <a id="pdf" href="/files/report.pdf?v=2#p3">pdf</a>
  <a id="pdf-upper" href="/files/REPORT.PDF">PDF</a>
  <a id="pdf-hash" href="/files/report.pdf#page=2">pdf#</a>
  <a id="ext-pdf" href="https://other.test/doc.pdf">ext pdf</a>
  <a id="www" href="https://www.site.test/x">www</a>
  <a id="sub" href="https://shop.site.test/x">sub</a>
  <a id="port" href="https://site.test:8443/x">port</a>
  <a id="scheme" href="http://site.test/x">scheme</a>
  <a id="download" href="/get-it" download>download attr</a>
  <a id="zip" href="/files/a.zip">zip</a>
  <a id="xyz" href="/files/a.xyz">xyz</a>
  <a id="stopper" href="https://other.test/stopped">stopper</a>
  <svg width="40" height="20"><a id="svg-link" href="https://other.test/svg"><rect id="svg-rect" width="40" height="20" /></a></svg>
  <img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" usemap="#m" width="20" height="20" id="map-img" />
  <map name="m"><area id="area" shape="rect" coords="0,0,20,20" href="https://other.test/area" /></map>
`;

/** Serve a fake site with the script (and optional script attributes); capture what it sends. */
async function openSite(page: Page, attributes = "", { blockNavigation = true } = {}): Promise<Sent[]> {
  const sent: Sent[] = [];
  await page.route(ENDPOINT, async (route) => {
    const req = route.request();
    sent.push({ ...JSON.parse(req.postData() ?? "{}"), contentType: req.headers()["content-type"] ?? "" });
    await route.fulfill({ status: 201, body: "{}", headers: { "access-control-allow-origin": "*" } });
  });
  const html = `<html><body>${LINKS}
    <script>
      ${blockNavigation ? 'document.addEventListener("click", function (e) { e.preventDefault(); });' : ""}
      document.getElementById("stopper").addEventListener("click", function (e) { e.stopPropagation(); e.preventDefault(); });
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

const links = (sent: Sent[]) => sent.filter((s) => s.event === "outbound_click" || s.event === "file_download");
const settle = (page: Page) => page.waitForTimeout(300);
/** Wait until `count` link events arrived, then a little longer so any extra (unwanted) ones would show. */
async function arrived(sent: Sent[], count: number) {
  await expect.poll(() => links(sent).length).toBeGreaterThanOrEqual(count);
  await new Promise((resolve) => setTimeout(resolve, 500));
}

test.describe("tracking script: outbound links and downloads", () => {
  test.skip(({ isMobile }) => isMobile, "script checks run once");

  test("an outbound click sends the link without query or fragment", async ({ page }) => {
    const sent = await openSite(page);
    await page.click("#ext");
    await expect.poll(() => links(sent).length).toBe(1);
    const [event] = links(sent);
    expect(event).toMatchObject({ event: "outbound_click", targetUrl: "https://other.test/a/b", url: "https://site.test/page" });
    expect(event.sessionId).toMatch(/^session-[0-9a-f]{16}$/);
    expect(event.contentType).toContain("text/plain");
  });

  test("non-web, same-page, href-less and internal links send nothing", async ({ page }) => {
    const sent = await openSite(page);
    for (const id of ["mail", "tel", "js", "hash", "nohref", "ftp", "internal", "www", "scheme"]) await page.click(`#${id}`);
    await settle(page);
    expect(links(sent)).toEqual([]);
  });

  test("files on the same site are downloads, matched case-insensitively and ignoring query and fragment", async ({ page }) => {
    const sent = await openSite(page);
    for (const id of ["pdf", "pdf-upper", "pdf-hash", "download"]) {
      await page.click(`#${id}`);
      await page.waitForTimeout(1100); // past the double-click window
    }
    await expect.poll(() => links(sent).length).toBe(4);
    expect(links(sent).map((s) => [s.event, s.targetUrl])).toEqual([
      ["file_download", "https://site.test/files/report.pdf"],
      ["file_download", "https://site.test/files/REPORT.PDF"],
      ["file_download", "https://site.test/files/report.pdf"],
      ["file_download", "https://site.test/get-it"],
    ]);
  });

  test("an external file is an outbound click; subdomains and other ports are outbound", async ({ page }) => {
    const sent = await openSite(page);
    for (const id of ["ext-pdf", "sub", "port"]) await page.click(`#${id}`);
    await expect.poll(() => links(sent).length).toBe(3);
    expect(links(sent).map((s) => [s.event, s.targetUrl])).toEqual([
      ["outbound_click", "https://other.test/doc.pdf"],
      ["outbound_click", "https://shop.site.test/x"],
      ["outbound_click", "https://site.test:8443/x"],
    ]);
  });

  test("children, new tabs, late links, middle click, ctrl-click and Enter count; right click doesn't", async ({ page }) => {
    const sent = await openSite(page);
    await page.click("#inner");
    await page.click("#blank");
    await page.evaluate(() => {
      const a = document.createElement("a");
      a.id = "late";
      a.href = "https://other.test/late";
      a.textContent = "late";
      document.body.appendChild(a);
    });
    await page.click("#late");
    await page.click("#ext", { button: "middle" });
    await page.waitForTimeout(1100);
    await page.click("#ext", { modifiers: ["Control"] });
    await page.waitForTimeout(1100);
    await page.focus("#ext");
    await page.keyboard.press("Enter");
    await expect.poll(() => links(sent).length).toBe(6);
    await page.click("#sub", { button: "right" });
    await settle(page);
    expect(links(sent).map((s) => s.targetUrl)).toEqual([
      "https://other.test/span",
      "https://other.test/blank",
      "https://other.test/late",
      "https://other.test/a/b",
      "https://other.test/a/b",
      "https://other.test/a/b",
    ]);
  });

  test("a link whose own handler stops propagation still counts; SVG links and image-map areas count", async ({ page }) => {
    const sent = await openSite(page);
    await page.click("#stopper");
    await page.click("#svg-rect");
    await page.click("#map-img", { position: { x: 5, y: 5 } });
    await expect.poll(() => links(sent).length).toBe(3);
    expect(links(sent).map((s) => s.targetUrl)).toEqual([
      "https://other.test/stopped",
      "https://other.test/svg",
      "https://other.test/area",
    ]);
  });

  test("script attributes turn each kind off and change the file types", async ({ page }) => {
    let sent = await openSite(page, 'data-outbound-links="false"');
    await page.click("#ext");
    await page.click("#pdf");
    await arrived(sent, 1);
    expect(links(sent).map((s) => s.event)).toEqual(["file_download"]);

    await page.unrouteAll();
    sent = await openSite(page, 'data-file-downloads="false"');
    await page.click("#pdf");
    await page.click("#ext");
    await arrived(sent, 1);
    expect(links(sent).map((s) => s.event)).toEqual(["outbound_click"]);

    await page.unrouteAll();
    sent = await openSite(page, 'data-file-types="zip"');
    await page.click("#zip");
    await page.click("#pdf");
    await arrived(sent, 1);
    expect(links(sent).map((s) => s.targetUrl)).toEqual(["https://site.test/files/a.zip"]);

    await page.unrouteAll();
    sent = await openSite(page, 'data-add-file-types=".XYZ"');
    await page.click("#xyz");
    await page.click("#pdf");
    await arrived(sent, 2);
    expect(links(sent).map((s) => s.targetUrl)).toEqual(["https://site.test/files/a.xyz", "https://site.test/files/report.pdf"]);
  });

  test("relative links resolve against <base href>, as the browser does", async ({ page }) => {
    const sent = await openSite(page);
    await page.evaluate(() => {
      const base = document.createElement("base");
      base.href = "https://other.test/docs/";
      document.head.appendChild(base);
      const a = document.createElement("a");
      a.id = "relative";
      a.href = "guide.html";
      a.textContent = "relative";
      document.body.appendChild(a);
    });
    await page.click("#relative");
    await arrived(sent, 1);
    expect(links(sent).map((s) => [s.event, s.targetUrl])).toEqual([["outbound_click", "https://other.test/docs/guide.html"]]);
  });

  test("a double click sends once; clicks a second apart send twice", async ({ page }) => {
    const sent = await openSite(page);
    await page.dblclick("#ext");
    await arrived(sent, 1);
    expect(links(sent)).toHaveLength(1);
    await page.waitForTimeout(1000);
    await page.click("#ext");
    await expect.poll(() => links(sent).length).toBe(2);
  });

  test("link clicks don't renew the session", async ({ page }) => {
    const sent = await openSite(page);
    const before = await page.evaluate(() => localStorage.getItem("session_expiration_timestamp"));
    await page.waitForTimeout(50);
    await page.click("#ext");
    await expect.poll(() => links(sent).length).toBe(1);
    expect(await page.evaluate(() => localStorage.getItem("session_expiration_timestamp"))).toBe(before);
  });

  test("navigation is never delayed or prevented", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("https://other.test/**", (route) => route.fulfill({ contentType: "text/html", body: "<p>arrived</p>" }));
    await openSite(page, "", { blockNavigation: false });
    await page.unroute(ENDPOINT);
    await page.route(ENDPOINT, async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.fulfill({ status: 201, body: "{}" }).catch(() => {});
    });
    const prevented: boolean[] = [];
    await page.exposeFunction("reportPrevented", (value: boolean) => prevented.push(value));
    // Window bubble listeners run last, so this sees the final defaultPrevented.
    await page.evaluate(() =>
      window.addEventListener("click", (e) => (window as unknown as { reportPrevented: (v: boolean) => void }).reportPrevented(e.defaultPrevented))
    );
    const started = Date.now();
    await page.click("#ext");
    await page.waitForURL("https://other.test/**");
    expect(Date.now() - started).toBeLessThan(2500);
    expect(prevented).toEqual([false]);
    expect(errors).toEqual([]);
  });
});

test.describe("track route: link events", () => {
  test.skip(({ isMobile }) => isMobile, "API checks run once");

  test("link events for another domain are rejected", async ({ request }) => {
    const res = await request.post("/api/track", {
      data: { event: "outbound_click", domain: "example.com", url: "https://not-example.org/", targetUrl: "https://x.test/" },
    });
    expect(res.status()).toBe(400);
    expect(await res.json()).toEqual({ error: "Domain mismatch" });
  });

  test("unsafe or malformed link URLs are rejected before any write", async ({ request }) => {
    const base = { event: "outbound_click", domain: "example.com", url: "https://example.com/" };
    const bad = ["javascript:alert(1)", "data:text/html,x", "ftp://x.test/f", "", 123, undefined, "https://x.test/ a", `https://x.test/${"a".repeat(2040)}`];
    for (const targetUrl of bad) {
      const res = await request.post("/api/track", { data: { ...base, targetUrl } });
      expect(res.status(), String(targetUrl).slice(0, 40)).toBe(400);
      expect(await res.json()).toEqual({ error: "Invalid link URL" });
    }
  });
});

test("link URLs are normalized to origin and path", () => {
  expect(normalizeLinkUrl("HTTPS://User:pw@Example.COM:443/a/b?q=1#h")).toBe("https://example.com/a/b");
  expect(normalizeLinkUrl("http://x.test:8080/p")).toBe("http://x.test:8080/p");
  for (const bad of ["javascript:alert(1)", "/relative", "https://x.test/\n", "", null, 5]) expect(normalizeLinkUrl(bad)).toBeNull();
});

test("top links rank by clicks within a kind", () => {
  const row = (kind: LinkEvent["kind"], url: string): LinkEvent => ({
    id: url,
    domain: "site.test",
    kind,
    url,
    page: null,
    client_session_id: null,
    created_at: "2026-01-01T00:00:00Z",
  });
  const rows = [row("outbound", "https://a.test/"), row("outbound", "https://b.test/"), row("outbound", "https://b.test/"), row("download", "https://site.test/x.pdf")];
  expect(topLinks(rows, "outbound")).toEqual([
    { label: "https://b.test/", count: 2 },
    { label: "https://a.test/", count: 1 },
  ]);
  expect(topLinks(rows, "download")).toEqual([{ label: "https://site.test/x.pdf", count: 1 }]);
});
