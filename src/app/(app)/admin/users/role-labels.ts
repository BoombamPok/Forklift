import type { AppRole } from "@/types/database";

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
  read_only: "Read-only",
};
