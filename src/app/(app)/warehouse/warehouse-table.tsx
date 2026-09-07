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
import { deleteWarehouse } from "@/features/warehouse/actions";
import type { WarehouseListRow } from "@/features/warehouse/queries";
import { WarehouseFormDialog } from "./warehouse-form-dialog";
import { LocationDeleteAction } from "./location-delete-action";

type WarehouseTableProps = {
  rows: WarehouseListRow[];
  canManage: boolean;
};

/**
 * `/warehouse`'s list (phase4.md §4) - name/address/rack count/occupancy,
 * with create/edit/soft-delete gated on `warehouse.manage` (absent, not
 * disabled, per the Phase 2/3 precedent).
 */
function WarehouseTable({ rows, canManage }: WarehouseTableProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<WarehouseListRow | null>(null);

  const columns: ColumnDef<WarehouseListRow, unknown>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: "Warehouse",
      cell: ({ row }) => (
        <Link
          href={`/warehouse/${row.original.id}`}
          className="font-medium text-foreground hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      id: "address",
      accessorKey: "address",
      header: "Address",
      enableSorting: false,
      cell: ({ row }) => row.original.address ?? "—",
    },
    {
      id: "rackCount",
      accessorKey: "rackCount",
      header: "Racks",
      cell: ({ row }) => (
        <span className="font-mono tabular-nums">{row.original.rackCount}</span>
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
            cell: ({ row }: { row: { original: WarehouseListRow } }) => (
              <div className="flex justify-end gap-1">
                <IconButton
                  label="Edit warehouse"
                  onClick={() => setEditing(row.original)}
                >
                  <PencilIcon />
                </IconButton>
                <LocationDeleteAction
                  entityLabel="Warehouse"
                  warningDescription="This also removes every rack, shelf, and box inside it. It's blocked if anything inside is currently holding stock - move or reassign those parts first."
                  onDelete={() => deleteWarehouse(row.original.id)}
                  onDeleted={() => router.refresh()}
                />
              </div>
            ),
          } satisfies ColumnDef<WarehouseListRow, unknown>,
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      {canManage ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="gradient"
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon /> Add warehouse
          </Button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        emptyState={{
          title: "No warehouses yet",
          description: canManage
            ? "Add a warehouse to start building out racks, shelves, and boxes."
            : "An admin or manager hasn't set up a warehouse yet.",
        }}
      />

      {canManage ? (
        <>
          <WarehouseFormDialog open={createOpen} onOpenChange={setCreateOpen} />
          <WarehouseFormDialog
            key={editing?.id ?? "closed"}
            open={editing !== null}
            onOpenChange={(open) => {
              if (!open) setEditing(null);
            }}
            warehouseId={editing?.id}
            defaultValues={
              editing
                ? { name: editing.name, address: editing.address ?? undefined }
                : undefined
            }
          />
        </>
      ) : null}
    </div>
  );
}

export { WarehouseTable };
