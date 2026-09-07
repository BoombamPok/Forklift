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
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

import type { ActionResult } from "@/lib/errors";

const codeSchema = z.object({
  code: z.string().min(1, "Code is required").max(50),
});
type CodeValues = z.infer<typeof codeSchema>;

type CodeFormDialogProps = {
  entityLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCode?: string;
  onSubmit: (values: CodeValues) => Promise<ActionResult<unknown>>;
};

/**
 * The one create/edit form for racks, shelves, and boxes (phase4.md §9) -
 * each is a single required `code` field validated against the same shape
 * as `rackFormSchema`/`shelfFormSchema`/`boxFormSchema`
 * (src/features/warehouse/schema.ts), which the calling Server Action
 * re-validates independently. A dialog rather than a dedicated page, since
 * one short field doesn't reach the content threshold CLAUDE.md's
 * "avoid unnecessary modals" rule is actually about (contrast
 * `PartForm`'s ~9 fields, which does warrant a page).
 *
 * `useForm`'s `defaultValues` only apply at mount, so a caller reusing one
 * instance for "edit row A" then "edit row B" must pass `key={rowId}` -
 * this deliberately doesn't reset via an effect on `open`/`defaultCode`
 * changing (that would set state synchronously inside an effect, which
 * the React Compiler's `react-hooks/set-state-in-effect` rule flags).
 */
function CodeFormDialog({
  entityLabel,
  open,
  onOpenChange,
  defaultCode,
  onSubmit,
}: CodeFormDialogProps) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const mode = defaultCode !== undefined ? "edit" : "create";

  const form = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: defaultCode ?? "" },
  });

  async function handleSubmit(values: CodeValues) {
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
          <DialogContentText>
            Codes must be unique among sibling {entityLabel.toLowerCase()}s.
          </DialogContentText>

          {formError ? <Alert severity="error">{formError}</Alert> : null}

          <Controller
            control={form.control}
            name="code"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Code"
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

export { CodeFormDialog };
