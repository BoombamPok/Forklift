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
} from "recharts";

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

function StockMovementBarChart({ data }: StockMovementBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} className="stroke-border" />
        <XAxis
          dataKey="date"
          tickFormatter={formatTick}
          interval={TICK_INTERVAL}
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
          labelFormatter={(value) => formatTick(String(value))}
          contentStyle={{
            borderRadius: "var(--radius-md)",
            borderColor: "var(--border)",
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar
          dataKey="inbound"
          name="Inbound"
          fill="var(--success)"
          radius={[2, 2, 0, 0]}
        />
        <Bar
          dataKey="outbound"
          name="Outbound"
          fill="var(--destructive)"
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export { StockMovementBarChart };
