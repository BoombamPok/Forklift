import * as React from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import type { SxProps, Theme } from "@mui/material/styles";

type LoadingStateProps = {
  variant?: "table" | "cards" | "block";
  rows?: number;
  columns?: 3 | 4;
  sx?: SxProps<Theme>;
};

/**
 * Skeletons that approximate the final layout, per CLAUDE.md - never a bare
 * spinner or a blank page while data loads.
 */
function LoadingState({
  variant = "block",
  rows = 5,
  columns = 4,
  sx,
}: LoadingStateProps) {
  if (variant === "table") {
    return (
      <Box
        role="status"
        aria-label="Loading"
        sx={{ display: "flex", flexDirection: "column", gap: 1, ...sx }}
      >
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={40} />
        ))}
      </Box>
    );
  }

  if (variant === "cards") {
    return (
      <Box
        role="status"
        aria-label="Loading"
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            lg: `repeat(${columns}, 1fr)`,
          },
          ...sx,
        }}
      >
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={96} />
        ))}
      </Box>
    );
  }

  return (
    <Box
      role="status"
      aria-label="Loading"
      sx={{ display: "flex", flexDirection: "column", gap: 1, ...sx }}
    >
      <Skeleton variant="text" width="33%" />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="85%" />
    </Box>
  );
}

export { LoadingState };
