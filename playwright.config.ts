import { defineConfig, devices } from "@playwright/test";

// Smoke tests run against a deployed site (production by default).
// The tracking script posts to the production API with data-domain
// "analytica-phi.vercel.app", so tracking assertions only hold there.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: process.env.BASE_URL ?? "https://analytica-phi.vercel.app",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testIgnore: /api\.spec\.ts/ },
  ],
});
