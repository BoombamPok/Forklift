import { ChartContainer } from "@/components/shared/chart-container";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { MotionFadeIn } from "@/components/shared/motion-fade-in";
import { StockMovementBarChart } from "@/components/shared/stock-movement-bar-chart";
import { toErrorKind } from "@/lib/errors";
import { getStockMovementSeries } from "@/features/dashboard/activity";

/**
 * Its own widget/Suspense boundary (phase2c.md) so a chart failure can't
 * take down the recent-activity widget next to it.
 */
async function StockMovementWidget() {
  let series;
  try {
    series = await getStockMovementSeries();
  } catch (error) {
    return (
      <ChartContainer title="Stock movement" description="Last 30 days">
        <ErrorState kind={toErrorKind(error)} className="h-full" />
      </ChartContainer>
    );
  }

  const hasMovement = series.some((day) => day.inbound > 0 || day.outbound > 0);

  return (
    <ChartContainer title="Stock movement" description="Last 30 days">
      {hasMovement ? (
        <MotionFadeIn className="h-full">
          <StockMovementBarChart data={series} />
        </MotionFadeIn>
      ) : (
        <EmptyState
          className="h-full"
          title="No movement yet"
          description="Stock movement will chart here once operations begin."
        />
      )}
    </ChartContainer>
  );
}

export { StockMovementWidget };
