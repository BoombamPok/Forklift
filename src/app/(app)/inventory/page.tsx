import { PlusIcon } from "lucide-react";
import Box from "@mui/material/Box";

import { requireRole } from "@/lib/auth/require-role";
import { can } from "@/lib/permissions";
import { toErrorKind } from "@/lib/errors";
import { ErrorState } from "@/components/shared/error-state";
import { NavLinkButton } from "@/components/shared/nav-link-button";
import {
  getInventoryList,
  type InventorySortColumn,
  type StockFilter,
} from "@/features/inventory/queries";
import type { InventoryStatus } from "@/types/database";
import { firstParam } from "@/lib/search-params";
import { InventoryFilters } from "./inventory-filters";
import { InventoryTable } from "./inventory-table";

const PAGE_SIZE = 20;
const SORT_COLUMNS: InventorySortColumn[] = [
  "part_number",
  "name",
  "quantity",
  "status",
];
const STATUSES: InventoryStatus[] = ["active", "discontinued", "damaged"];
const STOCK_FILTERS: StockFilter[] = ["low", "critical", "out_of_stock"];

/**
 * The real inventory list (phase3.md goal #1), replacing the Phase 1
 * placeholder. Reads `searchParams` for page/sort/filters and calls
 * `getInventoryList` directly (Server Component - ADR 0004) rather than
 * holding that state client-side.
 */
export default async function InventoryPage(props: PageProps<"/inventory">) {
  const user = await requireRole("inventory.view");
  const searchParams = await props.searchParams;

  const page = Math.max(1, Number(firstParam(searchParams.page)) || 1);
  const sortByParam = firstParam(searchParams.sortBy);
  const sortBy = SORT_COLUMNS.includes(sortByParam as InventorySortColumn)
    ? (sortByParam as InventorySortColumn)
    : "name";
  const sortDir = firstParam(searchParams.sortDir) === "desc" ? "desc" : "asc";

  const statusParam = firstParam(searchParams.status);
  const status = STATUSES.includes(statusParam as InventoryStatus)
    ? (statusParam as InventoryStatus)
    : undefined;

  const linkedParam = firstParam(searchParams.linked);
  const linked =
    linkedParam === "linked" || linkedParam === "unlinked"
      ? linkedParam
      : undefined;

  const stockParam = firstParam(searchParams.stock);
  const stockFilter = STOCK_FILTERS.includes(stockParam as StockFilter)
    ? (stockParam as StockFilter)
    : undefined;

  let rows, totalCount;
  try {
    ({ rows, totalCount } = await getInventoryList({
      page,
      pageSize: PAGE_SIZE,
      sortBy,
      sortDir,
      status,
      linked,
      stockFilter,
    }));
  } catch (error) {
    return <ErrorState kind={toErrorKind(error)} />;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <InventoryFilters
          status={status}
          stockFilter={stockFilter}
          linked={linked}
        />
        {can(user.role, "inventory.create") ? (
          <NavLinkButton
            href="/inventory/new"
            variant="contained"
            startIcon={<PlusIcon size={16} />}
          >
            Add part
          </NavLinkButton>
        ) : null}
      </Box>

      <InventoryTable
        rows={rows}
        totalCount={totalCount}
        page={page}
        pageSize={PAGE_SIZE}
        sortBy={sortBy}
        sortDir={sortDir}
      />
    </Box>
  );
}
