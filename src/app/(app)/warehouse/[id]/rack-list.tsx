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
        <MuiLink
          component={Link}
          href={`/warehouse/racks/${row.original.id}`}
          sx={{ fontWeight: 500, color: "text.primary" }}
        >
          {row.original.code}
        </MuiLink>
      ),
    },
    {
      id: "shelfCount",
      accessorKey: "shelfCount",
      header: "Shelves",
      cell: ({ row }) => (
        <Typography
          sx={{ fontFamily: "var(--font-plex-mono)" }}
          variant="body2"
        >
          {row.original.shelfCount}
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
            cell: ({ row }: { row: { original: RackSummary } }) => (
              <Box
                sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}
              >
                <IconButton
                  label="Edit rack"
                  onClick={() => setEditing(row.original)}
                >
                  <PencilIcon size={16} />
                </IconButton>
                <LocationDeleteAction
                  entityLabel="Rack"
                  warningDescription="This also removes every shelf and box on this rack. It's blocked if anything on it is currently holding stock - move or reassign those parts first."
                  onDelete={() => deleteRack(row.original.id, warehouseId)}
                  onDeleted={() => router.refresh()}
                />
              </Box>
            ),
          } satisfies ColumnDef<RackSummary, unknown>,
        ]
      : []),
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Racks
        </Typography>
        {canManage ? (
          <Button
            type="button"
            variant="contained"
            startIcon={<PlusIcon size={16} />}
            onClick={() => setCreateOpen(true)}
          >
            Add rack
          </Button>
        ) : null}
      </Box>

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
    </Box>
  );
}

export { RackList };
