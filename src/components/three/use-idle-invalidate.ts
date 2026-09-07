"use client";

import * as React from "react";
import { useThree } from "@react-three/fiber";

/**
 * Drives a low-frequency invalidation tick for scenes on frameloop="demand"
 * - a slow idle rotation only needs ~10 steps/sec to read as continuous
 * motion, at a fraction of the CPU/GPU cost of a perpetual 60fps loop.
 * Call inside a component rendered within <Canvas>.
 */
export function useIdleInvalidate(intervalMs = 100) {
  const invalidate = useThree((state) => state.invalidate);

  React.useEffect(() => {
    const id = window.setInterval(() => invalidate(), intervalMs);
    return () => window.clearInterval(id);
  }, [invalidate, intervalMs]);
}
