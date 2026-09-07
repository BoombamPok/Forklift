import { Suspense } from "react";
import Box from "@mui/material/Box";

import { LoadingState } from "@/components/shared/loading-state";
import { ChartContainer } from "@/components/shared/chart-container";
import { SceneLoader } from "@/components/three/scene-loader";
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
 * KPI row, stock movement chart + recent activity, and the low-stock
 * table all wired to live data, each in its own Suspense boundary so one
 * widget's failure or loading time never blocks another.
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();
  const showValue = user ? canViewInventoryValue(user.role) : false;
  const role = user?.role ?? "read_only";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {user ? (
        <Box
          sx={{
            position: "relative",
            display: "flex",
            minHeight: { xs: 224, sm: 256 },
            flexDirection: "column",
            justifyContent: "flex-end",
            overflow: "hidden",
            borderRadius: 4,
            px: { xs: 3, sm: 4 },
            py: 3,
            boxShadow: 3,
          }}
        >
          <SceneLoader
            variant="dashboard"
            posterTone="dual"
            sx={{ position: "absolute", inset: 0, zIndex: 0 }}
          />
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(to top, var(--mui-palette-background-paper) 0%, var(--mui-palette-background-paper) 50%, transparent 100%)",
            }}
          />
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <DashboardGreeting name={user.name} />
          </Box>
        </Box>
      ) : null}

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

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", lg: "repeat(3, 1fr)" },
        }}
      >
        <Box sx={{ gridColumn: { lg: "span 2" } }}>
          <Suspense
            fallback={
              <ChartContainer title="Stock movement" description="Last 30 days">
                <LoadingState variant="block" sx={{ height: "100%" }} />
              </ChartContainer>
            }
          >
            <StockMovementWidget />
          </Suspense>
        </Box>

        <QuickActions role={role} />
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", lg: "repeat(3, 1fr)" },
        }}
      >
        <Suspense fallback={<LoadingState variant="block" />}>
          <RecentActivityWidget />
        </Suspense>

        <Suspense
          fallback={
            <ChartContainer
              title="Inventory by brand"
              description="Live stock mix"
            >
              <LoadingState variant="block" sx={{ height: "100%" }} />
            </ChartContainer>
          }
        >
          <InventoryByBrandWidget />
        </Suspense>

        <Suspense fallback={<LoadingState variant="block" />}>
          <TopModelsWidget />
        </Suspense>
      </Box>

      <Suspense fallback={<LoadingState variant="table" rows={4} />}>
        <LowStockWidget />
      </Suspense>
    </Box>
  );
}
