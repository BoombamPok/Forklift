import Box from "@mui/material/Box";

import { requireRole } from "@/lib/auth/require-role";
import { toErrorKind } from "@/lib/errors";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { getStockAgingRows } from "@/features/reports/aging";
import { ReportHeader } from "../report-header";
import { AgingTable } from "./aging-table";

/**
 * `/reports/aging` (phase6.md §4 goal #6) - every live part, oldest
 * activity first, from `getStockAgingRows`
 * (src/features/reports/aging.ts). Deliberately no date-range control:
 * "how long has this been sitting" is unbounded by definition.
 */
export default async function AgingReportPage() {
  await requireRole("reports.view");

  let rows;
  try {
    rows = await getStockAgingRows();
  } catch (error) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <ReportHeader
          title="Stock aging"
          description="How long each part has sat without activity."
        />
        <ErrorState kind={toErrorKind(error)} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <ReportHeader
        title="Stock aging"
        description="How long each part has sat without activity."
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No inventory yet"
          description="Aging will populate once inventory parts exist."
        />
      ) : (
        <AgingTable rows={rows} />
      )}
    </Box>
  );
}
