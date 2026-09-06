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
  createRack,
  deleteRack,
  updateRack,
} from "@/features/warehouse/actions";
import type { RackSummary } from "@/features/warehouse/queries";
import { CodeFormDialog } from "../code-form-dialog";
import { LocationDeleteAction } from "../location-delete-action";

type RackListProps = {
  warehouseId: string;
  racks: RackSummary[];
  canManage: boolean;
};

/**
 * The warehouse detail page's rack browser (phase4.md §4) - racks within
 * this warehouse, with create/edit/soft-delete gated on `warehouse.manage`.
 */
function RackList({ warehouseId, racks, canManage }: RackListProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<RackSummary | null>(null);

  const columns: ColumnDef<RackSummary, unknown>[] = [
    {
      id: "code",
      accessorKey: "code",
      header: "Rack",
      cell: ({ row }) => (
        <Link
          href={`/warehouse/racks/${row.original.id}`}
          className="font-medium text-foreground hover:underline"
        >
          {row.original.code}
        </Link>
      ),
    },
    {
      id: "shelfCount",
      accessorKey: "shelfCount",
      header: "Shelves",
      cell: ({ row }) => (
        <span className="font-mono tabular-nums">
          {row.original.shelfCount}
        </span>
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
            cell: ({ row }: { row: { original: RackSummary } }) => (
              <div className="flex justify-end gap-1">
                <IconButton
                  label="Edit rack"
                  onClick={() => setEditing(row.original)}
                >
                  <PencilIcon />
                </IconButton>
                <LocationDeleteAction
                  entityLabel="Rack"
                  warningDescription="This also removes every shelf and box on this rack. It's blocked if anything on it is currently holding stock - move or reassign those parts first."
                  onDelete={() => deleteRack(row.original.id, warehouseId)}
                  onDeleted={() => router.refresh()}
                />
              </div>
            ),
          } satisfies ColumnDef<RackSummary, unknown>,
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-base font-semibold">Racks</h3>
        {canManage ? (
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <PlusIcon /> Add rack
          </Button>
        ) : null}
      </div>

      <DataTable
        columns={columns}
        data={racks}
        getRowId={(row) => row.id}
        emptyState={{
          title: "No racks yet",
          description: canManage
            ? "Add a rack to start building out this warehouse's shelves and boxes."
            : "An admin or manager hasn't added any racks yet.",
        }}
      />

      {canManage ? (
        <>
          <CodeFormDialog
            key="create"
            entityLabel="Rack"
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSubmit={(values) => createRack(warehouseId, values)}
          />
          <CodeFormDialog
            key={editing?.id ?? "closed"}
            entityLabel="Rack"
            open={editing !== null}
            onOpenChange={(open) => {
              if (!open) setEditing(null);
            }}
            defaultCode={editing?.code}
            onSubmit={(values) => updateRack(editing!.id, warehouseId, values)}
          />
        </>
      ) : null}
    </div>
  );
}

export { RackList };
