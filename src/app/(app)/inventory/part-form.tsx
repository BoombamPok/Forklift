"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";

import { Combobox, type ComboboxOption } from "@/components/shared/combobox";
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
  const duplicateTimerRef =
    React.useRef<ReturnType<typeof setTimeout>>(undefined);

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
    <Box
      component="form"
      onSubmit={(event) => {
        // Cancel any pending debounced duplicate check so a slow
        // response can't land after submit and flag the record just
        // created/saved as a duplicate of itself.
        clearTimeout(duplicateTimerRef.current);
        duplicateCheckRef.current++;
        return form.handleSubmit(onSubmit)(event);
      }}
      sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 720 }}
    >
      {formError ? <Alert severity="error">{formError}</Alert> : null}

      {duplicate ? (
        <Alert severity="warning">
          <AlertTitle>A part with this number already exists</AlertTitle>
          <Link href={`/inventory/${duplicate.id}`}>
            {duplicate.name} — quantity {duplicate.quantity}, {duplicate.status}
          </Link>
          . You can still save this as a separate part, or go edit the existing
          one instead.
        </Alert>
      ) : null}

      <Card>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <Controller
              control={form.control}
              name="partNumber"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Part number"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  onBlur={(event) => {
                    field.onBlur();
                    clearTimeout(duplicateTimerRef.current);
                    duplicateTimerRef.current = setTimeout(
                      () => checkDuplicate(event.target.value),
                      DUPLICATE_CHECK_DEBOUNCE_MS,
                    );
                  }}
                />
              )}
            />

            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Name"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="boxId"
              render={({ field, fieldState }) => (
                <Combobox
                  label="Box"
                  options={boxOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="No box selected"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="catalogueId"
              render={({ field, fieldState }) => (
                <Combobox
                  label="Catalogue link (optional)"
                  options={catalogueOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Not linked to a catalogue part"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="status"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  select
                  label="Status"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="discontinued">Discontinued</MenuItem>
                  <MenuItem value="damaged">Damaged</MenuItem>
                </TextField>
              )}
            />

            <Controller
              control={form.control}
              name="minStock"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="number"
                  slotProps={{ htmlInput: { min: 0, step: 1 } }}
                  value={field.value ?? ""}
                  label="Low-stock threshold (optional)"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="purchaseCost"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="number"
                  slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                  value={field.value ?? ""}
                  label="Purchase cost (optional)"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="sellingPrice"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="number"
                  slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                  value={field.value ?? ""}
                  label="Selling price (optional)"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Box>

          <Controller
            control={form.control}
            name="notes"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                value={field.value ?? ""}
                label="Notes (optional)"
                multiline
                rows={3}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </CardContent>
      </Card>

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          type="submit"
          variant="contained"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting
            ? "Saving…"
            : mode === "create"
              ? "Create part"
              : "Save changes"}
        </Button>
        <Button type="button" variant="outlined" onClick={() => router.back()}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
}

export { PartForm };
