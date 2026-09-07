import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

import { ErrorState } from "@/components/shared/error-state";
import { MotionFadeIn } from "@/components/shared/motion-fade-in";
import { toErrorKind } from "@/lib/errors";
import { getLowStockRows } from "@/features/dashboard/low-stock";
import { LowStockTable } from "./low-stock-table";

/**
 * Its own widget/Suspense boundary so this can't be taken down by, or
 * take down, the KPI/chart/activity widgets above it.
 *
 * NOTE: LowStockTable still renders on the shared DataTable/Tabs
 * primitives (shadcn/Tailwind) - those are used across ~15+ pages and
 * converting them is its own batch, not part of this dashboard pass.
 */
async function LowStockWidget() {
  let rows;
  try {
    rows = await getLowStockRows();
  } catch (error) {
    return (
      <Card>
        <CardHeader
          title={<Typography variant="h6">Needs attention</Typography>}
        />
        <CardContent sx={{ pt: 0 }}>
          <ErrorState kind={toErrorKind(error)} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={<Typography variant="h6">Needs attention</Typography>}
      />
      <CardContent sx={{ pt: 0 }}>
        <MotionFadeIn>
          <LowStockTable rows={rows} />
        </MotionFadeIn>
      </CardContent>
    </Card>
  );
}

export { LowStockWidget };
