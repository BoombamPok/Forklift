import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * The Supabase client for Server Components and Server Actions. Cookie
 * writes are wrapped in try/catch because Server Components can't set
 * cookies - proxy.ts is what actually refreshes the session; this
 * silently no-ops there instead of throwing.
 *
 * Uses the publishable key (see lib/supabase/client.ts) - this client
 * still respects the caller's session/RLS, it's just usable server-side.
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. See .env.example.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component - proxy.ts refreshes the
          // session instead, so this is safe to ignore.
        }
      },
    },
  });
}
