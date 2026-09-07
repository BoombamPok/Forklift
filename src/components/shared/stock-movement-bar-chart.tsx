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

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import type { StockMovementDay } from "@/features/dashboard/activity";

type StockMovementBarChartProps = {
  data: StockMovementDay[];
};

function formatTick(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Every ~5th day gets an x-axis label - 30 daily ticks all at once is
 * unreadable at this widget's width.
 */
const TICK_INTERVAL = 4;

function ChartTooltip({
  active,
  payload,
  label,
}: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;

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
      <Typography
        variant="caption"
        sx={{ display: "block", mb: 0.5, fontWeight: 600 }}
      >
        {formatTick(String(label))}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {payload.map((entry) => (
          <Box
            key={entry.name}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Box
              aria-hidden
              sx={{
                width: 8,
                height: 8,
                borderRadius: "2px",
                bgcolor: entry.color,
              }}
            />
            <Typography variant="caption" color="text.secondary">
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
        ))}
      </Box>
    </Paper>
  );
}

function StockMovementBarChart({ data }: StockMovementBarChartProps) {
  const successColor = "var(--mui-palette-success-main)";
  const errorColor = "var(--mui-palette-error-main)";
  const gridColor = "var(--mui-palette-divider)";
  const axisColor = "var(--mui-palette-text-secondary)";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        barCategoryGap={5}
        margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
      >
        <defs>
          <linearGradient id="inboundFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={successColor} stopOpacity={1} />
            <stop offset="100%" stopColor={successColor} stopOpacity={0.55} />
          </linearGradient>
          <linearGradient id="outboundFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={errorColor} stopOpacity={1} />
            <stop offset="100%" stopColor={errorColor} stopOpacity={0.55} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={gridColor} />
        <XAxis
          dataKey="date"
          tickFormatter={formatTick}
          interval={TICK_INTERVAL}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          stroke={axisColor}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          stroke={axisColor}
        />
        <Tooltip
          content={(props) => <ChartTooltip {...props} />}
          cursor={{ fill: "var(--mui-palette-action-hover)" }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          iconType="circle"
          iconSize={8}
        />
        <Bar
          dataKey="inbound"
          name="Inbound"
          fill="url(#inboundFill)"
          radius={[4, 4, 0, 0]}
          maxBarSize={18}
        />
        <Bar
          dataKey="outbound"
          name="Outbound"
          fill="url(#outboundFill)"
          radius={[4, 4, 0, 0]}
          maxBarSize={18}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export { StockMovementBarChart };
