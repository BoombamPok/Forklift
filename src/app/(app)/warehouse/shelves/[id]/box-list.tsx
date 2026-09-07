"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { PencilIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { IconButton } from "@/components/shared/icon-button";
import { createBox, deleteBox, updateBox } from "@/features/warehouse/actions";
import type { BoxSummary } from "@/features/warehouse/queries";
import { CodeFormDialog } from "../../code-form-dialog";
import { LocationDeleteAction } from "../../location-delete-action";

type BoxListProps = {
  shelfId: string;
  boxes: BoxSummary[];
  canManage: boolean;
};

/** The shelf detail page's box browser (phase4.md §4). */
function BoxList({ shelfId, boxes, canManage }: BoxListProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<BoxSummary | null>(null);

  const columns: ColumnDef<BoxSummary, unknown>[] = [
    {
      id: "code",
      accessorKey: "code",
      header: "Box",
      cell: ({ row }) => (
        <Link
          href={`/warehouse/boxes/${row.original.id}`}
          className="font-medium text-foreground hover:underline"
        >
          {row.original.code}
        </Link>
      ),
    },
    {
      id: "partCount",
      header: "Parts",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.partCount > 0 ? (
          <StatusBadge
            label={`${row.original.partCount} part${row.original.partCount === 1 ? "" : "s"}`}
            tone="outline"
          />
        ) : (
          <StatusBadge label="Empty" tone="secondary" />
        ),
    },
    ...(canManage
      ? [
          {
            id: "actions",
            header: "",
            enableSorting: false,
            cell: ({ row }: { row: { original: BoxSummary } }) => (
              <div className="flex justify-end gap-1">
                <IconButton
                  label="Edit box"
                  onClick={() => setEditing(row.original)}
                >
                  <PencilIcon />
                </IconButton>
                <LocationDeleteAction
                  entityLabel="Box"
                  warningDescription="It's blocked if this box currently holds any stock - move or reassign those parts first."
                  onDelete={() => deleteBox(row.original.id, shelfId)}
                  onDeleted={() => router.refresh()}
                />
              </div>
            ),
          } satisfies ColumnDef<BoxSummary, unknown>,
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-base font-semibold">Boxes</h3>
        {canManage ? (
          <Button
            type="button"
            variant="gradient"
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon /> Add box
          </Button>
        ) : null}
      </div>

      <DataTable
        columns={columns}
        data={boxes}
        getRowId={(row) => row.id}
        emptyState={{
          title: "No boxes yet",
          description: canManage
            ? "Add a box so parts can be assigned to this shelf."
            : "An admin or manager hasn't added any boxes yet.",
        }}
      />

      {canManage ? (
        <>
          <CodeFormDialog
            key="create"
            entityLabel="Box"
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSubmit={(values) => createBox(shelfId, values)}
          />
          <CodeFormDialog
            key={editing?.id ?? "closed"}
            entityLabel="Box"
            open={editing !== null}
            onOpenChange={(open) => {
              if (!open) setEditing(null);
            }}
            defaultCode={editing?.code}
            onSubmit={(values) => updateBox(editing!.id, shelfId, values)}
          />
        </>
      ) : null}
    </div>
  );
}

export { BoxList };
