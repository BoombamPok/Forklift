"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/shared/data-table";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { PartMovementHistoryItem } from "@/features/inventory/queries";

const DIRECTION_DOT: Record<PartMovementHistoryItem["direction"], string> = {
  in: "bg-success",
  out: "bg-destructive",
  none: "bg-muted-foreground/40",
};

const columns: ColumnDef<PartMovementHistoryItem, unknown>[] = [
  {
    accessorKey: "description",
    header: "Movement",
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            DIRECTION_DOT[row.original.direction],
          )}
        />
        {row.original.description}
      </div>
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
