import { requireRole } from "@/lib/auth/require-role";
import { can } from "@/lib/permissions";
import { toErrorKind } from "@/lib/errors";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { HierarchyBreadcrumb } from "@/components/shared/hierarchy-breadcrumb";
import { getShelfDetail } from "@/features/warehouse/queries";
import { ShelfDetailHeader } from "./shelf-detail-header";
import { BoxList } from "./box-list";

export default async function WarehouseShelfDetailPage(
  props: PageProps<"/warehouse/shelves/[id]">,
) {
  const user = await requireRole("warehouse.view");
  const { id } = await props.params;

  let detail;
  try {
    detail = await getShelfDetail(id);
  } catch (error) {
    return <ErrorState kind={toErrorKind(error)} />;
  }

  const canManage = can(user.role, "warehouse.manage");

  return (
    <div className="space-y-6">
      <HierarchyBreadcrumb
        items={[
          { label: "Warehouse", href: "/warehouse" },
          {
            label: detail.warehouse.name,
            href: `/warehouse/${detail.warehouse.id}`,
          },
          {
            label: `Rack ${detail.rack.code}`,
            href: `/warehouse/racks/${detail.rack.id}`,
          },
          { label: `Shelf ${detail.code}` },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Shelf {detail.code}
          </h2>
          {detail.deletedAt ? (
            <StatusBadge label="Deleted" tone="destructive" />
          ) : null}
        </div>

        {!detail.deletedAt ? (
          <ShelfDetailHeader
            shelfId={detail.id}
            rackId={detail.rack.id}
            code={detail.code}
            canManage={canManage}
          />
        ) : null}
      </div>

      <BoxList shelfId={detail.id} boxes={detail.boxes} canManage={canManage} />
    </div>
  );
}
