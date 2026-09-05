"use client";

import * as React from "react";
import { motion } from "motion/react";

type MotionFadeInProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Restrained entrance for content that just finished loading (e.g. a
 * Suspense boundary resolving) - marks the state change without
 * decorating for its own sake, per phase2b.md #0/CLAUDE.md's
 * anti-decoration direction. Shared so every UI sub-phase from here on
 * uses the same transition instead of ad hoc CSS per component.
 */
function MotionFadeIn({ children, className }: MotionFadeInProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export { MotionFadeIn };
