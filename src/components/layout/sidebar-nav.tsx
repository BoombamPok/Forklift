"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
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
import { signOut } from "@/features/auth/actions";

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
    <ListItem disablePadding sx={{ px: 1.5 }}>
      <ListItemButton
        component={Link}
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        selected={active}
        sx={{
          borderRadius: 2,
          "&.Mui-selected": {
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
            "&:hover": {
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.18),
            },
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 36,
            color: active ? "primary.main" : "text.secondary",
          }}
        >
          <Icon aria-hidden size={18} />
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          slotProps={{
            primary: {
              sx: {
                fontWeight: active ? 600 : 500,
                fontSize: "0.875rem",
                color: active ? "primary.main" : "text.primary",
              },
            },
          }}
        />
      </ListItemButton>
    </ListItem>
  );
}

type SidebarNavProps = {
  user?: AccountUser | null;
  onNavigate?: () => void;
};

/**
 * The nav content shared by the permanent desktop Drawer and the
 * temporary mobile Drawer (see app-shell.tsx) - one definition, two
 * presentations.
 */
function SidebarNav({ user, onNavigate }: SidebarNavProps) {
  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        flexDirection: "column",
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          display: "flex",
          height: 64,
          alignItems: "center",
          gap: 1.25,
          px: 2.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            width: 32,
            height: 32,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "10px",
            bgcolor: "primary.main",
            color: "primary.contrastText",
          }}
        >
          <BoxesIcon aria-hidden size={18} />
        </Box>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, letterSpacing: "-0.01em" }}
        >
          ForkStock
        </Typography>
      </Box>

      <Divider />

      <Box
        component="nav"
        aria-label="Primary"
        sx={{ flex: 1, overflowY: "auto", py: 1.5 }}
      >
        <List disablePadding>
          {PRIMARY_NAV.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={onNavigate} />
          ))}
        </List>

        <Divider sx={{ my: 1.5, mx: 3 }} />

        <List disablePadding>
          {ADMIN_NAV.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={onNavigate} />
          ))}
        </List>
      </Box>

      <Divider />
      <AccountMenu user={user} onSignOut={() => signOut()} />
    </Box>
  );
}

export { SidebarNav };
