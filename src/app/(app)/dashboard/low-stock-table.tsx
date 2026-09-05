"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/shared/data-table";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  LowStockRow,
  LowStockStatus,
} from "@/features/dashboard/low-stock";

const STATUS_LABEL: Record<LowStockStatus, string> = {
  out_of_stock: "Out of Stock",
  critical: "Critical",
  low: "Low",
};

const STATUS_TONE: Record<LowStockStatus, StatusTone> = {
  out_of_stock: "destructive",
  critical: "destructive",
  low: "warning",
};

type StatusFilter = "all" | LowStockStatus;

const columns: ColumnDef<LowStockRow, unknown>[] = [
  {
    accessorKey: "name",
    header: "Part",
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-foreground">{row.original.name}</p>
        <p className="text-xs text-muted-foreground">
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
  },
  {
    accessorKey: "minStock",
    header: "Min. stock",
    cell: ({ row }) => row.original.minStock ?? "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge
        label={STATUS_LABEL[row.original.status]}
        tone={STATUS_TONE[row.original.status]}
      />
    ),
  },
];

type LowStockTableProps = {
  rows: LowStockRow[];
};

/**
 * Read-only summary, not the full inventory table (phase2c.md's "2d" -
 * that's Phase 3): no editing, no "Restock" action. The status filter is
 * a simple client-side narrow of the already-fetched row set, not a
 * separate query per status - deliberately basic per the spec's "don't
 * over-build filtering here."
 */
function LowStockTable({ rows }: LowStockTableProps) {
  const [filter, setFilter] = React.useState<StatusFilter>("all");

  if (rows.length === 0) {
    return (
      <DataTable
        columns={columns}
        data={[]}
        emptyState={{
          title: "Nothing needs attention right now",
          description: "Every part is stocked above its configured threshold.",
        }}
      />
    );
  }

  const filteredRows =
    filter === "all" ? rows : rows.filter((row) => row.status === filter);
  const countFor = (status: LowStockStatus) =>
    rows.filter((row) => row.status === status).length;

  return (
    <div className="space-y-3">
      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as StatusFilter)}
      >
        <TabsList>
          <TabsTrigger value="all">All ({rows.length})</TabsTrigger>
          <TabsTrigger value="out_of_stock">
            Out of Stock ({countFor("out_of_stock")})
          </TabsTrigger>
          <TabsTrigger value="critical">
            Critical ({countFor("critical")})
          </TabsTrigger>
          <TabsTrigger value="low">Low ({countFor("low")})</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={filteredRows}
        getRowId={(row) => row.id}
        emptyState={{
          title: "No parts match this filter",
          description: "Try a different status above.",
        }}
      />
    </div>
  );
}

export { LowStockTable };
