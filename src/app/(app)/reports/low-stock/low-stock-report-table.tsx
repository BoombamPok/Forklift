"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/shared/data-table";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    accessorKey: "categoryName",
    header: "Category",
    cell: ({ row }) => row.original.categoryName ?? "—",
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{row.original.quantity}</span>
    ),
  },
  {
    accessorKey: "minStock",
    header: "Min. stock",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">
        {row.original.minStock ?? "—"}
      </span>
    ),
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

function dedupeSorted(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => v !== null))].sort();
}

type LowStockReportTableProps = {
  rows: LowStockRow[];
};

/**
 * The full, uncapped low-stock/out-of-stock report (phase6.md §4 goal
 * #4) - extends the dashboard's `LowStockTable` (src/app/(app)/
 * dashboard/low-stock-table.tsx) with brand/category filters on top of
 * its existing status tabs. Filtering stays a simple client-side narrow
 * of the already-fetched row set, same "don't over-build filtering
 * here" precedent that table's own comment establishes - the dataset is
 * every qualifying part, not a paginated multi-thousand-row list.
 */
function LowStockReportTable({ rows }: LowStockReportTableProps) {
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [brandFilter, setBrandFilter] = React.useState("all");
  const [categoryFilter, setCategoryFilter] = React.useState("all");

  const brandOptions = React.useMemo(
    () => dedupeSorted(rows.map((row) => row.brandName)),
    [rows],
  );
  const categoryOptions = React.useMemo(
    () => dedupeSorted(rows.map((row) => row.categoryName)),
    [rows],
  );

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

  const filteredRows = rows.filter(
    (row) =>
      (statusFilter === "all" || row.status === statusFilter) &&
      (brandFilter === "all" || row.brandName === brandFilter) &&
      (categoryFilter === "all" || row.categoryName === categoryFilter),
  );
  const countFor = (status: LowStockStatus) =>
    rows.filter((row) => row.status === status).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StatusFilter)}
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

        <div className="flex gap-2">
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger size="sm" className="w-40">
              <SelectValue placeholder="All brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All brands</SelectItem>
              {brandOptions.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger size="sm" className="w-40">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categoryOptions.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredRows}
        getRowId={(row) => row.id}
        emptyState={{
          title: "No parts match these filters",
          description: "Try a different status, brand, or category above.",
        }}
      />
    </div>
  );
}

export { LowStockReportTable };
