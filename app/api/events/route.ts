import { supabase } from "@/config/supabase";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getCorsHeaders } from "@/lib/cors";
import { DiscordClient } from "@/lib/discord-client";
import { UserData } from "@/types";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase.from("events").select("*");

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500, headers: getCorsHeaders() }
      );
    }

    return NextResponse.json(data, {
      headers: getCorsHeaders(),
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: getCorsHeaders(),
  });
}

interface EventRequest {
  name: string;
  domain: string;
  description: string;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  emoji?: string;
}

export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    const {
      name,
      domain,
      description,
      fields = [],
      emoji = "🔔",
    } = (await req.json()) as EventRequest;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
      }
      // Server-only client: API-key requests have no user session, so RLS would
      // hide the users row and block the insert. Ownership is checked below instead.
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const apiKey = authHeader.split("Bearer ")[1];
      const { data: userData } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("api", apiKey)
        .single<UserData>();

      if (!userData) {
        return NextResponse.json(
          { error: "Unauthorized - Invalid API" },
          { status: 403, headers: getCorsHeaders() }
        );
      }

      if (name == "" || domain == "" || description == "") {
        return NextResponse.json(
          { error: "Name, Domain, and Description Fields Must NOT Be Empty." },
          { status: 400, headers: getCorsHeaders() }
        );
      }

      const { data: website } = await supabaseAdmin
        .from("websites")
        .select("id")
        .eq("name", domain)
        .eq("user_id", userData.id)
        .maybeSingle();

      if (!website) {
        return NextResponse.json(
          { error: "Forbidden - Domain not registered to this API key" },
          { status: 403, headers: getCorsHeaders() }
        );
      }

      const { error: eventError } = await supabaseAdmin.from("events").insert([
        {
          event_name: name,
          website_id: domain,
          domain: domain,
          message: description,
          fields: fields,
        },
      ]);

      if (eventError) {
        return NextResponse.json(
          { error: eventError },
          { status: 400, headers: getCorsHeaders() }
        );
      }

      if (userData.discord_id && process.env.DISCORD_BOT_TOKEN) {
        try {
          const discord = new DiscordClient(process.env.DISCORD_BOT_TOKEN);
          const dmChannel = await discord.createDM(userData.discord_id);

          await discord.sendEmbed(dmChannel.id, {
            title: `${emoji} New Event: ${name}`,
            description: description,
            color: 0x0099ff,
            timestamp: new Date().toISOString(),
            fields: [
              {
                name: "Domain",
                value: domain,
                inline: true
              },
              ...fields
            ],
          });

          return NextResponse.json(
            { message: "success with discord notification" },
            { status: 200, headers: getCorsHeaders() }
          );
        } catch (discordError) {
          console.error("Discord delivery failed:", discordError);
          return NextResponse.json(
            { message: "Event recorded but Discord notification failed" },
            { status: 200, headers: getCorsHeaders() }
          );
        }
      }

      return NextResponse.json(
        { message: "success without discord notification" },
        { status: 200, headers: getCorsHeaders() }
      );
    }

    return NextResponse.json(
      { error: "Unauthorized - Invalid API" },
      { status: 401, headers: getCorsHeaders() }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}