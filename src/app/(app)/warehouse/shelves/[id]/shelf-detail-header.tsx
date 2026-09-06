"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PencilIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteShelf, updateShelf } from "@/features/warehouse/actions";
import { CodeFormDialog } from "../../code-form-dialog";
import { LocationDeleteAction } from "../../location-delete-action";

type ShelfDetailHeaderProps = {
  shelfId: string;
  rackId: string;
  code: string;
  canManage: boolean;
};

/** Edit/delete for the shelf itself, shown on `/warehouse/shelves/[id]`. */
function ShelfDetailHeader({
  shelfId,
  rackId,
  code,
  canManage,
}: ShelfDetailHeaderProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = React.useState(false);

  if (!canManage) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" onClick={() => setEditOpen(true)}>
        <PencilIcon /> Edit
      </Button>
      <LocationDeleteAction
        entityLabel="Shelf"
        variant="button"
        warningDescription="This also removes every box on this shelf. It's blocked if anything on it is currently holding stock - move or reassign those parts first."
        onDelete={() => deleteShelf(shelfId, rackId)}
        onDeleted={() => router.push(`/warehouse/racks/${rackId}`)}
      />
      <CodeFormDialog
        entityLabel="Shelf"
        open={editOpen}
        onOpenChange={setEditOpen}
        defaultCode={code}
        onSubmit={(values) => updateShelf(shelfId, rackId, values)}
      />
    </div>
  );
}

export { ShelfDetailHeader };
