import * as React from "react";
import Paper from "@mui/material/Paper";
import type { SxProps, Theme } from "@mui/material/styles";

type StatClusterProps = {
  /** How many cells sit side by side on a wide screen. */
  columns?: 2 | 3 | 4;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
};

/**
 * The headline metrics render as one divided instrument panel, not as N
 * separate cards.
 *
 * That is the main structural decision in this design. A row of
 * identical rounded cards with identical shadows is the most recognisable
 * piece of generic dashboard furniture there is, and it also reads wrong:
 * four cards say "four unrelated things", when these are four readings
 * off the same system and are meant to be compared against each other.
 * One panel divided by hairlines says that instead.
 *
 * Implementation note: the dividers are the parent's own background
 * showing through a 1px grid gap, so there are no per-cell borders to
 * double up at the seams and nothing to special-case at the edges when
 * the column count changes at a breakpoint.
 */
const COLUMN_TEMPLATE: Record<2 | 3 | 4, object> = {
  2: { xs: "1fr", sm: "repeat(2, 1fr)" },
  3: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
  4: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
};

function StatCluster({ columns = 4, children, sx }: StatClusterProps) {
  return (
    <Paper
      variant="outlined"
      sx={[
        {
          display: "grid",
          gap: "1px",
          overflow: "hidden",
          borderRadius: "var(--radius-panel)",
          // The gap colour *is* the rule between cells.
          bgcolor: "divider",
          gridTemplateColumns: COLUMN_TEMPLATE[columns],
          // The single orchestrated entrance in the app: cells resolve
          // left to right on first paint, the way a panel of gauges comes
          // up when equipment is switched on. Nothing else animates
          // without a person asking it to.
          "& > *": {
            animation: "instrument-in 380ms var(--ease-out) both",
          },
          "& > *:nth-of-type(2)": { animationDelay: "55ms" },
          "& > *:nth-of-type(3)": { animationDelay: "110ms" },
          "& > *:nth-of-type(4)": { animationDelay: "165ms" },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Paper>
  );
}

export { StatCluster };
