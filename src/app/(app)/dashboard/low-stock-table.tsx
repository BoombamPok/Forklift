"use client";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { ArrowRightIcon } from "lucide-react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
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
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => (
      <Box component="span" sx={{ fontFamily: "var(--font-plex-mono)" }}>
        {row.original.quantity}
      </Box>
    ),
  },
  {
    accessorKey: "minStock",
    header: "Min. stock",
    cell: ({ row }) => (
      <Box component="span" sx={{ fontFamily: "var(--font-plex-mono)" }}>
        {row.original.minStock ?? "—"}
      </Box>
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
  {
    id: "action",
    header: "",
    enableSorting: false,
    // "Restock" navigates to the part, where stock movements are actually
    // recorded. It deliberately does not adjust quantity from here: a
    // movement needs a type and a reason, and a one-click increment from
    // a dashboard would write an unattributable row into a ledger that
    // has no UPDATE or DELETE policy.
    cell: ({ row }) => (
      <Button
        component={Link}
        href={`/inventory/${row.original.id}`}
        size="small"
        variant="outlined"
        endIcon={<ArrowRightIcon size={14} />}
        aria-label={`Restock ${row.original.name}`}
        sx={{ whiteSpace: "nowrap" }}
      >
        Restock
      </Button>
    ),
  },
];

type LowStockTableProps = {
  rows: LowStockRow[];
};

/**
 * Read-only summary, not the full inventory table: no editing, no
 * "Restock" action. The status filter is a simple client-side narrow of
 * the already-fetched row set, not a separate query per status.
 *
 * The tabs filter the table below rather than switching between
 * separate panels - deliberately not wired with aria-controls pointing
 * at a tabpanel (MUI doesn't require it, unlike Radix, which forced an
 * earlier version of this component to render 4 empty hidden panels
 * just to satisfy "aria-valid-attr-value"), since there's no per-tab
 * panel content to point at.
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Tabs
        value={filter}
        onChange={(_, value: StatusFilter) => setFilter(value)}
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

      <DataTable
        columns={columns}
        data={filteredRows}
        getRowId={(row) => row.id}
        emptyState={{
          title: "No parts match this filter",
          description: "Try a different status above.",
        }}
      />
    </Box>
  );
}

export { LowStockTable };
