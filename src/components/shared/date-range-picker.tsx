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
import { Input } from "@/components/ui/input";
import { DAY_PRESETS, type DayPreset } from "@/features/reports/schema";

const PRESET_OPTIONS: { value: string; label: string }[] = [
  ...DAY_PRESETS.map((days) => ({
    value: String(days),
    label: `Last ${days} days`,
  })),
  { value: "custom", label: "Custom range" },
];

type DateRangePickerProps = {
  preset: DayPreset | "custom";
  from: string;
  to: string;
};

/**
 * The one date-range control every range-scoped report uses (phase6.md
 * §4/§9). Follows the URL-is-source-of-truth pattern established by
 * `InventoryFilters` (src/app/(app)/inventory/inventory-filters.tsx):
 * this just edits `days`/`from`/`to` query params, the Server Component
 * page re-parses them via `parseReportDateRange`
 * (src/features/reports/schema.ts). Deliberately no calendar-picker
 * dependency - native `<input type="date">` is enough for the "nice to
 * have" custom range per phase6.md §4.
 */
function DateRangePicker({ preset, from, to }: DateRangePickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [showCustom, setShowCustom] = React.useState(preset === "custom");
  const [customFrom, setCustomFrom] = React.useState(from);
  const [customTo, setCustomTo] = React.useState(to);

  function pushParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function handlePresetChange(value: string) {
    if (value === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    pushParams({ days: value, from: null, to: null });
  }

  function handleCustomChange(nextFrom: string, nextTo: string) {
    setCustomFrom(nextFrom);
    setCustomTo(nextTo);
    if (!nextFrom || !nextTo) return;
    pushParams({ days: null, from: nextFrom, to: nextTo });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={showCustom ? "custom" : String(preset)}
        onValueChange={handlePresetChange}
      >
        <SelectTrigger size="sm" className="w-40" aria-label="Date range">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESET_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showCustom ? (
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            aria-label="Start date"
            className="w-36"
            value={customFrom}
            max={customTo || undefined}
            onChange={(e) => handleCustomChange(e.target.value, customTo)}
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            aria-label="End date"
            className="w-36"
            value={customTo}
            min={customFrom || undefined}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => handleCustomChange(customFrom, e.target.value)}
          />
        </div>
      ) : null}
    </div>
  );
}

export { DateRangePicker };
