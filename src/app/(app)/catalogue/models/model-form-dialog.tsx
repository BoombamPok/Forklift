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
import { createModel, updateModel } from "@/features/catalogue/actions";
import {
  modelFormSchema,
  type ModelFormValues,
} from "@/features/catalogue/schema";

type ModelFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandOptions: ComboboxOption[];
  modelFamilyOptionsByBrand: Record<string, ComboboxOption[]>;
  modelId?: string;
  defaultValues?: ModelFormValues;
};

/**
 * Model create/edit (phase5.md §4) - name/model_code/fuel_type/brand/
 * model_family. Still a dialog, not a page: it's text inputs plus two
 * Combobox pickers, well short of `PartForm`'s ~9-field/two-Combobox
 * threshold. `modelFamilyOptionsByBrand` is precomputed server-side
 * (one flat fetch per brand, catalogue-sized) so switching the brand
 * Combobox client-side doesn't need its own fetch - `fuelType` is a
 * plain free-text field, not a fixed dropdown, since the schema has no
 * enum for it and inventing a fixed list would constrain future real
 * values to ones this app guessed (CLAUDE.md §13).
 */
function ModelFormDialog({
  open,
  onOpenChange,
  brandOptions,
  modelFamilyOptionsByBrand,
  modelId,
  defaultValues,
}: ModelFormDialogProps) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const mode = modelId ? "edit" : "create";

  const form = useForm<ModelFormValues>({
    resolver: zodResolver(modelFormSchema) as Resolver<ModelFormValues>,
    defaultValues: defaultValues ?? { name: "", brandId: "" },
  });

  // Tracked in local state rather than `form.watch()` - React Compiler
  // can't safely memoize around RHF's `watch()`, and this is the one
  // place the dialog needs to react to the brand selection outside its
  // own Controller render prop (to pick the right family options).
  const [selectedBrandId, setSelectedBrandId] = React.useState(
    defaultValues?.brandId ?? "",
  );
  const familyOptions = modelFamilyOptionsByBrand[selectedBrandId] ?? [];

  async function handleSubmit(values: ModelFormValues) {
    setFormError(null);
    const result =
      mode === "create"
        ? await createModel(values)
        : await updateModel(modelId!, values);

    if (!result.success) {
      setFormError(result.error.message);
      return;
    }
    toast.success(mode === "create" ? "Model added" : "Model updated");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="sm"
      fullWidth
    >
      <Box component="form" onSubmit={form.handleSubmit(handleSubmit)}>
        <DialogTitle>
          {mode === "create" ? "Add model" : "Edit model"}
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
                onChange={(value) => {
                  field.onChange(value);
                  setSelectedBrandId(value);
                  form.setValue("modelFamilyId", undefined);
                }}
                placeholder="Choose a brand"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={form.control}
            name="modelFamilyId"
            render={({ field, fieldState }) => (
              <Combobox
                label="Model family (optional)"
                options={familyOptions}
                value={field.value}
                onChange={field.onChange}
                disabled={!selectedBrandId}
                placeholder="No model family"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Controller
              control={form.control}
              name="modelCode"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  label="Model code (optional)"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="fuelType"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  label="Fuel type (optional)"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Box>
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

export { ModelFormDialog };
