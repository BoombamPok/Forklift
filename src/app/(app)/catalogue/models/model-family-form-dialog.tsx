"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Combobox, type ComboboxOption } from "@/components/shared/combobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shared/form";
import {
  createModelFamily,
  updateModelFamily,
} from "@/features/catalogue/actions";
import {
  modelFamilyFormSchema,
  type ModelFamilyFormValues,
} from "@/features/catalogue/schema";

type ModelFamilyFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandOptions: ComboboxOption[];
  familyId?: string;
  defaultValues?: ModelFamilyFormValues;
};

/**
 * Model family create/edit (phase5.md §4) - two fields (name + brand),
 * same dialog-not-page threshold as `WarehouseFormDialog`.
 */
function ModelFamilyFormDialog({
  open,
  onOpenChange,
  brandOptions,
  familyId,
  defaultValues,
}: ModelFamilyFormDialogProps) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const mode = familyId ? "edit" : "create";

  const form = useForm<ModelFamilyFormValues>({
    resolver: zodResolver(
      modelFamilyFormSchema,
    ) as Resolver<ModelFamilyFormValues>,
    defaultValues: defaultValues ?? { name: "", brandId: "" },
  });

  async function handleSubmit(values: ModelFamilyFormValues) {
    setFormError(null);
    const result =
      mode === "create"
        ? await createModelFamily(values)
        : await updateModelFamily(familyId!, values);

    if (!result.success) {
      setFormError(result.error.message);
      return;
    }
    toast.success(
      mode === "create" ? "Model family added" : "Model family updated",
    );
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add model family" : "Edit model family"}
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

            <FormField
              control={form.control}
              name="brandId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <FormControl>
                    <Combobox
                      options={brandOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Choose a brand"
                      searchPlaceholder="Search brands…"
                    />
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

export { ModelFamilyFormDialog };
