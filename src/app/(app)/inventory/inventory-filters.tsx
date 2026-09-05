"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
function InventoryFilters({ status, stockFilter, linked }: InventoryFiltersProps) {
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={status ?? "all"} onValueChange={(v) => setParam("status", v)}>
        <SelectTrigger size="sm" className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={stockFilter ?? "all"}
        onValueChange={(v) => setParam("stock", v)}
      >
        <SelectTrigger size="sm" className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STOCK_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={linked ?? "all"} onValueChange={(v) => setParam("linked", v)}>
        <SelectTrigger size="sm" className="w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LINKED_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export { InventoryFilters };
