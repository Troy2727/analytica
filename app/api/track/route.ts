// Receives events from public/tracking-script.js running on customers' sites.

import { NextRequest, NextResponse } from "next/server";
import { CORS_HEADERS } from "@/lib/cors";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface TrackRequest {
  event: "session_start" | "pageview" | "session_end";
  domain: string;
  url: string;
  source?: string;
  operatingSystem?: string;
  deviceType?: string;
  browserName?: string;
}

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

    if (body.event === "pageview") {
      const { error } = await supabase.from("page_views").insert({
        domain: body.domain,
        page: body.url,
        ...locate(request),
        operating_system: body.operatingSystem || "Unknown",
        device_type: body.deviceType || "Unknown",
        browser_name: body.browserName || "Unknown",
      });
      if (error) throw error;
    } else if (body.event === "session_start") {
      const { error } = await supabase.from("visits").insert({
        website_id: body.domain,
        event: "session_start",
        source: body.source || "direct",
      });
      if (error) throw error;
    }

    return reply({ success: true, data: body }, 201);
  } catch (error) {
    console.error("Tracking request failed:", error);
    return reply({ error: "Failed to process tracking request" }, 500);
  }
}
