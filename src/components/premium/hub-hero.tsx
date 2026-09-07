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
 * Shared 3D banner for the three hub pages (catalogue, reports, admin) -
 * they're plain link grids with no dense data to protect, the safest
 * place to go big on decoration. Extracted once a third caller needed
 * the identical header shape.
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
        minHeight: { xs: 224, sm: 256 },
        flexDirection: "column",
        justifyContent: "flex-end",
        overflow: "hidden",
        borderRadius: 4,
        px: { xs: 3, sm: 4 },
        py: 3,
        boxShadow: 3,
      }}
    >
      <SceneLoader
        variant="hub"
        leadHue={leadHue}
        posterTone={leadHue === "amber" ? "primary" : "electric"}
        className="absolute inset-0 z-0"
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(to top, var(--mui-palette-background-paper) 0%, var(--mui-palette-background-paper) 50%, transparent 100%)",
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
          gap: 1.5,
        }}
      >
        <Box sx={{ maxWidth: 640 }}>
          <Typography
            variant="h4"
            component="h2"
            sx={{ fontWeight: 600, letterSpacing: "-0.01em" }}
          >
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        </Box>
        {actions ? (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {actions}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

export { HubHero };
