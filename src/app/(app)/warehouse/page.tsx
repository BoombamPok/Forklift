import Box from "@mui/material/Box";

import { requireRole } from "@/lib/auth/require-role";
import { can } from "@/lib/permissions";
import { toErrorKind } from "@/lib/errors";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { getWarehouseList } from "@/features/warehouse/queries";
import { WarehouseTable } from "./warehouse-table";

export default async function WarehousePage() {
  const user = await requireRole("warehouse.view");

  let rows;
  try {
    rows = await getWarehouseList();
  } catch (error) {
    return <ErrorState kind={toErrorKind(error)} />;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <PageHeader
        title="Warehouses"
        description="Browse the physical storage hierarchy and see what's stored where."
      />

      <WarehouseTable
        rows={rows}
        canManage={can(user.role, "warehouse.manage")}
      />
    </Box>
  );
}
