"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  createCataloguePart,
  updateCataloguePart,
} from "@/features/catalogue/actions";
import {
  cataloguePartFormSchema,
  VERIFICATION_STATUSES,
  type CataloguePartFormValues,
} from "@/features/catalogue/schema";

type CataloguePartFormProps = {
  mode: "create" | "edit";
  partId?: string;
  defaultValues?: Partial<CataloguePartFormValues>;
  brandOptions: ComboboxOption[];
  categoryOptions: ComboboxOption[];
};

const VERIFICATION_LABEL: Record<string, string> = {
  unverified: "Unverified",
  verified: "Verified",
  uncertain: "Uncertain",
};

/**
 * Create/edit form for a catalogue part (phase5.md §4) - a dedicated
 * page, not a dialog, since it carries 11 fields plus two Combobox
 * pickers: the same threshold `PartForm`
 * (src/app/(app)/inventory/part-form.tsx) crosses for inventory parts,
 * which this mirrors closely (RHF + zodResolver, redirect to the new
 * record's detail page on create).
 */
function CataloguePartForm({
  mode,
  partId,
  defaultValues,
  brandOptions,
  categoryOptions,
}: CataloguePartFormProps) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<CataloguePartFormValues>({
    resolver: zodResolver(
      cataloguePartFormSchema,
    ) as Resolver<CataloguePartFormValues>,
    defaultValues: {
      partNumber: "",
      name: "",
      isFastener: false,
      verificationStatus: "unverified",
      ...defaultValues,
    },
  });

  async function onSubmit(values: CataloguePartFormValues) {
    setFormError(null);

    if (mode === "create") {
      const result = await createCataloguePart(values);
      if (!result.success) {
        setFormError(result.error.message);
        return;
      }
      toast.success("Catalogue part created");
      router.push(`/catalogue/parts/${result.data.id}`);
      return;
    }

    const result = await updateCataloguePart(partId!, values);
    if (!result.success) {
      setFormError(result.error.message);
      return;
    }
    toast.success("Catalogue part updated");
    router.push(`/catalogue/parts/${partId}`);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-2xl space-y-6"
      >
        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="partNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Brand (optional)</FormLabel>
                    <FormControl>
                      <Combobox
                        options={brandOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="No brand"
                        searchPlaceholder="Search brands…"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category (optional)</FormLabel>
                    <FormControl>
                      <Combobox
                        options={categoryOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="No category"
                        searchPlaceholder="Search categories…"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub-category (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assemblyGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assembly group (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="oemReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OEM reference (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacityRangeKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity range (optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="e.g. 2000-3000 kg"
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
                name="isFastener"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-md border border-border px-3 py-2">
                    <FormLabel className="font-normal">Is a fastener</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button
            type="submit"
            variant="gradient"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? "Saving…"
              : mode === "create"
                ? "Create part"
                : "Save changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}

export { CataloguePartForm };
