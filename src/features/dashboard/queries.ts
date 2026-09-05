import "server-only";

import { createClient } from "@/lib/supabase/server";

type InventoryStatsRow = {
  quantity: number;
  min_stock: number | null;
  purchase_cost: number | null;
};

/**
 * Shared projection behind all four dashboard aggregates. Not wrapped in
 * React's `cache()` (unlike `getCurrentUser`) - each call is independently
 * unit-testable, and the row count this filters over is small enough that
 * four lightweight queries per dashboard render isn't a real cost yet.
 */
async function fetchInventoryStatsRows(): Promise<InventoryStatsRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_parts")
    .select("quantity, min_stock, purchase_cost")
    .is("deleted_at", null);

  if (error) throw error;
  return data ?? [];
}

export async function getInventoryItemCount(): Promise<number> {
  const rows = await fetchInventoryStatsRows();
  return rows.length;
}

export type InventoryValue = {
  value: number;
  excludedCount: number;
};

/**
 * Cost-basis value (docs/decisions/0010): sum(quantity * purchase_cost).
 * Rows with a missing or negative purchase_cost are excluded from the
 * sum and counted in `excludedCount` rather than treated as 0, so a KPI
 * card can flag the total as incomplete instead of presenting it as
 * exact.
 */
export async function getInventoryValue(): Promise<InventoryValue> {
  const rows = await fetchInventoryStatsRows();
  let value = 0;
  let excludedCount = 0;

  for (const row of rows) {
    if (row.purchase_cost === null || row.purchase_cost < 0) {
      excludedCount += 1;
      continue;
    }
    value += row.quantity * row.purchase_cost;
  }

  if (excludedCount > 0) {
    console.warn(
      `getInventoryValue: excluded ${excludedCount} inventory_parts row(s) with missing or negative purchase_cost from the value sum`,
    );
  }

  return { value, excludedCount };
}

/** Only counts parts with a configured min_stock (docs/decisions/0009). */
export async function getLowStockCount(): Promise<number> {
  const rows = await fetchInventoryStatsRows();
  return rows.filter(
    (row) =>
      row.min_stock !== null &&
      row.quantity > 0 &&
      row.quantity <= row.min_stock,
  ).length;
}

export async function getOutOfStockCount(): Promise<number> {
  const rows = await fetchInventoryStatsRows();
  return rows.filter((row) => row.quantity === 0).length;
}
