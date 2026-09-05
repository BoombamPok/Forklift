/**
 * Central capability model per CLAUDE.md #12/#36 - never scatter
 * `role === "admin"` checks through components. This is a UI-level
 * convenience only; RLS policies (supabase/migrations) are the real
 * enforcement boundary and must independently agree with this table.
 */
export type Role = "admin" | "manager" | "staff" | "read_only";

export const ROLES: Role[] = ["admin", "manager", "staff", "read_only"];

export type Permission =
  | "inventory.view"
  | "inventory.create"
  | "inventory.edit"
  | "inventory.delete"
  | "inventory.adjust"
  | "inventory.transfer"
  | "catalogue.view"
  | "catalogue.manage"
  | "warehouse.view"
  | "warehouse.manage"
  | "reports.view"
  | "users.manage"
  | "settings.manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "inventory.view",
    "inventory.create",
    "inventory.edit",
    "inventory.delete",
    "inventory.adjust",
    "inventory.transfer",
    "catalogue.view",
    "catalogue.manage",
    "warehouse.view",
    "warehouse.manage",
    "reports.view",
    "users.manage",
    "settings.manage",
  ],
  manager: [
    "inventory.view",
    "inventory.create",
    "inventory.edit",
    "inventory.delete",
    "inventory.adjust",
    "inventory.transfer",
    "catalogue.view",
    "catalogue.manage",
    "warehouse.view",
    "warehouse.manage",
    "reports.view",
  ],
  staff: [
    "inventory.view",
    "inventory.create",
    "inventory.edit",
    "inventory.adjust",
    "inventory.transfer",
    "catalogue.view",
    "warehouse.view",
    "reports.view",
  ],
  read_only: [
    "inventory.view",
    "catalogue.view",
    "warehouse.view",
    "reports.view",
  ],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Cost-basis inventory value is commercially sensitive in a way item/
 * low-stock counts aren't (phase2b.md #4) - kept as its own named check
 * rather than a granular `Permission` entry since it isn't an action,
 * just a visibility boundary the dashboard enforces server-side.
 */
export function canViewInventoryValue(role: Role): boolean {
  return role === "admin" || role === "manager";
}
