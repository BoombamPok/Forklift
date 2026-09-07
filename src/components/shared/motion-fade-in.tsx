"use client";

import * as React from "react";
import { motion } from "motion/react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";

type MotionFadeInProps = {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
};

/**
 * Marks content arriving from a resolved Suspense boundary.
 *
 * Opacity only, and short. It used to also slide up 4px, which meant
 * every widget on the dashboard independently slid into place on load -
 * the single most common tell of a generated page, and it fought the one
 * deliberate entrance the KPI cluster owns. A pure cross-fade still says
 * "this just filled in" without staging a performance.
 */
function MotionFadeIn({ children, sx }: MotionFadeInProps) {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      sx={sx}
    >
      {children}
    </Box>
  );
}

export { MotionFadeIn };
