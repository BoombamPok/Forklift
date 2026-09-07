"use client";

import * as React from "react";

/**
 * Returns true once the ref'd element has entered the viewport, and stays
 * true afterward (a 3D scene shouldn't unmount/remount as the user
 * scrolls past it). Used to defer mounting a Canvas until it's actually
 * needed instead of paying its cost on every page load.
 */
export function useInViewMount<T extends Element>(): [
  React.RefObject<T | null>,
  boolean,
] {
  const ref = React.useRef<T | null>(null);
  const [shouldMount, setShouldMount] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node || shouldMount) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldMount(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldMount]);

  return [ref, shouldMount];
}
