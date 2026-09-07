import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            Shelf {detail.code}
          </Typography>
          {detail.deletedAt ? (
            <StatusBadge label="Deleted" tone="destructive" />
          ) : null}
        </Box>

        {!detail.deletedAt ? (
          <ShelfDetailHeader
            shelfId={detail.id}
            rackId={detail.rack.id}
            code={detail.code}
            canManage={canManage}
          />
        ) : null}
      </Box>

      <BoxList shelfId={detail.id} boxes={detail.boxes} canManage={canManage} />
    </Box>
  );
}
