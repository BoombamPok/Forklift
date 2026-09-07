import { ChartContainer } from "@/components/shared/chart-container";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { MotionFadeIn } from "@/components/shared/motion-fade-in";
import { StockMovementBarChart } from "@/components/shared/stock-movement-bar-chart";
import { toErrorKind } from "@/lib/errors";
import { getStockMovementSeries } from "@/features/dashboard/activity";

/**
 * Its own widget/Suspense boundary so a chart failure can't take down the
 * recent-activity widget next to it.
 */
async function StockMovementWidget() {
  let series;
  try {
    series = await getStockMovementSeries();
  } catch (error) {
    return (
      <ChartContainer title="Stock movement" description="Last 30 days">
        <ErrorState kind={toErrorKind(error)} sx={{ height: "100%" }} />
      </ChartContainer>
    );
  }

  const hasMovement = series.some((day) => day.inbound > 0 || day.outbound > 0);

  return (
    <ChartContainer title="Stock movement" description="Last 30 days">
      {hasMovement ? (
        <MotionFadeIn sx={{ height: "100%" }}>
          <StockMovementBarChart data={series} />
        </MotionFadeIn>
      ) : (
        <EmptyState
          sx={{ height: "100%" }}
          title="No movement yet"
          description="Stock movement will chart here once operations begin."
        />
      )}
    </ChartContainer>
  );
}

export { StockMovementWidget };
