import * as React from "react";

import { cn } from "@/lib/utils";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ChartContainerProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

/**
 * Layout shell for future Recharts content (Phase 6 reporting). Phase 1
 * only establishes the container per phase1.md #48/#52 - it deliberately
 * does not depend on Recharts yet, since nothing renders a chart this
 * phase.
 */
function ChartContainer({
  title,
  description,
  action,
  className,
  children,
}: ChartContainerProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent className="h-64">{children}</CardContent>
    </Card>
  );
}

export { ChartContainer };
