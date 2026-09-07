"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";

import type { ComboboxOption } from "@/components/shared/combobox";

type ModelFiltersProps = {
  brandOptions: ComboboxOption[];
  brandId?: string;
};

/** URL-driven brand filter (phase5.md §4) - same pattern as
 * `InventoryFilters` (src/app/(app)/inventory/inventory-filters.tsx). */
function ModelFilters({ brandOptions, brandId }: ModelFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setBrand(event: SelectChangeEvent) {
    const value = event.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("brandId");
    else params.set("brandId", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select
      size="small"
      value={brandId ?? "all"}
      onChange={setBrand}
      aria-label="Filter by brand"
      sx={{ width: 192 }}
    >
      <MenuItem value="all">All brands</MenuItem>
      {brandOptions.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  );
}

export { ModelFilters };
