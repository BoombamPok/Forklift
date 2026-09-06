"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/shared/data-table";
import { formatRelativeTime } from "@/lib/utils";
import type { StockAgingRow } from "@/features/reports/aging";

const columns: ColumnDef<StockAgingRow, unknown>[] = [
  {
    accessorKey: "name",
    header: "Part",
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-foreground">{row.original.name}</p>
        <p className="font-mono text-xs text-muted-foreground">
          {row.original.partNumber}
        </p>
      </div>
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
      <span className="font-mono tabular-nums">{row.original.quantity}</span>
    ),
  },
  {
    accessorKey: "lastActivityAt",
    header: "Idle since",
    cell: ({ row }) => (
      <span>
        {formatRelativeTime(row.original.lastActivityAt)}
        {!row.original.hasMovementHistory ? (
          <span className="ml-1.5 text-xs text-muted-foreground">
            (never moved)
          </span>
        ) : null}
      </span>
    ),
  },
];

function AgingTable({ rows }: { rows: StockAgingRow[] }) {
  return (
    <DataTable columns={columns} data={rows} getRowId={(row) => row.id} />
  );
}

export { AgingTable };
