"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";

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
        onClose={() => {
          resetFields();
          onOpenChange(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Record a stock movement</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <DialogContentText>
            Currently {currentQuantity} in stock.
          </DialogContentText>

          <Box>
            <InputLabel id="movement-type-label">Movement type</InputLabel>
            <Select
              labelId="movement-type-label"
              fullWidth
              value={movementType}
              onChange={(event) => {
                setMovementType(event.target.value as MovementType);
                setFieldErrors({});
              }}
            >
              {(Object.keys(MOVEMENT_LABEL) as MovementType[]).map((type) => (
                <MenuItem key={type} value={type}>
                  {MOVEMENT_LABEL[type]}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {movementType === "adjust" ? (
            <TextField
              type="number"
              label="Quantity change (signed, e.g. -3 or 5)"
              value={quantityChange}
              onChange={(e) => setQuantityChange(e.target.value)}
              error={!!fieldErrors.quantityChange}
              helperText={fieldErrors.quantityChange}
            />
          ) : movementType === "transfer" ? (
            <Box>
              <Combobox
                label="Destination box"
                options={boxOptions.filter((b) => b.value !== currentBoxId)}
                value={toBoxId}
                onChange={setToBoxId}
                placeholder="Choose a box"
                error={!!fieldErrors.toBoxId}
                helperText={fieldErrors.toBoxId}
              />
            </Box>
          ) : (
            <TextField
              type="number"
              label="Quantity"
              slotProps={{ htmlInput: { min: 1 } }}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              error={!!fieldErrors.quantity}
              helperText={fieldErrors.quantity}
            />
          )}

          {movementType === "in" ? (
            <Combobox
              label="Box (optional - defaults to current location)"
              options={boxOptions}
              value={boxId}
              onChange={setBoxId}
              placeholder="Use current box"
            />
          ) : null}

          <TextField
            label={`Reason${movementType === "adjust" ? "" : " (optional)"}`}
            multiline
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={!!fieldErrors.reason}
            helperText={fieldErrors.reason}
          />
        </DialogContent>
        <DialogActions>
          <Button type="button" variant="contained" onClick={handleReviewClick}>
            Review
          </Button>
        </DialogActions>
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
