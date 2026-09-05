"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { getPageTitle } from "@/lib/nav";
import type { AccountUser } from "@/components/layout/account-menu";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Header } from "@/components/layout/header";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type AppShellProps = {
  user?: AccountUser | null;
  children: React.ReactNode;
};

/**
 * The structural shell every protected route renders inside: fixed desktop
 * sidebar, header, main content; a Sheet-based drawer replaces the sidebar
 * on small screens. See phase1.md #18/#20 for the required behavior. Page
 * title is derived from the current route (src/lib/nav.ts) so individual
 * pages don't each have to declare it.
 */
function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">
        <SidebarNav user={user} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={getPageTitle(pathname)}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarNav user={user} onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

export { AppShell };
