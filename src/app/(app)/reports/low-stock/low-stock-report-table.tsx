"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";

import { DataTable } from "@/components/shared/data-table";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
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
    accessorKey: "categoryName",
    header: "Category",
    cell: ({ row }) => row.original.categoryName ?? "—",
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
    accessorKey: "minStock",
    header: "Min. stock",
    cell: ({ row }) => (
      <Typography
        sx={{ fontFamily: "var(--font-plex-mono)" }}
        variant="body2"
      >
        {row.original.minStock ?? "—"}
      </Typography>
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Tabs
          value={statusFilter}
          onChange={(_, value: StatusFilter) => setStatusFilter(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 36, "& .MuiTab-root": { minHeight: 36, py: 0.5 } }}
        >
          <Tab value="all" label={`All (${rows.length})`} />
          <Tab
            value="out_of_stock"
            label={`Out of Stock (${countFor("out_of_stock")})`}
          />
          <Tab value="critical" label={`Critical (${countFor("critical")})`} />
          <Tab value="low" label={`Low (${countFor("low")})`} />
        </Tabs>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Select
            size="small"
            value={brandFilter}
            onChange={(event: SelectChangeEvent) =>
              setBrandFilter(event.target.value)
            }
            aria-label="Filter by brand"
            sx={{ width: 160 }}
          >
            <MenuItem value="all">All brands</MenuItem>
            {brandOptions.map((brand) => (
              <MenuItem key={brand} value={brand}>
                {brand}
              </MenuItem>
            ))}
          </Select>

          <Select
            size="small"
            value={categoryFilter}
            onChange={(event: SelectChangeEvent) =>
              setCategoryFilter(event.target.value)
            }
            aria-label="Filter by category"
            sx={{ width: 160 }}
          >
            <MenuItem value="all">All categories</MenuItem>
            {categoryOptions.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Box>

      <DataTable
        columns={columns}
        data={filteredRows}
        getRowId={(row) => row.id}
        emptyState={{
          title: "No parts match these filters",
          description: "Try a different status, brand, or category above.",
        }}
      />
    </Box>
  );
}

export { LowStockReportTable };
