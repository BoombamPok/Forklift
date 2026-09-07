import * as React from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import type { SxProps, Theme } from "@mui/material/styles";

type LoadingVariant = "table" | "cards" | "cluster" | "chart" | "list" | "block";

type LoadingStateProps = {
  variant?: LoadingVariant;
  rows?: number;
  columns?: 3 | 4;
  sx?: SxProps<Theme>;
};

/**
 * Skeletons that approximate the final layout, per CLAUDE.md - never a
 * bare spinner or a blank page while data loads.
 *
 * Each variant mirrors the real component's frame (same border, same
 * radius, same internal rules), so the swap from skeleton to content is
 * a fill, not a re-layout. The old generic "stack of grey bars" version
 * caused a visible jump on every widget.
 */
const PANEL_SX = {
  border: "1px solid var(--mui-palette-divider)",
  borderRadius: "var(--radius-panel)",
  bgcolor: "background.paper",
} as const;

const CLUSTER_COLUMNS: Record<3 | 4, object> = {
  3: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
  4: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
};

function LoadingState({
  variant = "block",
  rows = 5,
  columns = 4,
  sx,
}: LoadingStateProps) {
  if (variant === "cluster") {
    return (
      <Box
        role="status"
        aria-label="Loading"
        sx={[
          {
            ...PANEL_SX,
            display: "grid",
            gap: "1px",
            overflow: "hidden",
            gridTemplateColumns: CLUSTER_COLUMNS[columns],
            bgcolor: "divider",
          },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Box key={i} sx={{ bgcolor: "background.paper", px: 2.25, py: 2 }}>
            <Skeleton variant="text" width="55%" height={18} />
            <Skeleton variant="text" width="42%" height={34} sx={{ mt: 0.5 }} />
          </Box>
        ))}
      </Box>
    );
  }

  if (variant === "chart") {
    // Bars of varying height rather than one grey block - it reads as
    // "a chart is coming" instead of "something is broken here".
    const bars = [46, 72, 38, 84, 60, 92, 54, 68, 44, 78];
    return (
      <Box
        role="status"
        aria-label="Loading"
        sx={[
          {
            display: "flex",
            alignItems: "flex-end",
            gap: 1,
            height: "100%",
            minHeight: 180,
          },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      >
        {bars.map((height, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            sx={{ flex: 1, height: `${height}%`, borderRadius: "4px 4px 2px 2px" }}
          />
        ))}
      </Box>
    );
  }

  if (variant === "list") {
    return (
      <Box
        role="status"
        aria-label="Loading"
        sx={[
          { ...PANEL_SX, p: 2.25 },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      >
        <Skeleton variant="text" width="38%" height={20} />
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1.75 }}>
          {Array.from({ length: rows }).map((_, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Skeleton variant="rounded" width={26} height={26} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width={`${88 - i * 9}%`} height={15} />
                <Skeleton variant="text" width={`${44 - i * 4}%`} height={12} />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  if (variant === "table") {
    return (
      <Box
        role="status"
        aria-label="Loading"
        sx={[
          { ...PANEL_SX, overflow: "hidden" },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      >
        <Box
          sx={{
            display: "flex",
            gap: 3,
            px: 2,
            py: 1.25,
            borderBottom: "1px solid var(--mui-palette-divider)",
          }}
        >
          {["22%", "16%", "12%", "14%"].map((width, i) => (
            <Skeleton key={i} variant="text" width={width} height={14} />
          ))}
        </Box>
        {Array.from({ length: rows }).map((_, i) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              px: 2,
              py: 1.5,
              borderBottom: i === rows - 1 ? "none" : "1px solid var(--rule)",
            }}
          >
            <Skeleton variant="text" width="26%" height={16} />
            <Skeleton variant="text" width="14%" height={16} />
            <Skeleton variant="text" width="9%" height={16} />
            <Skeleton variant="rounded" width={64} height={20} />
          </Box>
        ))}
      </Box>
    );
  }

  if (variant === "cards") {
    return (
      <Box
        role="status"
        aria-label="Loading"
        sx={[
          {
            display: "grid",
            gap: 2,
            gridTemplateColumns: CLUSTER_COLUMNS[columns],
          },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      >
        {Array.from({ length: rows }).map((_, i) => (
          <Box key={i} sx={{ ...PANEL_SX, p: 2.25 }}>
            <Skeleton variant="text" width="55%" height={18} />
            <Skeleton variant="text" width="40%" height={32} sx={{ mt: 0.5 }} />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box
      role="status"
      aria-label="Loading"
      sx={[
        { display: "flex", flexDirection: "column", gap: 1 },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Skeleton variant="text" width="33%" />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="85%" />
    </Box>
  );
}

export { LoadingState };
