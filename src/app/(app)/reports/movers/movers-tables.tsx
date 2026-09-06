"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelativeTime } from "@/lib/utils";
import type { MoverRow, SlowMoverRow } from "@/features/reports/movements";

const fastColumns: ColumnDef<MoverRow, unknown>[] = [
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
    accessorKey: "quantityMoved",
    header: "Quantity moved",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">
        {row.original.quantityMoved}
      </span>
    ),
  },
  {
    accessorKey: "movementCount",
    header: "Movements",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">
        {row.original.movementCount}
      </span>
    ),
  },
];

const slowColumns: ColumnDef<SlowMoverRow, unknown>[] = [
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
    accessorKey: "lastActivityAt",
    header: "Last activity",
    cell: ({ row }) => (
      <span>
        {row.original.hasMovementHistory
          ? formatRelativeTime(row.original.lastActivityAt)
          : `Never moved (added ${formatRelativeTime(row.original.lastActivityAt)})`}
      </span>
    ),
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
