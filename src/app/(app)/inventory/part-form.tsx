"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangleIcon } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  checkDuplicatePartNumber,
  createPart,
  updatePart,
} from "@/features/inventory/actions";
import {
  partFormSchema,
  type PartFormValues,
} from "@/features/inventory/schema";
import type { DuplicatePartMatch } from "@/features/inventory/queries";

const DUPLICATE_CHECK_DEBOUNCE_MS = 400;

type PartFormProps = {
  mode: "create" | "edit";
  partId?: string;
  defaultValues?: Partial<PartFormValues>;
  boxOptions: ComboboxOption[];
  catalogueOptions: ComboboxOption[];
};

/**
 * The one create/edit form (phase3.md §4) - a dedicated page rather
 * than a modal, since this carries ~9 fields plus two Combobox pickers
 * (CLAUDE.md warns against unnecessary modals for exactly this much
 * content). On create, redirects to the new part's detail page with
 * `?openMovement=in` so the detail page immediately opens the opening
 * Stock In dialog - every new part starts at quantity 0 (trigger-
 * enforced), and the user shouldn't be left there with no next step.
 */
function PartForm({
  mode,
  partId,
  defaultValues,
  boxOptions,
  catalogueOptions,
}: PartFormProps) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [duplicate, setDuplicate] = React.useState<DuplicatePartMatch | null>(
    null,
  );
  const duplicateCheckRef = React.useRef(0);
  const duplicateTimerRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  const form = useForm<PartFormValues>({
    // zod's own inferred input type for a z.preprocess-wrapped field
    // widens to `unknown`, which never lines up with a hand-declared
    // form type - the cast is safe because `partFormSchema.parse`'s
    // actual runtime behavior on this shape is covered by
    // schema.test.ts, this is purely a TS inference gap.
    resolver: zodResolver(partFormSchema) as Resolver<PartFormValues>,
    defaultValues: {
      partNumber: "",
      name: "",
      status: "active",
      ...defaultValues,
    },
  });

  async function checkDuplicate(partNumber: string) {
    if (!partNumber.trim()) {
      setDuplicate(null);
      return;
    }
    const requestId = ++duplicateCheckRef.current;
    const result = await checkDuplicatePartNumber(partNumber, partId);
    if (requestId !== duplicateCheckRef.current) return;
    setDuplicate(result.success ? result.data : null);
  }

  async function onSubmit(values: PartFormValues) {
    setFormError(null);

    if (mode === "create") {
      const result = await createPart(values);
      if (!result.success) {
        setFormError(result.error.message);
        return;
      }
      toast.success("Part created");
      router.push(`/inventory/${result.data.id}?openMovement=in`);
      return;
    }

    const result = await updatePart(partId!, values);
    if (!result.success) {
      setFormError(result.error.message);
      return;
    }
    toast.success("Part updated");
    router.push(`/inventory/${partId}`);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-2xl space-y-6"
      >
        {formError ? (
          <Alert variant="destructive">
            <AlertTriangleIcon />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        {duplicate ? (
          <Alert>
            <AlertTriangleIcon className="text-warning" />
            <AlertTitle>A part with this number already exists</AlertTitle>
            <AlertDescription>
              <Link href={`/inventory/${duplicate.id}`}>
                {duplicate.name} — quantity {duplicate.quantity}, {duplicate.status}
              </Link>
              . You can still save this as a separate part, or go edit the
              existing one instead.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="partNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Part number</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onBlur={(event) => {
                      field.onBlur();
                      clearTimeout(duplicateTimerRef.current);
                      duplicateTimerRef.current = setTimeout(
                        () => checkDuplicate(event.target.value),
                        DUPLICATE_CHECK_DEBOUNCE_MS,
                      );
                    }}
                  />
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
            name="boxId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Box</FormLabel>
                <FormControl>
                  <Combobox
                    options={boxOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="No box selected"
                    searchPlaceholder="Search boxes…"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="catalogueId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catalogue link (optional)</FormLabel>
                <FormControl>
                  <Combobox
                    options={catalogueOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Not linked to a catalogue part"
                    searchPlaceholder="Search catalogue…"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Low-stock threshold (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purchaseCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase cost (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sellingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling price (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ""} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
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

export { PartForm };
