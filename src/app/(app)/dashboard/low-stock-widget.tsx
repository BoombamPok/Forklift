import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/shared/error-state";
import { MotionFadeIn } from "@/components/shared/motion-fade-in";
import { toErrorKind } from "@/lib/errors";
import { getLowStockRows } from "@/features/dashboard/low-stock";
import { LowStockTable } from "./low-stock-table";

/**
 * Its own widget/Suspense boundary (same pattern as 2c) so this can't be
 * taken down by, or take down, the KPI/chart/activity widgets above it.
 */
async function LowStockWidget() {
  let rows;
  try {
    rows = await getLowStockRows();
  } catch (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Needs attention</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState kind={toErrorKind(error)} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Needs attention</CardTitle>
      </CardHeader>
      <CardContent>
        <MotionFadeIn>
          <LowStockTable rows={rows} />
        </MotionFadeIn>
      </CardContent>
    </Card>
  );
}

export { LowStockWidget };
