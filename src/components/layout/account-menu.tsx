"use client";

import * as React from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import {
  ChevronsUpDownIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";

type AccountUser = { name: string; email: string };

type AccountMenuProps = {
  user?: AccountUser | null;
  onSignOut?: () => void;
};

/**
 * Sidebar footer account area. With no `user` yet (auth not wired), this
 * shows a neutral placeholder rather than fabricating a name/email.
 */
function AccountMenu({ user, onSignOut }: AccountMenuProps) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  return (
    <Box sx={{ p: 1.5 }}>
      <ButtonBase
        onClick={(event) => setAnchorEl(event.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={open}
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          borderRadius: 2,
          px: 1,
          py: 0.75,
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <Avatar sx={{ width: 28, height: 28, bgcolor: "action.selected" }}>
          <UserIcon size={15} />
        </Avatar>
        <Typography variant="body2" noWrap sx={{ flex: 1, textAlign: "left" }}>
          {user?.name ?? "Account"}
        </Typography>
        <ChevronsUpDownIcon size={16} style={{ opacity: 0.5, flexShrink: 0 }} />
      </ButtonBase>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { minWidth: 224 } } }}
      >
        {user ? (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
        ) : null}
        <MenuItem
          component={Link}
          href="/admin"
          onClick={() => setAnchorEl(null)}
        >
          <ListItemIcon>
            <SettingsIcon size={16} />
          </ListItemIcon>
          Administration
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onSignOut?.();
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon sx={{ color: "error.main" }}>
            <LogOutIcon size={16} />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </Box>
  );
}

export { AccountMenu, type AccountUser };
