"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { DataTable } from "@/components/shared/data-table";
import { formatCurrency } from "@/lib/utils";
import type { ValuationBreakdownRow } from "@/features/reports/valuation";

const columns: ColumnDef<ValuationBreakdownRow, unknown>[] = [
  { accessorKey: "label", header: "Name" },
  {
    accessorKey: "itemCount",
    header: "Items",
    cell: ({ row }) => (
      <Typography
        sx={{ fontFamily: "var(--font-plex-mono)" }}
        variant="body2"
      >
        {row.original.itemCount}
      </Typography>
    ),
  },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ row }) => (
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
        <Typography
          sx={{ fontFamily: "var(--font-plex-mono)" }}
          variant="body2"
        >
          {formatCurrency(row.original.value)}
        </Typography>
        {row.original.excludedCount > 0 ? (
          <Typography variant="caption" color="text.secondary">
            ({row.original.excludedCount} missing cost)
          </Typography>
        ) : null}
      </Box>
    ),
  },
];

type ValuationBreakdownTableProps = {
  rows: ValuationBreakdownRow[];
  emptyTitle: string;
};

/**
 * A `ColumnDef`'s `cell` renderers are functions, which can't cross the
 * Server->Client Component boundary as props - this table (and its
 * sibling report tables) exists so `columns` is defined inside a "use
 * client" file instead of the Server Component page.
 */
function ValuationBreakdownTable({
  rows,
  emptyTitle,
}: ValuationBreakdownTableProps) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) => row.label}
      emptyState={{ title: emptyTitle }}
    />
  );
}

export { ValuationBreakdownTable };
