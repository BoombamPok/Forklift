import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <HierarchyBreadcrumb
        items={[
          { label: "Warehouse", href: "/warehouse" },
          { label: detail.name },
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              {detail.name}
            </Typography>
            {detail.deletedAt ? (
              <StatusBadge label="Deleted" tone="destructive" />
            ) : null}
          </Box>
          {detail.address ? (
            <Typography variant="body2" color="text.secondary">
              {detail.address}
            </Typography>
          ) : null}
        </Box>

        {!detail.deletedAt ? (
          <WarehouseDetailHeader
            warehouseId={detail.id}
            name={detail.name}
            address={detail.address}
            canManage={canManage}
          />
        ) : null}
      </Box>

      <RackList
        warehouseId={detail.id}
        racks={detail.racks}
        canManage={canManage}
      />
    </Box>
  );
}
