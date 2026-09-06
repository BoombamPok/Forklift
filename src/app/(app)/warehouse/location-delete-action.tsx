"use client";

import * as React from "react";
import Link from "next/link";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { IconButton } from "@/components/shared/icon-button";
import type { ActionResult } from "@/lib/errors";
import type { DeleteOutcome } from "@/features/warehouse/actions";

type LocationDeleteActionProps = {
  entityLabel: string;
  warningDescription: string;
  onDelete: () => Promise<ActionResult<DeleteOutcome>>;
  onDeleted: () => void;
  variant?: "icon" | "button";
};

/**
 * The one delete trigger for warehouses/racks/shelves/boxes (phase4.md §5):
 * calls the cascade soft-delete RPC and tells the two possible outcomes
 * apart. If any inventory_parts are still assigned anywhere in the
 * subtree, nothing was deleted - this shows exactly which parts are
 * blocking removal, each linking to its Phase 3 detail page, rather than
 * a generic "can't delete" error.
 */
function LocationDeleteAction({
  entityLabel,
  warningDescription,
  onDelete,
  onDeleted,
  variant = "icon",
}: LocationDeleteActionProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [blockedOpen, setBlockedOpen] = React.useState(false);
  const [blockedBy, setBlockedBy] = React.useState<DeleteOutcome["blockedBy"]>(
    [],
  );
  const [loading, setLoading] = React.useState(false);

  async function handleConfirm() {
    setLoading(true);
    const result = await onDelete();
    setLoading(false);
    setConfirmOpen(false);

    if (!result.success) {
      toast.error(result.error.message);
      return;
    }

    if (!result.data.deleted) {
      setBlockedBy(result.data.blockedBy);
      setBlockedOpen(true);
      return;
    }

    toast.success(`${entityLabel} deleted`);
    onDeleted();
  }

  return (
    <>
      {variant === "icon" ? (
        <IconButton
          label={`Delete ${entityLabel.toLowerCase()}`}
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2Icon />
        </IconButton>
      ) : (
        <Button
          type="button"
          variant="destructive"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2Icon /> Delete
        </Button>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete this ${entityLabel.toLowerCase()}?`}
        description={warningDescription}
        confirmLabel="Delete"
        loading={loading}
        onConfirm={handleConfirm}
      />

      <Dialog open={blockedOpen} onOpenChange={setBlockedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Can&apos;t delete this {entityLabel.toLowerCase()} yet
            </DialogTitle>
            <DialogDescription>
              {blockedBy.length} part{blockedBy.length === 1 ? "" : "s"} still
              stored here or beneath it. Move or reassign{" "}
              {blockedBy.length === 1 ? "it" : "them"} first, then try again.
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
            {blockedBy.map((part) => (
              <li key={part.id}>
                <Link
                  href={`/inventory/${part.id}`}
                  className="text-foreground hover:underline"
                >
                  {part.name}{" "}
                  <span className="font-mono text-muted-foreground">
                    ({part.partNumber})
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button type="button" onClick={() => setBlockedOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { LocationDeleteAction };
