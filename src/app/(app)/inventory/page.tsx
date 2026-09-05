import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { can } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import {
  getInventoryList,
  type InventorySortColumn,
  type StockFilter,
} from "@/features/inventory/queries";
import type { InventoryStatus } from "@/types/database";
import { InventoryFilters } from "./inventory-filters";
import { InventoryTable } from "./inventory-table";

const PAGE_SIZE = 20;
const SORT_COLUMNS: InventorySortColumn[] = ["part_number", "name", "quantity", "status"];
const STATUSES: InventoryStatus[] = ["active", "discontinued", "damaged"];
const STOCK_FILTERS: StockFilter[] = ["low", "critical", "out_of_stock"];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * The real inventory list (phase3.md goal #1), replacing the Phase 1
 * placeholder. Reads `searchParams` for page/sort/filters and calls
 * `getInventoryList` directly (Server Component - ADR 0004) rather than
 * holding that state client-side.
 */
export default async function InventoryPage(props: PageProps<"/inventory">) {
  const user = await requireRole("inventory.view");
  const searchParams = await props.searchParams;

  const page = Math.max(1, Number(first(searchParams.page)) || 1);
  const sortByParam = first(searchParams.sortBy);
  const sortBy = SORT_COLUMNS.includes(sortByParam as InventorySortColumn)
    ? (sortByParam as InventorySortColumn)
    : "name";
  const sortDir = first(searchParams.sortDir) === "desc" ? "desc" : "asc";

  const statusParam = first(searchParams.status);
  const status = STATUSES.includes(statusParam as InventoryStatus)
    ? (statusParam as InventoryStatus)
    : undefined;

  const linkedParam = first(searchParams.linked);
  const linked =
    linkedParam === "linked" || linkedParam === "unlinked" ? linkedParam : undefined;

  const stockParam = first(searchParams.stock);
  const stockFilter = STOCK_FILTERS.includes(stockParam as StockFilter)
    ? (stockParam as StockFilter)
    : undefined;

  const { rows, totalCount } = await getInventoryList({
    page,
    pageSize: PAGE_SIZE,
    sortBy,
    sortDir,
    status,
    linked,
    stockFilter,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <InventoryFilters status={status} stockFilter={stockFilter} linked={linked} />
        {can(user.role, "inventory.create") ? (
          <Button asChild>
            <Link href="/inventory/new">
              <PlusIcon /> Add part
            </Link>
          </Button>
        ) : null}
      </div>

      <InventoryTable
        rows={rows}
        totalCount={totalCount}
        page={page}
        pageSize={PAGE_SIZE}
        sortBy={sortBy}
        sortDir={sortDir}
      />
    </div>
  );
}
