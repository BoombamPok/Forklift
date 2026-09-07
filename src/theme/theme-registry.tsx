"use client";

import * as React from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "./theme";

/**
 * Wires MUI's Emotion cache into the App Router's streaming SSR (without
 * this, styles flash unstyled on first paint / can mismatch on
 * hydration), plus the theme and CssBaseline reset. This is the only
 * client boundary needed for MUI - everything under it can still be a
 * Server Component.
 *
 * `defaultMode="system"` (was "light"): the app now has a fully designed
 * dark scheme, so the honest default is to follow the machine. The
 * header toggle overrides and persists per-user.
 */
function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ThemeProvider theme={theme} defaultMode="system">
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}

export { ThemeRegistry };
