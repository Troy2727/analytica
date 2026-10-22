// Browser-side reads. They run with the signed-in user's session, so RLS
// only returns rows for websites that user owns.

import { supabase } from "@/lib/supabase";
import { timeframeStart } from "@/lib/timeframe";
import type { CustomEvent, PageView, Visit, Website } from "@/types";

export interface SiteData {
  pageViews: PageView[];
  visits: Visit[];
  events: CustomEvent[];
}

/** Page views and visits within the timeframe, plus every custom event, for one domain. */
export async function getSiteData(domain: string, timeframe: string): Promise<SiteData> {
  const since = timeframeStart(timeframe)?.toISOString();

  let views = supabase.from("page_views").select("*").eq("domain", domain);
  let visits = supabase.from("visits").select("*").eq("website_id", domain);
  if (since) {
    views = views.gte("created_at", since);
    visits = visits.gte("created_at", since);
  }
  const events = supabase
    .from("events")
    .select("*")
    .eq("website_id", domain)
    .order("created_at", { ascending: false });

  const [v, s, e] = await Promise.all([
    views.returns<PageView[]>(),
    visits.returns<Visit[]>(),
    events.returns<CustomEvent[]>(),
  ]);
  const error = v.error ?? s.error ?? e.error;
  if (error) throw new Error(error.message);

  return { pageViews: v.data ?? [], visits: s.data ?? [], events: e.data ?? [] };
}

/** Page views in the last `minutes` minutes: a rough "people on the site now". */
export async function getActiveUsers(domain: string, minutes = 10): Promise<number> {
  const since = new Date(Date.now() - minutes * 60_000).toISOString();
  const { count, error } = await supabase
    .from("page_views")
    .select("id", { count: "exact", head: true })
    .eq("domain", domain)
    .gte("created_at", since);
  if (error) console.error("Active users query failed:", error.message);
  return count ?? 0;
}

async function countRows(table: "visits" | "page_views", domain: string, since?: string) {
  let query = supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq(table === "visits" ? "website_id" : "domain", domain);
  if (since) query = query.gte("created_at", since);
  const { count } = await query;
  return count ?? 0;
}

export interface WebsiteSummary extends Website {
  visits: { total: number; lastDay: number };
  pageViews: { total: number; lastDay: number };
}

/** The user's websites, newest first, with all-time and last-24-hour traffic counts. */
export async function getWebsiteSummaries(userId: string): Promise<WebsiteSummary[]> {
  const { data, error } = await supabase
    .from("websites")
    .select("id, name, user_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<Website[]>();
  if (error) {
    console.error("Loading websites failed:", error.message);
    return [];
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  return Promise.all(
    (data ?? []).map(async (site) => {
      const [visits, visitsDay, views, viewsDay] = await Promise.all([
        countRows("visits", site.name),
        countRows("visits", site.name, dayAgo),
        countRows("page_views", site.name),
        countRows("page_views", site.name, dayAgo),
      ]);
      return {
        ...site,
        visits: { total: visits, lastDay: visitsDay },
        pageViews: { total: views, lastDay: viewsDay },
      };
    })
  );
}
