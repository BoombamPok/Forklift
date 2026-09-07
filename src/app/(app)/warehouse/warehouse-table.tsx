"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { PencilIcon, PlusIcon } from "lucide-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MuiLink from "@mui/material/Link";
import Typography from "@mui/material/Typography";

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
        <MuiLink
          component={Link}
          href={`/warehouse/${row.original.id}`}
          sx={{ fontWeight: 500, color: "text.primary" }}
        >
          {row.original.name}
        </MuiLink>
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
        <Typography
          sx={{ fontFamily: "var(--font-plex-mono)" }}
          variant="body2"
        >
          {row.original.rackCount}
        </Typography>
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
              <Box
                sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}
              >
                <IconButton
                  label="Edit warehouse"
                  onClick={() => setEditing(row.original)}
                >
                  <PencilIcon size={16} />
                </IconButton>
                <LocationDeleteAction
                  entityLabel="Warehouse"
                  warningDescription="This also removes every rack, shelf, and box inside it. It's blocked if anything inside is currently holding stock - move or reassign those parts first."
                  onDelete={() => deleteWarehouse(row.original.id)}
                  onDeleted={() => router.refresh()}
                />
              </Box>
            ),
          } satisfies ColumnDef<WarehouseListRow, unknown>,
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
            Add warehouse
          </Button>
        </Box>
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
    </Box>
  );
}

export { WarehouseTable };
