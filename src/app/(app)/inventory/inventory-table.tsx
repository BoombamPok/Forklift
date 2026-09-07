"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import Typography from "@mui/material/Typography";

import { DataTable } from "@/components/shared/data-table";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import type {
  InventoryListRow,
  InventorySortColumn,
} from "@/features/inventory/queries";
import type { InventoryStatus } from "@/types/database";

const STATUS_LABEL: Record<InventoryStatus, string> = {
  active: "Active",
  discontinued: "Discontinued",
  damaged: "Damaged",
};

const STATUS_TONE: Record<InventoryStatus, StatusTone> = {
  active: "success",
  discontinued: "secondary",
  damaged: "destructive",
};

const columns: ColumnDef<InventoryListRow, unknown>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Part",
    cell: ({ row }) => (
      <Link
        href={`/inventory/${row.original.id}`}
        style={{ display: "block", textDecoration: "none" }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {row.original.name}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontFamily: "var(--font-plex-mono)" }}
        >
          {row.original.partNumber}
        </Typography>
      </Link>
    ),
  },
  {
    id: "brand",
    accessorKey: "brandName",
    header: "Brand",
    enableSorting: false,
    cell: ({ row }) => row.original.brandName ?? "—",
  },
  {
    id: "quantity",
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
    id: "location",
    accessorKey: "boxCode",
    header: "Location",
    enableSorting: false,
    cell: ({ row }) => row.original.boxCode ?? "—",
  },
  {
    id: "status",
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

type InventoryTableProps = {
  rows: InventoryListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  sortBy: InventorySortColumn;
  sortDir: "asc" | "desc";
};

/**
 * Thin URL-driven wrapper around the shared `DataTable`'s manual
 * pagination/sorting mode (phase3.md goal #1) - changing page or sort
 * pushes a new URL, which re-runs the list Server Component with the
 * updated `searchParams`. `id`s above match `InventorySortColumn`
 * exactly so a header's `column.id` can be forwarded straight to the
 * query layer with no translation table. Part number itself isn't a
 * separately sortable column in this view (it's shown stacked under
 * the part name) - sorting by name covers the common case, matching
 * LowStockTable's existing combined "Part" cell convention.
 */
function InventoryTable({
  rows,
  totalCount,
  page,
  pageSize,
  sortBy,
  sortDir,
}: InventoryTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function pushParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined) params.delete(key);
      else params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const sorting: SortingState = [{ id: sortBy, desc: sortDir === "desc" }];

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      emptyState={{
        title: "No parts match these filters",
        description:
          "Try a different status, stock level, or catalogue filter.",
      }}
      manualPagination
      pageCount={Math.max(1, Math.ceil(totalCount / pageSize))}
      pagination={{ pageIndex: page - 1, pageSize }}
      onPaginationChange={(next) =>
        pushParams({ page: String(next.pageIndex + 1) })
      }
      manualSorting
      sorting={sorting}
      onSortingChange={(next) => {
        const [first] = next;
        pushParams({
          sortBy: first?.id ?? "name",
          sortDir: first?.desc ? "desc" : "asc",
          page: "1",
        });
      }}
    />
  );
}

export { InventoryTable };
