import * as React from "react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";

type StatClusterProps = {
  /** How many cards sit side by side on a wide screen. */
  columns?: 2 | 3 | 4;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
};

const COLUMN_TEMPLATE: Record<2 | 3 | 4, object> = {
  2: { xs: "1fr", sm: "repeat(2, 1fr)" },
  3: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
  4: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
};

/**
 * The headline metrics row.
 *
 * Holds the grid and the one orchestrated entrance in the app: cards
 * resolve left to right on first paint, the way a panel of gauges comes
 * up when equipment is switched on. Nothing else in the product animates
 * without a person asking it to.
 *
 * Each card draws its own frame (see KpiCard) rather than the row being
 * one divided panel - separate cards give the icon tiles room to act as
 * targets, which is what makes this row scannable rather than readable.
 */
function StatCluster({ columns = 4, children, sx }: StatClusterProps) {
  return (
    <Box
      sx={[
        {
          display: "grid",
          gap: 2,
          gridTemplateColumns: COLUMN_TEMPLATE[columns],
          "& > *": { animation: "instrument-in 380ms var(--ease-out) both" },
          "& > *:nth-of-type(2)": { animationDelay: "55ms" },
          "& > *:nth-of-type(3)": { animationDelay: "110ms" },
          "& > *:nth-of-type(4)": { animationDelay: "165ms" },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  );
}

export { StatCluster };
