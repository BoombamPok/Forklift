import * as React from "react";
import {
  AlertTriangleIcon,
  InfoIcon,
  PackageIcon,
  WalletIcon,
  XCircleIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { KpiCard } from "@/components/shared/kpi-card";
import { ErrorState } from "@/components/shared/error-state";
import { MotionFadeIn } from "@/components/shared/motion-fade-in";
import { cn, formatCurrency } from "@/lib/utils";
import { toErrorKind } from "@/lib/errors";
import {
  getInventoryItemCount,
  getInventoryValue,
  getLowStockCount,
  getOutOfStockCount,
} from "@/features/dashboard/queries";

type DashboardKpisProps = {
  showValue: boolean;
};

/**
 * Renders the four KPI cards from live data (phase2b.md). Fetches each
 * metric independently via `Promise.allSettled` so one query failing
 * (e.g. Supabase unreachable) only takes down its own card, not the
 * whole row - see phase2b.md #11.
 */
async function DashboardKpis({ showValue }: DashboardKpisProps) {
  const [itemCountResult, valueResult, lowStockResult, outOfStockResult] =
    await Promise.allSettled([
      getInventoryItemCount(),
      showValue ? getInventoryValue() : Promise.resolve(undefined),
      getLowStockCount(),
      getOutOfStockCount(),
    ]);

  const isEmpty =
    itemCountResult.status === "fulfilled" && itemCountResult.value === 0;

  return (
    <MotionFadeIn className="space-y-6">
      {isEmpty ? (
        <Alert>
          <InfoIcon />
          <AlertTitle>No data yet</AlertTitle>
          <AlertDescription>
            These numbers will populate once inventory and stock movements
            exist.
          </AlertDescription>
        </Alert>
      ) : null}

      <div
        className={cn(
          "grid grid-cols-1 gap-4 sm:grid-cols-2",
          showValue ? "lg:grid-cols-4" : "lg:grid-cols-3",
        )}
      >
        {renderKpi(itemCountResult, (count) => (
          <KpiCard label="Inventory items" value={count} icon={PackageIcon} />
        ))}

        {showValue
          ? renderKpi(valueResult, (value) =>
              value === undefined ? null : (
                <KpiCard
                  label="Inventory value"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      {formatCurrency(value.value)}
                      {value.excludedCount > 0 ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon
                              aria-label={`${value.excludedCount} item(s) missing cost data, not included in this total`}
                              className="size-3.5 text-muted-foreground"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            {value.excludedCount} item(s) missing cost data, not
                            included
                          </TooltipContent>
                        </Tooltip>
                      ) : null}
                    </span>
                  }
                  icon={WalletIcon}
                />
              ),
            )
          : null}

        {renderKpi(lowStockResult, (count) => (
          <KpiCard label="Low stock" value={count} icon={AlertTriangleIcon} />
        ))}

        {renderKpi(outOfStockResult, (count) => (
          <KpiCard label="Out of stock" value={count} icon={XCircleIcon} />
        ))}
      </div>
    </MotionFadeIn>
  );
}

function renderKpi<T>(
  result: PromiseSettledResult<T>,
  render: (value: T) => React.ReactNode,
) {
  if (result.status === "rejected") {
    return (
      <ErrorState
        kind={toErrorKind(result.reason)}
        className="h-full justify-center gap-2 rounded-lg py-6"
      />
    );
  }
  return render(result.value);
}

export { DashboardKpis };
