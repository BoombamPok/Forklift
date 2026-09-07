"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { DataTable } from "@/components/shared/data-table";
import { IconButton } from "@/components/shared/icon-button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { ComboboxOption } from "@/components/shared/combobox";
import { softDeleteModelFamily } from "@/features/catalogue/actions";
import type { ModelFamilyListRow } from "@/features/catalogue/queries";
import { ModelFamilyFormDialog } from "./model-family-form-dialog";

type ModelFamilyTableProps = {
  rows: ModelFamilyListRow[];
  brandOptions: ComboboxOption[];
  canManage: boolean;
};

function ModelFamilyTable({
  rows,
  brandOptions,
  canManage,
}: ModelFamilyTableProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ModelFamilyListRow | null>(null);
  const [deleting, setDeleting] = React.useState<ModelFamilyListRow | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  async function handleConfirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const result = await softDeleteModelFamily(deleting.id);
    setDeleteLoading(false);
    setDeleting(null);

    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Model family deleted");
    router.refresh();
  }

  const columns: ColumnDef<ModelFamilyListRow, unknown>[] = [
    { id: "name", accessorKey: "name", header: "Model family" },
    { id: "brandName", accessorKey: "brandName", header: "Brand" },
    {
      id: "modelCount",
      accessorKey: "modelCount",
      header: "Models",
      cell: ({ row }) => (
        <Typography
          sx={{ fontFamily: "var(--font-roboto-mono)" }}
          variant="body2"
        >
          {row.original.modelCount}
        </Typography>
      ),
    },
    ...(canManage
      ? [
          {
            id: "actions",
            header: "",
            enableSorting: false,
            cell: ({ row }: { row: { original: ModelFamilyListRow } }) => (
              <Box
                sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}
              >
                <IconButton
                  label="Edit model family"
                  onClick={() => setEditing(row.original)}
                >
                  <PencilIcon size={16} />
                </IconButton>
                <IconButton
                  label="Delete model family"
                  onClick={() => setDeleting(row.original)}
                >
                  <Trash2Icon size={16} />
                </IconButton>
              </Box>
            ),
          } satisfies ColumnDef<ModelFamilyListRow, unknown>,
        ]
      : []),
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {canManage ? (
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="button"
            variant="outlined"
            size="small"
            startIcon={<PlusIcon size={16} />}
            onClick={() => setCreateOpen(true)}
          >
            Add model family
          </Button>
        </Box>
      ) : null}

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        emptyState={{ title: "No model families yet" }}
      />

      {canManage ? (
        <>
          <ModelFamilyFormDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            brandOptions={brandOptions}
          />
          <ModelFamilyFormDialog
            key={editing?.id ?? "closed"}
            open={editing !== null}
            onOpenChange={(open) => {
              if (!open) setEditing(null);
            }}
            brandOptions={brandOptions}
            familyId={editing?.id}
            defaultValues={
              editing
                ? { name: editing.name, brandId: editing.brandId ?? "" }
                : undefined
            }
          />
          <ConfirmDialog
            open={deleting !== null}
            onOpenChange={(open) => !open && setDeleting(null)}
            title="Delete this model family?"
            description="Models already in this family keep their existing data - this only removes the family from future selection lists."
            confirmLabel="Delete"
            loading={deleteLoading}
            onConfirm={handleConfirmDelete}
          />
        </>
      ) : null}
    </Box>
  );
}

export { ModelFamilyTable };
