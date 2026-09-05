import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type TrendDirection = "up" | "down" | "flat";

type KpiCardProps = {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  trend?: {
    direction: TrendDirection;
    label: string;
  };
  className?: string;
};

const TREND_STYLES: Record<TrendDirection, string> = {
  up: "text-success",
  down: "text-destructive",
  flat: "text-muted-foreground",
};

/**
 * The KPI primitive dashboard/report screens build on - Phase 1 only wires
 * the shell (see phase1.md #48); real business numbers arrive in Phase 2/6.
 */
function KpiCard({ label, value, icon: Icon, trend, className }: KpiCardProps) {
  return (
    <Card className={cn("gap-2", className)}>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        {Icon ? (
          <CardAction>
            <Icon aria-hidden className="size-4 text-muted-foreground" />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-1">
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {value}
        </CardTitle>
        {trend ? (
          <p className={cn("text-xs", TREND_STYLES[trend.direction])}>
            {trend.label}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export { KpiCard };
