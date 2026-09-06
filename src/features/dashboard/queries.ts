import "server-only";

import { createClient } from "@/lib/supabase/server";

type InventoryStatsRow = {
  quantity: number;
  min_stock: number | null;
  purchase_cost: number | null;
  catalogue_part_id: string | null;
};

/**
 * Shared projection behind all dashboard aggregates. Not wrapped in
 * React's `cache()` (unlike `getCurrentUser`) - each call is independently
 * unit-testable, and the row count this filters over is small enough that
 * several lightweight queries per dashboard render isn't a real cost yet.
 */
async function fetchInventoryStatsRows(): Promise<InventoryStatsRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_parts")
    .select("quantity, min_stock, purchase_cost, catalogue_part_id")
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
 * Cost-basis sum (docs/decisions/0010): sum(quantity * purchase_cost).
 * Rows with a missing or negative purchase_cost are excluded from the
 * sum and counted in `excludedCount` rather than treated as 0. Extracted
 * so `getInventoryValue` and the Phase 6 valuation-by-category/brand
 * reports (src/features/reports/valuation.ts) always agree - a second,
 * differently-computed "value" number must never exist.
 */
export function sumCostBasis(
  rows: { quantity: number; purchase_cost: number | null }[],
): InventoryValue {
  let value = 0;
  let excludedCount = 0;

  for (const row of rows) {
    if (row.purchase_cost === null || row.purchase_cost < 0) {
      excludedCount += 1;
      continue;
    }
    value += row.quantity * row.purchase_cost;
  }

  return { value, excludedCount };
}

/**
 * Cost-basis value (docs/decisions/0010). Rows with a missing or
 * negative purchase_cost are excluded from the sum and counted in
 * `excludedCount` rather than treated as 0, so a KPI card can flag the
 * total as incomplete instead of presenting it as exact.
 */
export async function getInventoryValue(): Promise<InventoryValue> {
  const rows = await fetchInventoryStatsRows();
  const result = sumCostBasis(rows);

  if (result.excludedCount > 0) {
    console.warn(
      `getInventoryValue: excluded ${result.excludedCount} inventory_parts row(s) with missing or negative purchase_cost from the value sum`,
    );
  }

  return result;
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

export type BrandCountRow = {
  label: string;
  itemCount: number;
};

const UNLINKED_LABEL = "Unlinked";

/**
 * How many in-stock parts belong to each catalogue brand, for the
 * dashboard's brand-mix chart. Resolves brand through
 * `catalogue_part_id -> catalogue_parts.brand_id -> brands.name` (same
 * "fetch flat, join in JS" precedent as src/features/reports/shared.ts),
 * with the same "Unlinked" bucket convention as the valuation-by-brand
 * report for parts with no catalogue link or no brand set. Kept separate
 * from that report's version (src/features/reports/valuation.ts) rather
 * than shared - this one only ever exposes item counts, never cost, so
 * it carries none of that report's value-visibility gating.
 */
export async function getInventoryCountByBrand(): Promise<BrandCountRow[]> {
  const supabase = await createClient();
  const rows = await fetchInventoryStatsRows();

  const cataloguePartIds = [
    ...new Set(
      rows
        .map((row) => row.catalogue_part_id)
        .filter((id): id is string => id !== null),
    ),
  ];

  let brandNameByCataloguePartId = new Map<string, string>();
  if (cataloguePartIds.length > 0) {
    const { data: catalogueParts, error: catalogueError } = await supabase
      .from("catalogue_parts")
      .select("id, brand_id")
      .in("id", cataloguePartIds);
    if (catalogueError) throw catalogueError;

    const brandIds = [
      ...new Set(
        (catalogueParts ?? [])
          .map((cp) => cp.brand_id)
          .filter((id): id is string => id !== null),
      ),
    ];

    let brandNameById = new Map<string, string>();
    if (brandIds.length > 0) {
      const { data: brands, error: brandsError } = await supabase
        .from("brands")
        .select("id, name")
        .in("id", brandIds);
      if (brandsError) throw brandsError;
      brandNameById = new Map((brands ?? []).map((b) => [b.id, b.name]));
    }

    brandNameByCataloguePartId = new Map(
      (catalogueParts ?? [])
        .filter((cp) => cp.brand_id !== null && brandNameById.has(cp.brand_id))
        .map((cp) => [cp.id, brandNameById.get(cp.brand_id!)!]),
    );
  }

  const itemCountByLabel = new Map<string, number>();
  for (const row of rows) {
    const label = row.catalogue_part_id
      ? (brandNameByCataloguePartId.get(row.catalogue_part_id) ??
        UNLINKED_LABEL)
      : UNLINKED_LABEL;
    itemCountByLabel.set(label, (itemCountByLabel.get(label) ?? 0) + 1);
  }

  return [...itemCountByLabel.entries()]
    .map(([label, itemCount]) => ({ label, itemCount }))
    .sort((a, b) => b.itemCount - a.itemCount);
}
