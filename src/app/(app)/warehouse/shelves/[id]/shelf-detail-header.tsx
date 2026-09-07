"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PencilIcon } from "lucide-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

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
    </Box>
  );
}

export { ShelfDetailHeader };
