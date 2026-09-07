"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";

import { getPageTitle } from "@/lib/nav";
import type { AccountUser } from "@/components/layout/account-menu";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Header } from "@/components/layout/header";

const RAIL_WIDTH = 244;

type AppShellProps = {
  user?: AccountUser | null;
  children: React.ReactNode;
};

/**
 * The structural shell every protected route renders inside: a permanent
 * graphite rail on desktop, a temporary overlay drawer on mobile.
 *
 * The work surface is inset by 8px on desktop and given its own rounded
 * top-left corner, so the rail reads as a chassis the page sits inside
 * rather than two panes butted together. It is one of the cheapest ways
 * to make an app stop looking like a default admin template.
 */
function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

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
        sx={{ width: { lg: RAIL_WIDTH }, flexShrink: { lg: 0 } }}
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
          <SidebarNav user={user} onNavigate={() => setMobileNavOpen(false)} />
        </Drawer>

        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", lg: "block" },
            "& .MuiDrawer-paper": {
              width: RAIL_WIDTH,
              boxSizing: "border-box",
              bgcolor: "var(--chassis)",
            },
          }}
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
          overflow: "hidden",
          bgcolor: "background.default",
          borderLeft: { lg: "1px solid var(--chassis-hairline)" },
          borderTopLeftRadius: { lg: "var(--radius-sheet)" },
          my: { lg: 1 },
          mr: { lg: 1 },
          borderRadius: { lg: "var(--radius-sheet)" },
          boxShadow: { lg: "0 1px 3px rgba(0,0,0,0.32)" },
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
