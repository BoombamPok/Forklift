export { cn } from "cn";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** The one place a money amount becomes display text - keeps every KPI/
 * report screen using the same currency and rounding instead of ad hoc
 * `Intl.NumberFormat` calls scattered through components. */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

const RELATIVE_TIME_UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] =
  [
    { unit: "year", ms: 365 * 24 * 60 * 60 * 1000 },
    { unit: "month", ms: 30 * 24 * 60 * 60 * 1000 },
    { unit: "week", ms: 7 * 24 * 60 * 60 * 1000 },
    { unit: "day", ms: 24 * 60 * 60 * 1000 },
    { unit: "hour", ms: 60 * 60 * 1000 },
    { unit: "minute", ms: 60 * 1000 },
  ];

/**
 * "3 hours ago" / "in 2 days" style relative time for activity feeds.
 * `now` is injectable so callers (and tests) don't depend on the actual
 * wall clock.
 */
export function formatRelativeTime(
  iso: string,
  now: Date = new Date(),
): string {
  const diffMs = new Date(iso).getTime() - now.getTime();

  for (const { unit, ms } of RELATIVE_TIME_UNITS) {
    if (Math.abs(diffMs) >= ms) {
      return relativeTimeFormatter.format(Math.round(diffMs / ms), unit);
    }
  }
  return relativeTimeFormatter.format(Math.round(diffMs / 1000), "second");
}
