import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * The only Supabase client browser code should create. Values are read as
 * literal `process.env.NEXT_PUBLIC_*` references (not proxied through a
 * shared object) so Next.js can inline them into the client bundle.
 *
 * Uses the publishable key (replaces the legacy anon key - Supabase is
 * retiring anon/service_role keys by end of 2026). Same low privilege,
 * same RLS behavior, just a new key format (`sb_publishable_...`).
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. See .env.example.",
    );
  }

  return createBrowserClient<Database>(url, publishableKey);
}
