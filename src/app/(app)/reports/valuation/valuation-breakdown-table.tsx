"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/shared/data-table";
import { formatCurrency } from "@/lib/utils";
import type { ValuationBreakdownRow } from "@/features/reports/valuation";

const columns: ColumnDef<ValuationBreakdownRow, unknown>[] = [
  { accessorKey: "label", header: "Name" },
  {
    accessorKey: "itemCount",
    header: "Items",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{row.original.itemCount}</span>
    ),
  },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">
        {formatCurrency(row.original.value)}
        {row.original.excludedCount > 0 ? (
          <span className="ml-1.5 text-xs text-muted-foreground">
            ({row.original.excludedCount} missing cost)
          </span>
        ) : null}
      </span>
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
