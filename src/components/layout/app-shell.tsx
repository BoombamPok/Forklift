"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";

import { getPageTitle } from "@/lib/nav";
import type { AccountUser } from "@/components/layout/account-menu";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Header } from "@/components/layout/header";

const DRAWER_WIDTH = 264;

type AppShellProps = {
  user?: AccountUser | null;
  children: React.ReactNode;
};

/**
 * The structural shell every protected route renders inside: a permanent
 * MUI Drawer on desktop, a temporary (overlay) Drawer on mobile - MUI's
 * standard "responsive drawer" pattern. Page title is derived from the
 * current route (src/lib/nav.ts) so individual pages don't each have to
 * declare it.
 */
function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  return (
    <Box sx={{ display: "flex", height: "100dvh", overflow: "hidden" }}>
      <Box
        component="nav"
        sx={{ width: { lg: DRAWER_WIDTH }, flexShrink: { lg: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", lg: "none" },
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
            },
          }}
        >
          <SidebarNav user={user} onNavigate={() => setMobileNavOpen(false)} />
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", lg: "block" },
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              border: "none",
            },
          }}
          open
        >
          <SidebarNav user={user} />
        </Drawer>
      </Box>

      <Box
        sx={{
          display: "flex",
          minWidth: 0,
          flex: 1,
          flexDirection: "column",
        }}
      >
        <Header
          title={getPageTitle(pathname)}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: "auto",
            p: { xs: 2, lg: 3 },
            bgcolor: "background.default",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export { AppShell };
