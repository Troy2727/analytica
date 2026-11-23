// Owner-side share link management, run in the browser under the owner's
// session (RLS limits every call to their own websites).

import { supabase } from "@/lib/supabase";

/** The public URL for a website's share link. */
export const shareUrl = (origin: string, domain: string, token: string) =>
  `${origin}/share/${encodeURIComponent(domain)}/${token}`;

/** The website's share token, or null when it has none. */
export async function getShareToken(websiteId: string): Promise<string | null> {
  const { data, error } = await supabase.from("share_links").select("token").eq("website_id", websiteId).maybeSingle();
  if (error) throw error;
  return data?.token ?? null;
}

/** Create the website's link; if one already exists (double click, another tab), return that one. */
export async function createShareToken(websiteId: string): Promise<string> {
  const { data, error } = await supabase.from("share_links").insert({ website_id: websiteId }).select("token").single();
  if (error?.code === "23505") {
    const existing = await getShareToken(websiteId);
    if (existing) return existing;
  }
  if (error) throw error;
  return data.token;
}

/** Delete the website's link; its URL stops working immediately. */
export async function revokeShareToken(websiteId: string): Promise<void> {
  const { error } = await supabase.from("share_links").delete().eq("website_id", websiteId);
  if (error) throw error;
}
