import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  sumCostBasis,
  type InventoryValue,
} from "@/features/dashboard/queries";

const UNLINKED_LABEL = "Unlinked";

export type ValuationBreakdownRow = {
  label: string;
  itemCount: number;
} & InventoryValue;

type InventoryStatsRow = {
  quantity: number;
  purchase_cost: number | null;
  catalogue_part_id: string | null;
};

async function fetchInventoryValuationRows(): Promise<InventoryStatsRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_parts")
    .select("quantity, purchase_cost, catalogue_part_id")
    .is("deleted_at", null);

  if (error) throw error;
  return data ?? [];
}

function breakdownBy(
  rows: InventoryStatsRow[],
  labelByCataloguePartId: Map<string, string>,
): ValuationBreakdownRow[] {
  const rowsByLabel = new Map<string, InventoryStatsRow[]>();

  for (const row of rows) {
    const label = row.catalogue_part_id
      ? (labelByCataloguePartId.get(row.catalogue_part_id) ?? UNLINKED_LABEL)
      : UNLINKED_LABEL;
    const bucket = rowsByLabel.get(label);
    if (bucket) bucket.push(row);
    else rowsByLabel.set(label, [row]);
  }

  return [...rowsByLabel.entries()]
    .map(([label, bucketRows]) => ({
      label,
      itemCount: bucketRows.length,
      ...sumCostBasis(bucketRows),
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Cost-basis inventory value broken down by category and by brand
 * (phase6.md §4) - reuses `sumCostBasis` (src/features/dashboard/
 * queries.ts) so this can never disagree with the dashboard's own
 * total. Inventory parts with no catalogue link, or whose linked
 * catalogue part has no category/brand set, land in an explicit
 * "Unlinked" bucket rather than being dropped.
 */
export async function getInventoryValuationByCategory(): Promise<
  ValuationBreakdownRow[]
> {
  const supabase = await createClient();
  const rows = await fetchInventoryValuationRows();

  const cataloguePartIds = [
    ...new Set(
      rows
        .map((row) => row.catalogue_part_id)
        .filter((id): id is string => id !== null),
    ),
  ];

  let categoryNameByCataloguePartId = new Map<string, string>();
  if (cataloguePartIds.length > 0) {
    const { data: catalogueParts, error: catalogueError } = await supabase
      .from("catalogue_parts")
      .select("id, category_id")
      .in("id", cataloguePartIds);
    if (catalogueError) throw catalogueError;

    const categoryIds = [
      ...new Set(
        (catalogueParts ?? [])
          .map((cp) => cp.category_id)
          .filter((id): id is string => id !== null),
      ),
    ];

    let categoryNameById = new Map<string, string>();
    if (categoryIds.length > 0) {
      const { data: categories, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name")
        .in("id", categoryIds);
      if (categoriesError) throw categoriesError;
      categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]));
    }

    categoryNameByCataloguePartId = new Map(
      (catalogueParts ?? [])
        .filter(
          (cp) =>
            cp.category_id !== null && categoryNameById.has(cp.category_id),
        )
        .map((cp) => [cp.id, categoryNameById.get(cp.category_id!)!]),
    );
  }

  return breakdownBy(rows, categoryNameByCataloguePartId);
}

export async function getInventoryValuationByBrand(): Promise<
  ValuationBreakdownRow[]
> {
  const supabase = await createClient();
  const rows = await fetchInventoryValuationRows();

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

  return breakdownBy(rows, brandNameByCataloguePartId);
}
