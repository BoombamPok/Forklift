"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelativeTime } from "@/lib/utils";
import type { MoverRow, SlowMoverRow } from "@/features/reports/movements";

const fastColumns: ColumnDef<MoverRow, unknown>[] = [
  {
    accessorKey: "name",
    header: "Part",
    cell: ({ row }) => (
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {row.original.name}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", fontFamily: "var(--font-roboto-mono)" }}
        >
          {row.original.partNumber}
        </Typography>
      </Box>
    ),
  },
  {
    accessorKey: "brandName",
    header: "Brand",
    cell: ({ row }) => row.original.brandName ?? "—",
  },
  {
    accessorKey: "quantityMoved",
    header: "Quantity moved",
    cell: ({ row }) => (
      <Typography
        sx={{ fontFamily: "var(--font-roboto-mono)" }}
        variant="body2"
      >
        {row.original.quantityMoved}
      </Typography>
    ),
  },
  {
    accessorKey: "movementCount",
    header: "Movements",
    cell: ({ row }) => (
      <Typography
        sx={{ fontFamily: "var(--font-roboto-mono)" }}
        variant="body2"
      >
        {row.original.movementCount}
      </Typography>
    ),
  },
];

const slowColumns: ColumnDef<SlowMoverRow, unknown>[] = [
  {
    accessorKey: "name",
    header: "Part",
    cell: ({ row }) => (
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {row.original.name}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", fontFamily: "var(--font-roboto-mono)" }}
        >
          {row.original.partNumber}
        </Typography>
      </Box>
    ),
  },
  {
    accessorKey: "brandName",
    header: "Brand",
    cell: ({ row }) => row.original.brandName ?? "—",
  },
  {
    accessorKey: "lastActivityAt",
    header: "Last activity",
    cell: ({ row }) =>
      row.original.hasMovementHistory
        ? formatRelativeTime(row.original.lastActivityAt)
        : `Never moved (added ${formatRelativeTime(row.original.lastActivityAt)})`,
  },
];

function FastMoversTable({ rows }: { rows: MoverRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No movement in this period"
        description="Try a wider date range."
      />
    );
  }
  return (
    <DataTable columns={fastColumns} data={rows} getRowId={(row) => row.id} />
  );
}

function SlowMoversTable({ rows }: { rows: SlowMoverRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Every part moved in this period"
        description="Nothing has sat idle over the selected range."
      />
    );
  }
  return (
    <DataTable columns={slowColumns} data={rows} getRowId={(row) => row.id} />
  );
}

export { FastMoversTable, SlowMoversTable };
