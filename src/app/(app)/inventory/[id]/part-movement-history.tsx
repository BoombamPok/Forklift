"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Box from "@mui/material/Box";

import { DataTable } from "@/components/shared/data-table";
import { formatRelativeTime } from "@/lib/utils";
import type { PartMovementHistoryItem } from "@/features/inventory/queries";

const DIRECTION_COLOR: Record<PartMovementHistoryItem["direction"], string> = {
  in: "var(--mui-palette-success-main)",
  out: "var(--mui-palette-error-main)",
  none: "var(--mui-palette-text-disabled)",
};

const columns: ColumnDef<PartMovementHistoryItem, unknown>[] = [
  {
    accessorKey: "description",
    header: "Movement",
    cell: ({ row }) => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <Box
          aria-hidden
          sx={{
            width: 6,
            height: 6,
            flexShrink: 0,
            borderRadius: "50%",
            bgcolor: DIRECTION_COLOR[row.original.direction],
          }}
        />
        {row.original.description}
      </Box>
    ),
  },
  {
    accessorKey: "actorName",
    header: "By",
    enableSorting: false,
    cell: ({ row }) => row.original.actorName ?? "—",
  },
  {
    accessorKey: "timestamp",
    header: "When",
    enableSorting: false,
    cell: ({ row }) => formatRelativeTime(row.original.timestamp),
  },
];

type PartMovementHistoryProps = {
  items: PartMovementHistoryItem[];
};

function PartMovementHistory({ items }: PartMovementHistoryProps) {
  return (
    <DataTable
      columns={columns}
      data={items}
      getRowId={(row) => row.id}
      emptyState={{
        title: "No movements yet",
        description:
          "Stock In/Out, transfers, and adjustments will appear here.",
      }}
    />
  );
}

export { PartMovementHistory };
