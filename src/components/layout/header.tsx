"use client";

import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { MenuIcon } from "lucide-react";

import { GlobalSearch } from "@/components/layout/global-search";
import { ColorModeToggle } from "@/components/shared/color-mode-toggle";

type HeaderProps = {
  title: string;
  onOpenMobileNav: () => void;
};

function subscribe() {
  return () => {};
}

function useShortcutKey(): string | null {
  return React.useSyncExternalStore(
    subscribe,
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K"),
    () => null,
  );
}

/** Rendered only after mount, so the label matches the actual platform
 * instead of guessing during SSR and hydrating into a mismatch. */
function ShortcutHint() {
  const key = useShortcutKey();

  if (!key) return null;

  return (
    <Box
      aria-hidden
      className="numeric"
      sx={{
        position: "absolute",
        right: 10,
        top: "50%",
        transform: "translateY(-50%)",
        pointerEvents: "none",
        display: { xs: "none", md: "block" },
        px: 0.75,
        py: 0.125,
        borderRadius: "var(--radius-chip)",
        border: "1px solid var(--mui-palette-divider)",
        bgcolor: "var(--mui-palette-background-default)",
        fontSize: "0.6875rem",
        lineHeight: 1.6,
        color: "text.disabled",
        transition: "opacity 140ms var(--ease-standard)",
        ".search-slot:focus-within &": { opacity: 0 },
      }}
    >
      {key}
    </Box>
  );
}

/**
 * Page context on the left, search and display controls on the right.
 *
 * The search box owns a global ⌘K / Ctrl+K shortcut. It is wired here by
 * focusing the input inside the wrapper rather than inside GlobalSearch
 * itself - that component owns tested debounce/keyboard-nav behaviour
 * and there was no reason to reopen it for a focus call.
 */
function Header({ title, onOpenMobileNav }: HeaderProps) {
  const searchSlot = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "k" || !(event.metaKey || event.ctrlKey)) return;
      const input = searchSlot.current?.querySelector("input");
      if (!input) return;
      event.preventDefault();
      input.focus();
      input.select();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <AppBar
      position="sticky"
      sx={{
        borderBottom: "1px solid var(--mui-palette-divider)",
        bgcolor: "color-mix(in srgb, var(--mui-palette-background-paper) 82%, transparent)",
        backdropFilter: "blur(12px) saturate(140%)",
        WebkitBackdropFilter: "blur(12px) saturate(140%)",
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          gap: 1,
          px: { xs: 1.5, lg: 3 },
          minHeight: { xs: 56, lg: 60 },
        }}
      >
        <IconButton
          aria-label="Open navigation"
          onClick={onOpenMobileNav}
          sx={{ display: { xs: "inline-flex", lg: "none" }, ml: -0.5 }}
        >
          <MenuIcon size={19} />
        </IconButton>

        <Typography
          variant="h6"
          component="h1"
          noWrap
          sx={{ minWidth: 0, letterSpacing: "-0.012em" }}
        >
          {title}
        </Typography>

        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            ref={searchSlot}
            className="search-slot"
            sx={{ position: "relative", display: { xs: "none", sm: "block" } }}
          >
            <GlobalSearch sx={{ width: { sm: 240, lg: 300 } }} />
            <ShortcutHint />
          </Box>
          <ColorModeToggle />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export { Header };
