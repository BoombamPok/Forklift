"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon, PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import MuiLink from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { IconButton } from "@/components/shared/icon-button";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { VerificationBadge } from "@/components/shared/verification-badge";
import type { ComboboxOption } from "@/components/shared/combobox";
import {
  removeCompatibility,
  updateCompatibility,
} from "@/features/catalogue/actions";
import {
  compatibilityStatusSchema,
  VERIFICATION_STATUSES,
  type CompatibilityStatusValues,
} from "@/features/catalogue/schema";
import type { CompatibilityRow } from "@/features/catalogue/queries";
import { CompatibilityDialog } from "./compatibility-dialog";

const VERIFICATION_LABEL: Record<string, string> = {
  unverified: "Unverified",
  verified: "Verified",
  uncertain: "Uncertain",
};

type EditDialogProps = {
  row: CompatibilityRow | null;
  cataloguePartId: string;
  onOpenChange: (open: boolean) => void;
};

function CompatibilityEditDialog({
  row,
  cataloguePartId,
  onOpenChange,
}: EditDialogProps) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<CompatibilityStatusValues>({
    resolver: zodResolver(
      compatibilityStatusSchema,
    ) as Resolver<CompatibilityStatusValues>,
    defaultValues: {
      verificationStatus: row?.verificationStatus ?? "unverified",
      notes: row?.notes ?? "",
    },
  });

  async function handleSubmit(values: CompatibilityStatusValues) {
    if (!row) return;
    setFormError(null);
    const result = await updateCompatibility(
      row.id,
      cataloguePartId,
      row.modelId,
      values,
    );
    if (!result.success) {
      setFormError(result.error.message);
      return;
    }
    toast.success("Compatibility updated");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog
      open={row !== null}
      onClose={() => onOpenChange(false)}
      maxWidth="sm"
      fullWidth
    >
      <Box component="form" onSubmit={form.handleSubmit(handleSubmit)}>
        <DialogTitle>
          {row ? `${row.brandName} ${row.modelName}` : ""}
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {formError ? <Alert severity="error">{formError}</Alert> : null}

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
            {form.formState.isSubmitting ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

type CompatibilityListProps = {
  cataloguePartId: string;
  rows: CompatibilityRow[];
  modelOptions: ComboboxOption[];
  canEdit: boolean;
};

/**
 * The primary compatibility editor (phase5.md §5's accepted decision):
 * add/remove a part↔model link, change its verification status. Removal
 * goes through `ConfirmDialog` per phase5.md §11 - it's a real data
 * decision ("this part doesn't fit that model after all"), not a bare
 * delete button.
 */
function CompatibilityList({
  cataloguePartId,
  rows,
  modelOptions,
  canEdit,
}: CompatibilityListProps) {
  const router = useRouter();
  const [addOpen, setAddOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CompatibilityRow | null>(null);
  const [removing, setRemoving] = React.useState<CompatibilityRow | null>(null);
  const [removeLoading, setRemoveLoading] = React.useState(false);

  async function handleConfirmRemove() {
    if (!removing) return;
    setRemoveLoading(true);
    const result = await removeCompatibility(
      removing.id,
      cataloguePartId,
      removing.modelId,
    );
    setRemoveLoading(false);
    setRemoving(null);

    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Compatibility removed");
    router.refresh();
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {rows.length === 0 ? (
        <EmptyState
          title="No compatible models recorded yet"
          description="Add a model this part fits."
        />
      ) : (
        <Box
          component="ul"
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            m: 0,
            p: 0,
            listStyle: "none",
          }}
        >
          {rows.map((row) => (
            <Paper
              component="li"
              variant="outlined"
              key={row.id}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                px: 1.5,
                py: 1,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <MuiLink
                  component={Link}
                  href={`/catalogue/models/${row.modelId}`}
                  sx={{ fontWeight: 500, color: "text.primary" }}
                >
                  {row.brandName} {row.modelName}
                </MuiLink>
                {row.notes ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.notes}
                  </Typography>
                ) : null}
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexShrink: 0,
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <VerificationBadge status={row.verificationStatus} />
                {canEdit ? (
                  <>
                    <IconButton
                      label="Edit compatibility"
                      size="icon-sm"
                      onClick={() => setEditing(row)}
                    >
                      <PencilIcon size={16} />
                    </IconButton>
                    <IconButton
                      label="Remove compatibility"
                      size="icon-sm"
                      onClick={() => setRemoving(row)}
                    >
                      <XIcon size={16} />
                    </IconButton>
                  </>
                ) : null}
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {canEdit ? (
        <Button
          type="button"
          variant="outlined"
          size="small"
          startIcon={<PlusIcon size={16} />}
          onClick={() => setAddOpen(true)}
          sx={{ alignSelf: "flex-start" }}
        >
          Add compatible model
        </Button>
      ) : null}

      {canEdit ? (
        <>
          <CompatibilityDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            cataloguePartId={cataloguePartId}
            modelOptions={modelOptions}
          />
          <CompatibilityEditDialog
            key={editing?.id ?? "closed"}
            row={editing}
            cataloguePartId={cataloguePartId}
            onOpenChange={(open) => {
              if (!open) setEditing(null);
            }}
          />
          <ConfirmDialog
            open={removing !== null}
            onOpenChange={(open) => !open && setRemoving(null)}
            title="Remove this compatibility?"
            description={
              removing
                ? `This removes the record that this part fits ${removing.brandName} ${removing.modelName}. This can't be undone.`
                : ""
            }
            confirmLabel="Remove"
            loading={removeLoading}
            onConfirm={handleConfirmRemove}
          />
        </>
      ) : null}
    </Box>
  );
}

export { CompatibilityList };
