"use client";

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
import { useTheme } from "@mui/material/styles";

import type { MovementTypeDay } from "@/features/reports/movements";
import type { MovementType } from "@/types/database";

type MovementTypeBarChartProps = {
  data: MovementTypeDay[];
};

function formatTick(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function ChartTooltip({
  active,
  payload,
  label,
}: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;

  return (
    <Paper elevation={4} sx={{ px: 1.5, py: 1, fontSize: "0.75rem" }}>
      <Typography
        variant="caption"
        sx={{ display: "block", mb: 0.5, fontWeight: 600 }}
      >
        {formatTick(String(label))}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {payload
          .filter((entry) => Number(entry.value) > 0)
          .map((entry) => (
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
                  fontFamily: "var(--font-roboto-mono)",
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

/**
 * The full 6-movement-type breakdown for a selected date range
 * (phase6.md §4 - the dashboard's own `StockMovementBarChart` stays
 * collapsed to inbound/outbound; this is where the full picture lives).
 * Same gradient-free bar/tooltip conventions as that chart, tokens
 * shared with `KpiCard`'s tone palette so a type's color always means
 * the same thing across the app.
 */
function MovementTypeBarChart({ data }: MovementTypeBarChartProps) {
  const theme = useTheme();
  const gridColor = theme.palette.divider;
  const axisColor = theme.palette.text.secondary;

  const series: { key: MovementType; name: string; color: string }[] = [
    { key: "in", name: "In", color: theme.palette.success.main },
    { key: "returned", name: "Returned", color: theme.palette.info.main },
    { key: "adjust", name: "Adjusted", color: theme.palette.primary.main },
    {
      key: "transfer",
      name: "Transferred",
      color: theme.palette.text.secondary,
    },
    { key: "damaged", name: "Damaged", color: theme.palette.warning.main },
    { key: "out", name: "Out", color: theme.palette.error.main },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        barCategoryGap={5}
        margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
      >
        <CartesianGrid vertical={false} stroke={gridColor} />
        <XAxis
          dataKey="date"
          tickFormatter={formatTick}
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
          cursor={{ fill: theme.palette.action.hover }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          iconType="circle"
          iconSize={8}
        />
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            fill={s.color}
            radius={[3, 3, 0, 0]}
            maxBarSize={14}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export { MovementTypeBarChart };
