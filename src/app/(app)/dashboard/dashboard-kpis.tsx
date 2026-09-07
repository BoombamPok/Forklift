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
import { StatCluster } from "@/components/shared/stat-cluster";
import { ErrorState } from "@/components/shared/error-state";
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

/** A failed metric still has to occupy its cell, or the remaining
 * readings slide sideways and a person reads the wrong number under the
 * wrong label. Flattened to sit flush inside the cluster's own frame. */
const CELL_ERROR_SX = {
  borderRadius: "var(--radius-panel)",
  bgcolor: "background.paper",
  height: "100%",
  gap: 1,
  py: 3,
};

/**
 * Renders the headline metrics as one divided instrument panel. Fetches
 * each metric independently via `Promise.allSettled` so one query failing
 * (e.g. Supabase unreachable) only takes down its own cell, not the row.
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {isEmpty ? (
        <Alert severity="info" icon={<InfoIcon size={17} />}>
          <AlertTitle sx={{ fontSize: "0.8438rem", fontWeight: 600, mb: 0.25 }}>
            No data yet
          </AlertTitle>
          These numbers will populate once inventory and stock movements exist.
        </Alert>
      ) : null}

      <StatCluster columns={showValue ? 4 : 3}>
        {renderKpi(itemCountResult, (count) => (
          <KpiCard
            label="Inventory items"
            value={count}
            icon={PackageIcon}
            tone="info"
          />
        ))}

        {showValue
          ? renderKpi(valueResult, (value) =>
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
                            style={{ color: "var(--mui-palette-text-secondary)" }}
                          />
                        </Tooltip>
                      ) : null}
                    </Box>
                  }
                  icon={WalletIcon}
                  tone="success"
                />
              ),
            )
          : null}

        {renderKpi(lowStockResult, (count) => (
          <KpiCard
            label="Low stock"
            value={count}
            icon={AlertTriangleIcon}
            tone="warning"
          />
        ))}

        {renderKpi(outOfStockResult, (count) => (
          <KpiCard
            label="Out of stock"
            value={count}
            icon={XCircleIcon}
            tone="destructive"
          />
        ))}
      </StatCluster>
    </Box>
  );
}

function renderKpi<T>(
  result: PromiseSettledResult<T>,
  render: (value: T) => React.ReactNode,
) {
  if (result.status === "rejected") {
    return <ErrorState kind={toErrorKind(result.reason)} sx={CELL_ERROR_SX} />;
  }
  return render(result.value);
}

export { DashboardKpis };
