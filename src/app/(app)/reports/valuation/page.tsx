import { WalletIcon } from "lucide-react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { requireRole } from "@/lib/auth/require-role";
import { canViewInventoryValue } from "@/lib/permissions";
import { toErrorKind } from "@/lib/errors";
import { formatCurrency } from "@/lib/utils";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatCluster } from "@/components/shared/stat-cluster";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import {
  getInventoryValuationByBrand,
  getInventoryValuationByCategory,
} from "@/features/reports/valuation";
import { ReportHeader } from "../report-header";
import { ValuationBreakdownTable } from "./valuation-breakdown-table";

/**
 * `/reports/valuation` (phase6.md §4 goal #2) - the same cost-basis
 * total as the dashboard KPI (`getInventoryValue`,
 * src/features/dashboard/queries.ts), broken down by category and by
 * brand via `sumCostBasis`-backed queries
 * (src/features/reports/valuation.ts) so the numbers can never disagree.
 * Gated additionally on `canViewInventoryValue` (phase6.md §10 - this
 * report must not surface cost data through a different route than the
 * dashboard already restricts to admin/manager).
 */
export default async function ValuationReportPage() {
  const user = await requireRole("reports.view");

  if (!canViewInventoryValue(user.role)) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <ReportHeader
          title="Inventory valuation"
          description="Cost-basis value of stock on hand, by category and brand."
        />
        <ErrorState kind="permission" />
      </Box>
    );
  }

  let byCategory, byBrand;
  try {
    [byCategory, byBrand] = await Promise.all([
      getInventoryValuationByCategory(),
      getInventoryValuationByBrand(),
    ]);
  } catch (error) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <ReportHeader
          title="Inventory valuation"
          description="Cost-basis value of stock on hand, by category and brand."
        />
        <ErrorState kind={toErrorKind(error)} />
      </Box>
    );
  }

  const total = byCategory.reduce((sum, row) => sum + row.value, 0);
  const excludedCount = byCategory.reduce(
    (sum, row) => sum + row.excludedCount,
    0,
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <ReportHeader
        title="Inventory valuation"
        description="Cost-basis value of stock on hand, by category and brand."
      />

      {/* One reading, so one column. */}
      <StatCluster sx={{ gridTemplateColumns: "1fr", maxWidth: { sm: 400 } }}>
        <KpiCard
          label="Total inventory value"
          value={formatCurrency(total)}
          icon={WalletIcon}
          tone="success"
          trend={
            excludedCount > 0
              ? {
                  direction: "flat",
                  label: `${excludedCount} item(s) missing cost data, not included`,
                }
              : undefined
          }
        />
      </StatCluster>

      {total === 0 && excludedCount === 0 ? (
        <EmptyState
          title="No inventory value yet"
          description="This will populate once inventory parts have a purchase cost."
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              By category
            </Typography>
            <ValuationBreakdownTable
              rows={byCategory}
              emptyTitle="No categorized value yet"
            />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              By brand
            </Typography>
            <ValuationBreakdownTable
              rows={byBrand}
              emptyTitle="No branded value yet"
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
