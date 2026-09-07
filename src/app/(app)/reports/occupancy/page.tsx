import Box from "@mui/material/Box";

import { requireRole } from "@/lib/auth/require-role";
import { toErrorKind } from "@/lib/errors";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { getOccupancyRollup } from "@/features/reports/occupancy";
import { ReportHeader } from "../report-header";
import { OccupancyTable } from "./occupancy-table";

/**
 * `/reports/occupancy` (phase6.md §4 goal #7) - extends Phase 4's
 * per-location occupancy badges (`OccupancyBadge`,
 * src/components/shared/occupancy-badge.tsx) to one rollup table across
 * every warehouse and rack, via `getOccupancyRollup`
 * (src/features/reports/occupancy.ts).
 */
export default async function OccupancyReportPage() {
  await requireRole("reports.view");

  let rows;
  try {
    rows = await getOccupancyRollup();
  } catch (error) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <ReportHeader
          title="Warehouse occupancy"
          description="Box occupancy for every rack, across every warehouse."
        />
        <ErrorState kind={toErrorKind(error)} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <ReportHeader
        title="Warehouse occupancy"
        description="Box occupancy for every rack, across every warehouse."
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No racks yet"
          description="Occupancy will populate once warehouses have racks and boxes."
        />
      ) : (
        <OccupancyTable rows={rows} />
      )}
    </Box>
  );
}
