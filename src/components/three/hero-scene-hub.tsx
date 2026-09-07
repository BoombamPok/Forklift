"use client";

import type { CSSProperties } from "react";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { SceneCanvas } from "@/components/three/scene-canvas";
import {
  ParallaxRig,
  FloatingCluster,
  SceneLights,
} from "@/components/three/scene-primitives";

type HeroSceneHubProps = {
  style?: CSSProperties;
  /** Lets catalogue/reports/admin each lead with a different hue so the
   * three hub pages don't look identical. */
  leadHue?: "amber" | "electric";
};

/** Shared hub-page hero - used by the catalogue, reports, and admin index
 * pages, which are plain link grids today and have no dense data to protect. */
function HeroSceneHub({ style, leadHue = "amber" }: HeroSceneHubProps) {
  return (
    <SceneCanvas style={style}>
      <SceneLights />
      <FloatingCluster density="slim" leadHue={leadHue} />
      <ParallaxRig strength={0.4} />
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

export { HeroSceneHub };
