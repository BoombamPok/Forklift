import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/types/database";

export type UserListRow = {
  id: string;
  email: string;
  fullName: string | null;
  role: AppRole;
  status: "active" | "invited" | "deactivated";
  lastSignInAt: string | null;
  createdAt: string;
};

/**
 * Merges `profiles` (role, full name - readable via RLS's "Admins can view
 * all profiles" policy through the regular client) with Supabase Auth's
 * per-user email/last-sign-in/ban state (only available via the admin
 * client) - same fetch-flat-join-in-JS convention as the rest of the app.
 * `listUsers` defaults to 50/page; 200 comfortably covers a business of
 * this size for V1 without adding pagination this feature doesn't need yet.
 */
export async function getUserList(): Promise<UserListRow[]> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const [{ data: profiles, error: profilesError }, authUsersRes] =
    await Promise.all([
      supabase.from("profiles").select("id, role, full_name"),
      admin.auth.admin.listUsers({ perPage: 200 }),
    ]);
  if (profilesError) throw profilesError;
  if (authUsersRes.error) throw authUsersRes.error;

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return authUsersRes.data.users.map((user) => {
    const profile = profileById.get(user.id);
    const banned =
      user.banned_until !== null &&
      user.banned_until !== undefined &&
      new Date(user.banned_until).getTime() > Date.now();

    return {
      id: user.id,
      email: user.email ?? "",
      fullName: profile?.full_name ?? null,
      role: profile?.role ?? "staff",
      status: banned
        ? "deactivated"
        : user.last_sign_in_at
          ? "active"
          : "invited",
      lastSignInAt: user.last_sign_in_at ?? null,
      createdAt: user.created_at,
    };
  });
}
