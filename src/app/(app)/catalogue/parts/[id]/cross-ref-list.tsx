"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { IconButton } from "@/components/shared/icon-button";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { addCrossRef, deleteCrossRef } from "@/features/catalogue/actions";
import {
  crossRefFormSchema,
  type CrossRefFormValues,
} from "@/features/catalogue/schema";
import type { CrossRefRow } from "@/features/catalogue/queries";

type CrossRefListProps = {
  partId: string;
  crossRefs: CrossRefRow[];
  canEdit: boolean;
};

/**
 * Inline add/remove list for cross-references (phase5.md §4) - same
 * shape as `PartImagesGallery`
 * (src/app/(app)/inventory/[id]/part-images-gallery.tsx): a short list,
 * an inline add form instead of a full dialog, and `ConfirmDialog` for
 * the one destructive action.
 */
function CrossRefList({ partId, crossRefs, canEdit }: CrossRefListProps) {
  const router = useRouter();
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(
    null,
  );
  const [deleting, setDeleting] = React.useState(false);

  const form = useForm<CrossRefFormValues>({
    resolver: zodResolver(crossRefFormSchema),
    defaultValues: { crossReferenceNumber: "", source: "" },
  });

  async function handleAdd(values: CrossRefFormValues) {
    const result = await addCrossRef(partId, values);
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Cross-reference added");
    form.reset({ crossReferenceNumber: "", source: "" });
    router.refresh();
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    setDeleting(true);
    const result = await deleteCrossRef(pendingDeleteId, partId);
    setDeleting(false);
    setPendingDeleteId(null);

    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Cross-reference removed");
    router.refresh();
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {crossRefs.length === 0 ? (
        <EmptyState title="No cross-references recorded" />
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
          {crossRefs.map((ref) => (
            <Paper
              component="li"
              variant="outlined"
              key={ref.id}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                px: 1.5,
                py: 0.75,
              }}
            >
              <Typography variant="body2">
                <Box
                  component="span"
                  sx={{ fontFamily: "var(--font-plex-mono)" }}
                >
                  {ref.crossReferenceNumber}
                </Box>
                {ref.source ? (
                  <Box component="span" sx={{ color: "text.secondary" }}>
                    {" "}
                    · {ref.source}
                  </Box>
                ) : null}
              </Typography>
              {canEdit ? (
                <IconButton
                  label="Remove cross-reference"
                  size="icon-sm"
                  onClick={() => setPendingDeleteId(ref.id)}
                >
                  <XIcon size={16} />
                </IconButton>
              ) : null}
            </Paper>
          ))}
        </Box>
      )}

      {canEdit ? (
        <Box
          component="form"
          onSubmit={form.handleSubmit(handleAdd)}
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            gap: 1,
          }}
        >
          <Controller
            control={form.control}
            name="crossReferenceNumber"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                placeholder="Reference number"
                size="small"
                sx={{ width: 160 }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="source"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                value={field.value ?? ""}
                placeholder="Source (optional)"
                size="small"
                sx={{ width: 160 }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Button
            type="submit"
            variant="outlined"
            size="small"
            startIcon={<PlusIcon size={16} />}
            disabled={form.formState.isSubmitting}
          >
            Add
          </Button>
        </Box>
      ) : null}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        title="Remove this cross-reference?"
        description="This permanently removes the reference number. This can't be undone."
        confirmLabel="Remove"
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}

export { CrossRefList };
