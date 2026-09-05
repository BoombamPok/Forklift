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
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
      <p className="mb-1.5 font-medium">{formatTick(String(label))}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2 rounded-[2px]"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-medium tabular-nums">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StockMovementBarChart({ data }: StockMovementBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        barCategoryGap={5}
        margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
      >
        <defs>
          <linearGradient id="inboundFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--success)" stopOpacity={1} />
            <stop offset="100%" stopColor="var(--success)" stopOpacity={0.55} />
          </linearGradient>
          <linearGradient id="outboundFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--destructive)" stopOpacity={1} />
            <stop
              offset="100%"
              stopColor="var(--destructive)"
              stopOpacity={0.55}
            />
          </linearGradient>
        </defs>
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
          content={(props) => <ChartTooltip {...props} />}
          cursor={{ fill: "var(--muted)", opacity: 0.5 }}
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
