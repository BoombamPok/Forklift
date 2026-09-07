"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  type HTMLMotionProps,
} from "motion/react";
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

type MagneticButtonProps = Omit<HTMLMotionProps<"button">, "ref"> &
  VariantProps<typeof buttonVariants> & {
    /** How far the button can be pulled toward the cursor, in pixels. */
    strength?: number;
  };

/**
 * A hero-only CTA - renders with the same classes as `Button` (via
 * `buttonVariants`, not by wrapping the component - `motion` needs a
 * direct DOM ref, and Button doesn't forward one) and eases toward the
 * cursor within a small radius, springing back on leave. Used sparingly
 * (login submit, hub primary actions), never on dense-table row actions
 * where it would just get in the way of fast repeated clicks.
 */
function MagneticButton({
  strength = 14,
  className,
  variant = "default",
  size = "default",
  onMouseMove,
  onMouseLeave,
  ...props
}: MagneticButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 300, damping: 20, mass: 0.5 });

  const handleMouseMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    onMouseMove?.(event);
    if (prefersReducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(((event.clientX - rect.left) / rect.width - 0.5) * strength);
    y.set(((event.clientY - rect.top) / rect.height - 0.5) * strength);
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLButtonElement>) => {
    onMouseLeave?.(event);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      style={prefersReducedMotion ? undefined : { x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { MagneticButton };
