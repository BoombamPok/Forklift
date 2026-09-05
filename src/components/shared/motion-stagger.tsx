"use client";

import * as React from "react";
import { motion, type Variants } from "motion/react";

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
  className?: string;
};

/**
 * Cascades its direct `MotionStaggerItem` children in on mount instead of
 * having every item pop in at once - used for grids/lists of otherwise
 * uniform cards (KPI row, table rows) where a single fade reads as
 * static. Restrained per CLAUDE.md: marks a state change, not decoration.
 */
function MotionStagger({ children, className }: MotionStaggerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {children}
    </motion.div>
  );
}

function MotionStaggerItem({ children, className }: MotionStaggerProps) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

export { MotionStagger, MotionStaggerItem };
