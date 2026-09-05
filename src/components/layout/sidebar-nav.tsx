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
import { AccountMenu } from "@/components/layout/account-menu";

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
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        active && "bg-sidebar-accent text-sidebar-accent-foreground",
      )}
    >
      <Icon
        aria-hidden
        className={cn(
          "size-4 shrink-0",
          active ? "text-sidebar-primary" : "text-sidebar-foreground/50",
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
function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <BoxesIcon aria-hidden className="size-5 text-sidebar-primary" />
        <span className="font-heading text-sm font-semibold tracking-tight">
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

      <AccountMenu />
    </div>
  );
}

export { SidebarNav };
