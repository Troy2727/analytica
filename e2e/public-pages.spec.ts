import { test, expect, type Response } from "@playwright/test";

test("homepage renders and its own tracking calls succeed", async ({ page, baseURL }) => {
  const errors: string[] = [];
  const trackResponses: Response[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.url().includes("/api/track")) trackResponses.push(r);
    else if (r.url().startsWith(baseURL!) && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 }).first()).toContainText("Every visit.");
  await expect(page.getByRole("link", { name: /get started/i }).first()).toBeVisible();

  // The site tracks itself: session_start + pageview must both be stored (201).
  await expect.poll(() => trackResponses.length, { timeout: 15_000 }).toBeGreaterThanOrEqual(2);
  for (const r of trackResponses) expect(r.status(), r.request().postData() ?? "").toBe(201);
  expect(errors).toEqual([]);
});

test("homepage fits the viewport without horizontal scroll", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

for (const path of ["/dashboard", "/settings", "/site/example.com"]) {
  test(`logged-out visitor is sent from ${path} to sign-in`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/sign-in$/);
  });
}

test("sign-in rejects a wrong password with a clear message", async ({ page }) => {
  await page.goto("/sign-in");
  await page.locator('input[type="email"]').fill("e2e-nobody@example.com");
  await page.locator('input[type="password"]').fill("definitely-wrong-password");
  await page.locator('form button[type="submit"]').click();
  await expect(page.getByText("Invalid email or password")).toBeVisible();
});

test("sign-in offers GitHub and Google", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("button", { name: "GitHub" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Google" })).toBeVisible();
});

test("unknown routes show the 404 page", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("404 - Data Not Found")).toBeVisible();
});
