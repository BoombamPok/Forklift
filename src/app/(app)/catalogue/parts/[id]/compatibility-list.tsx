"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon, PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconButton } from "@/components/shared/icon-button";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { VerificationBadge } from "@/components/shared/verification-badge";
import type { ComboboxOption } from "@/components/shared/combobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shared/form";
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
    <Dialog open={row !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {row ? `${row.brandName} ${row.modelName}` : ""}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {formError ? (
              <p className="text-sm font-medium text-destructive">
                {formError}
              </p>
            ) : null}

            <FormField
              control={form.control}
              name="verificationStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {VERIFICATION_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {VERIFICATION_LABEL[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
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
    <div className="space-y-3">
      {rows.length === 0 ? (
        <EmptyState
          title="No compatible models recorded yet"
          description="Add a model this part fits."
        />
      ) : (
        <ul className="space-y-1.5 text-sm">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <Link
                  href={`/catalogue/models/${row.modelId}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {row.brandName} {row.modelName}
                </Link>
                {row.notes ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {row.notes}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <VerificationBadge status={row.verificationStatus} />
                {canEdit ? (
                  <>
                    <IconButton
                      label="Edit compatibility"
                      size="icon-sm"
                      onClick={() => setEditing(row)}
                    >
                      <PencilIcon />
                    </IconButton>
                    <IconButton
                      label="Remove compatibility"
                      size="icon-sm"
                      onClick={() => setRemoving(row)}
                    >
                      <XIcon />
                    </IconButton>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canEdit ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAddOpen(true)}
        >
          <PlusIcon /> Add compatible model
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
    </div>
  );
}

export { CompatibilityList };
