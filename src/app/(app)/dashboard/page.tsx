import { Suspense } from "react";
import Box from "@mui/material/Box";

import { LoadingState } from "@/components/shared/loading-state";
import { ChartContainer } from "@/components/shared/chart-container";
import { SectionLabel } from "@/components/shared/section-label";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canViewInventoryValue } from "@/lib/permissions";
import { DashboardGreeting } from "./dashboard-greeting";
import { DashboardKpis } from "./dashboard-kpis";
import { StockMovementWidget } from "./stock-movement-widget";
import { QuickActions } from "./quick-actions";
import { RecentActivityWidget } from "./recent-activity-widget";
import { InventoryByBrandWidget } from "./inventory-by-brand-widget";
import { TopModelsWidget } from "./top-models-widget";
import { LowStockWidget } from "./low-stock-widget";

/**
 * The 3D hero that used to sit at the top of this page is gone.
 *
 * It cost the first 256px of the most valuable screen in the app - the
 * one a storekeeper opens to find out what is wrong this morning - and
 * pushed the actual readings below the fold on a laptop. It also pulled a
 * ~400KB three.js chunk onto the highest-traffic route to render
 * decoration. Decorative 3D is defensible on the login screen, where
 * there is nothing else competing for the space; on an operations
 * dashboard it is the thing that makes an otherwise serious tool look
 * like a template.
 *
 * The page is now banded: read the numbers, read the trend, act. Each
 * widget keeps its own Suspense boundary so one slow or failing query
 * never blocks another.
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();
  const showValue = user ? canViewInventoryValue(user.role) : false;
  const role = user?.role ?? "read_only";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {user ? <DashboardGreeting name={user.name} /> : null}

      <Suspense
        fallback={
          <LoadingState
            variant="cluster"
            columns={showValue ? 4 : 3}
            rows={showValue ? 4 : 3}
          />
        }
      >
        <DashboardKpis showValue={showValue} />
      </Suspense>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <SectionLabel>Movement</SectionLabel>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 2fr) minmax(0, 1fr)" },
          }}
        >
          <Suspense
            fallback={
              <ChartContainer title="Stock movement" description="Last 30 days">
                <LoadingState variant="chart" />
              </ChartContainer>
            }
          >
            <StockMovementWidget />
          </Suspense>

          <QuickActions role={role} />
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <SectionLabel>Composition &amp; activity</SectionLabel>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", xl: "repeat(3, 1fr)" },
          }}
        >
          <Suspense fallback={<LoadingState variant="list" />}>
            <RecentActivityWidget />
          </Suspense>

          <Suspense
            fallback={
              <ChartContainer
                title="Inventory by brand"
                description="Live stock mix"
              >
                <LoadingState variant="chart" />
              </ChartContainer>
            }
          >
            <InventoryByBrandWidget />
          </Suspense>

          <Suspense fallback={<LoadingState variant="list" />}>
            <TopModelsWidget />
          </Suspense>
        </Box>
      </Box>

      {/* This one owns its own section label - see low-stock-widget.tsx. */}
      <Suspense
        fallback={
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <SectionLabel>Needs attention</SectionLabel>
            <LoadingState variant="table" rows={5} />
          </Box>
        }
      >
        <LowStockWidget />
      </Suspense>
    </Box>
  );
}
