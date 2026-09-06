"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Combobox, type ComboboxOption } from "@/components/shared/combobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shared/form";
import { addCompatibility } from "@/features/catalogue/actions";
import {
  compatibilityFormSchema,
  VERIFICATION_STATUSES,
  type CompatibilityFormValues,
} from "@/features/catalogue/schema";

const VERIFICATION_LABEL: Record<string, string> = {
  unverified: "Unverified",
  verified: "Verified",
  uncertain: "Uncertain",
};

type CompatibilityDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cataloguePartId: string;
  modelOptions: ComboboxOption[];
};

/**
 * "Add compatibility" - the part detail page is the primary editor
 * (phase5.md §5's accepted decision). Duplicate part+model pairs are
 * caught by the DB's own `unique (catalogue_part_id, catalogue_model_id)`
 * constraint; `addCompatibility` (features/catalogue/actions.ts) turns
 * that into "This part is already linked to this model" (phase5.md §11).
 */
function CompatibilityDialog({
  open,
  onOpenChange,
  cataloguePartId,
  modelOptions,
}: CompatibilityDialogProps) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<CompatibilityFormValues>({
    resolver: zodResolver(
      compatibilityFormSchema,
    ) as Resolver<CompatibilityFormValues>,
    defaultValues: { modelId: "", verificationStatus: "unverified", notes: "" },
  });

  async function handleSubmit(values: CompatibilityFormValues) {
    setFormError(null);
    const result = await addCompatibility(cataloguePartId, values);
    if (!result.success) {
      setFormError(result.error.message);
      return;
    }
    toast.success("Compatibility added");
    form.reset({ modelId: "", verificationStatus: "unverified", notes: "" });
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add compatible model</DialogTitle>
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
              name="modelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Combobox
                      options={modelOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Choose a model"
                      searchPlaceholder="Search models…"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {form.formState.isSubmitting ? "Saving…" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export { CompatibilityDialog };
