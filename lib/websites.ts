import { isMissingTable, supabase } from "@/lib/supabase";

/** Delete a website and everything recorded for it. RLS limits this to the owner's rows. */
export async function deleteWebsite(domain: string): Promise<void> {
  const results = await Promise.all([
    supabase.from("page_views").delete().eq("domain", domain),
    supabase.from("visits").delete().eq("website_id", domain),
    supabase.from("events").delete().eq("domain", domain),
    supabase.from("link_events").delete().eq("domain", domain),
    supabase.from("web_vitals").delete().eq("domain", domain),
    supabase.from("js_errors").delete().eq("domain", domain),
  ]);
  // link_events, web_vitals and js_errors may not exist yet (migrations 010/013/014 not applied); that mustn't block deleting a site.
  const failed = results.find((r) => r.error && !isMissingTable(r.error));
  if (failed?.error) throw failed.error;

  const { error } = await supabase.from("websites").delete().eq("name", domain);
  if (error) throw error;
}
