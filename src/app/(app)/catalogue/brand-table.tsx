"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { IconButton } from "@/components/shared/icon-button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  createBrand,
  softDeleteBrand,
  updateBrand,
} from "@/features/catalogue/actions";
import type { BrandListRow } from "@/features/catalogue/queries";
import { NameFormDialog } from "./name-form-dialog";

type BrandTableProps = {
  rows: BrandListRow[];
  canManage: boolean;
};

/**
 * `/catalogue/brands`'s full CRUD table (phase5.md §4) - a brand can be
 * soft-deleted even with models/parts still pointing at it (no cascade-
 * blocking requirement here, unlike Phase 4's warehouse hierarchy), so
 * this is a plain `ConfirmDialog` + soft delete, not `LocationDeleteAction`.
 */
function BrandTable({ rows, canManage }: BrandTableProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<BrandListRow | null>(null);
  const [deleting, setDeleting] = React.useState<BrandListRow | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  async function handleConfirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const result = await softDeleteBrand(deleting.id);
    setDeleteLoading(false);
    setDeleting(null);

    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Brand deleted");
    router.refresh();
  }

  const columns: ColumnDef<BrandListRow, unknown>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: "Brand",
      cell: ({ row }) => (
        <Link
          href={`/catalogue/models?brandId=${row.original.id}`}
          className="font-medium text-foreground hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      id: "modelCount",
      accessorKey: "modelCount",
      header: "Models",
      cell: ({ row }) => (
        <span className="font-mono tabular-nums">
          {row.original.modelCount}
        </span>
      ),
    },
    {
      id: "partCount",
      accessorKey: "partCount",
      header: "Parts",
      cell: ({ row }) => (
        <span className="font-mono tabular-nums">{row.original.partCount}</span>
      ),
    },
    ...(canManage
      ? [
          {
            id: "actions",
            header: "",
            enableSorting: false,
            cell: ({ row }: { row: { original: BrandListRow } }) => (
              <div className="flex justify-end gap-1">
                <IconButton
                  label="Edit brand"
                  onClick={() => setEditing(row.original)}
                >
                  <PencilIcon />
                </IconButton>
                <IconButton
                  label="Delete brand"
                  onClick={() => setDeleting(row.original)}
                >
                  <Trash2Icon />
                </IconButton>
              </div>
            ),
          } satisfies ColumnDef<BrandListRow, unknown>,
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      {canManage ? (
        <div className="flex justify-end">
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <PlusIcon /> Add brand
          </Button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        emptyState={{
          title: "No brands yet",
          description: canManage
            ? "Add a brand to start building out the catalogue."
            : "An admin or manager hasn't added a brand yet.",
        }}
      />

      {canManage ? (
        <>
          <NameFormDialog
            entityLabel="Brand"
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSubmit={createBrand}
          />
          <NameFormDialog
            key={editing?.id ?? "closed"}
            entityLabel="Brand"
            open={editing !== null}
            onOpenChange={(open) => {
              if (!open) setEditing(null);
            }}
            defaultName={editing?.name}
            onSubmit={(values) => updateBrand(editing!.id, values)}
          />
          <ConfirmDialog
            open={deleting !== null}
            onOpenChange={(open) => !open && setDeleting(null)}
            title="Delete this brand?"
            description="Models and parts already linked to this brand keep their existing data - this only removes the brand from future selection lists."
            confirmLabel="Delete"
            loading={deleteLoading}
            onConfirm={handleConfirmDelete}
          />
        </>
      ) : null}
    </div>
  );
}

export { BrandTable };
