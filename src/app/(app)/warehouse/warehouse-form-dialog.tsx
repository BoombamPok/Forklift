"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

import { createWarehouse, updateWarehouse } from "@/features/warehouse/actions";
import {
  warehouseFormSchema,
  type WarehouseFormValues,
} from "@/features/warehouse/schema";

type WarehouseFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId?: string;
  defaultValues?: WarehouseFormValues;
};

/**
 * Create/edit for a warehouse (phase4.md §4) - two fields, so a dialog
 * rather than a dedicated page (same reasoning as `CodeFormDialog`).
 *
 * `useForm`'s `defaultValues` only apply at mount, so a caller reusing one
 * instance for "edit warehouse A" then "edit warehouse B" must pass
 * `key={warehouseId}` - see `CodeFormDialog`'s equivalent note for why this
 * doesn't reset via an effect instead.
 */
function WarehouseFormDialog({
  open,
  onOpenChange,
  warehouseId,
  defaultValues,
}: WarehouseFormDialogProps) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const mode = warehouseId ? "edit" : "create";

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: { name: "", address: "", ...defaultValues },
  });

  async function handleSubmit(values: WarehouseFormValues) {
    setFormError(null);

    if (mode === "create") {
      const result = await createWarehouse(values);
      if (!result.success) {
        setFormError(result.error.message);
        return;
      }
      toast.success("Warehouse added");
      onOpenChange(false);
      router.push(`/warehouse/${result.data.id}`);
      return;
    }

    const result = await updateWarehouse(warehouseId!, values);
    if (!result.success) {
      setFormError(result.error.message);
      return;
    }
    toast.success("Warehouse updated");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="xs"
      fullWidth
    >
      <Box component="form" onSubmit={form.handleSubmit(handleSubmit)}>
        <DialogTitle>
          {mode === "create" ? "Add warehouse" : "Edit warehouse"}
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <DialogContentText>
            {mode === "create"
              ? "You can add racks, shelves, and boxes once it's created."
              : "Update this warehouse's name or address."}
          </DialogContentText>

          {formError ? <Alert severity="error">{formError}</Alert> : null}

          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Name"
                autoFocus
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={form.control}
            name="address"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                value={field.value ?? ""}
                label="Address (optional)"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? "Saving…"
              : mode === "create"
                ? "Add"
                : "Save"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export { WarehouseFormDialog };
