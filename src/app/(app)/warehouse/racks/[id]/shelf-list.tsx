"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { PencilIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { OccupancyBadge } from "@/components/shared/occupancy-badge";
import { IconButton } from "@/components/shared/icon-button";
import {
  createShelf,
  deleteShelf,
  updateShelf,
} from "@/features/warehouse/actions";
import type { ShelfSummary } from "@/features/warehouse/queries";
import { CodeFormDialog } from "../../code-form-dialog";
import { LocationDeleteAction } from "../../location-delete-action";

type ShelfListProps = {
  rackId: string;
  shelves: ShelfSummary[];
  canManage: boolean;
};

/** The rack detail page's shelf browser (phase4.md §4). */
function ShelfList({ rackId, shelves, canManage }: ShelfListProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ShelfSummary | null>(null);

  const columns: ColumnDef<ShelfSummary, unknown>[] = [
    {
      id: "code",
      accessorKey: "code",
      header: "Shelf",
      cell: ({ row }) => (
        <Link
          href={`/warehouse/shelves/${row.original.id}`}
          className="font-medium text-foreground hover:underline"
        >
          {row.original.code}
        </Link>
      ),
    },
    {
      id: "occupancy",
      header: "Occupancy",
      enableSorting: false,
      cell: ({ row }) => (
        <OccupancyBadge
          boxesOccupied={row.original.boxesOccupied}
          boxesTotal={row.original.boxesTotal}
        />
      ),
    },
    ...(canManage
      ? [
          {
            id: "actions",
            header: "",
            enableSorting: false,
            cell: ({ row }: { row: { original: ShelfSummary } }) => (
              <div className="flex justify-end gap-1">
                <IconButton
                  label="Edit shelf"
                  onClick={() => setEditing(row.original)}
                >
                  <PencilIcon />
                </IconButton>
                <LocationDeleteAction
                  entityLabel="Shelf"
                  warningDescription="This also removes every box on this shelf. It's blocked if anything on it is currently holding stock - move or reassign those parts first."
                  onDelete={() => deleteShelf(row.original.id, rackId)}
                  onDeleted={() => router.refresh()}
                />
              </div>
            ),
          } satisfies ColumnDef<ShelfSummary, unknown>,
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-base font-semibold">Shelves</h3>
        {canManage ? (
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <PlusIcon /> Add shelf
          </Button>
        ) : null}
      </div>

      <DataTable
        columns={columns}
        data={shelves}
        getRowId={(row) => row.id}
        emptyState={{
          title: "No shelves yet",
          description: canManage
            ? "Add a shelf to start building out this rack's boxes."
            : "An admin or manager hasn't added any shelves yet.",
        }}
      />

      {canManage ? (
        <>
          <CodeFormDialog
            key="create"
            entityLabel="Shelf"
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSubmit={(values) => createShelf(rackId, values)}
          />
          <CodeFormDialog
            key={editing?.id ?? "closed"}
            entityLabel="Shelf"
            open={editing !== null}
            onOpenChange={(open) => {
              if (!open) setEditing(null);
            }}
            defaultCode={editing?.code}
            onSubmit={(values) => updateShelf(editing!.id, rackId, values)}
          />
        </>
      ) : null}
    </div>
  );
}

export { ShelfList };
