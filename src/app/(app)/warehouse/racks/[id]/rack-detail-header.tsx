"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PencilIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteRack, updateRack } from "@/features/warehouse/actions";
import { CodeFormDialog } from "../../code-form-dialog";
import { LocationDeleteAction } from "../../location-delete-action";

type RackDetailHeaderProps = {
  rackId: string;
  warehouseId: string;
  code: string;
  canManage: boolean;
};

/** Edit/delete for the rack itself, shown on `/warehouse/racks/[id]`. */
function RackDetailHeader({
  rackId,
  warehouseId,
  code,
  canManage,
}: RackDetailHeaderProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = React.useState(false);

  if (!canManage) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" onClick={() => setEditOpen(true)}>
        <PencilIcon /> Edit
      </Button>
      <LocationDeleteAction
        entityLabel="Rack"
        variant="button"
        warningDescription="This also removes every shelf and box on this rack. It's blocked if anything on it is currently holding stock - move or reassign those parts first."
        onDelete={() => deleteRack(rackId, warehouseId)}
        onDeleted={() => router.push(`/warehouse/${warehouseId}`)}
      />
      <CodeFormDialog
        entityLabel="Rack"
        open={editOpen}
        onOpenChange={setEditOpen}
        defaultCode={code}
        onSubmit={(values) => updateRack(rackId, warehouseId, values)}
      />
    </div>
  );
}

export { RackDetailHeader };
