import { supabase } from "@/lib/supabase";

/** Delete a website and everything recorded for it. RLS limits this to the owner's rows. */
export async function deleteWebsite(domain: string): Promise<void> {
  const results = await Promise.all([
    supabase.from("page_views").delete().eq("domain", domain),
    supabase.from("visits").delete().eq("website_id", domain),
    supabase.from("events").delete().eq("domain", domain),
  ]);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;

  const { error } = await supabase.from("websites").delete().eq("name", domain);
  if (error) throw error;
}
