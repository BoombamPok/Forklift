"use client";

import * as React from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import { ChevronsUpDownIcon, LogOutIcon, SettingsIcon } from "lucide-react";

type AccountUser = { name: string; email: string };

type AccountMenuProps = {
  user?: AccountUser | null;
  onSignOut?: () => void;
};

/** Two-letter monogram, or a single dash when there is no user yet -
 * never a fabricated name or a generic person glyph. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "–";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Sidebar footer account area. Sits on the graphite rail, so it uses the
 * chassis tokens rather than the palette - but the menu it opens is a
 * floating layer over the work surface and uses the normal theme.
 */
function AccountMenu({ user, onSignOut }: AccountMenuProps) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  return (
    <Box sx={{ p: 1.25 }}>
      <ButtonBase
        onClick={(event) => setAnchorEl(event.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={open}
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          borderRadius: "var(--radius-control)",
          px: 1,
          py: 1,
          textAlign: "left",
          transition: "background-color 140ms var(--ease-standard)",
          "&:hover": { bgcolor: "var(--chassis-raised)" },
          "&:focus-visible": { outlineOffset: -2 },
        }}
      >
        <Box
          aria-hidden
          sx={{
            display: "flex",
            width: 28,
            height: 28,
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "7px",
            bgcolor: "var(--chassis-raised)",
            border: "1px solid var(--chassis-hairline)",
            fontSize: "0.6875rem",
            fontWeight: 600,
            color: "var(--chassis-text)",
          }}
        >
          {initials(user?.name ?? "")}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            component="span"
            noWrap
            sx={{
              display: "block",
              fontSize: "0.8125rem",
              fontWeight: 500,
              lineHeight: 1.3,
              color: "var(--chassis-text)",
            }}
          >
            {user?.name ?? "Account"}
          </Typography>
          {user?.email ? (
            <Typography
              component="span"
              noWrap
              sx={{
                display: "block",
                fontSize: "0.6875rem",
                lineHeight: 1.3,
                color: "var(--chassis-faint)",
              }}
            >
              {user.email}
            </Typography>
          ) : null}
        </Box>
        <ChevronsUpDownIcon
          size={15}
          aria-hidden
          style={{ flexShrink: 0, color: "var(--chassis-faint)" }}
        />
      </ButtonBase>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { minWidth: 232 } } }}
      >
        <MenuItem
          component={Link}
          href="/admin"
          onClick={() => setAnchorEl(null)}
        >
          <ListItemIcon>
            <SettingsIcon size={15} />
          </ListItemIcon>
          Administration
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onSignOut?.();
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon sx={{ color: "error.main" }}>
            <LogOutIcon size={15} />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </Box>
  );
}

export { AccountMenu, type AccountUser };
