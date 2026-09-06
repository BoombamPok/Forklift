import { requireRole } from "@/lib/auth/require-role";
import { toErrorKind } from "@/lib/errors";
import { ChartContainer } from "@/components/shared/chart-container";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { MovementTypeBarChart } from "@/components/shared/movement-type-bar-chart";
import {
  getMovementTypeSeries,
  getMovementTypeSummary,
} from "@/features/reports/movements";
import { parseReportDateRange } from "@/features/reports/schema";
import { ReportHeader } from "../report-header";
import { MovementSummaryTable } from "./movement-summary-table";

/**
 * `/reports/movements` (phase6.md §4 goal #3) - the dashboard's own
 * chart deliberately collapses to inbound/outbound; this report is the
 * full 6-movement-type picture over a selectable date range, sharing
 * one range-bound fetch (`fetchMovementsInRange`,
 * src/features/reports/movements.ts) for both the chart and the table.
 */
export default async function MovementsReportPage(
  props: PageProps<"/reports/movements">,
) {
  await requireRole("reports.view");
  const searchParams = await props.searchParams;
  const range = parseReportDateRange(searchParams);

  let series, summary;
  try {
    [series, summary] = await Promise.all([
      getMovementTypeSeries(range),
      getMovementTypeSummary(range),
    ]);
  } catch (error) {
    return (
      <div className="space-y-6">
        <ReportHeader
          title="Stock movement"
          description="Every movement type over a selected date range."
        />
        <ErrorState kind={toErrorKind(error)} />
      </div>
    );
  }

  const hasMovement = summary.some((row) => row.movementCount > 0);

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Stock movement"
        description="Every movement type over a selected date range."
        action={
          <DateRangePicker
            preset={range.preset}
            from={range.from}
            to={range.to}
          />
        }
      />

      {hasMovement ? (
        <>
          <ChartContainer
            title="Movement by type"
            description={`${range.from} to ${range.to}`}
          >
            <MovementTypeBarChart data={series} />
          </ChartContainer>
          <MovementSummaryTable rows={summary} />
        </>
      ) : (
        <EmptyState
          title="No movement in this period"
          description="Try a wider date range, or check back once operations begin."
        />
      )}
    </div>
  );
}
