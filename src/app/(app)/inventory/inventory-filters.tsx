"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "discontinued", label: "Discontinued" },
  { value: "damaged", label: "Damaged" },
];

const STOCK_OPTIONS = [
  { value: "all", label: "Any stock level" },
  { value: "out_of_stock", label: "Out of stock" },
  { value: "critical", label: "Critical" },
  { value: "low", label: "Low" },
];

const LINKED_OPTIONS = [
  { value: "all", label: "Catalogue link: any" },
  { value: "linked", label: "Catalogue + Inventory" },
  { value: "unlinked", label: "Inventory only" },
];

type InventoryFiltersProps = {
  status?: string;
  stockFilter?: string;
  linked?: string;
};

/**
 * Each Select updates the URL (resetting `page` back to 1) rather than
 * holding its own state - the list page is a Server Component reading
 * `searchParams`, so the URL is the single source of truth for filters,
 * matching the "Server Components read data directly" architecture
 * (ADR 0004) over client-side query state.
 */
function InventoryFilters({
  status,
  stockFilter,
  linked,
}: InventoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete(key);
    else params.set(key, value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function selectHandler(key: string) {
    return (event: SelectChangeEvent) => setParam(key, event.target.value);
  }

  return (
    <Box
      sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}
    >
      <Select
        size="small"
        value={status ?? "all"}
        onChange={selectHandler("status")}
        aria-label="Filter by status"
        sx={{ width: 160 }}
      >
        {STATUS_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>

      <Select
        size="small"
        value={stockFilter ?? "all"}
        onChange={selectHandler("stock")}
        aria-label="Filter by stock level"
        sx={{ width: 176 }}
      >
        {STOCK_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>

      <Select
        size="small"
        value={linked ?? "all"}
        onChange={selectHandler("linked")}
        aria-label="Filter by catalogue link"
        sx={{ width: 208 }}
      >
        {LINKED_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}

export { InventoryFilters };
