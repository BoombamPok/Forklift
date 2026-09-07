"use client";

import type { CSSProperties } from "react";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { SceneCanvas } from "@/components/three/scene-canvas";
import {
  ParallaxRig,
  FloatingCluster,
  SceneLights,
} from "@/components/three/scene-primitives";

/**
 * Slimmer banner variant for the dashboard - a wide, short hero band, not
 * a full-viewport takeover, since the KPIs below it are the actual point
 * of the page and need to stay primary.
 */
function HeroSceneDashboard({ style }: { style?: CSSProperties }) {
  return (
    <SceneCanvas style={style}>
      <SceneLights />
      <FloatingCluster density="slim" leadHue="amber" />
      <ParallaxRig strength={0.35} />
      <EffectComposer>
        <Bloom
          intensity={0.75}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </SceneCanvas>
  );
}

export { HeroSceneDashboard };
