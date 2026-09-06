"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconButton } from "@/components/shared/icon-button";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/shared/form";
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
    <div className="space-y-3">
      {crossRefs.length === 0 ? (
        <EmptyState title="No cross-references recorded" />
      ) : (
        <ul className="space-y-1.5 text-sm">
          {crossRefs.map((ref) => (
            <li
              key={ref.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-1.5"
            >
              <span>
                <span className="font-mono">{ref.crossReferenceNumber}</span>
                {ref.source ? (
                  <span className="text-muted-foreground"> · {ref.source}</span>
                ) : null}
              </span>
              {canEdit ? (
                <IconButton
                  label="Remove cross-reference"
                  size="icon-sm"
                  onClick={() => setPendingDeleteId(ref.id)}
                >
                  <XIcon />
                </IconButton>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canEdit ? (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleAdd)}
            className="flex flex-wrap items-start gap-2"
          >
            <FormField
              control={form.control}
              name="crossReferenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Reference number"
                      className="w-40"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Source (optional)"
                      className="w-40"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={form.formState.isSubmitting}
            >
              <PlusIcon /> Add
            </Button>
          </form>
        </Form>
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
    </div>
  );
}

export { CrossRefList };
