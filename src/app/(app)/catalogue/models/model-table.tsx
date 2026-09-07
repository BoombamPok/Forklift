"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MuiLink from "@mui/material/Link";
import Typography from "@mui/material/Typography";

import { DataTable } from "@/components/shared/data-table";
import { IconButton } from "@/components/shared/icon-button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { ComboboxOption } from "@/components/shared/combobox";
import { softDeleteModel } from "@/features/catalogue/actions";
import type { ModelListRow } from "@/features/catalogue/queries";
import { ModelFormDialog } from "./model-form-dialog";

type ModelTableProps = {
  rows: ModelListRow[];
  brandOptions: ComboboxOption[];
  modelFamilyOptionsByBrand: Record<string, ComboboxOption[]>;
  canManage: boolean;
};

function ModelTable({
  rows,
  brandOptions,
  modelFamilyOptionsByBrand,
  canManage,
}: ModelTableProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ModelListRow | null>(null);
  const [deleting, setDeleting] = React.useState<ModelListRow | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  async function handleConfirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const result = await softDeleteModel(deleting.id);
    setDeleteLoading(false);
    setDeleting(null);

    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Model deleted");
    router.refresh();
  }

  const columns: ColumnDef<ModelListRow, unknown>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: "Model",
      cell: ({ row }) => (
        <MuiLink
          component={Link}
          href={`/catalogue/models/${row.original.id}`}
          sx={{ fontWeight: 500, color: "text.primary" }}
        >
          {row.original.name}
        </MuiLink>
      ),
    },
    { id: "brandName", accessorKey: "brandName", header: "Brand" },
    {
      id: "modelFamilyName",
      accessorKey: "modelFamilyName",
      header: "Model family",
      enableSorting: false,
      cell: ({ row }) => row.original.modelFamilyName ?? "—",
    },
    {
      id: "fuelType",
      accessorKey: "fuelType",
      header: "Fuel type",
      enableSorting: false,
      cell: ({ row }) => row.original.fuelType ?? "—",
    },
    {
      id: "compatiblePartCount",
      accessorKey: "compatiblePartCount",
      header: "Compatible parts",
      cell: ({ row }) => (
        <Typography
          sx={{ fontFamily: "var(--font-roboto-mono)" }}
          variant="body2"
        >
          {row.original.compatiblePartCount}
        </Typography>
      ),
    },
    ...(canManage
      ? [
          {
            id: "actions",
            header: "",
            enableSorting: false,
            cell: ({ row }: { row: { original: ModelListRow } }) => (
              <Box
                sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}
              >
                <IconButton
                  label="Edit model"
                  onClick={() => setEditing(row.original)}
                >
                  <PencilIcon size={16} />
                </IconButton>
                <IconButton
                  label="Delete model"
                  onClick={() => setDeleting(row.original)}
                >
                  <Trash2Icon size={16} />
                </IconButton>
              </Box>
            ),
          } satisfies ColumnDef<ModelListRow, unknown>,
        ]
      : []),
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {canManage ? (
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="button"
            variant="contained"
            startIcon={<PlusIcon size={16} />}
            onClick={() => setCreateOpen(true)}
          >
            Add model
          </Button>
        </Box>
      ) : null}

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        emptyState={{
          title: "No models match this filter",
          description: canManage
            ? "Add a model, or choose a different brand."
            : "Try a different brand.",
        }}
      />

      {canManage ? (
        <>
          <ModelFormDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            brandOptions={brandOptions}
            modelFamilyOptionsByBrand={modelFamilyOptionsByBrand}
          />
          <ModelFormDialog
            key={editing?.id ?? "closed"}
            open={editing !== null}
            onOpenChange={(open) => {
              if (!open) setEditing(null);
            }}
            brandOptions={brandOptions}
            modelFamilyOptionsByBrand={modelFamilyOptionsByBrand}
            modelId={editing?.id}
            defaultValues={
              editing
                ? {
                    name: editing.name,
                    brandId: editing.brandId,
                    modelFamilyId: editing.modelFamilyId ?? undefined,
                    modelCode: editing.modelCode ?? undefined,
                    fuelType: editing.fuelType ?? undefined,
                  }
                : undefined
            }
          />
          <ConfirmDialog
            open={deleting !== null}
            onOpenChange={(open) => !open && setDeleting(null)}
            title="Delete this model?"
            description="Compatibility links already recorded for this model keep their existing data - this only removes the model from future selection lists."
            confirmLabel="Delete"
            loading={deleteLoading}
            onConfirm={handleConfirmDelete}
          />
        </>
      ) : null}
    </Box>
  );
}

export { ModelTable };
