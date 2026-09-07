"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { DataTable } from "@/components/shared/data-table";
import { formatRelativeTime } from "@/lib/utils";
import type { StockAgingRow } from "@/features/reports/aging";

const columns: ColumnDef<StockAgingRow, unknown>[] = [
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
          sx={{ display: "block", fontFamily: "var(--font-plex-mono)" }}
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
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => (
      <Typography
        sx={{ fontFamily: "var(--font-plex-mono)" }}
        variant="body2"
      >
        {row.original.quantity}
      </Typography>
    ),
  },
  {
    accessorKey: "lastActivityAt",
    header: "Idle since",
    cell: ({ row }) => (
      <Typography variant="body2">
        {formatRelativeTime(row.original.lastActivityAt)}
        {!row.original.hasMovementHistory ? (
          <Typography
            component="span"
            variant="caption"
            color="text.secondary"
            sx={{ ml: 0.75 }}
          >
            (never moved)
          </Typography>
        ) : null}
      </Typography>
    ),
  },
];

function AgingTable({ rows }: { rows: StockAgingRow[] }) {
  return <DataTable columns={columns} data={rows} getRowId={(row) => row.id} />;
}

export { AgingTable };
