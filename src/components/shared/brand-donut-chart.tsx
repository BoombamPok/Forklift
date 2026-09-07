"use client";

/*
 * Chart colors are CSS custom properties, not resolved theme values.
 *
 * With `cssVariables` enabled, `theme.palette.x.main` read through
 * `useTheme()` gives the *default* color scheme's literal hex, which is
 * baked in at render and does not update when a person switches to dark
 * mode - the charts would keep their light-mode fills on a dark panel.
 * SVG `fill`/`stroke` accept `var()` directly, so handing Recharts the
 * variable lets the browser re-resolve it on every scheme change.
 */

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipContentProps } from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

type BrandDonutDatum = {
  label: string;
  value: number;
};

type BrandDonutChartProps = {
  data: BrandDonutDatum[];
  totalLabel: string;
};

const MAX_SLICES = 5;

/** Caps the pie at the top 5 buckets, folding the rest into "Other". */
function toChartData(data: BrandDonutDatum[]): BrandDonutDatum[] {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  if (sorted.length <= MAX_SLICES) return sorted;

  const top = sorted.slice(0, MAX_SLICES);
  const otherValue = sorted
    .slice(MAX_SLICES)
    .reduce((sum, entry) => sum + entry.value, 0);
  return [...top, { label: "Other", value: otherValue }];
}

function DonutTooltip({
  active,
  payload,
}: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];

  return (
    <Paper
      elevation={0}
      sx={{
        px: 1.5,
        py: 1.125,
        fontSize: "0.75rem",
        borderRadius: "var(--radius-control)",
        border: "1px solid var(--mui-palette-divider)",
        boxShadow: "0 8px 24px rgba(11,16,26,0.18)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          aria-hidden
          sx={{
            width: 8,
            height: 8,
            borderRadius: "2px",
            bgcolor: entry.color,
          }}
        />
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {entry.name}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            ml: "auto",
            fontFamily: "var(--font-plex-mono)",
            fontWeight: 600,
          }}
        >
          {entry.value}
        </Typography>
      </Box>
    </Paper>
  );
}

/**
 * Donut chart with a centered total and a side legend showing each
 * bucket's share - used for the dashboard's inventory-by-brand mix.
 * Slice colors come from the categorical ramp, which is kept separate
 * from the status palette on purpose - see sliceColors below.
 */
function BrandDonutChart({ data, totalLabel }: BrandDonutChartProps) {
  // The categorical ramp from globals.css, not the status palette. A
  // brand slice filled with the same amber as "low stock" invites exactly
  // the wrong reading.
  const sliceColors = [
    "var(--series-1)",
    "var(--series-2)",
    "var(--series-3)",
    "var(--series-4)",
    "var(--series-5)",
    "var(--series-6)",
  ];
  const chartData = toChartData(data);
  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box
        sx={{
          position: "relative",
          mx: "auto",
          width: 144,
          height: 144,
          flexShrink: 0,
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.label}
                  fill={sliceColors[index % sliceColors.length]}
                />
              ))}
            </Pie>
            <Tooltip content={(props) => <DonutTooltip {...props} />} />
          </PieChart>
        </ResponsiveContainer>
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <Typography
            sx={{
              fontFamily: "var(--font-plex-mono)",
              fontSize: "1.25rem",
              lineHeight: 1,
              fontWeight: 600,
            }}
          >
            {total}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            {totalLabel}
          </Typography>
        </Box>
      </Box>

      <Box
        component="ul"
        sx={{
          listStyle: "none",
          m: 0,
          p: 0,
          minWidth: 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {chartData.map((entry, index) => {
          const percentage =
            total > 0 ? Math.round((entry.value / total) * 100) : 0;
          return (
            <Box
              component="li"
              key={entry.label}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                fontSize: "0.875rem",
              }}
            >
              <Box
                aria-hidden
                sx={{
                  width: 10,
                  height: 10,
                  flexShrink: 0,
                  borderRadius: "3px",
                  bgcolor: sliceColors[index % sliceColors.length],
                }}
              />
              <Typography variant="body2" noWrap sx={{ minWidth: 0, flex: 1 }}>
                {entry.label}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: "var(--font-plex-mono)", flexShrink: 0 }}
              >
                {percentage}%
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export { BrandDonutChart };
