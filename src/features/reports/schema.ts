import { z } from "zod";

import { firstParam } from "@/lib/search-params";

export type DateRange = { from: string; to: string };

export const DAY_PRESETS = [7, 30, 90] as const;
export type DayPreset = (typeof DAY_PRESETS)[number];
export const DEFAULT_DAYS: DayPreset = 30;

const MAX_RANGE_DAYS = 366;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

const customRangeSchema = z
  .object({ from: isoDate, to: isoDate })
  .refine((range) => range.from <= range.to, {
    message: "Start date must be on or before the end date",
    path: ["from"],
  })
  .refine(
    (range) =>
      (new Date(range.to).getTime() - new Date(range.from).getTime()) /
        MS_PER_DAY <=
      MAX_RANGE_DAYS,
    { message: `Range can't exceed ${MAX_RANGE_DAYS} days`, path: ["to"] },
  )
  .refine((range) => new Date(range.to).getTime() <= Date.now(), {
    message: "End date can't be in the future",
    path: ["to"],
  });

function todayUtc(): Date {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Last `days` UTC calendar days, inclusive of today. */
export function rangeForDays(days: number): DateRange {
  const to = todayUtc();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (days - 1));
  return { from: toIsoDate(from), to: toIsoDate(to) };
}

/**
 * A `DateRange`'s calendar dates as the timestamp bounds a
 * `stock_movements.created_at` query needs - `to` is inclusive of its
 * whole day, not just midnight.
 */
export function rangeToTimestamps(range: DateRange): {
  since: string;
  until: string;
} {
  return {
    since: `${range.from}T00:00:00.000Z`,
    until: `${range.to}T23:59:59.999Z`,
  };
}

export type ResolvedReportDateRange = DateRange & {
  preset: DayPreset | "custom";
};

/**
 * Reads `from`/`to` (validated custom range) or `days` (one of
 * `DAY_PRESETS`) off the URL, following the same `firstParam`
 * (src/lib/search-params.ts) convention every other list page's filters
 * use. Invalid or missing input falls back to the 30-day default rather
 * than erroring the page - a bad query string is not a real error state.
 */
export function parseReportDateRange(
  searchParams: Record<string, string | string[] | undefined>,
): ResolvedReportDateRange {
  const fromParam = firstParam(searchParams.from);
  const toParam = firstParam(searchParams.to);

  if (fromParam && toParam) {
    const result = customRangeSchema.safeParse({
      from: fromParam,
      to: toParam,
    });
    if (result.success) {
      return { ...result.data, preset: "custom" };
    }
  }

  const daysParam = Number(firstParam(searchParams.days));
  const days = (DAY_PRESETS as readonly number[]).includes(daysParam)
    ? (daysParam as DayPreset)
    : DEFAULT_DAYS;

  return { ...rangeForDays(days), preset: days };
}
