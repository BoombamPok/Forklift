import "server-only";
import { redirect } from "next/navigation";

import { requireUser, type CurrentUser } from "@/lib/auth/get-current-user";
import { can, type Permission } from "@/lib/permissions";

/**
 * Server-side authorization gate for a page/action - defense in depth
 * alongside RLS (CLAUDE.md #12: never rely on hiding UI elements alone).
 * Redirects to the dashboard with nothing rendered rather than exposing
 * that a restricted route exists.
 */
export async function requireRole(
  permission: Permission,
): Promise<CurrentUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) {
    redirect("/dashboard");
  }
  return user;
}
