"use client";

import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { SceneCanvas } from "@/components/three/scene-canvas";
import {
  ParallaxRig,
  FloatingCluster,
  SceneLights,
} from "@/components/three/scene-primitives";

/** Full hero for the login page - the highest-impact, above-the-fold slot. */
function HeroSceneLogin({ className }: { className?: string }) {
  return (
    <SceneCanvas className={className}>
      <SceneLights />
      <FloatingCluster density="full" leadHue="amber" />
      <ParallaxRig strength={0.6} />
      <EffectComposer>
        <Bloom
          intensity={0.7}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </SceneCanvas>
  );
}

export { HeroSceneLogin };
