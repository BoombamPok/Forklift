"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

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

  function handlePresetChange(event: SelectChangeEvent) {
    const value = event.target.value;
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
    <Box
      sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}
    >
      <Select
        size="small"
        value={showCustom ? "custom" : String(preset)}
        onChange={handlePresetChange}
        aria-label="Date range"
        sx={{ width: 160 }}
      >
        {PRESET_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>

      {showCustom ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TextField
            type="date"
            size="small"
            sx={{ width: 152 }}
            value={customFrom}
            slotProps={{
              htmlInput: {
                "aria-label": "Start date",
                max: customTo || undefined,
              },
            }}
            onChange={(e) => handleCustomChange(e.target.value, customTo)}
          />
          <Typography variant="body2" color="text.secondary">
            to
          </Typography>
          <TextField
            type="date"
            size="small"
            sx={{ width: 152 }}
            value={customTo}
            slotProps={{
              htmlInput: {
                "aria-label": "End date",
                min: customFrom || undefined,
                max: new Date().toISOString().slice(0, 10),
              },
            }}
            onChange={(e) => handleCustomChange(customFrom, e.target.value)}
          />
        </Box>
      ) : null}
    </Box>
  );
}

export { DateRangePicker };
