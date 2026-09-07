"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";

import { SearchInput } from "@/components/shared/search-input";
import type { ComboboxOption } from "@/components/shared/combobox";

const SEARCH_DEBOUNCE_MS = 350;

const FASTENER_OPTIONS = [
  { value: "all", label: "Fastener: any" },
  { value: "yes", label: "Fasteners only" },
  { value: "no", label: "Non-fasteners only" },
];

const VERIFICATION_OPTIONS = [
  { value: "all", label: "Verification: any" },
  { value: "verified", label: "Verified" },
  { value: "unverified", label: "Unverified" },
  { value: "uncertain", label: "Uncertain" },
];

type PartsFiltersProps = {
  brandOptions: ComboboxOption[];
  categoryOptions: ComboboxOption[];
  search?: string;
  brandId?: string;
  categoryId?: string;
  fastener?: string;
  verificationStatus?: string;
};

/**
 * Search + filters for `/catalogue/parts` (phase5.md §9 - the catalogue
 * is expected to grow well past today's 284 parts, so this list is
 * genuinely searchable, not something that only works at current
 * volume). URL-driven, same convention as `InventoryFilters` - the list
 * page itself is a Server Component reading `searchParams` (ADR 0004).
 */
function PartsFilters({
  brandOptions,
  categoryOptions,
  search,
  brandId,
  categoryId,
  fastener,
  verificationStatus,
}: PartsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = React.useState(search ?? "");
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  function setParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearchChange(value: string) {
    setSearchValue(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => setParam("q", value.trim() || undefined),
      SEARCH_DEBOUNCE_MS,
    );
  }

  function selectHandler(key: string) {
    return (event: SelectChangeEvent) => setParam(key, event.target.value);
  }

  return (
    <Box
      sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}
    >
      <SearchInput
        value={searchValue}
        onChange={(event) => handleSearchChange(event.target.value)}
        onClear={() => {
          setSearchValue("");
          clearTimeout(debounceRef.current);
          setParam("q", undefined);
        }}
        placeholder="Search part number, name, OEM ref, cross-ref…"
        sx={{ width: 288 }}
      />

      <Select
        size="small"
        value={brandId ?? "all"}
        onChange={selectHandler("brandId")}
        aria-label="Filter by brand"
        sx={{ width: 160 }}
      >
        <MenuItem value="all">All brands</MenuItem>
        {brandOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>

      <Select
        size="small"
        value={categoryId ?? "all"}
        onChange={selectHandler("categoryId")}
        aria-label="Filter by category"
        sx={{ width: 176 }}
      >
        <MenuItem value="all">All categories</MenuItem>
        {categoryOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>

      <Select
        size="small"
        value={fastener ?? "all"}
        onChange={selectHandler("fastener")}
        aria-label="Filter by fastener"
        sx={{ width: 176 }}
      >
        {FASTENER_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>

      <Select
        size="small"
        value={verificationStatus ?? "all"}
        onChange={selectHandler("verification")}
        aria-label="Filter by verification status"
        sx={{ width: 176 }}
      >
        {VERIFICATION_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}

export { PartsFilters };
