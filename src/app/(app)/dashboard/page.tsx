import {
  AlertTriangleIcon,
  InfoIcon,
  PackageIcon,
  WalletIcon,
  XCircleIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/shared/kpi-card";
import { ChartContainer } from "@/components/shared/chart-container";
import { ActivityList } from "@/components/shared/activity-list";
import { EmptyState } from "@/components/shared/empty-state";

/**
 * Dashboard foundation only, per phase1.md #48: route, layout, and the
 * KPI/chart/activity primitives. Real numbers arrive once inventory and
 * stock movements exist (Phase 2/6) - showing "-" here instead of 0 keeps
 * "unknown" distinct from "verified zero" per CLAUDE.md's data-integrity
 * rule.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Alert>
        <InfoIcon />
        <AlertTitle>No data yet</AlertTitle>
        <AlertDescription>
          These numbers will populate once inventory and stock movements exist.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Inventory items" value="—" icon={PackageIcon} />
        <KpiCard label="Inventory value" value="—" icon={WalletIcon} />
        <KpiCard label="Low stock" value="—" icon={AlertTriangleIcon} />
        <KpiCard label="Out of stock" value="—" icon={XCircleIcon} />
      </div>

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
