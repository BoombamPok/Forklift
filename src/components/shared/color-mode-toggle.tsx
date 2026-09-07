"use client";

import { useColorScheme } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import { MoonIcon, SunIcon } from "lucide-react";

import { useMounted } from "@/lib/hooks/use-mounted";

/**
 * Light/dark switch. Renders a fixed-size placeholder until mounted -
 * `useColorScheme` can't know the resolved mode during SSR, and swapping
 * the icon after hydration would either mismatch or make the header jump.
 *
 * Cycles light <-> dark explicitly rather than through a three-way
 * light/dark/system menu: the initial value already follows the system,
 * and a person reaching for this control wants the other one now, not a
 * submenu.
 */
function ColorModeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();
  const mounted = useMounted();

  if (!mounted) {
    return <Box sx={{ width: 34, height: 34 }} aria-hidden />;
  }

  const resolved = mode === "system" ? systemMode : mode;
  const next = resolved === "dark" ? "light" : "dark";
  const label = `Switch to ${next} mode`;

  return (
    <Tooltip title={label}>
      <IconButton
        aria-label={label}
        onClick={() => setMode(next)}
        sx={{ width: 34, height: 34, color: "text.secondary" }}
      >
        {resolved === "dark" ? <SunIcon size={17} /> : <MoonIcon size={17} />}
      </IconButton>
    </Tooltip>
  );
}

export { ColorModeToggle };
