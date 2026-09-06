import { z } from "zod";

import type { AppRole } from "@/types/database";
import { ROLES } from "@/lib/permissions";

const APP_ROLES: [AppRole, ...AppRole[]] = [ROLES[0], ...ROLES.slice(1)];

export const inviteUserSchema = z.object({
  fullName: z.string().min(1, "Name is required").max(200),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  role: z.enum(APP_ROLES),
});
export type InviteUserValues = {
  fullName: string;
  email: string;
  role: AppRole;
};

export const updateRoleSchema = z.object({
  role: z.enum(APP_ROLES),
});
export type UpdateRoleValues = { role: AppRole };
