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

import type { MovementTypeDay } from "@/features/reports/movements";
import type { MovementType } from "@/types/database";

type MovementTypeBarChartProps = {
  data: MovementTypeDay[];
};

const SERIES: { key: MovementType; name: string; color: string }[] = [
  { key: "in", name: "In", color: "var(--success)" },
  { key: "returned", name: "Returned", color: "var(--info)" },
  { key: "adjust", name: "Adjusted", color: "var(--primary)" },
  { key: "transfer", name: "Transferred", color: "var(--muted-foreground)" },
  { key: "damaged", name: "Damaged", color: "var(--warning)" },
  { key: "out", name: "Out", color: "var(--destructive)" },
];

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
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
      <p className="mb-1.5 font-medium">{formatTick(String(label))}</p>
      <div className="space-y-1">
        {payload
          .filter((entry) => Number(entry.value) > 0)
          .map((entry) => (
            <div key={entry.name} className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-2 rounded-[2px]"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
              <span className="ml-auto font-mono font-medium tabular-nums">
                {entry.value}
              </span>
            </div>
          ))}
      </div>
    </div>
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
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        barCategoryGap={5}
        margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
      >
        <CartesianGrid vertical={false} className="stroke-border" />
        <XAxis
          dataKey="date"
          tickFormatter={formatTick}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          stroke="var(--muted-foreground)"
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          stroke="var(--muted-foreground)"
        />
        <Tooltip
          content={(props) => <ChartTooltip {...props} />}
          cursor={{ fill: "var(--muted)", opacity: 0.5 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          iconType="circle"
          iconSize={8}
        />
        {SERIES.map((series) => (
          <Bar
            key={series.key}
            dataKey={series.key}
            name={series.name}
            fill={series.color}
            radius={[3, 3, 0, 0]}
            maxBarSize={14}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export { MovementTypeBarChart };
