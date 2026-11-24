// Data for a public share link. The token is checked on every request, so a
// revoked link stops working at once. Headers (no-store, noindex) come from next.config.ts.

import { NextRequest, NextResponse } from "next/server";
import { decodeDomain, getSharedPayload, resolveShare } from "@/lib/share-access";
import { TIMEFRAMES } from "@/lib/timeframe";

export const dynamic = "force-dynamic";

// One response for every kind of bad link, so callers can't tell which check failed.
const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });

export async function GET(request: NextRequest, { params }: { params: Promise<{ website: string; token: string }> }) {
  const { website, token } = await params;
  try {
    const domain = decodeDomain(website);
    const site = domain === null ? null : await resolveShare(domain, token);
    if (!site) return notFound();

    const timeframe = request.nextUrl.searchParams.get("timeframe") ?? "0";
    if (!TIMEFRAMES.some((t) => t.value === timeframe)) {
      return NextResponse.json({ error: "Invalid timeframe" }, { status: 400 });
    }
    return NextResponse.json(await getSharedPayload(site, timeframe));
  } catch (error) {
    console.error("Shared analytics request failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to load shared analytics" }, { status: 500 });
  }
}
