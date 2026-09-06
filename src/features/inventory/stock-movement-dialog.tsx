"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox, type ComboboxOption } from "@/components/shared/combobox";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { recordStockMovement } from "@/features/inventory/actions";
import {
  stockMovementSchema,
  validateMovementQuantity,
} from "@/features/inventory/schema";
import type { MovementType } from "@/types/database";

const MOVEMENT_LABEL: Record<MovementType, string> = {
  in: "Stock In",
  out: "Stock Out",
  transfer: "Transfer",
  adjust: "Adjust",
  damaged: "Damaged",
  returned: "Returned",
};

type StockMovementDialogProps = {
  partId: string;
  currentQuantity: number;
  currentBoxId: string | null;
  boxOptions: ComboboxOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialType?: MovementType;
};

/**
 * One dialog for all six movement types (phase3.md, per the movement
 * semantics resolved during planning), rather than six separate ones -
 * each type only shows the fields it needs. A ConfirmDialog gates the
 * actual write (CLAUDE.md's confirmation rule for consequential
 * actions - stock adjust/transfer explicitly named), stating that
 * movement history is permanent and can't be undone.
 */
function StockMovementDialog({
  partId,
  currentQuantity,
  currentBoxId,
  boxOptions,
  open,
  onOpenChange,
  initialType = "in",
}: StockMovementDialogProps) {
  const router = useRouter();
  const [movementType, setMovementType] =
    React.useState<MovementType>(initialType);
  const [quantity, setQuantity] = React.useState("");
  const [quantityChange, setQuantityChange] = React.useState("");
  const [boxId, setBoxId] = React.useState<string | undefined>(undefined);
  const [toBoxId, setToBoxId] = React.useState<string | undefined>(undefined);
  const [reason, setReason] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {},
  );
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  /**
   * Resets back to `initialType` on close (not via an effect watching
   * `open` - setState directly in an effect body causes a cascading
   * render the react-hooks rule flags). The dialog's very first open is
   * already correct from `useState(initialType)`'s own initializer, so
   * this only needs to cover *re*-opening after a previous edit.
   */
  function resetFields() {
    setMovementType(initialType);
    setQuantity("");
    setQuantityChange("");
    setBoxId(undefined);
    setToBoxId(undefined);
    setReason("");
    setFieldErrors({});
  }

  function buildInput() {
    switch (movementType) {
      case "in":
        return { movementType, quantity, boxId, reason: reason || undefined };
      case "out":
        return { movementType, quantity, reason: reason || undefined };
      case "transfer":
        return { movementType, toBoxId, reason: reason || undefined };
      case "adjust":
        return { movementType, quantityChange, reason };
      case "damaged":
        return { movementType, quantity, reason: reason || undefined };
      case "returned":
        return { movementType, quantity, reason: reason || undefined };
    }
  }

  function summarize(): string {
    switch (movementType) {
      case "in":
        return `Receive ${quantity || "…"} units into stock.`;
      case "out":
        return `Ship ${quantity || "…"} units out of stock.`;
      case "transfer": {
        const label = boxOptions.find((b) => b.value === toBoxId)?.label;
        return `Move all ${currentQuantity} units to ${label ?? "the selected box"}.`;
      }
      case "adjust":
        return `Adjust quantity by ${quantityChange || "…"} (from ${currentQuantity}).`;
      case "damaged":
        return `Mark ${quantity || "…"} units as damaged (removed from stock).`;
      case "returned":
        return `Record ${quantity || "…"} returned units back into stock.`;
    }
  }

  function handleReviewClick() {
    const parsed = stockMovementSchema.safeParse(buildInput());
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const next: Record<string, string> = {};
      for (const [key, messages] of Object.entries(flat)) {
        if (messages?.[0]) next[key] = messages[0];
      }
      setFieldErrors(next);
      return;
    }

    const quantityError = validateMovementQuantity(
      parsed.data,
      currentQuantity,
    );
    if (quantityError) {
      setFieldErrors({
        quantity: quantityError,
        quantityChange: quantityError,
      });
      return;
    }

    setFieldErrors({});
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    setSubmitting(true);
    const result = await recordStockMovement(
      partId,
      stockMovementSchema.parse(buildInput()),
    );
    setSubmitting(false);
    setConfirmOpen(false);

    if (!result.success) {
      toast.error(result.error.message);
      return;
    }

    toast.success(`${MOVEMENT_LABEL[movementType]} recorded`);
    resetFields();
    onOpenChange(false);
    router.refresh();
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) resetFields();
          onOpenChange(next);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record a stock movement</DialogTitle>
            <DialogDescription>
              Currently {currentQuantity} in stock.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Movement type</Label>
              <Select
                value={movementType}
                onValueChange={(v) => {
                  setMovementType(v as MovementType);
                  setFieldErrors({});
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(MOVEMENT_LABEL) as MovementType[]).map(
                    (type) => (
                      <SelectItem key={type} value={type}>
                        {MOVEMENT_LABEL[type]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            {movementType === "adjust" ? (
              <div className="space-y-1.5">
                <Label>Quantity change (signed, e.g. -3 or 5)</Label>
                <Input
                  type="number"
                  value={quantityChange}
                  onChange={(e) => setQuantityChange(e.target.value)}
                />
                {fieldErrors.quantityChange ? (
                  <p className="text-sm font-medium text-destructive">
                    {fieldErrors.quantityChange}
                  </p>
                ) : null}
              </div>
            ) : movementType === "transfer" ? (
              <div className="space-y-1.5">
                <Label>Destination box</Label>
                <Combobox
                  options={boxOptions.filter((b) => b.value !== currentBoxId)}
                  value={toBoxId}
                  onChange={setToBoxId}
                  placeholder="Choose a box"
                />
                {fieldErrors.toBoxId ? (
                  <p className="text-sm font-medium text-destructive">
                    {fieldErrors.toBoxId}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                {fieldErrors.quantity ? (
                  <p className="text-sm font-medium text-destructive">
                    {fieldErrors.quantity}
                  </p>
                ) : null}
              </div>
            )}

            {movementType === "in" ? (
              <div className="space-y-1.5">
                <Label>Box (optional - defaults to current location)</Label>
                <Combobox
                  options={boxOptions}
                  value={boxId}
                  onChange={setBoxId}
                  placeholder="Use current box"
                />
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label>
                Reason{movementType === "adjust" ? "" : " (optional)"}
              </Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
              />
              {fieldErrors.reason ? (
                <p className="text-sm font-medium text-destructive">
                  {fieldErrors.reason}
                </p>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" onClick={handleReviewClick}>
              Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Confirm ${MOVEMENT_LABEL[movementType]}`}
        description={`${summarize()} This creates a permanent entry in the part's movement history and can't be edited or removed afterward.`}
        confirmLabel="Record movement"
        variant="default"
        loading={submitting}
        onConfirm={handleConfirm}
      />
    </>
  );
}

export { StockMovementDialog };
