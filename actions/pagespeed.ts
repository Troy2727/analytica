"use server";

// Server actions run without the user's session, and `websites` rows are
// owner-only under RLS, so metrics are read and written with the service role.
// Metrics are per domain: several users can add the same domain, and every
// row with that name gets the same results.

import { supabaseAdmin } from "@/lib/supabase";
import type { PerformanceMetrics } from "@/types";

const METRIC_COLUMNS =
  "performance, accessibility, bestPractices, seo, firstContentfulPaint, largestContentfulPaint, timeToInteractive, totalBlockingTime, cumulativeLayoutShift, speedIndex";

/** "https://www.example.com" -> "example.com" */
const bareDomain = (site: string) => site.trim().replace(/^(https?:\/\/)?(www\.)?/, "");

/** Strip newlines so values can't forge extra log lines. */
const forLog = (error: unknown) =>
  (error instanceof Error ? error.message : String(error)).replace(/[\r\n]/g, " ");

/** Last saved Lighthouse results for a domain; null when it was never analyzed. */
export async function getSavedMetrics(domain: string): Promise<PerformanceMetrics | null> {
  const name = bareDomain(domain);
  if (!name) throw new Error("A domain is required");

  const { data, error } = await supabaseAdmin()
    .from("websites")
    .select(METRIC_COLUMNS)
    .eq("name", name)
    .limit(1)
    .maybeSingle<Partial<PerformanceMetrics>>();
  if (error) {
    console.error("Loading saved metrics failed:", forLog(error));
    throw new Error("Could not load saved metrics");
  }
  if (!data || data.performance == null) return null;

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, Number(value ?? 0)])
  ) as unknown as PerformanceMetrics;
}

interface LighthouseResult {
  categories: Record<string, { score: number }>;
  audits: Record<string, { numericValue: number }>;
}

/** Run Google PageSpeed (mobile) on `url`, save the results for `domain`, and return them. */
export async function runPageSpeed(domain: string, url: string): Promise<PerformanceMetrics | null> {
  const key = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!key) {
    console.error("GOOGLE_PAGESPEED_API_KEY is not configured");
    return null;
  }

  const api = new URL("https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed");
  api.searchParams.set("url", url);
  api.searchParams.set("key", key);
  api.searchParams.set("strategy", "mobile");
  for (const category of ["performance", "accessibility", "best-practices", "seo"]) {
    api.searchParams.append("category", category);
  }

  try {
    const response = await fetch(api, {
      signal: AbortSignal.timeout(60_000), // Lighthouse runs can take most of a minute
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("PageSpeed API returned", response.status);
      return null;
    }
    const { lighthouseResult: lh } = (await response.json()) as { lighthouseResult?: LighthouseResult };
    if (!lh) {
      console.error("PageSpeed response had no Lighthouse result");
      return null;
    }

    const score = (category: string) => Math.round(lh.categories[category].score * 100);
    const ms = (audit: string) => Math.round(lh.audits[audit].numericValue);
    const metrics: PerformanceMetrics = {
      performance: score("performance"),
      accessibility: score("accessibility"),
      bestPractices: score("best-practices"),
      seo: score("seo"),
      firstContentfulPaint: ms("first-contentful-paint"),
      largestContentfulPaint: ms("largest-contentful-paint"),
      timeToInteractive: ms("interactive"),
      totalBlockingTime: ms("total-blocking-time"),
      speedIndex: ms("speed-index"),
      cumulativeLayoutShift: Math.round(lh.audits["cumulative-layout-shift"].numericValue * 1000) / 1000,
    };

    const { error } = await supabaseAdmin()
      .from("websites")
      .update(metrics)
      .eq("name", bareDomain(domain));
    if (error) {
      console.error("Saving metrics failed:", forLog(error));
      return null;
    }
    return metrics;
  } catch (error) {
    console.error("PageSpeed run failed:", forLog(error));
    return null;
  }
}
