"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipContentProps } from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

type BrandDonutDatum = {
  label: string;
  value: number;
};

type BrandDonutChartProps = {
  data: BrandDonutDatum[];
  totalLabel: string;
};

const SLICE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
];

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
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="size-2 rounded-[2px]"
          style={{ backgroundColor: entry.color }}
        />
        <span className="font-medium">{entry.name}</span>
        <span className="ml-auto font-mono font-medium tabular-nums">
          {entry.value}
        </span>
      </div>
    </div>
  );
}

/**
 * Donut chart with a centered total and a side legend showing each
 * bucket's share - used for the dashboard's inventory-by-brand mix.
 * Colors are drawn from the theme's generic `--chart-*` tokens (oklch,
 * globals.css) rather than hardcoded hex, same convention as
 * `stock-movement-bar-chart.tsx`.
 */
function BrandDonutChart({ data, totalLabel }: BrandDonutChartProps) {
  const chartData = toChartData(data);
  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="flex h-full flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative mx-auto size-36 shrink-0">
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
                  fill={SLICE_COLORS[index % SLICE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={(props) => <DonutTooltip {...props} />} />
          </PieChart>
        </ResponsiveContainer>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
        >
          <span className="font-mono text-xl leading-none font-semibold tabular-nums">
            {total}
          </span>
          <span className="mt-1 text-[0.6875rem] tracking-wide text-muted-foreground uppercase">
            {totalLabel}
          </span>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-2">
        {chartData.map((entry, index) => {
          const percentage =
            total > 0 ? Math.round((entry.value / total) * 100) : 0;
          return (
            <li key={entry.label} className="flex items-center gap-2 text-sm">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{
                  backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length],
                }}
              />
              <span className="min-w-0 flex-1 truncate text-foreground">
                {entry.label}
              </span>
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                {percentage}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export { BrandDonutChart };
