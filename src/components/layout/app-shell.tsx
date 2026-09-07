"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";

import { getPageTitle } from "@/lib/nav";
import type { AccountUser } from "@/components/layout/account-menu";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Header } from "@/components/layout/header";

const RAIL_WIDTH = 240;
const RAIL_WIDTH_COLLAPSED = 68;
const COLLAPSE_KEY = "forkstock:rail-collapsed";
const COLLAPSE_EVENT = "forkstock:rail-collapsed-change";

function getCollapsedSnapshot(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    // Private browsing / storage disabled. The default expanded rail is a
    // perfectly good answer, so this is not worth surfacing.
    return false;
  }
}

function subscribeToCollapsed(onChange: () => void) {
  window.addEventListener(COLLAPSE_EVENT, onChange);
  return () => window.removeEventListener(COLLAPSE_EVENT, onChange);
}

/**
 * The collapsed rail state lives in localStorage, remembered per browser.
 * Read via useSyncExternalStore (server snapshot: expanded) rather than a
 * useEffect+setState, so the server has a safe default without hydrating
 * one width and then snapping to another - and a same-tab write can push a
 * re-render (localStorage's own "storage" event only fires in *other*
 * tabs) via a small custom event dispatched alongside the write.
 */
function useCollapsedRail(): [boolean, () => void] {
  const collapsed = React.useSyncExternalStore(
    subscribeToCollapsed,
    getCollapsedSnapshot,
    () => false,
  );

  const toggle = React.useCallback(() => {
    const next = !getCollapsedSnapshot();
    try {
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    } catch {
      /* see above */
    }
    window.dispatchEvent(new Event(COLLAPSE_EVENT));
  }, []);

  return [collapsed, toggle];
}

type AppShellProps = {
  user?: AccountUser | null;
  children: React.ReactNode;
};

/**
 * The structural shell every protected route renders inside: a permanent
 * rail on desktop, a temporary overlay drawer on mobile.
 */
function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [collapsed, toggleCollapsed] = useCollapsedRail();

  const railWidth = collapsed ? RAIL_WIDTH_COLLAPSED : RAIL_WIDTH;

  return (
    <Box
      sx={{
        display: "flex",
        height: "100dvh",
        overflow: "hidden",
        bgcolor: "var(--chassis)",
      }}
    >
      <Box
        component="nav"
        sx={{
          width: { lg: railWidth },
          flexShrink: { lg: 0 },
          transition: "width 220ms var(--ease-out)",
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", lg: "none" },
            "& .MuiDrawer-paper": {
              width: RAIL_WIDTH,
              boxSizing: "border-box",
              bgcolor: "var(--chassis)",
            },
          }}
        >
          {/* No collapse control on mobile - the drawer is already an
              overlay that dismisses, so a second width mode would be a
              setting with nothing to do. */}
          <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
        </Drawer>

        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", lg: "block" },
            "& .MuiDrawer-paper": {
              width: railWidth,
              boxSizing: "border-box",
              bgcolor: "var(--chassis)",
              overflowX: "hidden",
              transition: "width 220ms var(--ease-out)",
            },
          }}
        >
          <SidebarNav collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
        </Drawer>
      </Box>

      <Box
        sx={{
          display: "flex",
          minWidth: 0,
          flex: 1,
          flexDirection: "column",
          overflow: "hidden",
          bgcolor: "background.default",
        }}
      >
        <Header
          title={getPageTitle(pathname)}
          user={user}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: "auto",
            px: { xs: 2, lg: 3 },
            pt: { xs: 2, lg: 2.5 },
            pb: { xs: 4, lg: 5 },
          }}
        >
          <Box sx={{ mx: "auto", width: "100%", maxWidth: 1440 }}>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export { AppShell };
