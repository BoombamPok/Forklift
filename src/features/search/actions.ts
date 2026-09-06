"use server";

import { createClient } from "@/lib/supabase/server";
import { toIlikePattern } from "@/lib/ilike";
import type { StatusTone } from "@/components/shared/status-badge";

export type SearchResultKind = "part" | "brand" | "model";

export type SearchResult = {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle: string | null;
  href: string;
  badge: { label: string; tone: StatusTone } | null;
};

const RESULTS_PER_CATEGORY = 5;
const MAX_RESULTS = 8;
const MIN_QUERY_LENGTH = 2;

function dedupeById<T extends { id: string }>(rows: T[]): T[] {
  return [...new Map(rows.map((row) => [row.id, row])).values()];
}

/**
 * Global header search (phase2c.md's "2e"): inventory_parts, catalogue_
 * parts (+ cross_refs), brands, and catalogue_models, each searched with
 * plain `ilike` per phase2c.md's "PostgreSQL only" direction - the
 * current catalogue (284 parts) doesn't come close to needing a trigram
 * index yet. One `ilike` call per column rather than a single `.or(...)`
 * filter string: `.or()` interpolates the raw query into a filter-DSL
 * string PostgREST parses, and a user typing `,`/`(`/`)` shouldn't be
 * able to influence how that string parses - a plain `.ilike(column,
 * pattern)` call passes the pattern as an ordinary parameter instead.
 */
export async function searchGlobal(rawQuery: string): Promise<SearchResult[]> {
  const query = rawQuery.trim();
  if (query.length < MIN_QUERY_LENGTH) return [];

  const supabase = await createClient();
  const pattern = toIlikePattern(query);

  const [
    inventoryByNumber,
    inventoryByName,
    catalogueByNumber,
    catalogueByName,
    catalogueByOem,
    crossRefs,
    brandMatches,
    modelMatches,
  ] = await Promise.all([
    supabase
      .from("inventory_parts")
      .select("id, part_number, name, catalogue_part_id")
      .is("deleted_at", null)
      .ilike("part_number", pattern)
      .limit(RESULTS_PER_CATEGORY),
    supabase
      .from("inventory_parts")
      .select("id, part_number, name, catalogue_part_id")
      .is("deleted_at", null)
      .ilike("name", pattern)
      .limit(RESULTS_PER_CATEGORY),
    supabase
      .from("catalogue_parts")
      .select("id, part_number, name")
      .is("deleted_at", null)
      .ilike("part_number", pattern)
      .limit(RESULTS_PER_CATEGORY),
    supabase
      .from("catalogue_parts")
      .select("id, part_number, name")
      .is("deleted_at", null)
      .ilike("name", pattern)
      .limit(RESULTS_PER_CATEGORY),
    supabase
      .from("catalogue_parts")
      .select("id, part_number, name")
      .is("deleted_at", null)
      .ilike("oem_reference", pattern)
      .limit(RESULTS_PER_CATEGORY),
    supabase
      .from("cross_refs")
      .select("catalogue_part_id, cross_reference_number")
      .ilike("cross_reference_number", pattern)
      .limit(RESULTS_PER_CATEGORY),
    supabase
      .from("brands")
      .select("id, name")
      .is("deleted_at", null)
      .ilike("name", pattern)
      .limit(RESULTS_PER_CATEGORY),
    supabase
      .from("catalogue_models")
      .select("id, name, brand_id")
      .is("deleted_at", null)
      .ilike("name", pattern)
      .limit(RESULTS_PER_CATEGORY),
  ]);

  for (const res of [
    inventoryByNumber,
    inventoryByName,
    catalogueByNumber,
    catalogueByName,
    catalogueByOem,
    crossRefs,
    brandMatches,
    modelMatches,
  ]) {
    if (res.error) throw res.error;
  }

  const inventoryRows = dedupeById([
    ...(inventoryByNumber.data ?? []),
    ...(inventoryByName.data ?? []),
  ]);
  const linkedCataloguePartIds = new Set(
    inventoryRows
      .map((row) => row.catalogue_part_id)
      .filter((id): id is string => id !== null),
  );

  const results: SearchResult[] = inventoryRows.map((row) => ({
    id: row.id,
    kind: "part",
    title: row.name,
    subtitle: row.part_number,
    href: `/inventory/${row.id}`,
    badge: { label: "In Stock", tone: "success" },
  }));

  // catalogue_parts matched by their own fields, plus catalogue_parts
  // only found via a cross-reference number - deduped, and suppressed
  // when the same catalogue part is already shown as an inventory match.
  const cataloguePartsById = new Map(
    dedupeById([
      ...(catalogueByNumber.data ?? []),
      ...(catalogueByName.data ?? []),
      ...(catalogueByOem.data ?? []),
    ]).map((row) => [row.id, row]),
  );

  const crossRefOnlyIds = [
    ...new Set((crossRefs.data ?? []).map((row) => row.catalogue_part_id)),
  ].filter((id) => !cataloguePartsById.has(id));

  if (crossRefOnlyIds.length > 0) {
    const { data: extraParts, error } = await supabase
      .from("catalogue_parts")
      .select("id, part_number, name")
      .in("id", crossRefOnlyIds);
    if (error) throw error;
    for (const row of extraParts ?? []) cataloguePartsById.set(row.id, row);
  }

  for (const part of cataloguePartsById.values()) {
    if (linkedCataloguePartIds.has(part.id)) continue;
    results.push({
      id: part.id,
      kind: "part",
      title: part.name,
      subtitle: part.part_number,
      href: `/catalogue/parts/${part.id}`,
      badge: { label: "Catalogue Only", tone: "secondary" },
    });
  }

  for (const row of brandMatches.data ?? []) {
    results.push({
      id: row.id,
      kind: "brand",
      title: row.name,
      subtitle: null,
      href: "/catalogue",
      badge: { label: "Brand", tone: "outline" },
    });
  }

  const modelBrandIds = [
    ...new Set(
      (modelMatches.data ?? [])
        .map((row) => row.brand_id)
        .filter((id): id is string => id !== null),
    ),
  ];
  let modelBrandNameById = new Map<string, string>();
  if (modelBrandIds.length > 0) {
    const { data: modelBrands, error } = await supabase
      .from("brands")
      .select("id, name")
      .in("id", modelBrandIds);
    if (error) throw error;
    modelBrandNameById = new Map(
      (modelBrands ?? []).map((b) => [b.id, b.name]),
    );
  }

  for (const row of modelMatches.data ?? []) {
    results.push({
      id: row.id,
      kind: "model",
      title: row.name,
      subtitle: modelBrandNameById.get(row.brand_id) ?? null,
      href: `/catalogue/models/${row.id}`,
      badge: { label: "Model", tone: "outline" },
    });
  }

  return results.slice(0, MAX_RESULTS);
}
