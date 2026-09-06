import { WalletIcon } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { canViewInventoryValue } from "@/lib/permissions";
import { toErrorKind } from "@/lib/errors";
import { formatCurrency } from "@/lib/utils";
import { KpiCard } from "@/components/shared/kpi-card";
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
      <div className="space-y-6">
        <ReportHeader
          title="Inventory valuation"
          description="Cost-basis value of stock on hand, by category and brand."
        />
        <ErrorState kind="permission" />
      </div>
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
      <div className="space-y-6">
        <ReportHeader
          title="Inventory valuation"
          description="Cost-basis value of stock on hand, by category and brand."
        />
        <ErrorState kind={toErrorKind(error)} />
      </div>
    );
  }

  const total = byCategory.reduce((sum, row) => sum + row.value, 0);
  const excludedCount = byCategory.reduce(
    (sum, row) => sum + row.excludedCount,
    0,
  );

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Inventory valuation"
        description="Cost-basis value of stock on hand, by category and brand."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
      </div>

      {total === 0 && excludedCount === 0 ? (
        <EmptyState
          title="No inventory value yet"
          description="This will populate once inventory parts have a purchase cost."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">By category</h3>
            <ValuationBreakdownTable
              rows={byCategory}
              emptyTitle="No categorized value yet"
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">By brand</h3>
            <ValuationBreakdownTable
              rows={byBrand}
              emptyTitle="No branded value yet"
            />
          </div>
        </div>
      )}
    </div>
  );
}
