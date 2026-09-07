import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { MenuIcon } from "lucide-react";

import { GlobalSearch } from "@/components/layout/global-search";

type HeaderProps = {
  title: string;
  onOpenMobileNav: () => void;
};

/** Page title/context + global search. */
function Header({ title, onOpenMobileNav }: HeaderProps) {
  return (
    <AppBar
      position="sticky"
      color="inherit"
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: (theme) =>
          theme.palette.mode === "light"
            ? "rgba(255,255,255,0.85)"
            : "rgba(31,30,28,0.85)",
        backdropFilter: "blur(10px)",
      }}
    >
      <Toolbar sx={{ gap: 1.5, minHeight: { xs: 56, lg: 64 } }}>
        <IconButton
          aria-label="Open navigation"
          onClick={onOpenMobileNav}
          sx={{ display: { xs: "inline-flex", lg: "none" }, ml: -1 }}
        >
          <MenuIcon size={20} />
        </IconButton>

        <Typography
          variant="h6"
          component="h1"
          noWrap
          sx={{ minWidth: 0, fontWeight: 600 }}
        >
          {title}
        </Typography>

        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
          <GlobalSearch
            sx={{ display: { xs: "none", sm: "block" }, width: 280 }}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export { Header };
