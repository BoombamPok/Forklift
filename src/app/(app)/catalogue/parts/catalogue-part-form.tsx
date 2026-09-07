"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";

import { Combobox, type ComboboxOption } from "@/components/shared/combobox";
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
    <Box
      component="form"
      onSubmit={form.handleSubmit(onSubmit)}
      sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 720 }}
    >
      {formError ? <Alert severity="error">{formError}</Alert> : null}

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
              name="brandId"
              render={({ field, fieldState }) => (
                <Combobox
                  label="Brand (optional)"
                  options={brandOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="No brand"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="categoryId"
              render={({ field, fieldState }) => (
                <Combobox
                  label="Category (optional)"
                  options={categoryOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="No category"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="subCategory"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  label="Sub-category (optional)"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="assemblyGroup"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  label="Assembly group (optional)"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="oemReference"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  label="OEM reference (optional)"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="capacityRangeKg"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  label="Capacity range (optional)"
                  placeholder="e.g. 2000-3000 kg"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="verificationStatus"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  select
                  label="Verification status"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                >
                  {VERIFICATION_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {VERIFICATION_LABEL[status]}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              control={form.control}
              name="isFastener"
              render={({ field }) => (
                <Paper
                  variant="outlined"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 1.5,
                    py: 0.5,
                  }}
                >
                  <FormControlLabel
                    label="Is a fastener"
                    labelPlacement="start"
                    sx={{
                      ml: 0,
                      width: "100%",
                      justifyContent: "space-between",
                    }}
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.checked)
                        }
                      />
                    }
                  />
                </Paper>
              )}
            />
          </Box>

          <Controller
            control={form.control}
            name="description"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                value={field.value ?? ""}
                label="Description (optional)"
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

export { CataloguePartForm };
