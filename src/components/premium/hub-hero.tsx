import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { SceneLoader } from "@/components/three/scene-loader";

type HubHeroProps = {
  title: string;
  description: string;
  /** Rotates which accent leads the 3D composition, so catalogue/reports/
   * admin don't all look identical. */
  leadHue?: "amber" | "electric";
  actions?: React.ReactNode;
};

/**
 * Shared banner for the three hub pages (catalogue, reports, admin).
 *
 * Rebuilt as a compact graphite band rather than a 256px card with a
 * gradient fading into the page background. It is the same chassis
 * material as the rail and the sign-in panel, so a hub reads as a
 * doorway into a section rather than as a decorative header that happens
 * to sit above some links - and at 168px it no longer pushes the actual
 * navigation below the fold.
 *
 * These pages are link grids with no dense data to protect, which is
 * why they keep a 3D scene at all while the dashboard does not.
 */
function HubHero({
  title,
  description,
  leadHue = "amber",
  actions,
}: HubHeroProps) {
  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        minHeight: { xs: 148, sm: 168 },
        flexDirection: "column",
        justifyContent: "flex-end",
        overflow: "hidden",
        borderRadius: "var(--radius-panel)",
        border: "1px solid var(--chassis-hairline)",
        bgcolor: "var(--chassis)",
        px: { xs: 2.5, sm: 3.5 },
        py: 2.75,
      }}
    >
      <SceneLoader
        variant="hub"
        leadHue={leadHue}
        posterTone={leadHue === "amber" ? "primary" : "electric"}
        sx={{ position: "absolute", inset: 0, zIndex: 0 }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(to top, var(--chassis) 12%, color-mix(in srgb, var(--chassis) 70%, transparent) 62%, transparent 100%)",
        }}
      />
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ maxWidth: "60ch" }}>
          <Typography
            variant="h3"
            component="h2"
            sx={{ color: "var(--chassis-text)" }}
          >
            {title}
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 0.5, color: "var(--chassis-muted)" }}
          >
            {description}
          </Typography>
        </Box>
        {actions ? (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>{actions}</Box>
        ) : null}
      </Box>
    </Box>
  );
}

export { HubHero };
