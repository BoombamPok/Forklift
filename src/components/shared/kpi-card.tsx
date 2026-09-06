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
type KpiTone = "default" | "success" | "warning" | "destructive" | "info";

type KpiCardProps = {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  tone?: KpiTone;
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

const TONE_STYLES: Record<KpiTone, string> = {
  default: "bg-muted text-muted-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
};

/**
 * The KPI primitive dashboard/report screens build on. `tone` tints the
 * icon chip to match what the metric means (e.g. warning for low stock)
 * - purely a semantic color cue, not a claim the card is interactive, so
 * no hover/press affordance is added here.
 */
function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  trend,
  className,
}: KpiCardProps) {
  return (
    <Card className={cn("gap-3", className)}>
      <CardHeader>
        <CardDescription className="font-medium tracking-wide text-muted-foreground uppercase text-[0.6875rem]">
          {label}
        </CardDescription>
        {Icon ? (
          <CardAction>
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-lg",
                TONE_STYLES[tone],
              )}
            >
              <Icon aria-hidden className="size-4" />
            </div>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-1">
        <CardTitle className="font-mono text-[1.75rem] leading-none font-semibold tracking-tight tabular-nums">
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

export { KpiCard, type KpiTone };
