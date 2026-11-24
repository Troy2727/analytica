// Receives events from public/tracking-script.js running on customers' sites.

import { NextRequest, NextResponse } from "next/server";
import { CORS_HEADERS } from "@/lib/cors";
import { parseJsError } from "@/lib/js-errors";
import { normalizeLinkUrl } from "@/lib/link-url";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface TrackRequest {
  event: "session_start" | "pageview" | "session_end" | "engagement" | "outbound_click" | "file_download" | "js_error";
  domain: string;
  url: string;
  sessionId?: string;
  engagedMs?: unknown;
  targetUrl?: unknown;
  name?: unknown;
  message?: unknown;
  stack?: unknown;
  file?: unknown;
  line?: unknown;
  col?: unknown;
  source?: string;
  operatingSystem?: string;
  deviceType?: string;
  browserName?: string;
}

const SESSION_ID = /^session-[0-9a-f]{16}$/;
const MAX_ENGAGED_MS = 30 * 60 * 1000;

/** The script's session id, or null when it is missing or malformed (older cached scripts send none). */
const sessionOf = (body: TrackRequest) =>
  typeof body.sessionId === "string" && SESSION_ID.test(body.sessionId) ? body.sessionId : null;

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

/** Visitor location from the geo headers Vercel adds to every request. */
function locate(request: NextRequest) {
  const header = (name: string) => request.headers.get(`x-vercel-ip-${name}`);
  const city = header("city");
  const country = header("country");
  return {
    city: city ? decodeURIComponent(city) : "Unknown",
    region: header("country-region") || "Unknown",
    country: (country && regionNames.of(country)) || "Unknown",
  };
}

const reply = (body: object, status: number) =>
  NextResponse.json(body, { status, headers: CORS_HEADERS });

export function OPTIONS() {
  return reply({}, 200);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TrackRequest;

    // Only record events for the page's own domain, so a site can't post
    // traffic in another site's name.
    if (!body.url?.includes(body.domain)) {
      return reply({ error: "Domain mismatch" }, 400);
    }

    const sessionId = sessionOf(body);

    if (body.event === "pageview") {
      const { error } = await supabase.from("page_views").insert({
        domain: body.domain,
        page: body.url,
        ...locate(request),
        operating_system: body.operatingSystem || "Unknown",
        device_type: body.deviceType || "Unknown",
        browser_name: body.browserName || "Unknown",
        client_session_id: sessionId,
      });
      if (error) throw error;
    } else if (body.event === "session_start") {
      const { error } = await supabase.from("visits").insert({
        website_id: body.domain,
        event: "session_start",
        source: body.source || "direct",
        client_session_id: sessionId,
      });
      if (error) throw error;
    } else if (body.event === "engagement") {
      if (!sessionId) return reply({ error: "Invalid session" }, 400);
      const ms = body.engagedMs;
      if (typeof ms !== "number" || !Number.isFinite(ms) || ms <= 0) {
        return reply({ error: "Invalid engagement" }, 400);
      }
      const { error } = await supabase.from("page_engagement").insert({
        domain: body.domain,
        page: body.url,
        client_session_id: sessionId,
        engaged_ms: Math.min(Math.max(1, Math.round(ms)), MAX_ENGAGED_MS), // the column requires 1..30 min
      });
      if (error) throw error;
    } else if (body.event === "outbound_click" || body.event === "file_download") {
      const url = normalizeLinkUrl(body.targetUrl);
      if (!url) return reply({ error: "Invalid link URL" }, 400);
      const { error } = await supabase.from("link_events").insert({
        domain: body.domain,
        kind: body.event === "outbound_click" ? "outbound" : "download",
        url,
        page: body.url.slice(0, 2048),
        client_session_id: sessionId,
      });
      if (error) throw error;
    } else if (body.event === "js_error") {
      const jsError = parseJsError(body);
      if (!jsError) return reply({ error: "Invalid error" }, 400);
      const { error } = await supabase.from("js_errors").insert({
        domain: body.domain,
        page: body.url.slice(0, 2048),
        ...jsError,
        country: locate(request).country,
        operating_system: (body.operatingSystem || "Unknown").slice(0, 50),
        device_type: (body.deviceType || "Unknown").slice(0, 50),
        browser_name: (body.browserName || "Unknown").slice(0, 50),
        client_session_id: sessionId,
      });
      if (error) throw error;
    }

    return reply({ success: true, data: body }, 201);
  } catch (error) {
    console.error("Tracking request failed:", error);
    return reply({ error: "Failed to process tracking request" }, 500);
  }
}
