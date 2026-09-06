"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        value={searchValue}
        onChange={(event) => handleSearchChange(event.target.value)}
        onClear={() => {
          setSearchValue("");
          clearTimeout(debounceRef.current);
          setParam("q", undefined);
        }}
        placeholder="Search part number, name, OEM ref, cross-ref…"
        className="w-72"
      />

      <Select
        value={brandId ?? "all"}
        onValueChange={(v) => setParam("brandId", v)}
      >
        <SelectTrigger size="sm" className="w-40" aria-label="Filter by brand">
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

      <Select
        value={categoryId ?? "all"}
        onValueChange={(v) => setParam("categoryId", v)}
      >
        <SelectTrigger
          size="sm"
          className="w-44"
          aria-label="Filter by category"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categoryOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={fastener ?? "all"}
        onValueChange={(v) => setParam("fastener", v)}
      >
        <SelectTrigger
          size="sm"
          className="w-44"
          aria-label="Filter by fastener"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FASTENER_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={verificationStatus ?? "all"}
        onValueChange={(v) => setParam("verification", v)}
      >
        <SelectTrigger
          size="sm"
          className="w-44"
          aria-label="Filter by verification status"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {VERIFICATION_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export { PartsFilters };
