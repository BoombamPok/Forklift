"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import Typography from "@mui/material/Typography";

import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { VerificationBadge } from "@/components/shared/verification-badge";
import type {
  CataloguePartListRow,
  CatalogueSortColumn,
} from "@/features/catalogue/queries";

const columns: ColumnDef<CataloguePartListRow, unknown>[] = [
  {
    id: "part_number",
    accessorKey: "partNumber",
    header: "Part",
    cell: ({ row }) => (
      <Link
        href={`/catalogue/parts/${row.original.id}`}
        style={{ display: "block", textDecoration: "none" }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {row.original.name}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontFamily: "var(--font-roboto-mono)" }}
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
    id: "category",
    accessorKey: "categoryName",
    header: "Category",
    enableSorting: false,
    cell: ({ row }) => row.original.categoryName ?? "—",
  },
  {
    id: "linked",
    header: "Stock",
    enableSorting: false,
    cell: ({ row }) => (
      <StatusBadge
        label={row.original.linked ? "Catalogue + Inventory" : "Catalogue Only"}
        tone={row.original.linked ? "success" : "secondary"}
      />
    ),
  },
  {
    id: "verification_status",
    accessorKey: "verificationStatus",
    header: "Verification",
    cell: ({ row }) => (
      <VerificationBadge status={row.original.verificationStatus} />
    ),
  },
];

type PartsTableProps = {
  rows: CataloguePartListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  sortBy: CatalogueSortColumn;
  sortDir: "asc" | "desc";
};

/**
 * URL-driven manual pagination/sorting, mirroring `InventoryTable`
 * (src/app/(app)/inventory/inventory-table.tsx) exactly - column `id`s
 * match `CatalogueSortColumn` so a header click forwards straight to
 * the query layer.
 */
function PartsTable({
  rows,
  totalCount,
  page,
  pageSize,
  sortBy,
  sortDir,
}: PartsTableProps) {
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
        description: "Try a different search term or filter combination.",
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
          sortBy: first?.id ?? "part_number",
          sortDir: first?.desc ? "desc" : "asc",
          page: "1",
        });
      }}
    />
  );
}

export { PartsTable };
