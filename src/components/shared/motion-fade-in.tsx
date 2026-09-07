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
 * Restrained entrance for content that just finished loading (e.g. a
 * Suspense boundary resolving) - marks the state change without
 * decorating for its own sake. Shared so every widget uses the same
 * transition instead of ad hoc CSS per component.
 */
function MotionFadeIn({ children, sx }: MotionFadeInProps) {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      sx={sx}
    >
      {children}
    </Box>
  );
}

export { MotionFadeIn };
