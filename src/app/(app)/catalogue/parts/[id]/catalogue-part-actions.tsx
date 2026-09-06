"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PencilIcon, Trash2Icon, TrendingUpIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { softDeleteCataloguePart } from "@/features/catalogue/actions";

type CataloguePartActionsProps = {
  partId: string;
  partNumber: string;
  name: string;
  canManage: boolean;
  canPromote: boolean;
  isDeleted: boolean;
};

/**
 * "Promote to inventory" (phase5.md §4 goal #5) is a plain link into
 * Phase 3's actual create form (`/inventory/new`) with the catalogue
 * link and known fields pre-filled via query params - not a second,
 * simplified create flow. It's gated on `inventory.create`, not
 * `catalogue.manage` (phase5.md §10): staff can promote even though
 * they can't edit the catalogue itself.
 */
function CataloguePartActions({
  partId,
  partNumber,
  name,
  canManage,
  canPromote,
  isDeleted,
}: CataloguePartActionsProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  async function handleConfirmDelete() {
    setDeleteLoading(true);
    const result = await softDeleteCataloguePart(partId);
    setDeleteLoading(false);
    setDeleteOpen(false);

    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Catalogue part deleted");
    router.refresh();
  }

  const promoteHref = `/inventory/new?catalogueId=${partId}&partNumber=${encodeURIComponent(
    partNumber,
  )}&name=${encodeURIComponent(name)}`;

  return (
    <div className="flex flex-wrap gap-2">
      {canPromote ? (
        <Button asChild variant="outline">
          <Link href={promoteHref}>
            <TrendingUpIcon /> Promote to inventory
          </Link>
        </Button>
      ) : null}

      {canManage ? (
        <>
          <Button asChild variant="outline">
            <Link href={`/catalogue/parts/${partId}/edit`}>
              <PencilIcon /> Edit
            </Link>
          </Button>
          {!isDeleted ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2Icon /> Delete
            </Button>
          ) : null}
        </>
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this catalogue part?"
        description="This soft-deletes the catalogue record. Any inventory item still linked to it keeps its own data - this only removes the part from future catalogue browsing and selection."
        confirmLabel="Delete"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export { CataloguePartActions };
