"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import ButtonBase from "@mui/material/ButtonBase";
import { BoxesIcon, PanelLeftIcon } from "lucide-react";

import {
  ADMIN_NAV,
  PRIMARY_NAV,
  isNavItemActive,
  type NavItem,
} from "@/lib/nav";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

/**
 * The rail is near-black in both colour schemes. It is the chassis around
 * the work surface rather than part of it, so it does not invert - which
 * also means the work area reads as "the lit part" at a glance.
 *
 * Deliberately not MUI's List/ListItemButton: those bring Material's
 * selected-state and ripple model, which fights the flat rail styling
 * here, and plain anchors keep the markup simple.
 */

function NavLink({
  item,
  collapsed,
  onNavigate,
  animate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
  animate: boolean;
}) {
  const pathname = usePathname();
  const active = isNavItemActive(pathname, item.href);
  const Icon = item.icon;

  const link = (
    <Box component="li" sx={{ position: "relative" }}>
      {/*
        One shared indicator that slides between items on navigation
        (motion `layoutId`) rather than each item fading its own
        background in and out. Motion answering an action, and it makes
        the rail feel like a physical selector.
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
            // A wash, not a solid orange pill. 240px of saturated fill
            // sits in the corner of the eye all day; the wash plus the
            // 3px marker reads just as clearly and costs nothing.
            bgcolor: "var(--chassis-active)",
            boxShadow: "inset 3px 0 0 var(--signal-display)",
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
          gap: 1.5,
          minHeight: 40,
          px: collapsed ? 0 : 1.5,
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: "var(--radius-control)",
          textDecoration: "none",
          fontSize: "0.875rem",
          fontWeight: active ? 600 : 500,
          whiteSpace: "nowrap",
          color: active ? "var(--signal-display)" : "var(--chassis-muted)",
          transition: "color 140ms var(--ease-standard)",
          "&:hover": {
            color: "var(--chassis-text)",
            bgcolor: active ? "transparent" : "var(--chassis-raised)",
          },
          "&:focus-visible": { outlineOffset: -2 },
        }}
      >
        <Icon
          aria-hidden
          size={18}
          strokeWidth={active ? 2.3 : 1.9}
          style={{ flexShrink: 0 }}
        />
        {collapsed ? null : (
          <Box component="span" sx={{ minWidth: 0, flex: 1 }}>
            {item.label}
          </Box>
        )}
      </Box>
    </Box>
  );

  // Collapsed, the label is gone, so the icon needs to say what it is on
  // hover and on keyboard focus - otherwise the rail becomes a memory test.
  return collapsed ? (
    <Tooltip title={item.label} placement="right">
      {link}
    </Tooltip>
  ) : (
    link
  );
}

function RailSection({
  label,
  items,
  collapsed,
  onNavigate,
  animate,
}: {
  label: string;
  items: NavItem[];
  collapsed: boolean;
  onNavigate?: () => void;
  animate: boolean;
}) {
  return (
    <Box sx={{ px: 1.5 }}>
      {collapsed ? (
        <Box
          aria-hidden
          sx={{ height: "1px", bgcolor: "var(--chassis-hairline)", mb: 1.25 }}
        />
      ) : (
        <Typography
          component="p"
          sx={{
            px: 1.5,
            pb: 0.75,
            fontSize: "0.6875rem",
            fontWeight: 600,
            color: "var(--chassis-faint)",
          }}
        >
          {label}
        </Typography>
      )}
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
            collapsed={collapsed}
            onNavigate={onNavigate}
            animate={animate}
          />
        ))}
      </Box>
    </Box>
  );
}

type SidebarNavProps = {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
};

function SidebarNav({
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: SidebarNavProps) {
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
          height: 64,
          alignItems: "center",
          gap: 1.25,
          px: collapsed ? 0 : 2.5,
          justifyContent: collapsed ? "center" : "flex-start",
          flexShrink: 0,
        }}
      >
        <Box
          aria-hidden
          sx={{
            display: "flex",
            width: 30,
            height: 30,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "7px",
            bgcolor: "var(--signal-display)",
            color: "#1A0E07",
            flexShrink: 0,
          }}
        >
          <BoxesIcon size={17} strokeWidth={2.4} />
        </Box>
        {collapsed ? null : (
          <Box sx={{ minWidth: 0 }}>
            <Typography
              component="span"
              sx={{
                display: "block",
                fontSize: "1rem",
                fontWeight: 600,
                letterSpacing: "-0.02em",
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
                lineHeight: 1.3,
                color: "var(--chassis-faint)",
              }}
            >
              Spare parts &amp; stores
            </Typography>
          </Box>
        )}
      </Box>

      <Box
        component="nav"
        aria-label="Primary"
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
          py: 1.5,
        }}
      >
        <RailSection
          label="Operations"
          items={PRIMARY_NAV}
          collapsed={collapsed}
          onNavigate={onNavigate}
          animate={animate}
        />
        <RailSection
          label="Manage"
          items={ADMIN_NAV}
          collapsed={collapsed}
          onNavigate={onNavigate}
          animate={animate}
        />
      </Box>

      {onToggleCollapse ? (
        <Box
          sx={{
            flexShrink: 0,
            borderTop: "1px solid var(--chassis-hairline)",
            p: 1.5,
          }}
        >
          <ButtonBase
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              minHeight: 38,
              px: collapsed ? 0 : 1.5,
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius: "var(--radius-control)",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--chassis-muted)",
              transition:
                "color 140ms var(--ease-standard), background-color 140ms var(--ease-standard)",
              "&:hover": {
                color: "var(--chassis-text)",
                bgcolor: "var(--chassis-raised)",
              },
              "&:focus-visible": { outlineOffset: -2 },
            }}
          >
            <PanelLeftIcon
              aria-hidden
              size={18}
              strokeWidth={1.9}
              style={{
                flexShrink: 0,
                transform: collapsed ? "rotate(180deg)" : "none",
                transition: "transform 200ms var(--ease-out)",
              }}
            />
            {collapsed ? null : <Box component="span">Collapse</Box>}
          </ButtonBase>
        </Box>
      ) : null}
    </Box>
  );
}

export { SidebarNav };
