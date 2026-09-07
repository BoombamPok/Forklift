"use client";

import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import { MenuIcon } from "lucide-react";

import { GlobalSearch } from "@/components/layout/global-search";
import { ColorModeToggle } from "@/components/shared/color-mode-toggle";
import {
  AccountMenu,
  type AccountUser,
} from "@/components/layout/account-menu";

type HeaderProps = {
  title: string;
  user?: AccountUser | null;
  onOpenMobileNav: () => void;
};

function subscribeNoop() {
  return () => {};
}

function useShortcutKey(): string | null {
  return React.useSyncExternalStore(
    subscribeNoop,
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
 * Search across the width, account on the right.
 *
 * The page title is present as an h1 but visually hidden. Search is the
 * primary job of this bar - the whole product is "find the part" - and
 * every screen already states its own name in its page header, so a
 * visible title here would repeat it twice within 60px. The h1 stays in
 * the accessibility tree so the document keeps a real top-level heading.
 *
 * No notification bell: nothing in this app produces notifications yet,
 * and a bell that never rings is a promise the product doesn't keep.
 *
 * The search box owns a global ⌘K / Ctrl+K shortcut, wired here by
 * focusing the input inside the wrapper rather than inside GlobalSearch -
 * that component owns tested debounce and keyboard-nav behaviour and
 * there was no reason to reopen it for a focus call.
 */
function Header({ title, user, onOpenMobileNav }: HeaderProps) {
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
        bgcolor:
          "color-mix(in srgb, var(--mui-palette-background-paper) 84%, transparent)",
        backdropFilter: "blur(12px) saturate(140%)",
        WebkitBackdropFilter: "blur(12px) saturate(140%)",
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          gap: { xs: 1, lg: 2 },
          px: { xs: 1.5, lg: 2.5 },
          minHeight: { xs: 58, lg: 64 },
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
          sx={{
            position: "absolute",
            width: "1px",
            height: "1px",
            overflow: "hidden",
            clip: "rect(0 0 0 0)",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </Typography>

        <Box
          ref={searchSlot}
          className="search-slot"
          sx={{ position: "relative", flex: 1, minWidth: 0, maxWidth: 620 }}
        >
          <GlobalSearch sx={{ width: "100%" }} />
          <ShortcutHint />
        </Box>

        <Box
          sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <ColorModeToggle />
          <Divider
            orientation="vertical"
            flexItem
            sx={{ my: 1.5, mx: 0.5, display: { xs: "none", md: "block" } }}
          />
          <AccountMenu user={user} />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export { Header };
