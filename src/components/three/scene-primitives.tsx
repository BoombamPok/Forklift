"use client";

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useIdleInvalidate } from "@/components/three/use-idle-invalidate";

const AMBER = { base: "#e8a464", emissive: "#c2703a" };
const ELECTRIC = { base: "#5fb8e0", emissive: "#2f7f9e" };

/** Gentle camera parallax toward the pointer, plus the shared idle tick
 * that keeps frameloop="demand" scenes animating at low cost. */
function ParallaxRig({ strength = 0.6 }: { strength?: number }) {
  useIdleInvalidate(100);
  useFrame((state) => {
    const targetX = state.pointer.x * strength;
    const targetY = state.pointer.y * (strength * 0.6);
    state.camera.position.x = THREE.MathUtils.lerp(
      state.camera.position.x,
      targetX,
      0.05,
    );
    state.camera.position.y = THREE.MathUtils.lerp(
      state.camera.position.y,
      targetY,
      0.05,
    );
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

type FloatingClusterProps = {
  /** "full" is the 3-piece composition (login/dashboard hero); "slim" drops
   * the third accent piece for a lighter hub-page banner. */
  density?: "full" | "slim";
  /** Rotates which hue leads the composition per hub page, so catalogue/
   * reports/admin don't look identical. */
  leadHue?: "amber" | "electric";
};

/**
 * The shared abstract geometric composition behind every hero scene - a
 * floating cluster of metallic/distorted primitives lit in the brand's two
 * accent hues. Deliberately not a literal forklift/crate render (no such
 * 3D asset exists); this is intentionally abstract.
 */
function FloatingCluster({
  density = "full",
  leadHue = "amber",
}: FloatingClusterProps) {
  const groupRef = React.useRef<THREE.Group>(null);
  const lead = leadHue === "amber" ? AMBER : ELECTRIC;
  const secondary = leadHue === "amber" ? ELECTRIC : AMBER;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.12;
    groupRef.current.rotation.x += delta * 0.04;
  });

  const scale = density === "full" ? 1 : 1.15;

  return (
    <group ref={groupRef} scale={scale}>
      <Float speed={1.4} rotationIntensity={0.6} floatIntensity={1}>
        <mesh>
          <icosahedronGeometry args={[1.35, 4]} />
          <MeshDistortMaterial
            color={lead.base}
            emissive={lead.emissive}
            emissiveIntensity={0.65}
            roughness={0.12}
            metalness={0.65}
            distort={0.4}
            speed={1.6}
          />
        </mesh>
      </Float>
      <Float speed={1.1} rotationIntensity={0.9} floatIntensity={1.4}>
        <mesh position={[2.1, -0.7, -0.6]} rotation={[0.6, 0.3, 0]}>
          <torusGeometry args={[0.75, 0.19, 32, 100]} />
          <meshStandardMaterial
            color={secondary.base}
            emissive={secondary.emissive}
            emissiveIntensity={0.75}
            roughness={0.2}
            metalness={0.75}
          />
        </mesh>
      </Float>
      <Float speed={1.8} rotationIntensity={0.5} floatIntensity={1.2}>
        <mesh position={[-1.9, 1, -0.3]}>
          <octahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial
            color={lead.base}
            emissive={lead.emissive}
            emissiveIntensity={0.6}
            roughness={0.18}
            metalness={0.65}
          />
        </mesh>
      </Float>
      {density === "full" && (
        <Float speed={1.5} rotationIntensity={0.7} floatIntensity={1.3}>
          <mesh position={[0.6, 1.5, -1.2]}>
            <dodecahedronGeometry args={[0.4, 0]} />
            <meshStandardMaterial
              color={secondary.base}
              emissive={secondary.emissive}
              emissiveIntensity={0.55}
              roughness={0.2}
              metalness={0.7}
            />
          </mesh>
        </Float>
      )}
    </group>
  );
}

/** Standard three-point-ish lighting rig shared by every hero scene. */
function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <pointLight position={[4, 3, 4]} intensity={70} color={AMBER.base} />
      <pointLight position={[-4, -2, 3]} intensity={55} color={ELECTRIC.base} />
      <directionalLight position={[0, 4, 5]} intensity={0.8} />
    </>
  );
}

export { ParallaxRig, FloatingCluster, SceneLights };
