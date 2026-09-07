import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { StatusBadge } from "@/components/shared/status-badge";

type OccupancyBadgeProps = {
  boxesOccupied: number;
  boxesTotal: number;
};

/**
 * The one occupancy indicator used at every level (warehouse/rack/shelf) -
 * a plain, honest ratio against real `inventory_parts.box_id` counts, never
 * a chart or a fabricated "capacity" figure (phase4.md §3/§9: this phase
 * shows current occupancy, not trends - that's Phase 6). The meter is a
 * direct visualization of that same ratio, not a separate metric.
 */
function OccupancyBadge({ boxesOccupied, boxesTotal }: OccupancyBadgeProps) {
  if (boxesTotal === 0) {
    return <StatusBadge label="No boxes yet" tone="secondary" />;
  }

  const percentage = Math.round((boxesOccupied / boxesTotal) * 100);

  return (
    <Box
      role="img"
      aria-label={`${boxesOccupied} of ${boxesTotal} boxes occupied`}
      sx={{ display: "flex", alignItems: "center", gap: 1 }}
    >
      <Box
        sx={{
          width: 56,
          height: 6,
          flexShrink: 0,
          overflow: "hidden",
          borderRadius: 999,
          bgcolor: "action.hover",
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${percentage}%`,
            borderRadius: 999,
            transition: "width 150ms",
            bgcolor:
              boxesOccupied === 0
                ? "transparent"
                : "color-mix(in srgb, var(--mui-palette-text-primary) 60%, transparent)",
          }}
        />
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontFamily: "var(--font-plex-mono)" }}
      >
        {boxesOccupied}/{boxesTotal}
      </Typography>
    </Box>
  );
}

export { OccupancyBadge };
