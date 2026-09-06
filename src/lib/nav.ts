import type { LucideIcon } from "lucide-react";
import {
  BarChart3Icon,
  BookOpenIcon,
  LayoutDashboardIcon,
  PackageIcon,
  ShieldCheckIcon,
  WarehouseIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/**
 * Single source of truth for primary navigation - the sidebar, mobile
 * drawer, and (later) breadcrumbs all read from this instead of each
 * hardcoding the route list.
 *
 * There is no standalone "Operations" item (Phase 1's original nav
 * scaffold had one) - stock movements are recorded per-part from
 * `/inventory/[id]` (Phase 3) and the full ledger/summary lives at
 * `/reports/movements` (Phase 6). A dedicated Operations page was never
 * built, and its Phase 1 placeholder was still claiming "coming in
 * Phase 6" after Phase 6 shipped - removed as stale during Phase 7's
 * final UX polish pass rather than left pointing nowhere real.
 */
export const PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { label: "Inventory", href: "/inventory", icon: PackageIcon },
  { label: "Catalogue", href: "/catalogue", icon: BookOpenIcon },
  { label: "Warehouse", href: "/warehouse", icon: WarehouseIcon },
  { label: "Reports", href: "/reports", icon: BarChart3Icon },
];

export const ADMIN_NAV: NavItem[] = [
  { label: "Administration", href: "/admin", icon: ShieldCheckIcon },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const ALL_NAV: NavItem[] = [...PRIMARY_NAV, ...ADMIN_NAV];

/** Derives the header's page title from the current route's nav item. */
export function getPageTitle(pathname: string): string {
  const match = ALL_NAV.find((item) => isNavItemActive(pathname, item.href));
  return match?.label ?? "ForkStock";
}
