"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PencilIcon } from "lucide-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

import { deleteWarehouse } from "@/features/warehouse/actions";
import { WarehouseFormDialog } from "../warehouse-form-dialog";
import { LocationDeleteAction } from "../location-delete-action";

type WarehouseDetailHeaderProps = {
  warehouseId: string;
  name: string;
  address: string | null;
  canManage: boolean;
};

/** Edit/delete for the warehouse itself, shown on `/warehouse/[id]`. */
function WarehouseDetailHeader({
  warehouseId,
  name,
  address,
  canManage,
}: WarehouseDetailHeaderProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = React.useState(false);

  if (!canManage) return null;

  return (
    <Box
      sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}
    >
      <Button
        type="button"
        variant="outlined"
        startIcon={<PencilIcon size={16} />}
        onClick={() => setEditOpen(true)}
      >
        Edit
      </Button>
      <LocationDeleteAction
        entityLabel="Warehouse"
        variant="button"
        warningDescription="This also removes every rack, shelf, and box inside it. It's blocked if anything inside is currently holding stock - move or reassign those parts first."
        onDelete={() => deleteWarehouse(warehouseId)}
        onDeleted={() => router.push("/warehouse")}
      />
      <WarehouseFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        warehouseId={warehouseId}
        defaultValues={{ name, address: address ?? undefined }}
      />
    </Box>
  );
}

export { WarehouseDetailHeader };
