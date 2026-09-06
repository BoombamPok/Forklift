import { requireRole } from "@/lib/auth/require-role";
import { toErrorKind } from "@/lib/errors";
import { ErrorState } from "@/components/shared/error-state";
import { getLowStockRows } from "@/features/dashboard/low-stock";
import { ReportHeader } from "../report-header";
import { LowStockReportTable } from "./low-stock-report-table";

/**
 * `/reports/low-stock` (phase6.md §4 goal #4) - the full, uncapped list
 * from `getLowStockRows` (src/features/dashboard/low-stock.ts, already
 * uncapped for the dashboard widget), filterable by status/brand/
 * category.
 */
export default async function LowStockReportPage() {
  await requireRole("reports.view");

  let rows;
  try {
    rows = await getLowStockRows();
  } catch (error) {
    return (
      <div className="space-y-6">
        <ReportHeader
          title="Low stock & out of stock"
          description="The full list of parts that need attention right now."
        />
        <ErrorState kind={toErrorKind(error)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Low stock & out of stock"
        description="The full list of parts that need attention right now."
      />
      <LowStockReportTable rows={rows} />
    </div>
  );
}
