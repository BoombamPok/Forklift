"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useInViewMount } from "@/components/three/use-in-view-mount";
import { PosterFallback } from "@/components/three/poster-fallback";
import { cn } from "@/lib/utils";

// The only file in the app allowed to call next/dynamic(..., { ssr: false })
// for a 3D scene - this keeps the ~350-500KB three.js/@react-three chunk
// scoped to exactly the routes that render one of these, and out of every
// Server Component page's own module graph.
const HeroSceneLogin = dynamic(
  () =>
    import("@/components/three/hero-scene-login").then((m) => m.HeroSceneLogin),
  { ssr: false },
);
const HeroSceneDashboard = dynamic(
  () =>
    import("@/components/three/hero-scene-dashboard").then(
      (m) => m.HeroSceneDashboard,
    ),
  { ssr: false },
);
const HeroSceneHub = dynamic(
  () => import("@/components/three/hero-scene-hub").then((m) => m.HeroSceneHub),
  { ssr: false },
);

type SceneVariant = "login" | "dashboard" | "hub";

type SceneLoaderProps = {
  variant: SceneVariant;
  className?: string;
  /** Only used by the "hub" variant, to vary catalogue/reports/admin. */
  leadHue?: "amber" | "electric";
  posterTone?: "primary" | "electric" | "dual";
};

const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeToDesktopQuery(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useIsDesktopViewport() {
  return React.useSyncExternalStore(
    subscribeToDesktopQuery,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

/**
 * Gates every 3D hero scene behind three checks: prefers-reduced-motion,
 * desktop viewport (this app is desktop-first, not waived for the visual
 * reset), and IntersectionObserver-based lazy mount. Server-rendered
 * output is always the static PosterFallback - the real Canvas only
 * mounts client-side once all three checks pass, so there is no
 * SSR/hydration mismatch to worry about.
 */
function SceneLoader({
  variant,
  className,
  leadHue,
  posterTone = "dual",
}: SceneLoaderProps) {
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useIsDesktopViewport();
  const [ref, isInView] = useInViewMount<HTMLDivElement>();

  const shouldRenderScene = isDesktop && !prefersReducedMotion && isInView;

  return (
    <div ref={ref} className={cn("relative", className)}>
      {shouldRenderScene ? (
        <React.Suspense fallback={<PosterFallback tone={posterTone} />}>
          {variant === "login" && <HeroSceneLogin className="size-full" />}
          {variant === "dashboard" && (
            <HeroSceneDashboard className="size-full" />
          )}
          {variant === "hub" && (
            <HeroSceneHub className="size-full" leadHue={leadHue} />
          )}
        </React.Suspense>
      ) : (
        <PosterFallback tone={posterTone} />
      )}
    </div>
  );
}

export { SceneLoader };
