"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { createWarehouse, updateWarehouse } from "@/features/warehouse/actions";
import {
  warehouseFormSchema,
  type WarehouseFormValues,
} from "@/features/warehouse/schema";

type WarehouseFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId?: string;
  defaultValues?: WarehouseFormValues;
};

/**
 * Create/edit for a warehouse (phase4.md §4) - two fields, so a dialog
 * rather than a dedicated page (same reasoning as `CodeFormDialog`).
 *
 * `useForm`'s `defaultValues` only apply at mount, so a caller reusing one
 * instance for "edit warehouse A" then "edit warehouse B" must pass
 * `key={warehouseId}` - see `CodeFormDialog`'s equivalent note for why this
 * doesn't reset via an effect instead.
 */
function WarehouseFormDialog({
  open,
  onOpenChange,
  warehouseId,
  defaultValues,
}: WarehouseFormDialogProps) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const mode = warehouseId ? "edit" : "create";

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: { name: "", address: "", ...defaultValues },
  });

  async function handleSubmit(values: WarehouseFormValues) {
    setFormError(null);

    if (mode === "create") {
      const result = await createWarehouse(values);
      if (!result.success) {
        setFormError(result.error.message);
        return;
      }
      toast.success("Warehouse added");
      onOpenChange(false);
      router.push(`/warehouse/${result.data.id}`);
      return;
    }

    const result = await updateWarehouse(warehouseId!, values);
    if (!result.success) {
      setFormError(result.error.message);
      return;
    }
    toast.success("Warehouse updated");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add warehouse" : "Edit warehouse"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "You can add racks, shelves, and boxes once it's created."
              : "Update this warehouse's name or address."}
          </DialogDescription>
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

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
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

export { WarehouseFormDialog };
