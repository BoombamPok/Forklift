"use client";

import * as React from "react";

function subscribe() {
  return () => {};
}

/**
 * True only once the client has hydrated. Uses useSyncExternalStore (not a
 * useEffect + setState) so React renders the server snapshot first to match
 * hydration, then flips to the client snapshot on its next pass - no
 * synchronous setState-in-effect render, consistent with useReducedMotion.
 */
export function useMounted(): boolean {
  return React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
