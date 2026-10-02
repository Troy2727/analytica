import { test, expect } from "@playwright/test";

// None of these requests write to the database.

test("track rejects a url that does not match the domain", async ({ request }) => {
  const res = await request.post("/api/track", {
    data: { event: "pageview", domain: "example.com", url: "https://not-example.org/" },
  });
  expect(res.status()).toBe(400);
  expect(await res.json()).toEqual({ error: "Domain mismatch" });
});

test("track allows cross-origin requests from any site", async ({ request }) => {
  const res = await request.fetch("/api/track", { method: "OPTIONS" });
  expect(res.ok()).toBe(true);
  expect(res.headers()["access-control-allow-origin"]).toBe("*");
});

test("keepalive reaches the database", async ({ request }) => {
  const res = await request.get("/api/keepalive");
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
});

test("events requires an API key", async ({ request }) => {
  const res = await request.post("/api/events", {
    data: { name: "e2e", domain: "example.com", description: "e2e" },
  });
  expect(res.status()).toBe(401);
});

test("events rejects an unknown API key", async ({ request }) => {
  const res = await request.post("/api/events", {
    headers: { Authorization: "Bearer not-a-real-key" },
    data: { name: "e2e", domain: "example.com", description: "e2e" },
  });
  expect(res.status()).toBe(403);
});
