"use client";

import * as React from "react";
import { motion, useInView, type Variants } from "motion/react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay in seconds, for revealing a row of siblings in sequence. */
  delay?: number;
};

/**
 * Hero/hub-section variant of motion-fade-in.tsx's mount-reveal pattern -
 * bigger movement (24px vs 4px), triggers once when scrolled into view
 * instead of on mount. Reserved for hero/hub pages; dense data pages keep
 * using motion-fade-in/motion-stagger for their Suspense-boundary reveals.
 */
function ScrollReveal({ children, className, delay = 0 }: ScrollRevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

export { ScrollReveal };
