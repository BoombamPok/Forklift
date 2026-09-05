import { Suspense } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/shared/chart-container";
import { ActivityList } from "@/components/shared/activity-list";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canViewInventoryValue } from "@/lib/permissions";
import { DashboardKpis } from "./dashboard-kpis";

/**
 * KPI row wired to live inventory data per phase2b.md; the chart and
 * activity feed below remain the Phase 1 static placeholders until 2c.
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
        <ChartContainer title="Stock movement" description="Last 30 days">
          <EmptyState
            className="h-full"
            title="No movement yet"
            description="Stock movement will chart here once operations begin."
          />
        </ChartContainer>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityList items={[]} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
