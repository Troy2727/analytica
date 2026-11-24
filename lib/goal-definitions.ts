// Goal and funnel definitions, read and written in the browser under the
// owner's session (RLS limits every call to their own websites).

import { supabase } from "@/lib/supabase";
import type { Funnel, Goal } from "@/types";

/** Another goal (or another funnel, for funnels) on the site already has this name, ignoring case. */
export class DuplicateNameError extends Error {}

function check(error: { code?: string; message: string } | null) {
  if (!error) return;
  if (error.code === "23505") throw new DuplicateNameError(error.message);
  throw error;
}

export async function listDefinitions(websiteId: string): Promise<{ goals: Goal[]; funnels: Funnel[] }> {
  const [goals, funnels] = await Promise.all([
    supabase.from("goals").select("*").eq("website_id", websiteId).order("created_at").returns<Goal[]>(),
    supabase.from("funnels").select("*").eq("website_id", websiteId).order("created_at").returns<Funnel[]>(),
  ]);
  check(goals.error ?? funnels.error);
  return { goals: goals.data ?? [], funnels: funnels.data ?? [] };
}

export async function saveGoal(websiteId: string, goal: { id?: string; name: string; pattern: string }): Promise<void> {
  const row = { name: goal.name, pattern: goal.pattern };
  const { error } = goal.id
    ? await supabase.from("goals").update(row).eq("id", goal.id)
    : await supabase.from("goals").insert({ ...row, website_id: websiteId });
  check(error);
}

export async function saveFunnel(websiteId: string, funnel: { id?: string; name: string; steps: string[] }): Promise<void> {
  const row = { name: funnel.name, steps: funnel.steps };
  const { error } = funnel.id
    ? await supabase.from("funnels").update(row).eq("id", funnel.id)
    : await supabase.from("funnels").insert({ ...row, website_id: websiteId });
  check(error);
}

export async function deleteDefinition(table: "goals" | "funnels", id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq("id", id);
  check(error);
}
