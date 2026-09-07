import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { requireRole } from "@/lib/auth/require-role";
import { toErrorKind } from "@/lib/errors";
import { ErrorState } from "@/components/shared/error-state";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { getFastMovers, getSlowMovers } from "@/features/reports/movements";
import { parseReportDateRange } from "@/features/reports/schema";
import { ReportHeader } from "../report-header";
import { FastMoversTable, SlowMoversTable } from "./movers-tables";

/**
 * `/reports/movers` (phase6.md §4 goal #5, §5's accepted default) - fast
 * movers ranked by total absolute quantity moved in the selected range;
 * slow movers are parts with zero qualifying movement in that range,
 * ordered by how long they've actually been idle (shared with the Stock
 * Aging report via `getStockAgingRows`,
 * src/features/reports/aging.ts).
 */
export default async function MoversReportPage(
  props: PageProps<"/reports/movers">,
) {
  await requireRole("reports.view");
  const searchParams = await props.searchParams;
  const range = parseReportDateRange(searchParams);

  let fastMovers, slowMovers;
  try {
    [fastMovers, slowMovers] = await Promise.all([
      getFastMovers(range),
      getSlowMovers(range),
    ]);
  } catch (error) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <ReportHeader
          title="Fast & slow movers"
          description="Which parts move the most - and which haven't moved at all."
        />
        <ErrorState kind={toErrorKind(error)} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <ReportHeader
        title="Fast & slow movers"
        description="Which parts move the most - and which haven't moved at all."
        action={
          <DateRangePicker
            preset={range.preset}
            from={range.from}
            to={range.to}
          />
        }
      />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Fast movers (top {fastMovers.length})
        </Typography>
        <FastMoversTable rows={fastMovers} />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Slow movers
        </Typography>
        <SlowMoversTable rows={slowMovers} />
      </Box>
    </Box>
  );
}
