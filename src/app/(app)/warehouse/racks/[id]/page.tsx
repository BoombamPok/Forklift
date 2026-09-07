import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { requireRole } from "@/lib/auth/require-role";
import { can } from "@/lib/permissions";
import { toErrorKind } from "@/lib/errors";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { HierarchyBreadcrumb } from "@/components/shared/hierarchy-breadcrumb";
import { getRackDetail } from "@/features/warehouse/queries";
import { RackDetailHeader } from "./rack-detail-header";
import { ShelfList } from "./shelf-list";

export default async function WarehouseRackDetailPage(
  props: PageProps<"/warehouse/racks/[id]">,
) {
  const user = await requireRole("warehouse.view");
  const { id } = await props.params;

  let detail;
  try {
    detail = await getRackDetail(id);
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
          { label: `Rack ${detail.code}` },
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
            Rack {detail.code}
          </Typography>
          {detail.deletedAt ? (
            <StatusBadge label="Deleted" tone="destructive" />
          ) : null}
        </Box>

        {!detail.deletedAt ? (
          <RackDetailHeader
            rackId={detail.id}
            warehouseId={detail.warehouse.id}
            code={detail.code}
            canManage={canManage}
          />
        ) : null}
      </Box>

      <ShelfList
        rackId={detail.id}
        shelves={detail.shelves}
        canManage={canManage}
      />
    </Box>
  );
}
