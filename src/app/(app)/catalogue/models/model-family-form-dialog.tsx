"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

import { Combobox, type ComboboxOption } from "@/components/shared/combobox";
import {
  createModelFamily,
  updateModelFamily,
} from "@/features/catalogue/actions";
import {
  modelFamilyFormSchema,
  type ModelFamilyFormValues,
} from "@/features/catalogue/schema";

type ModelFamilyFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandOptions: ComboboxOption[];
  familyId?: string;
  defaultValues?: ModelFamilyFormValues;
};

/**
 * Model family create/edit (phase5.md §4) - two fields (name + brand),
 * same dialog-not-page threshold as `WarehouseFormDialog`.
 */
function ModelFamilyFormDialog({
  open,
  onOpenChange,
  brandOptions,
  familyId,
  defaultValues,
}: ModelFamilyFormDialogProps) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const mode = familyId ? "edit" : "create";

  const form = useForm<ModelFamilyFormValues>({
    resolver: zodResolver(
      modelFamilyFormSchema,
    ) as Resolver<ModelFamilyFormValues>,
    defaultValues: defaultValues ?? { name: "", brandId: "" },
  });

  async function handleSubmit(values: ModelFamilyFormValues) {
    setFormError(null);
    const result =
      mode === "create"
        ? await createModelFamily(values)
        : await updateModelFamily(familyId!, values);

    if (!result.success) {
      setFormError(result.error.message);
      return;
    }
    toast.success(
      mode === "create" ? "Model family added" : "Model family updated",
    );
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
          {mode === "create" ? "Add model family" : "Edit model family"}
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
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
            name="brandId"
            render={({ field, fieldState }) => (
              <Combobox
                label="Brand"
                options={brandOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Choose a brand"
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

export { ModelFamilyFormDialog };
