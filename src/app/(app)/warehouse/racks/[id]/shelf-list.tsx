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
        <MuiLink
          component={Link}
          href={`/warehouse/shelves/${row.original.id}`}
          sx={{ fontWeight: 500, color: "text.primary" }}
        >
          {row.original.code}
        </MuiLink>
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
              <Box
                sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}
              >
                <IconButton
                  label="Edit shelf"
                  onClick={() => setEditing(row.original)}
                >
                  <PencilIcon size={16} />
                </IconButton>
                <LocationDeleteAction
                  entityLabel="Shelf"
                  warningDescription="This also removes every box on this shelf. It's blocked if anything on it is currently holding stock - move or reassign those parts first."
                  onDelete={() => deleteShelf(row.original.id, rackId)}
                  onDeleted={() => router.refresh()}
                />
              </Box>
            ),
          } satisfies ColumnDef<ShelfSummary, unknown>,
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
          Shelves
        </Typography>
        {canManage ? (
          <Button
            type="button"
            variant="contained"
            startIcon={<PlusIcon size={16} />}
            onClick={() => setCreateOpen(true)}
          >
            Add shelf
          </Button>
        ) : null}
      </Box>

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
    </Box>
  );
}

export { ShelfList };
