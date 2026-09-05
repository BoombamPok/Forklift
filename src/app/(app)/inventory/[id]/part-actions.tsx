"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PencilIcon, PlusCircleIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { softDeletePart } from "@/features/inventory/actions";
import type { ComboboxOption } from "@/components/shared/combobox";
import { StockMovementDialog } from "./stock-movement-dialog";
import type { MovementType } from "@/types/database";

type PartActionsProps = {
  partId: string;
  currentQuantity: number;
  currentBoxId: string | null;
  boxOptions: ComboboxOption[];
  canEdit: boolean;
  canDelete: boolean;
  canRecordMovement: boolean;
  isDeleted: boolean;
};

function isMovementType(value: string | null): value is MovementType {
  return (
    value === "in" ||
    value === "out" ||
    value === "transfer" ||
    value === "adjust" ||
    value === "damaged" ||
    value === "returned"
  );
}

/**
 * The part detail page's action row (Edit / Record movement / Delete) -
 * absent, not disabled, per each permission (§10's existing dashboard
 * precedent). Also handles the "open the opening Stock In dialog right
 * after creating a part" flow (§4) via the `?openMovement=` search
 * param the create form redirects with.
 */
function PartActions({
  partId,
  currentQuantity,
  currentBoxId,
  boxOptions,
  canEdit,
  canDelete,
  canRecordMovement,
  isDeleted,
}: PartActionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openMovementParam = searchParams.get("openMovement");

  const [movementOpen, setMovementOpen] = React.useState(
    isMovementType(openMovementParam),
  );
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await softDeletePart(partId);
    setDeleting(false);
    setDeleteOpen(false);

    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Part deleted");
    router.push("/inventory");
  }

  if (isDeleted) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canRecordMovement ? (
        <Button type="button" onClick={() => setMovementOpen(true)}>
          <PlusCircleIcon /> Record movement
        </Button>
      ) : null}
      {canEdit ? (
        <Button asChild variant="outline">
          <Link href={`/inventory/${partId}/edit`}>
            <PencilIcon /> Edit
          </Link>
        </Button>
      ) : null}
      {canDelete ? (
        <Button
          type="button"
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2Icon /> Delete
        </Button>
      ) : null}

      {canRecordMovement ? (
        <StockMovementDialog
          partId={partId}
          currentQuantity={currentQuantity}
          currentBoxId={currentBoxId}
          boxOptions={boxOptions}
          open={movementOpen}
          onOpenChange={setMovementOpen}
          initialType={isMovementType(openMovementParam) ? openMovementParam : "in"}
        />
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this part?"
        description="This removes it from the inventory list and search. It stays recoverable - an admin or manager can restore it - and its full movement history is kept."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export { PartActions };
