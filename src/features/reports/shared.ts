import "server-only";

import { createClient } from "@/lib/supabase/server";

export type PartLabel = {
  partNumber: string;
  name: string;
  brandName: string | null;
};

/**
 * `inventory_parts.id -> {part_number, name, brand}` for a given set of
 * ids, resolving brand through `catalogue_part_id -> catalogue_parts.
 * brand_id -> brands.name` (same "fetch flat, join in JS" precedent as
 * `getLowStockRows`, src/features/dashboard/low-stock.ts). Extracted
 * here once a third report (stock aging, then fast movers) needed the
 * identical lookup.
 */
export async function getPartLabelsById(
  partIds: string[],
): Promise<Map<string, PartLabel>> {
  if (partIds.length === 0) return new Map();
  const supabase = await createClient();

  const { data: parts, error } = await supabase
    .from("inventory_parts")
    .select("id, part_number, name, catalogue_part_id")
    .in("id", partIds);
  if (error) throw error;

  const cataloguePartIds = [
    ...new Set(
      (parts ?? [])
        .map((p) => p.catalogue_part_id)
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

  return new Map(
    (parts ?? []).map((p) => [
      p.id,
      {
        partNumber: p.part_number,
        name: p.name,
        brandName: p.catalogue_part_id
          ? (brandNameByCataloguePartId.get(p.catalogue_part_id) ?? null)
          : null,
      },
    ]),
  );
}
