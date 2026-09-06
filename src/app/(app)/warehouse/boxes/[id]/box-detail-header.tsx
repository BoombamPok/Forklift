"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PencilIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteBox, updateBox } from "@/features/warehouse/actions";
import { CodeFormDialog } from "../../code-form-dialog";
import { LocationDeleteAction } from "../../location-delete-action";

type BoxDetailHeaderProps = {
  boxId: string;
  shelfId: string;
  code: string;
  canManage: boolean;
};

/** Edit/delete for the box itself, shown on `/warehouse/boxes/[id]`. */
function BoxDetailHeader({
  boxId,
  shelfId,
  code,
  canManage,
}: BoxDetailHeaderProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = React.useState(false);

  if (!canManage) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" onClick={() => setEditOpen(true)}>
        <PencilIcon /> Edit
      </Button>
      <LocationDeleteAction
        entityLabel="Box"
        variant="button"
        warningDescription="It's blocked if this box currently holds any stock - move or reassign those parts first."
        onDelete={() => deleteBox(boxId, shelfId)}
        onDeleted={() => router.push(`/warehouse/shelves/${shelfId}`)}
      />
      <CodeFormDialog
        entityLabel="Box"
        open={editOpen}
        onOpenChange={setEditOpen}
        defaultCode={code}
        onSubmit={(values) => updateBox(boxId, shelfId, values)}
      />
    </div>
  );
}

export { BoxDetailHeader };
