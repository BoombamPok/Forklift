"use client";

import * as React from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Single source of truth for the app's reduced-motion carve-out - every
 * premium animation/3D primitive gates on this instead of querying
 * matchMedia itself. Uses useSyncExternalStore (not motion/react's own
 * useReducedMotion, which reads matchMedia during the first client render
 * and can mismatch the server-rendered markup) so hydration always starts
 * from the same "motion allowed" assumption the server used, then updates
 * safely on the client's next pass.
 */
export function useReducedMotion(): boolean {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
