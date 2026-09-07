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
import {
  createCategory,
  softDeleteCategory,
  updateCategory,
} from "@/features/catalogue/actions";
import type { CategoryListRow } from "@/features/catalogue/queries";
import { NameFormDialog } from "./name-form-dialog";

type CategoryTableProps = {
  rows: CategoryListRow[];
  canManage: boolean;
};

/** Category CRUD (phase5.md §4) - a flat list, same shape as `BrandTable`. */
function CategoryTable({ rows, canManage }: CategoryTableProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CategoryListRow | null>(null);
  const [deleting, setDeleting] = React.useState<CategoryListRow | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  async function handleConfirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const result = await softDeleteCategory(deleting.id);
    setDeleteLoading(false);
    setDeleting(null);

    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Category deleted");
    router.refresh();
  }

  const columns: ColumnDef<CategoryListRow, unknown>[] = [
    { id: "name", accessorKey: "name", header: "Category" },
    {
      id: "partCount",
      accessorKey: "partCount",
      header: "Parts",
      cell: ({ row }) => (
        <Typography
          sx={{ fontFamily: "var(--font-plex-mono)" }}
          variant="body2"
        >
          {row.original.partCount}
        </Typography>
      ),
    },
    ...(canManage
      ? [
          {
            id: "actions",
            header: "",
            enableSorting: false,
            cell: ({ row }: { row: { original: CategoryListRow } }) => (
              <Box
                sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}
              >
                <IconButton
                  label="Edit category"
                  onClick={() => setEditing(row.original)}
                >
                  <PencilIcon size={16} />
                </IconButton>
                <IconButton
                  label="Delete category"
                  onClick={() => setDeleting(row.original)}
                >
                  <Trash2Icon size={16} />
                </IconButton>
              </Box>
            ),
          } satisfies ColumnDef<CategoryListRow, unknown>,
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
            Add category
          </Button>
        </Box>
      ) : null}

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        emptyState={{
          title: "No categories yet",
          description: canManage
            ? "Add a category to start grouping parts."
            : "An admin or manager hasn't added a category yet.",
        }}
      />

      {canManage ? (
        <>
          <NameFormDialog
            entityLabel="Category"
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSubmit={createCategory}
          />
          <NameFormDialog
            key={editing?.id ?? "closed"}
            entityLabel="Category"
            open={editing !== null}
            onOpenChange={(open) => {
              if (!open) setEditing(null);
            }}
            defaultName={editing?.name}
            onSubmit={(values) => updateCategory(editing!.id, values)}
          />
          <ConfirmDialog
            open={deleting !== null}
            onOpenChange={(open) => !open && setDeleting(null)}
            title="Delete this category?"
            description="Parts already using this category keep their existing data - this only removes it from future selection lists."
            confirmLabel="Delete"
            loading={deleteLoading}
            onConfirm={handleConfirmDelete}
          />
        </>
      ) : null}
    </Box>
  );
}

export { CategoryTable };
