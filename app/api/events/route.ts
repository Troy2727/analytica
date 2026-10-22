// Custom events API: `POST /api/events` with `Authorization: Bearer <API key>`.
// Records the event and, if the owner linked Discord, DMs them about it.

import { NextRequest, NextResponse } from "next/server";
import { CORS_HEADERS } from "@/lib/cors";
import { sendDiscordDm } from "@/lib/discord";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import type { EventField, UserData } from "@/types";

export const dynamic = "force-dynamic";

interface EventRequest {
  name: string;
  domain: string;
  description: string;
  fields?: EventField[];
  emoji?: string;
}

const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: CORS_HEADERS });

export function OPTIONS() {
  return new Response(null, { headers: CORS_HEADERS });
}

export async function GET() {
  // Anon client: RLS decides what is visible.
  const { data, error } = await supabase.from("events").select("*");
  return error ? reply({ error: "Failed to fetch events" }, 500) : reply(data);
}

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    const body = (await request.json()) as EventRequest;
    if (!auth?.startsWith("Bearer ")) {
      return reply({ error: "Unauthorized - Invalid API" }, 401);
    }

    // API-key requests have no user session, so the admin client is used and
    // ownership is checked here instead of by RLS.
    const db = supabaseAdmin();
    const { data: owner } = await db
      .from("users")
      .select("*")
      .eq("api", auth.slice("Bearer ".length))
      .single<UserData>();
    if (!owner) {
      return reply({ error: "Unauthorized - Invalid API" }, 403);
    }

    const { name, domain, description, fields = [], emoji = "🔔" } = body;
    if (!name || !domain || !description) {
      return reply({ error: "Name, Domain, and Description Fields Must NOT Be Empty." }, 400);
    }

    const { data: site } = await db
      .from("websites")
      .select("id")
      .eq("name", domain)
      .eq("user_id", owner.id)
      .maybeSingle();
    if (!site) {
      return reply({ error: "Forbidden - Domain not registered to this API key" }, 403);
    }

    const { error } = await db.from("events").insert({
      event_name: name,
      website_id: domain,
      domain,
      message: description,
      fields,
    });
    if (error) return reply({ error }, 400);

    const token = process.env.DISCORD_BOT_TOKEN;
    if (!owner.discord_id || !token) {
      return reply({ message: "success without discord notification" });
    }
    try {
      await sendDiscordDm(
        owner.discord_id,
        {
          title: `${emoji} New Event: ${name}`,
          description,
          color: 0x0099ff,
          timestamp: new Date().toISOString(),
          fields: [{ name: "Domain", value: domain, inline: true }, ...fields],
        },
        token
      );
      return reply({ message: "success with discord notification" });
    } catch (discordError) {
      console.error("Discord delivery failed:", discordError);
      return reply({ message: "Event recorded but Discord notification failed" });
    }
  } catch (error) {
    return reply({ error: error instanceof Error ? error.message : "Unknown error occurred" }, 500);
  }
}
