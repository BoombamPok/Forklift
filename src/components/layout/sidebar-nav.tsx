"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { BoxesIcon } from "lucide-react";

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
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { signOut } from "@/features/auth/actions";

/**
 * The rail is graphite in both color schemes. It is the chassis around
 * the work surface rather than part of it, so it does not invert - which
 * also means the work area reads as "the lit part" at a glance, and the
 * app has a recognisable silhouette instead of looking like a white page
 * with a white sidebar.
 *
 * Deliberately not MUI's List/ListItemButton: those bring Material's
 * selected-state and ripple model, which fights the flat rail styling
 * here, and the markup is simpler as plain anchors.
 */

function NavLink({
  item,
  onNavigate,
  animate,
}: {
  item: NavItem;
  onNavigate?: () => void;
  animate: boolean;
}) {
  const pathname = usePathname();
  const active = isNavItemActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Box component="li" sx={{ position: "relative" }}>
      {/*
        One shared indicator that slides between items on navigation
        (motion `layoutId`), rather than each item fading its own
        background in and out. It is motion answering an action, and it
        makes the rail feel like a physical selector.
      */}
      {active ? (
        <Box
          component={animate ? motion.div : "div"}
          {...(animate
            ? {
                layoutId: "rail-indicator",
                transition: { type: "spring", stiffness: 520, damping: 42 },
              }
            : {})}
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            borderRadius: "var(--radius-control)",
            bgcolor: "var(--chassis-raised)",
            boxShadow: "inset 2px 0 0 var(--mui-palette-primary-main)",
          }}
        />
      ) : null}

      <Box
        component={Link}
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          minHeight: 36,
          px: 1.25,
          borderRadius: "var(--radius-control)",
          textDecoration: "none",
          fontSize: "0.8438rem",
          fontWeight: active ? 600 : 500,
          color: active ? "var(--chassis-text)" : "var(--chassis-muted)",
          transition: "color 140ms var(--ease-standard)",
          "&:hover": { color: "var(--chassis-text)" },
          "&:focus-visible": { outlineOffset: -2 },
        }}
      >
        <Icon
          aria-hidden
          size={17}
          strokeWidth={active ? 2.2 : 1.9}
          style={{ flexShrink: 0 }}
        />
        <Box component="span" sx={{ minWidth: 0, flex: 1 }}>
          {item.label}
        </Box>
      </Box>
    </Box>
  );
}

function RailSection({
  label,
  items,
  onNavigate,
  animate,
}: {
  label: string;
  items: NavItem[];
  onNavigate?: () => void;
  animate: boolean;
}) {
  return (
    <Box sx={{ px: 1.25 }}>
      <Typography
        component="p"
        sx={{
          px: 1.25,
          pb: 0.75,
          fontSize: "0.6875rem",
          fontWeight: 600,
          color: "var(--chassis-faint)",
        }}
      >
        {label}
      </Typography>
      <Box
        component="ul"
        sx={{
          listStyle: "none",
          m: 0,
          p: 0,
          display: "flex",
          flexDirection: "column",
          gap: 0.25,
        }}
      >
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            onNavigate={onNavigate}
            animate={animate}
          />
        ))}
      </Box>
    </Box>
  );
}

type SidebarNavProps = {
  user?: AccountUser | null;
  onNavigate?: () => void;
};

function SidebarNav({ user, onNavigate }: SidebarNavProps) {
  const prefersReducedMotion = useReducedMotion();
  const animate = !prefersReducedMotion;

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        flexDirection: "column",
        bgcolor: "var(--chassis)",
        color: "var(--chassis-text)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          height: 60,
          alignItems: "center",
          gap: 1.25,
          px: 2.25,
          flexShrink: 0,
        }}
      >
        <Box
          aria-hidden
          sx={{
            display: "flex",
            width: 28,
            height: 28,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "7px",
            bgcolor: "var(--mui-palette-primary-main)",
            color: "var(--mui-palette-primary-contrastText)",
            flexShrink: 0,
          }}
        >
          <BoxesIcon size={16} strokeWidth={2.2} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="span"
            sx={{
              display: "block",
              fontSize: "0.9375rem",
              fontWeight: 600,
              letterSpacing: "-0.015em",
              lineHeight: 1.2,
              color: "var(--chassis-text)",
            }}
          >
            ForkStock
          </Typography>
          <Typography
            component="span"
            sx={{
              display: "block",
              fontSize: "0.6875rem",
              lineHeight: 1.2,
              color: "var(--chassis-faint)",
            }}
          >
            Spare parts &amp; stores
          </Typography>
        </Box>
      </Box>

      <Box
        component="nav"
        aria-label="Primary"
        sx={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
          py: 1.5,
        }}
      >
        <RailSection
          label="Operations"
          items={PRIMARY_NAV}
          onNavigate={onNavigate}
          animate={animate}
        />
        <RailSection
          label="Manage"
          items={ADMIN_NAV}
          onNavigate={onNavigate}
          animate={animate}
        />
      </Box>

      <Box sx={{ borderTop: "1px solid var(--chassis-hairline)", flexShrink: 0 }}>
        <AccountMenu user={user} onSignOut={() => signOut()} />
      </Box>
    </Box>
  );
}

export { SidebarNav };
