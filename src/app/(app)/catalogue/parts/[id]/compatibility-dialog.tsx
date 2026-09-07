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
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";

import { Combobox, type ComboboxOption } from "@/components/shared/combobox";
import { addCompatibility } from "@/features/catalogue/actions";
import {
  compatibilityFormSchema,
  VERIFICATION_STATUSES,
  type CompatibilityFormValues,
} from "@/features/catalogue/schema";

const VERIFICATION_LABEL: Record<string, string> = {
  unverified: "Unverified",
  verified: "Verified",
  uncertain: "Uncertain",
};

type CompatibilityDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cataloguePartId: string;
  modelOptions: ComboboxOption[];
};

/**
 * "Add compatibility" - the part detail page is the primary editor
 * (phase5.md §5's accepted decision). Duplicate part+model pairs are
 * caught by the DB's own `unique (catalogue_part_id, catalogue_model_id)`
 * constraint; `addCompatibility` (features/catalogue/actions.ts) turns
 * that into "This part is already linked to this model" (phase5.md §11).
 */
function CompatibilityDialog({
  open,
  onOpenChange,
  cataloguePartId,
  modelOptions,
}: CompatibilityDialogProps) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<CompatibilityFormValues>({
    resolver: zodResolver(
      compatibilityFormSchema,
    ) as Resolver<CompatibilityFormValues>,
    defaultValues: { modelId: "", verificationStatus: "unverified", notes: "" },
  });

  async function handleSubmit(values: CompatibilityFormValues) {
    setFormError(null);
    const result = await addCompatibility(cataloguePartId, values);
    if (!result.success) {
      setFormError(result.error.message);
      return;
    }
    toast.success("Compatibility added");
    form.reset({ modelId: "", verificationStatus: "unverified", notes: "" });
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
        <DialogTitle>Add compatible model</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {formError ? <Alert severity="error">{formError}</Alert> : null}

          <Controller
            control={form.control}
            name="modelId"
            render={({ field, fieldState }) => (
              <Combobox
                label="Model"
                options={modelOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Choose a model"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={form.control}
            name="verificationStatus"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                select
                label="Verification status"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              >
                {VERIFICATION_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {VERIFICATION_LABEL[status]}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            control={form.control}
            name="notes"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                value={field.value ?? ""}
                label="Notes (optional)"
                multiline
                rows={2}
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
            {form.formState.isSubmitting ? "Saving…" : "Add"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export { CompatibilityDialog };
