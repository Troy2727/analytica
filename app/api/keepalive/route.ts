import { supabase } from "@/config/supabase";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Called daily by Vercel Cron (vercel.json) so the free-tier Supabase project
// never pauses for inactivity. RLS returns no rows to the anon client, but the
// database still executes the query.
export async function GET() {
  const { error } = await supabase.from("websites").select("id").limit(1);

  if (error) {
    console.error("Keepalive query failed:", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
