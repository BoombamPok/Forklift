import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Secret-key client for privileged server-side operations only (e.g.
 * provisioning a user's profile row). The `server-only` import makes
 * bundling this into a Client Component a build error, not just a
 * convention - the secret key must never reach the browser. (Supabase's
 * secret key replaces the legacy service_role key and, unlike it, is
 * rejected outright if a request from a browser ever tries to use it.)
 *
 * Prefer lib/supabase/server.ts (RLS-scoped, respects the caller's
 * session) for everything else - this bypasses RLS entirely.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY. See .env.example.",
    );
  }

  return createSupabaseClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
