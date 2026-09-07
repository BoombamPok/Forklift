import { ChartContainer } from "@/components/shared/chart-container";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { MotionFadeIn } from "@/components/shared/motion-fade-in";
import { BrandDonutChart } from "@/components/shared/brand-donut-chart";
import { toErrorKind } from "@/lib/errors";
import { getInventoryCountByBrand } from "@/features/dashboard/queries";

/**
 * Its own widget/Suspense boundary (same pattern as the other dashboard
 * widgets) so this can't be taken down by, or take down, the KPI/chart/
 * activity widgets around it. Only ever renders item counts, never cost -
 * see the query's own doc comment for why this doesn't need the
 * inventory-value visibility gating the KPI row has.
 */
async function InventoryByBrandWidget() {
  let rows;
  try {
    rows = await getInventoryCountByBrand();
  } catch (error) {
    return (
      <ChartContainer title="Inventory by brand" description="Live stock mix">
        <ErrorState kind={toErrorKind(error)} sx={{ height: "100%" }} />
      </ChartContainer>
    );
  }

  const hasData = rows.some((row) => row.itemCount > 0);

  return (
    <ChartContainer title="Inventory by brand" description="Live stock mix">
      {hasData ? (
        <MotionFadeIn sx={{ height: "100%" }}>
          <BrandDonutChart
            data={rows.map((row) => ({
              label: row.label,
              value: row.itemCount,
            }))}
            totalLabel="Parts"
          />
        </MotionFadeIn>
      ) : (
        <EmptyState
          sx={{ height: "100%" }}
          title="No inventory yet"
          description="Brand mix will chart here once stock exists."
        />
      )}
    </ChartContainer>
  );
}

export { InventoryByBrandWidget };
