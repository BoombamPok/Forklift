import * as React from "react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type LoadingStateProps = {
  variant?: "table" | "cards" | "block";
  rows?: number;
  columns?: 3 | 4;
  className?: string;
};

/**
 * Skeletons that approximate the final layout, per CLAUDE.md - never a bare
 * spinner or a blank page while data loads.
 */
function LoadingState({
  variant = "block",
  rows = 5,
  columns = 4,
  className,
}: LoadingStateProps) {
  if (variant === "table") {
    return (
      <div
        role="status"
        aria-label="Loading"
        className={cn("space-y-2", className)}
      >
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div
        role="status"
        aria-label="Loading"
        className={cn(
          "grid grid-cols-1 gap-4 sm:grid-cols-2",
          columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4",
          className,
        )}
      >
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("space-y-2", className)}
    >
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

export { LoadingState };
