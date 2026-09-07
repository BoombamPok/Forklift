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
import { ChevronDownIcon, LogOutIcon, SettingsIcon } from "lucide-react";

import { signOut } from "@/features/auth/actions";

type AccountUser = { name: string; email: string; roleLabel?: string };

type AccountMenuProps = {
  user?: AccountUser | null;
};

/** Two-letter monogram, or a dash when there is no user yet - never a
 * fabricated name or a generic person glyph. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "–";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Account control, top right. Moved out of the sidebar footer: the rail
 * can now collapse to 68px, where a name and a role have nowhere to go,
 * and "who am I signed in as" is the one piece of chrome that should not
 * disappear when a person narrows the navigation.
 *
 * The role sits under the name because permissions in this app are not
 * cosmetic - whether you can see inventory value or record a movement
 * depends on it, so it is worth being able to check at a glance.
 */
function AccountMenu({ user }: AccountMenuProps) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <ButtonBase
        onClick={(event) => setAnchorEl(event.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={user ? `Account: ${user.name}` : "Account"}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          borderRadius: "var(--radius-control)",
          pl: 0.75,
          pr: { xs: 0.75, md: 1 },
          py: 0.75,
          transition: "background-color 140ms var(--ease-standard)",
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <Box
          aria-hidden
          sx={{
            display: "flex",
            width: 32,
            height: 32,
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            bgcolor: "action.selected",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "text.secondary",
          }}
        >
          {initials(user?.name ?? "")}
        </Box>
        <Box
          sx={{
            minWidth: 0,
            display: { xs: "none", md: "block" },
            textAlign: "left",
          }}
        >
          <Typography
            component="span"
            noWrap
            sx={{
              display: "block",
              fontSize: "0.8125rem",
              fontWeight: 600,
              lineHeight: 1.3,
            }}
          >
            {user?.name ?? "Account"}
          </Typography>
          {user?.roleLabel ? (
            <Typography
              component="span"
              noWrap
              sx={{
                display: "block",
                fontSize: "0.6875rem",
                lineHeight: 1.3,
                color: "text.secondary",
              }}
            >
              {user.roleLabel}
            </Typography>
          ) : null}
        </Box>
        <ChevronDownIcon
          aria-hidden
          size={15}
          style={{
            flexShrink: 0,
            opacity: 0.5,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 180ms var(--ease-out)",
          }}
        />
      </ButtonBase>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 236 } } }}
      >
        {user ? (
          <Box sx={{ px: 1.5, pt: 0.75, pb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user.email}
            </Typography>
          </Box>
        ) : null}
        {user ? <Divider sx={{ mb: 0.5 }} /> : null}
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
            signOut();
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon sx={{ color: "error.main" }}>
            <LogOutIcon size={15} />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}

export { AccountMenu, type AccountUser };
