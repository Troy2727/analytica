import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/**
 * The shared anon client. In the browser it carries the signed-in user's
 * session, so row-level security limits every query to that user's data.
 * Responses are never cached: analytics must always be fresh.
 */
export const supabase = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  global: {
    fetch: (input, init) => fetch(input, { cache: "no-cache", ...init }),
  },
});

/**
 * Service-role client that bypasses row-level security. Server-only: use it
 * where there is no user session (API-key requests, server actions) and check
 * ownership in code instead.
 */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return createClient(url, key);
}
