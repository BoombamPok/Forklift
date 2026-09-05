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
