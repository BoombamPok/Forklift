import { requireRole } from "@/lib/auth/require-role";
import { can } from "@/lib/permissions";
import { toErrorKind } from "@/lib/errors";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { HierarchyBreadcrumb } from "@/components/shared/hierarchy-breadcrumb";
import { getWarehouseDetail } from "@/features/warehouse/queries";
import { WarehouseDetailHeader } from "./warehouse-detail-header";
import { RackList } from "./rack-list";

export default async function WarehouseDetailPage(
  props: PageProps<"/warehouse/[id]">,
) {
  const user = await requireRole("warehouse.view");
  const { id } = await props.params;

  let detail;
  try {
    detail = await getWarehouseDetail(id);
  } catch (error) {
    return <ErrorState kind={toErrorKind(error)} />;
  }

  const canManage = can(user.role, "warehouse.manage");

  return (
    <div className="space-y-6">
      <HierarchyBreadcrumb
        items={[
          { label: "Warehouse", href: "/warehouse" },
          { label: detail.name },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              {detail.name}
            </h2>
            {detail.deletedAt ? (
              <StatusBadge label="Deleted" tone="destructive" />
            ) : null}
          </div>
          {detail.address ? (
            <p className="text-sm text-muted-foreground">{detail.address}</p>
          ) : null}
        </div>

        {!detail.deletedAt ? (
          <WarehouseDetailHeader
            warehouseId={detail.id}
            name={detail.name}
            address={detail.address}
            canManage={canManage}
          />
        ) : null}
      </div>

      <RackList
        warehouseId={detail.id}
        racks={detail.racks}
        canManage={canManage}
      />
    </div>
  );
}
