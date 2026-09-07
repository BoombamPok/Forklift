import Box from "@mui/material/Box";

import { ErrorState } from "@/components/shared/error-state";
import { MotionFadeIn } from "@/components/shared/motion-fade-in";
import { SectionLabel } from "@/components/shared/section-label";
import { toErrorKind } from "@/lib/errors";
import { getLowStockRows } from "@/features/dashboard/low-stock";
import { LowStockTable } from "./low-stock-table";

/**
 * Its own widget/Suspense boundary so this can't be taken down by, or
 * take down, the KPI/chart/activity widgets above it.
 *
 * No Card wrapper any more: the section label names the block and
 * DataTable draws its own panel. The old version put a titled card around
 * a bordered table, which is two frames for one list. The label stays
 * inside the widget (rather than in page.tsx) so the heading is present
 * in every state this thing can be in - loading, loaded, and failed.
 */
async function LowStockWidget() {
  let rows;
  try {
    rows = await getLowStockRows();
  } catch (error) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <SectionLabel>Needs attention</SectionLabel>
        <ErrorState kind={toErrorKind(error)} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <SectionLabel>Needs attention</SectionLabel>
      <MotionFadeIn>
        <LowStockTable rows={rows} />
      </MotionFadeIn>
    </Box>
  );
}

export { LowStockWidget };
