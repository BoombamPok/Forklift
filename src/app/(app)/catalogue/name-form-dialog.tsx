"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

import type { ActionResult } from "@/lib/errors";

const nameSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
});
type NameValues = z.infer<typeof nameSchema>;

type NameFormDialogProps = {
  entityLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName?: string;
  onSubmit: (values: NameValues) => Promise<ActionResult<unknown>>;
};

/**
 * The one create/edit form for brands and categories (phase5.md §4) - a
 * single required `name` field, same "doesn't reach the modal-avoidance
 * threshold" reasoning as `CodeFormDialog`
 * (src/app/(app)/warehouse/code-form-dialog.tsx), which this otherwise
 * mirrors exactly (including the `key={id}`-per-row remount contract).
 */
function NameFormDialog({
  entityLabel,
  open,
  onOpenChange,
  defaultName,
  onSubmit,
}: NameFormDialogProps) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const mode = defaultName !== undefined ? "edit" : "create";

  const form = useForm<NameValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: defaultName ?? "" },
  });

  async function handleSubmit(values: NameValues) {
    setFormError(null);
    const result = await onSubmit(values);
    if (!result.success) {
      setFormError(result.error.message);
      return;
    }
    toast.success(
      mode === "create" ? `${entityLabel} added` : `${entityLabel} updated`,
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
          {mode === "create"
            ? `Add ${entityLabel.toLowerCase()}`
            : `Edit ${entityLabel.toLowerCase()}`}
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

export { NameFormDialog };
