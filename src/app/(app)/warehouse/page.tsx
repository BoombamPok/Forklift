import { requireRole } from "@/lib/auth/require-role";
import { can } from "@/lib/permissions";
import { toErrorKind } from "@/lib/errors";
import { ErrorState } from "@/components/shared/error-state";
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
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Warehouses
        </h2>
        <p className="text-sm text-muted-foreground">
          Browse the physical storage hierarchy and see what&apos;s stored
          where.
        </p>
      </div>

      <WarehouseTable
        rows={rows}
        canManage={can(user.role, "warehouse.manage")}
      />
    </div>
  );
}
