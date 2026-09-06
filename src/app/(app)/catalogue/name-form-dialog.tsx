"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shared/form";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? `Add ${entityLabel.toLowerCase()}`
              : `Edit ${entityLabel.toLowerCase()}`}
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} autoFocus />
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
                {form.formState.isSubmitting
                  ? "Saving…"
                  : mode === "create"
                    ? "Add"
                    : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export { NameFormDialog };
