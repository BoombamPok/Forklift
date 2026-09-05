import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * The only Supabase client browser code should create. Values are read as
 * literal `process.env.NEXT_PUBLIC_*` references (not proxied through a
 * shared object) so Next.js can inline them into the client bundle.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. See .env.example.",
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
