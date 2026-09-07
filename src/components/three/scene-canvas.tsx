"use client";

import * as React from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents } from "@react-three/drei";

type SceneCanvasProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Shared <Canvas> shell for every hero 3D scene. frameloop="demand" means
 * nothing renders unless something calls invalidate() - each scene drives
 * its own slow idle-tick invalidation (see hero-scene-*.tsx) instead of
 * running a perpetual 60fps loop, keeping idle CPU/GPU near zero.
 */
function SceneCanvas({ children, className }: SceneCanvasProps) {
  return (
    <Canvas
      className={className}
      frameloop="demand"
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 9], fov: 32 }}
    >
      <AdaptiveDpr pixelated={false} />
      <AdaptiveEvents />
      {children}
    </Canvas>
  );
}

export { SceneCanvas };
