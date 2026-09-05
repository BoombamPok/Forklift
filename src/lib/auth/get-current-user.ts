import "server-only";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/permissions";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

/**
 * Resolves the signed-in user + their app role, or `null` if signed out -
 * or if Supabase isn't configured yet (no .env.local). That last case
 * only matters before Phase 1 step 9/10; once real credentials exist it's
 * never hit, so callers don't need to special-case it.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();
    if (!profile) return null;

    return {
      id: user.id,
      email: user.email ?? "",
      name: profile.full_name ?? user.email ?? "Account",
      role: profile.role,
    };
  } catch (error) {
    console.warn("getCurrentUser: unable to resolve session", error);
    return null;
  }
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
