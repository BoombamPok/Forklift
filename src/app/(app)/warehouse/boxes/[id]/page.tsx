import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { requireRole } from "@/lib/auth/require-role";
import { can } from "@/lib/permissions";
import { toErrorKind } from "@/lib/errors";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { HierarchyBreadcrumb } from "@/components/shared/hierarchy-breadcrumb";
import { getBoxDetail } from "@/features/warehouse/queries";
import { getBoxOptions } from "@/features/inventory/queries";
import { BoxDetailHeader } from "./box-detail-header";
import { BoxPartsTable } from "./box-parts-table";

export default async function WarehouseBoxDetailPage(
  props: PageProps<"/warehouse/boxes/[id]">,
) {
  const user = await requireRole("warehouse.view");
  const { id } = await props.params;

  let detail;
  try {
    detail = await getBoxDetail(id);
  } catch (error) {
    return <ErrorState kind={toErrorKind(error)} />;
  }

  const canManage = can(user.role, "warehouse.manage");
  const canTransfer = can(user.role, "inventory.transfer");
  const boxOptions = canTransfer ? await getBoxOptions() : [];

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
          {
            label: `Shelf ${detail.shelf.code}`,
            href: `/warehouse/shelves/${detail.shelf.id}`,
          },
          { label: `Box ${detail.code}` },
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
            Box {detail.code}
          </Typography>
          {detail.deletedAt ? (
            <StatusBadge label="Deleted" tone="destructive" />
          ) : null}
        </Box>

        {!detail.deletedAt ? (
          <BoxDetailHeader
            boxId={detail.id}
            shelfId={detail.shelf.id}
            code={detail.code}
            canManage={canManage}
          />
        ) : null}
      </Box>

      <BoxPartsTable
        boxId={detail.id}
        parts={detail.parts}
        boxOptions={boxOptions}
        canTransfer={canTransfer}
      />
    </Box>
  );
}
