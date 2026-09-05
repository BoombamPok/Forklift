import "server-only";

import { createClient } from "@/lib/supabase/server";

export type LowStockStatus = "out_of_stock" | "critical" | "low";

export type LowStockRow = {
  id: string;
  partNumber: string;
  name: string;
  brandName: string | null;
  quantity: number;
  minStock: number | null;
  status: LowStockStatus;
};

function statusFor(quantity: number, minStock: number | null): LowStockStatus {
  if (quantity === 0) return "out_of_stock";
  // Only reachable for a row that already passed the qualifying filter
  // below, so minStock is never null here.
  return quantity <= minStock! * 0.5 ? "critical" : "low";
}

/**
 * Parts that need attention right now (phase2c.md's "2d" section):
 * everything at zero quantity, plus anything at or below its configured
 * `min_stock` (docs/decisions/0009) - a part with no threshold set is
 * only eligible via the zero-quantity case, same rule
 * `getLowStockCount`/`getOutOfStockCount` (Phase 2a) already use.
 *
 * Brand is resolved through `inventory_parts.catalogue_part_id ->
 * catalogue_parts.brand_id -> brands.name` as two more flat queries
 * (same "fetch flat, join in JS" precedent as 2a/2c) rather than a
 * PostgREST embed, since `types/database.ts` has no `Relationships`
 * metadata for an embed to type against. Model isn't included: a
 * catalogue part's model fit is many-to-many via `compatibility`, so it
 * doesn't reduce to one column for a summary row.
 */
export async function getLowStockRows(): Promise<LowStockRow[]> {
  const supabase = await createClient();

  const { data: parts, error } = await supabase
    .from("inventory_parts")
    .select("id, part_number, name, quantity, min_stock, catalogue_part_id")
    .is("deleted_at", null);

  if (error) throw error;

  const qualifying = (parts ?? []).filter(
    (part) =>
      part.quantity === 0 ||
      (part.min_stock !== null && part.quantity <= part.min_stock),
  );

  if (qualifying.length === 0) return [];

  const cataloguePartIds = [
    ...new Set(
      qualifying
        .map((part) => part.catalogue_part_id)
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

  return qualifying
    .map((part) => ({
      id: part.id,
      partNumber: part.part_number,
      name: part.name,
      brandName: part.catalogue_part_id
        ? (brandNameByCataloguePartId.get(part.catalogue_part_id) ?? null)
        : null,
      quantity: part.quantity,
      minStock: part.min_stock,
      status: statusFor(part.quantity, part.min_stock),
    }))
    .sort((a, b) => a.quantity - b.quantity);
}
