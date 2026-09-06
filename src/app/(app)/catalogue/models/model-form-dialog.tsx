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
import { createModel, updateModel } from "@/features/catalogue/actions";
import {
  modelFormSchema,
  type ModelFormValues,
} from "@/features/catalogue/schema";

type ModelFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandOptions: ComboboxOption[];
  modelFamilyOptionsByBrand: Record<string, ComboboxOption[]>;
  modelId?: string;
  defaultValues?: ModelFormValues;
};

/**
 * Model create/edit (phase5.md §4) - name/model_code/fuel_type/brand/
 * model_family. Still a dialog, not a page: it's text inputs plus two
 * Combobox pickers, well short of `PartForm`'s ~9-field/two-Combobox
 * threshold. `modelFamilyOptionsByBrand` is precomputed server-side
 * (one flat fetch per brand, catalogue-sized) so switching the brand
 * Combobox client-side doesn't need its own fetch - `fuelType` is a
 * plain free-text field, not a fixed dropdown, since the schema has no
 * enum for it and inventing a fixed list would constrain future real
 * values to ones this app guessed (CLAUDE.md §13).
 */
function ModelFormDialog({
  open,
  onOpenChange,
  brandOptions,
  modelFamilyOptionsByBrand,
  modelId,
  defaultValues,
}: ModelFormDialogProps) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const mode = modelId ? "edit" : "create";

  const form = useForm<ModelFormValues>({
    resolver: zodResolver(modelFormSchema) as Resolver<ModelFormValues>,
    defaultValues: defaultValues ?? { name: "", brandId: "" },
  });

  // Tracked in local state rather than `form.watch()` - React Compiler
  // can't safely memoize around RHF's `watch()`, and this is the one
  // place the dialog needs to react to the brand selection outside its
  // own FormField render prop (to pick the right family options).
  const [selectedBrandId, setSelectedBrandId] = React.useState(
    defaultValues?.brandId ?? "",
  );
  const familyOptions = modelFamilyOptionsByBrand[selectedBrandId] ?? [];

  async function handleSubmit(values: ModelFormValues) {
    setFormError(null);
    const result =
      mode === "create"
        ? await createModel(values)
        : await updateModel(modelId!, values);

    if (!result.success) {
      setFormError(result.error.message);
      return;
    }
    toast.success(mode === "create" ? "Model added" : "Model updated");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add model" : "Edit model"}
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
                      onChange={(value) => {
                        field.onChange(value);
                        setSelectedBrandId(value);
                        form.setValue("modelFamilyId", undefined);
                      }}
                      placeholder="Choose a brand"
                      searchPlaceholder="Search brands…"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="modelFamilyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model family (optional)</FormLabel>
                  <FormControl>
                    <Combobox
                      options={familyOptions}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={!selectedBrandId}
                      placeholder="No model family"
                      searchPlaceholder="Search model families…"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="modelCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model code (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fuelType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel type (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

export { ModelFormDialog };
