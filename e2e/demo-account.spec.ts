import { test, expect, type Page } from "@playwright/test";

// The public demo account from the README (see supabase/migrations/005).
// These tests only read; the account cannot change its password or demo site.
const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "AnalyticaDemo2026!";
const DEMO_SITE = "analytica-phi.vercel.app";

async function signIn(page: Page) {
  await page.goto("/sign-in");
  await page.locator('input[type="email"]').fill(DEMO_EMAIL);
  await page.locator('input[type="password"]').fill(DEMO_PASSWORD);
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
}

test("demo account signs in and sees its website on the dashboard", async ({ page }) => {
  await signIn(page);
  await expect(page.getByText(DEMO_SITE).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("No websites added yet")).toHaveCount(0);
});

test("demo site page shows analytics, events and PageSpeed scores", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await signIn(page);
  await page.goto(`/site/${DEMO_SITE}`);
  await expect(page.getByText(`Analytics for ${DEMO_SITE}`)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Total Visits")).toBeVisible();

  await page.getByRole("tab", { name: "Events" }).click();
  await expect(page.getByText("Custom Events Overview")).toBeVisible();

  await page.getByRole("tab", { name: "Performance" }).click();
  const panel = page.locator('[role="tabpanel"][data-state="active"]');
  await expect(panel).toContainText("Performance Metrics");
  // Saved PageSpeed results render as a non-zero performance score.
  await expect(panel).toHaveText(/[1-9]\d*\s*Performance/, { timeout: 15_000 });

  expect(errors).toEqual([]);
});

test("demo account can open settings", async ({ page }) => {
  await signIn(page);
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "API Settings" })).toBeVisible({ timeout: 15_000 });
});
