import "server-only";

import { createClient } from "@/lib/supabase/server";
import { toIlikePattern } from "@/lib/ilike";
import type { VerificationStatus } from "@/types/database";

export type SelectOption = { value: string; label: string };

function dedupe<T>(values: T[]): T[] {
  return [...new Set(values)];
}

async function mapNamesById(
  table: "brands" | "categories",
  ids: string[],
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(table)
    .select("id, name")
    .in("id", ids);
  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.id, row.name]));
}

/**
 * Which catalogue parts currently have at least one live (non-deleted)
 * inventory link - reused by both the parts list ("Catalogue Only" vs
 * "Catalogue + Inventory") and the part detail page's promote-or-link
 * decision.
 */
async function getLinkedCataloguePartIds(
  cataloguePartIds: string[],
): Promise<Set<string>> {
  if (cataloguePartIds.length === 0) return new Set();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_parts")
    .select("catalogue_part_id")
    .is("deleted_at", null)
    .in("catalogue_part_id", cataloguePartIds);
  if (error) throw error;
  return new Set(
    (data ?? [])
      .map((row) => row.catalogue_part_id)
      .filter((id): id is string => id !== null),
  );
}

export async function getBrandOptions(): Promise<SelectOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brands")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return (data ?? []).map((row) => ({ value: row.id, label: row.name }));
}

export async function getCategoryOptions(): Promise<SelectOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return (data ?? []).map((row) => ({ value: row.id, label: row.name }));
}

/** Model families for a given brand, or every family if `brandId` is
 * omitted - used by the model create/edit form's family Combobox. */
export async function getModelFamilyOptions(
  brandId?: string,
): Promise<SelectOption[]> {
  const supabase = await createClient();
  let query = supabase
    .from("catalogue_model_families")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");
  if (brandId) query = query.eq("brand_id", brandId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({ value: row.id, label: row.name }));
}

/** Every model, labeled "Brand — Model", for the compatibility editor's
 * model Combobox - 9 real models today, well within one flat fetch. */
export async function getModelOptions(): Promise<SelectOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("catalogue_models")
    .select("id, name, brand_id")
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;

  const brandIds = dedupe((data ?? []).map((row) => row.brand_id));
  const brandNameById = await mapNamesById("brands", brandIds);

  return (data ?? []).map((row) => ({
    value: row.id,
    label: `${brandNameById.get(row.brand_id) ?? "Unknown brand"} — ${row.name}`,
  }));
}

export type BrandListRow = {
  id: string;
  name: string;
  modelCount: number;
  partCount: number;
};

/**
 * `/catalogue`'s brand overview (phase5.md §4 goal #1) - real model and
 * part counts, computed from a flat fetch of each child table rather
 * than a fabricated figure, same "fetch flat, join in JS" convention as
 * `getWarehouseList` (features/warehouse/queries.ts).
 */
export async function getBrandList(): Promise<BrandListRow[]> {
  const supabase = await createClient();
  const [{ data: brands, error }, modelsRes, partsRes] = await Promise.all([
    supabase.from("brands").select("id, name").is("deleted_at", null),
    supabase.from("catalogue_models").select("brand_id").is("deleted_at", null),
    supabase.from("catalogue_parts").select("brand_id").is("deleted_at", null),
  ]);

  if (error) throw error;
  if (modelsRes.error) throw modelsRes.error;
  if (partsRes.error) throw partsRes.error;

  const modelCountByBrand = new Map<string, number>();
  for (const row of modelsRes.data ?? []) {
    modelCountByBrand.set(
      row.brand_id,
      (modelCountByBrand.get(row.brand_id) ?? 0) + 1,
    );
  }

  const partCountByBrand = new Map<string, number>();
  for (const row of partsRes.data ?? []) {
    if (!row.brand_id) continue;
    partCountByBrand.set(
      row.brand_id,
      (partCountByBrand.get(row.brand_id) ?? 0) + 1,
    );
  }

  return (brands ?? []).map((brand) => ({
    id: brand.id,
    name: brand.name,
    modelCount: modelCountByBrand.get(brand.id) ?? 0,
    partCount: partCountByBrand.get(brand.id) ?? 0,
  }));
}

export type CategoryListRow = { id: string; name: string; partCount: number };

export async function getCategoryList(): Promise<CategoryListRow[]> {
  const supabase = await createClient();
  const [{ data: categories, error }, partsRes] = await Promise.all([
    supabase.from("categories").select("id, name").is("deleted_at", null),
    supabase
      .from("catalogue_parts")
      .select("category_id")
      .is("deleted_at", null),
  ]);

  if (error) throw error;
  if (partsRes.error) throw partsRes.error;

  const partCountByCategory = new Map<string, number>();
  for (const row of partsRes.data ?? []) {
    if (!row.category_id) continue;
    partCountByCategory.set(
      row.category_id,
      (partCountByCategory.get(row.category_id) ?? 0) + 1,
    );
  }

  return (categories ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    partCount: partCountByCategory.get(category.id) ?? 0,
  }));
}

export type ModelFamilyListRow = {
  id: string;
  name: string;
  brandId: string | null;
  brandName: string;
  modelCount: number;
};

export async function getModelFamilyList(): Promise<ModelFamilyListRow[]> {
  const supabase = await createClient();
  const [{ data: families, error }, modelsRes] = await Promise.all([
    supabase
      .from("catalogue_model_families")
      .select("id, name, brand_id")
      .is("deleted_at", null),
    supabase
      .from("catalogue_models")
      .select("model_family_id")
      .is("deleted_at", null),
  ]);

  if (error) throw error;
  if (modelsRes.error) throw modelsRes.error;

  const modelCountByFamily = new Map<string, number>();
  for (const row of modelsRes.data ?? []) {
    if (!row.model_family_id) continue;
    modelCountByFamily.set(
      row.model_family_id,
      (modelCountByFamily.get(row.model_family_id) ?? 0) + 1,
    );
  }

  const brandNameById = await mapNamesById(
    "brands",
    dedupe(
      (families ?? [])
        .map((f) => f.brand_id)
        .filter((id): id is string => id !== null),
    ),
  );

  return (families ?? []).map((family) => ({
    id: family.id,
    name: family.name,
    brandId: family.brand_id,
    brandName: family.brand_id
      ? (brandNameById.get(family.brand_id) ?? "Unknown brand")
      : "No brand",
    modelCount: modelCountByFamily.get(family.id) ?? 0,
  }));
}

export type ModelListRow = {
  id: string;
  name: string;
  modelCode: string | null;
  fuelType: string | null;
  brandId: string;
  brandName: string;
  modelFamilyId: string | null;
  modelFamilyName: string | null;
  compatiblePartCount: number;
};

/** `/catalogue/models`, optionally filtered to one brand (phase5.md §4). */
export async function getModelList(params: {
  brandId?: string;
}): Promise<ModelListRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("catalogue_models")
    .select("id, name, model_code, fuel_type, brand_id, model_family_id")
    .is("deleted_at", null)
    .order("name");
  if (params.brandId) query = query.eq("brand_id", params.brandId);

  const { data: models, error } = await query;
  if (error) throw error;

  const [{ data: compatRows, error: compatError }] = await Promise.all([
    supabase.from("compatibility").select("catalogue_model_id"),
  ]);
  if (compatError) throw compatError;

  const compatCountByModel = new Map<string, number>();
  for (const row of compatRows ?? []) {
    compatCountByModel.set(
      row.catalogue_model_id,
      (compatCountByModel.get(row.catalogue_model_id) ?? 0) + 1,
    );
  }

  const brandNameById = await mapNamesById(
    "brands",
    dedupe((models ?? []).map((m) => m.brand_id)),
  );

  const familyIds = dedupe(
    (models ?? [])
      .map((m) => m.model_family_id)
      .filter((id): id is string => id !== null),
  );
  let familyNameById = new Map<string, string>();
  if (familyIds.length > 0) {
    const { data: families, error: familiesError } = await supabase
      .from("catalogue_model_families")
      .select("id, name")
      .in("id", familyIds);
    if (familiesError) throw familiesError;
    familyNameById = new Map((families ?? []).map((f) => [f.id, f.name]));
  }

  return (models ?? []).map((model) => ({
    id: model.id,
    name: model.name,
    modelCode: model.model_code,
    fuelType: model.fuel_type,
    brandId: model.brand_id,
    brandName: brandNameById.get(model.brand_id) ?? "Unknown brand",
    modelFamilyId: model.model_family_id,
    modelFamilyName: model.model_family_id
      ? (familyNameById.get(model.model_family_id) ?? null)
      : null,
    compatiblePartCount: compatCountByModel.get(model.id) ?? 0,
  }));
}

export type ModelCompatiblePart = {
  compatibilityId: string;
  partId: string;
  partNumber: string;
  partName: string;
  capacityRangeKg: string | null;
  verificationStatus: VerificationStatus;
};

export type ModelDetail = {
  id: string;
  name: string;
  modelCode: string | null;
  fuelType: string | null;
  deletedAt: string | null;
  brand: { id: string; name: string };
  modelFamily: { id: string; name: string } | null;
  compatibleParts: ModelCompatiblePart[];
};

/**
 * `/catalogue/models/[id]` (phase5.md §4) - compatibility shown read-
 * only here per the §5 decision (the part detail page is the primary
 * editor); each part keeps its own `capacity_range_kg` as recorded,
 * never averaged across a model's parts (ADR 0008).
 */
export async function getModelDetail(id: string): Promise<ModelDetail> {
  const supabase = await createClient();
  const { data: model, error } = await supabase
    .from("catalogue_models")
    .select(
      "id, name, model_code, fuel_type, brand_id, model_family_id, deleted_at",
    )
    .eq("id", id)
    .single();
  if (error) throw error;

  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name")
    .eq("id", model.brand_id)
    .single();
  if (brandError) throw brandError;

  let modelFamily: { id: string; name: string } | null = null;
  if (model.model_family_id) {
    const { data: family, error: familyError } = await supabase
      .from("catalogue_model_families")
      .select("id, name")
      .eq("id", model.model_family_id)
      .single();
    if (familyError) throw familyError;
    modelFamily = family;
  }

  const { data: compatRows, error: compatError } = await supabase
    .from("compatibility")
    .select("id, catalogue_part_id, verification_status")
    .eq("catalogue_model_id", id);
  if (compatError) throw compatError;

  const partIds = dedupe((compatRows ?? []).map((r) => r.catalogue_part_id));
  let partById = new Map<
    string,
    { part_number: string; name: string; capacity_range_kg: string | null }
  >();
  if (partIds.length > 0) {
    const { data: parts, error: partsError } = await supabase
      .from("catalogue_parts")
      .select("id, part_number, name, capacity_range_kg")
      .in("id", partIds);
    if (partsError) throw partsError;
    partById = new Map((parts ?? []).map((p) => [p.id, p]));
  }

  const compatibleParts: ModelCompatiblePart[] = (compatRows ?? [])
    .map((row) => {
      const part = partById.get(row.catalogue_part_id);
      if (!part) return null;
      return {
        compatibilityId: row.id,
        partId: row.catalogue_part_id,
        partNumber: part.part_number,
        partName: part.name,
        capacityRangeKg: part.capacity_range_kg,
        verificationStatus: row.verification_status,
      };
    })
    .filter((row): row is ModelCompatiblePart => row !== null)
    .sort((a, b) => a.partNumber.localeCompare(b.partNumber));

  return {
    id: model.id,
    name: model.name,
    modelCode: model.model_code,
    fuelType: model.fuel_type,
    deletedAt: model.deleted_at,
    brand,
    modelFamily,
    compatibleParts,
  };
}

export type CatalogueSortColumn =
  "part_number" | "name" | "verification_status";

export type CataloguePartListParams = {
  page: number;
  pageSize: number;
  sortBy: CatalogueSortColumn;
  sortDir: "asc" | "desc";
  search?: string;
  brandId?: string;
  categoryId?: string;
  modelId?: string;
  isFastener?: boolean;
  verificationStatus?: VerificationStatus;
};

export type CataloguePartListRow = {
  id: string;
  partNumber: string;
  name: string;
  brandName: string | null;
  categoryName: string | null;
  isFastener: boolean;
  verificationStatus: VerificationStatus;
  linked: boolean;
};

type RawCataloguePartRow = {
  id: string;
  part_number: string;
  name: string;
  brand_id: string | null;
  category_id: string | null;
  is_fastener: boolean;
  verification_status: VerificationStatus;
};

async function toListRows(
  rows: RawCataloguePartRow[],
): Promise<CataloguePartListRow[]> {
  const brandNameById = await mapNamesById(
    "brands",
    dedupe(rows.map((r) => r.brand_id).filter((id): id is string => !!id)),
  );
  const categoryNameById = await mapNamesById(
    "categories",
    dedupe(rows.map((r) => r.category_id).filter((id): id is string => !!id)),
  );
  const linkedIds = await getLinkedCataloguePartIds(rows.map((r) => r.id));

  return rows.map((row) => ({
    id: row.id,
    partNumber: row.part_number,
    name: row.name,
    brandName: row.brand_id ? (brandNameById.get(row.brand_id) ?? null) : null,
    categoryName: row.category_id
      ? (categoryNameById.get(row.category_id) ?? null)
      : null,
    isFastener: row.is_fastener,
    verificationStatus: row.verification_status,
    linked: linkedIds.has(row.id),
  }));
}

/**
 * The real, searchable/filterable/paginated catalogue parts list
 * (phase5.md §4/§9 - the catalogue is expected to grow to ~1,500-2,000
 * parts, so this must genuinely paginate, not just work at today's
 * 284). Plain column filters (brand/category/fastener/verification)
 * always run server-side via `.range()`. A free-text `search` is the
 * one deviation from that: matching across part_number/name/
 * oem_reference *and* cross_refs would need either PostgREST's
 * `.or()` (deliberately avoided app-wide - see features/search/
 * actions.ts's comment on filter-DSL injection) or a view/RPC not
 * justified at this volume - so, exactly like `getInventoryList`'s own
 * `stockFilter` branch, a search fetches every row matching the other
 * filters and paginates in JS instead.
 */
export async function getCataloguePartList(
  params: CataloguePartListParams,
): Promise<{ rows: CataloguePartListRow[]; totalCount: number }> {
  const supabase = await createClient();
  const { page, pageSize, sortBy, sortDir } = params;

  let modelPartIds: string[] | null = null;
  if (params.modelId) {
    const { data, error } = await supabase
      .from("compatibility")
      .select("catalogue_part_id")
      .eq("catalogue_model_id", params.modelId);
    if (error) throw error;
    modelPartIds = dedupe((data ?? []).map((r) => r.catalogue_part_id));
  }

  let query = supabase
    .from("catalogue_parts")
    .select(
      "id, part_number, name, brand_id, category_id, is_fastener, verification_status",
      { count: "exact" },
    )
    .is("deleted_at", null);

  if (params.brandId) query = query.eq("brand_id", params.brandId);
  if (params.categoryId) query = query.eq("category_id", params.categoryId);
  if (params.isFastener !== undefined)
    query = query.eq("is_fastener", params.isFastener);
  if (params.verificationStatus)
    query = query.eq("verification_status", params.verificationStatus);
  if (modelPartIds) query = query.in("id", modelPartIds);

  const search = params.search?.trim();

  if (!search) {
    query = query
      .order(sortBy, { ascending: sortDir === "asc" })
      .range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    const rows = (data ?? []) as RawCataloguePartRow[];
    return { rows: await toListRows(rows), totalCount: count ?? rows.length };
  }

  const { data, error } = await query;
  if (error) throw error;
  const allRows = (data ?? []) as RawCataloguePartRow[];

  const pattern = toIlikePattern(search);
  const [byNumber, byName, byOem, crossRefs] = await Promise.all([
    supabase
      .from("catalogue_parts")
      .select("id")
      .is("deleted_at", null)
      .ilike("part_number", pattern),
    supabase
      .from("catalogue_parts")
      .select("id")
      .is("deleted_at", null)
      .ilike("name", pattern),
    supabase
      .from("catalogue_parts")
      .select("id")
      .is("deleted_at", null)
      .ilike("oem_reference", pattern),
    supabase
      .from("cross_refs")
      .select("catalogue_part_id")
      .ilike("cross_reference_number", pattern),
  ]);
  for (const res of [byNumber, byName, byOem, crossRefs]) {
    if (res.error) throw res.error;
  }

  const matchingIds = new Set([
    ...(byNumber.data ?? []).map((r) => r.id),
    ...(byName.data ?? []).map((r) => r.id),
    ...(byOem.data ?? []).map((r) => r.id),
    ...(crossRefs.data ?? []).map((r) => r.catalogue_part_id),
  ]);

  const matching = allRows.filter((row) => matchingIds.has(row.id));
  const direction = sortDir === "asc" ? 1 : -1;
  matching.sort((a, b) => {
    const av = a[sortBy];
    const bv = b[sortBy];
    if (av === bv) return 0;
    return av < bv ? -direction : direction;
  });

  const totalCount = matching.length;
  const pageRows = matching.slice((page - 1) * pageSize, page * pageSize);
  return { rows: await toListRows(pageRows), totalCount };
}

export type CrossRefRow = {
  id: string;
  crossReferenceNumber: string;
  source: string | null;
};

export type LinkedInventoryPart = {
  id: string;
  partNumber: string;
  name: string;
  quantity: number;
};

export type CompatibilityRow = {
  id: string;
  modelId: string;
  modelName: string;
  brandName: string;
  verificationStatus: VerificationStatus;
  notes: string | null;
};

export type CataloguePartDetail = {
  id: string;
  partNumber: string;
  name: string;
  brand: { id: string; name: string } | null;
  category: { id: string; name: string } | null;
  subCategory: string | null;
  assemblyGroup: string | null;
  isFastener: boolean;
  capacityRangeKg: string | null;
  oemReference: string | null;
  description: string | null;
  verificationStatus: VerificationStatus;
  deletedAt: string | null;
  sources: string[];
  crossRefs: CrossRefRow[];
  compatibility: CompatibilityRow[];
  linkedInventoryParts: LinkedInventoryPart[];
};

/**
 * `/catalogue/parts/[id]` (phase5.md §4, new route) - fetched by id
 * regardless of `deleted_at`, same "still viewable once deleted"
 * precedent as `getInventoryPartDetail`/`getWarehouseDetail`.
 */
export async function getCataloguePartDetail(
  id: string,
): Promise<CataloguePartDetail> {
  const supabase = await createClient();
  const { data: part, error } = await supabase
    .from("catalogue_parts")
    .select(
      "id, part_number, name, brand_id, category_id, sub_category, assembly_group, is_fastener, capacity_range_kg, oem_reference, description, verification_status, deleted_at",
    )
    .eq("id", id)
    .single();
  if (error) throw error;

  const [
    brandRes,
    categoryRes,
    sourceLinksRes,
    crossRefsRes,
    compatRes,
    linkedPartsRes,
  ] = await Promise.all([
    part.brand_id
      ? supabase
          .from("brands")
          .select("id, name")
          .eq("id", part.brand_id)
          .single()
      : Promise.resolve({ data: null, error: null }),
    part.category_id
      ? supabase
          .from("categories")
          .select("id, name")
          .eq("id", part.category_id)
          .single()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("catalogue_part_sources")
      .select("source_id")
      .eq("catalogue_part_id", id),
    supabase
      .from("cross_refs")
      .select("id, cross_reference_number, source")
      .eq("catalogue_part_id", id)
      .order("cross_reference_number"),
    supabase
      .from("compatibility")
      .select("id, catalogue_model_id, verification_status, notes")
      .eq("catalogue_part_id", id),
    supabase
      .from("inventory_parts")
      .select("id, part_number, name, quantity")
      .eq("catalogue_part_id", id)
      .is("deleted_at", null),
  ]);

  if (brandRes.error) throw brandRes.error;
  if (categoryRes.error) throw categoryRes.error;
  if (sourceLinksRes.error) throw sourceLinksRes.error;
  if (crossRefsRes.error) throw crossRefsRes.error;
  if (compatRes.error) throw compatRes.error;
  if (linkedPartsRes.error) throw linkedPartsRes.error;

  const sourceIds = dedupe(
    (sourceLinksRes.data ?? []).map((row) => row.source_id),
  );
  let sources: string[] = [];
  if (sourceIds.length > 0) {
    const { data: sourceRows, error: sourceError } = await supabase
      .from("catalogue_sources")
      .select("id, name")
      .in("id", sourceIds);
    if (sourceError) throw sourceError;
    sources = (sourceRows ?? []).map((row) => row.name);
  }

  const modelIds = dedupe(
    (compatRes.data ?? []).map((row) => row.catalogue_model_id),
  );
  let modelById = new Map<string, { name: string; brand_id: string }>();
  if (modelIds.length > 0) {
    const { data: models, error: modelsError } = await supabase
      .from("catalogue_models")
      .select("id, name, brand_id")
      .in("id", modelIds);
    if (modelsError) throw modelsError;
    modelById = new Map(
      (models ?? []).map((m) => [m.id, { name: m.name, brand_id: m.brand_id }]),
    );
  }
  const modelBrandNameById = await mapNamesById(
    "brands",
    dedupe([...modelById.values()].map((m) => m.brand_id)),
  );

  const compatibility: CompatibilityRow[] = (compatRes.data ?? [])
    .map((row) => {
      const model = modelById.get(row.catalogue_model_id);
      if (!model) return null;
      return {
        id: row.id,
        modelId: row.catalogue_model_id,
        modelName: model.name,
        brandName: modelBrandNameById.get(model.brand_id) ?? "Unknown brand",
        verificationStatus: row.verification_status,
        notes: row.notes,
      };
    })
    .filter((row): row is CompatibilityRow => row !== null)
    .sort((a, b) => a.modelName.localeCompare(b.modelName));

  return {
    id: part.id,
    partNumber: part.part_number,
    name: part.name,
    brand: brandRes.data,
    category: categoryRes.data,
    subCategory: part.sub_category,
    assemblyGroup: part.assembly_group,
    isFastener: part.is_fastener,
    capacityRangeKg: part.capacity_range_kg,
    oemReference: part.oem_reference,
    description: part.description,
    verificationStatus: part.verification_status,
    deletedAt: part.deleted_at,
    sources,
    crossRefs: (crossRefsRes.data ?? []).map((row) => ({
      id: row.id,
      crossReferenceNumber: row.cross_reference_number,
      source: row.source,
    })),
    compatibility,
    linkedInventoryParts: (linkedPartsRes.data ?? []).map((row) => ({
      id: row.id,
      partNumber: row.part_number,
      name: row.name,
      quantity: row.quantity,
    })),
  };
}
