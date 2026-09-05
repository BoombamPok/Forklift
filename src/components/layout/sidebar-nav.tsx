"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BoxesIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  ADMIN_NAV,
  PRIMARY_NAV,
  isNavItemActive,
  type NavItem,
} from "@/lib/nav";
import {
  AccountMenu,
  type AccountUser,
} from "@/components/layout/account-menu";
import { signOut } from "@/features/auth/actions";

function NavLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isNavItemActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/65 transition-all duration-150",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        active && "bg-sidebar-accent text-sidebar-accent-foreground",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-0 h-4 w-[3px] rounded-full bg-sidebar-primary transition-transform duration-200 ease-out",
          active ? "scale-y-100" : "scale-y-0",
        )}
      />
      <Icon
        aria-hidden
        className={cn(
          "size-4 shrink-0 transition-colors duration-150",
          active
            ? "text-sidebar-primary"
            : "text-sidebar-foreground/45 group-hover:text-sidebar-foreground/80",
        )}
      />
      {item.label}
    </Link>
  );
}

/**
 * The nav content shared by the fixed desktop sidebar and the mobile
 * drawer (see app-shell.tsx) - one definition, two presentations.
 */
type SidebarNavProps = {
  user?: AccountUser | null;
  onNavigate?: () => void;
};

function SidebarNav({ user, onNavigate }: SidebarNavProps) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-sidebar-primary to-orange-400 shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
          <BoxesIcon aria-hidden className="size-4 text-white" />
        </div>
        <span className="font-heading text-[15px] font-semibold tracking-tight">
          ForkStock
        </span>
      </div>

      <nav
        aria-label="Primary"
        className="flex-1 space-y-4 overflow-y-auto p-3"
      >
        <div className="space-y-0.5">
          {PRIMARY_NAV.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={onNavigate} />
          ))}
        </div>

        <div className="space-y-0.5 border-t border-sidebar-border pt-3">
          {ADMIN_NAV.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>

      <AccountMenu user={user} onSignOut={() => signOut()} />
    </div>
  );
}

export { SidebarNav };
