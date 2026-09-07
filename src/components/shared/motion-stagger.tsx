"use client";

import * as React from "react";
import { motion, type Variants } from "motion/react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

type MotionStaggerProps = {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
};

/**
 * Cascades its direct `MotionStaggerItem` children in on mount instead of
 * having every item pop in at once - used for grids/lists of otherwise
 * uniform cards (KPI row, table rows) where a single fade reads as
 * static.
 */
function MotionStagger({ children, sx }: MotionStaggerProps) {
  return (
    <Box
      component={motion.div}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      sx={sx}
    >
      {children}
    </Box>
  );
}

function MotionStaggerItem({ children, sx }: MotionStaggerProps) {
  return (
    <Box component={motion.div} variants={itemVariants} sx={sx}>
      {children}
    </Box>
  );
}

export { MotionStagger, MotionStaggerItem };
