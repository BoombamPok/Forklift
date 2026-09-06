"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  function setBrand(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("brandId");
    else params.set("brandId", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={brandId ?? "all"} onValueChange={setBrand}>
      <SelectTrigger size="sm" className="w-48" aria-label="Filter by brand">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All brands</SelectItem>
        {brandOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { ModelFilters };
