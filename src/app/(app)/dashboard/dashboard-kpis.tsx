import * as React from "react";
import {
  AlertTriangleIcon,
  InfoIcon,
  PackageIcon,
  WalletIcon,
  XCircleIcon,
} from "lucide-react";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";

import { KpiCard } from "@/components/shared/kpi-card";
import { ErrorState } from "@/components/shared/error-state";
import { MotionFadeIn } from "@/components/shared/motion-fade-in";
import {
  MotionStagger,
  MotionStaggerItem,
} from "@/components/shared/motion-stagger";
import { formatCurrency } from "@/lib/utils";
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
 * Renders the four KPI cards from live data. Fetches each metric
 * independently via `Promise.allSettled` so one query failing (e.g.
 * Supabase unreachable) only takes down its own card, not the whole row.
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
    <MotionFadeIn sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {isEmpty ? (
        <Alert severity="info" icon={<InfoIcon size={18} />}>
          <AlertTitle>No data yet</AlertTitle>
          These numbers will populate once inventory and stock movements exist.
        </Alert>
      ) : null}

      <MotionStagger
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            lg: showValue ? "repeat(4, 1fr)" : "repeat(3, 1fr)",
          },
        }}
      >
        <MotionStaggerItem>
          {renderKpi(itemCountResult, (count) => (
            <KpiCard
              label="Inventory items"
              value={count}
              icon={PackageIcon}
              tone="info"
            />
          ))}
        </MotionStaggerItem>

        {showValue ? (
          <MotionStaggerItem>
            {renderKpi(valueResult, (value) =>
              value === undefined ? null : (
                <KpiCard
                  label="Inventory value"
                  value={
                    <Box
                      component="span"
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.75,
                      }}
                    >
                      {formatCurrency(value.value)}
                      {value.excludedCount > 0 ? (
                        <Tooltip
                          title={`${value.excludedCount} item(s) missing cost data, not included`}
                        >
                          <InfoIcon
                            aria-label={`${value.excludedCount} item(s) missing cost data, not included in this total`}
                            size={14}
                            style={{
                              color: "var(--mui-palette-text-secondary)",
                            }}
                          />
                        </Tooltip>
                      ) : null}
                    </Box>
                  }
                  icon={WalletIcon}
                  tone="success"
                />
              ),
            )}
          </MotionStaggerItem>
        ) : null}

        <MotionStaggerItem>
          {renderKpi(lowStockResult, (count) => (
            <KpiCard
              label="Low stock"
              value={count}
              icon={AlertTriangleIcon}
              tone="warning"
            />
          ))}
        </MotionStaggerItem>

        <MotionStaggerItem>
          {renderKpi(outOfStockResult, (count) => (
            <KpiCard
              label="Out of stock"
              value={count}
              icon={XCircleIcon}
              tone="destructive"
            />
          ))}
        </MotionStaggerItem>
      </MotionStagger>
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
        sx={{ height: "100%", justifyContent: "center", gap: 1, py: 3 }}
      />
    );
  }
  return render(result.value);
}

export { DashboardKpis };
