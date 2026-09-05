import { Suspense } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/shared/chart-container";
import { LoadingState } from "@/components/shared/loading-state";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canViewInventoryValue } from "@/lib/permissions";
import { DashboardKpis } from "./dashboard-kpis";
import { StockMovementWidget } from "./stock-movement-widget";
import { RecentActivityWidget } from "./recent-activity-widget";
import { LowStockWidget } from "./low-stock-widget";

/**
 * KPI row (2b), stock movement chart + recent activity (2c), and the
 * low-stock table (2d) all wired to live data, each in its own Suspense
 * boundary so one widget's failure or loading time never blocks another.
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();
  const showValue = user ? canViewInventoryValue(user.role) : false;

  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <LoadingState
            variant="cards"
            rows={showValue ? 4 : 3}
            columns={showValue ? 4 : 3}
          />
        }
      >
        <DashboardKpis showValue={showValue} />
      </Suspense>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Suspense
          fallback={
            <ChartContainer title="Stock movement" description="Last 30 days">
              <LoadingState variant="block" className="h-full" />
            </ChartContainer>
          }
        >
          <StockMovementWidget />
        </Suspense>

        <Suspense
          fallback={
            <Card>
              <CardHeader>
                <CardTitle>Recent activity</CardTitle>
              </CardHeader>
              <CardContent>
                <LoadingState variant="block" />
              </CardContent>
            </Card>
          }
        >
          <RecentActivityWidget />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <CardTitle>Needs attention</CardTitle>
            </CardHeader>
            <CardContent>
              <LoadingState variant="table" rows={4} />
            </CardContent>
          </Card>
        }
      >
        <LowStockWidget />
      </Suspense>
    </div>
  );
}
