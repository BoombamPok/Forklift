import "server-only";

import { createClient } from "@/lib/supabase/server";
import { classifyMovement, describeMovement } from "@/lib/stock-movements";
import type { MovementDirection } from "@/lib/stock-movements";
import type { InventoryStatus } from "@/types/database";

export type InventorySortColumn = "part_number" | "name" | "quantity" | "status";
export type StockFilter = "low" | "critical" | "out_of_stock";

export type InventoryListParams = {
  page: number;
  pageSize: number;
  sortBy: InventorySortColumn;
  sortDir: "asc" | "desc";
  status?: InventoryStatus;
  linked?: "linked" | "unlinked";
  stockFilter?: StockFilter;
};

export type InventoryListRow = {
  id: string;
  partNumber: string;
  name: string;
  quantity: number;
  minStock: number | null;
  status: InventoryStatus;
  brandName: string | null;
  boxCode: string | null;
  linked: boolean;
};

export type InventoryListResult = {
  rows: InventoryListRow[];
  totalCount: number;
};

type RawInventoryRow = {
  id: string;
  part_number: string;
  name: string;
  quantity: number;
  min_stock: number | null;
  status: InventoryStatus;
  catalogue_part_id: string | null;
  box_id: string | null;
};

function stockLevelOf(row: {
  quantity: number;
  min_stock: number | null;
}): StockFilter | null {
  if (row.quantity === 0) return "out_of_stock";
  if (row.min_stock !== null && row.quantity <= row.min_stock) {
    return row.quantity <= row.min_stock * 0.5 ? "critical" : "low";
  }
  return null;
}

async function resolveBrandAndBoxLabels(
  rows: RawInventoryRow[],
): Promise<{
  brandNameByCataloguePartId: Map<string, string>;
  boxCodeByBoxId: Map<string, string>;
}> {
  const supabase = await createClient();

  const cataloguePartIds = [
    ...new Set(
      rows.map((r) => r.catalogue_part_id).filter((id): id is string => id !== null),
    ),
  ];
  const boxIds = [
    ...new Set(rows.map((r) => r.box_id).filter((id): id is string => id !== null)),
  ];

  const [catalogueRes, boxRes] = await Promise.all([
    cataloguePartIds.length > 0
      ? supabase.from("catalogue_parts").select("id, brand_id").in("id", cataloguePartIds)
      : Promise.resolve({ data: [], error: null }),
    boxIds.length > 0
      ? supabase.from("boxes").select("id, code").in("id", boxIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (catalogueRes.error) throw catalogueRes.error;
  if (boxRes.error) throw boxRes.error;

  const brandIds = [
    ...new Set(
      (catalogueRes.data ?? [])
        .map((c) => c.brand_id)
        .filter((id): id is string => id !== null),
    ),
  ];

  let brandNameById = new Map<string, string>();
  if (brandIds.length > 0) {
    const { data: brands, error } = await supabase
      .from("brands")
      .select("id, name")
      .in("id", brandIds);
    if (error) throw error;
    brandNameById = new Map((brands ?? []).map((b) => [b.id, b.name]));
  }

  const brandNameByCataloguePartId = new Map(
    (catalogueRes.data ?? [])
      .filter((c) => c.brand_id !== null && brandNameById.has(c.brand_id))
      .map((c) => [c.id, brandNameById.get(c.brand_id!)!]),
  );

  const boxCodeByBoxId = new Map((boxRes.data ?? []).map((b) => [b.id, b.code]));

  return { brandNameByCataloguePartId, boxCodeByBoxId };
}

function toListRow(
  row: RawInventoryRow,
  brandNameByCataloguePartId: Map<string, string>,
  boxCodeByBoxId: Map<string, string>,
): InventoryListRow {
  return {
    id: row.id,
    partNumber: row.part_number,
    name: row.name,
    quantity: row.quantity,
    minStock: row.min_stock,
    status: row.status,
    brandName: row.catalogue_part_id
      ? (brandNameByCataloguePartId.get(row.catalogue_part_id) ?? null)
      : null,
    boxCode: row.box_id ? (boxCodeByBoxId.get(row.box_id) ?? null) : null,
    linked: row.catalogue_part_id !== null,
  };
}

/**
 * The real, server-side-paginated inventory list (phase3.md's goal #1).
 * `status`/`linked` filter server-side via plain column filters. A
 * `stockFilter` is the one exception: "low"/"critical"/"out_of_stock"
 * compare `quantity` against *another column* (`min_stock`), which
 * PostgREST can't express as a filter without a computed view/RPC - not
 * justified yet at this project's actual data volume (CLAUDE.md §6), so
 * that path fetches every non-deleted row matching the other filters and
 * paginates in JS instead, same "fetch flat, join in JS" precedent as
 * `getLowStockRows`. The common case (no stock filter) is real
 * `.range()`/`.order()` pagination against the database.
 */
export async function getInventoryList(
  params: InventoryListParams,
): Promise<InventoryListResult> {
  const supabase = await createClient();
  const { page, pageSize, sortBy, sortDir, status, linked, stockFilter } = params;

  let query = supabase
    .from("inventory_parts")
    .select(
      "id, part_number, name, quantity, min_stock, status, catalogue_part_id, box_id",
      { count: "exact" },
    )
    .is("deleted_at", null);

  if (status) query = query.eq("status", status);
  if (linked === "linked") query = query.not("catalogue_part_id", "is", null);
  if (linked === "unlinked") query = query.is("catalogue_part_id", null);

  if (!stockFilter) {
    query = query
      .order(sortBy, { ascending: sortDir === "asc" })
      .range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    const rows = (data ?? []) as RawInventoryRow[];
    const { brandNameByCataloguePartId, boxCodeByBoxId } =
      await resolveBrandAndBoxLabels(rows);

    return {
      rows: rows.map((r) => toListRow(r, brandNameByCataloguePartId, boxCodeByBoxId)),
      totalCount: count ?? rows.length,
    };
  }

  const { data, error } = await query;
  if (error) throw error;

  const allRows = (data ?? []) as RawInventoryRow[];
  const matching = allRows.filter((r) => stockLevelOf(r) === stockFilter);

  const direction = sortDir === "asc" ? 1 : -1;
  matching.sort((a, b) => {
    const av = a[sortBy];
    const bv = b[sortBy];
    if (av === bv) return 0;
    return av < bv ? -direction : direction;
  });

  const totalCount = matching.length;
  const pageRows = matching.slice((page - 1) * pageSize, page * pageSize);
  const { brandNameByCataloguePartId, boxCodeByBoxId } =
    await resolveBrandAndBoxLabels(pageRows);

  return {
    rows: pageRows.map((r) => toListRow(r, brandNameByCataloguePartId, boxCodeByBoxId)),
    totalCount,
  };
}

export type InventoryPartLocation = {
  boxId: string;
  boxCode: string;
  shelfCode: string;
  rackCode: string;
  warehouseName: string;
};

export type InventoryPartCatalogueLink = {
  id: string;
  partNumber: string;
  name: string;
  brandName: string | null;
  oemReference: string | null;
};

export type InventoryPartDetail = {
  id: string;
  partNumber: string;
  name: string;
  quantity: number;
  minStock: number | null;
  purchaseCost: number | null;
  sellingPrice: number | null;
  status: InventoryStatus;
  notes: string | null;
  boxId: string | null;
  deletedAt: string | null;
  location: InventoryPartLocation | null;
  catalogueLink: InventoryPartCatalogueLink | null;
};

/**
 * Fetched by id regardless of `deleted_at` - a soft-deleted part stays
 * viewable (CLAUDE.md's "recoverable, not gone" for soft delete; the
 * detail page shows a "Deleted" state distinct from the active
 * `status` badge) rather than 404ing the moment it's removed from the
 * list. `PGRST116` (`.single()` no-rows) surfaces as a genuine
 * "not-found" via `toErrorKind`, same as everywhere else.
 */
export async function getInventoryPartDetail(
  id: string,
): Promise<InventoryPartDetail> {
  const supabase = await createClient();

  const { data: part, error } = await supabase
    .from("inventory_parts")
    .select(
      "id, part_number, name, quantity, min_stock, purchase_cost, selling_price, status, notes, box_id, catalogue_part_id, deleted_at",
    )
    .eq("id", id)
    .single();

  if (error) throw error;

  let location: InventoryPartLocation | null = null;
  if (part.box_id) {
    const { data: box, error: boxError } = await supabase
      .from("boxes")
      .select("id, code, shelf_id")
      .eq("id", part.box_id)
      .single();
    if (boxError) throw boxError;

    const { data: shelf, error: shelfError } = await supabase
      .from("shelves")
      .select("code, rack_id")
      .eq("id", box.shelf_id)
      .single();
    if (shelfError) throw shelfError;

    const { data: rack, error: rackError } = await supabase
      .from("racks")
      .select("code, warehouse_id")
      .eq("id", shelf.rack_id)
      .single();
    if (rackError) throw rackError;

    const { data: warehouse, error: warehouseError } = await supabase
      .from("warehouses")
      .select("name")
      .eq("id", rack.warehouse_id)
      .single();
    if (warehouseError) throw warehouseError;

    location = {
      boxId: box.id,
      boxCode: box.code,
      shelfCode: shelf.code,
      rackCode: rack.code,
      warehouseName: warehouse.name,
    };
  }

  let catalogueLink: InventoryPartCatalogueLink | null = null;
  if (part.catalogue_part_id) {
    const { data: cataloguePart, error: catalogueError } = await supabase
      .from("catalogue_parts")
      .select("id, part_number, name, brand_id, oem_reference")
      .eq("id", part.catalogue_part_id)
      .single();
    if (catalogueError) throw catalogueError;

    let brandName: string | null = null;
    if (cataloguePart.brand_id) {
      const { data: brand, error: brandError } = await supabase
        .from("brands")
        .select("name")
        .eq("id", cataloguePart.brand_id)
        .single();
      if (brandError) throw brandError;
      brandName = brand.name;
    }

    catalogueLink = {
      id: cataloguePart.id,
      partNumber: cataloguePart.part_number,
      name: cataloguePart.name,
      brandName,
      oemReference: cataloguePart.oem_reference,
    };
  }

  return {
    id: part.id,
    partNumber: part.part_number,
    name: part.name,
    quantity: part.quantity,
    minStock: part.min_stock,
    purchaseCost: part.purchase_cost,
    sellingPrice: part.selling_price,
    status: part.status,
    notes: part.notes,
    boxId: part.box_id,
    deletedAt: part.deleted_at,
    location,
    catalogueLink,
  };
}

export type PartMovementHistoryItem = {
  id: string;
  description: string;
  timestamp: string;
  actorName: string | null;
  direction: MovementDirection;
};

/**
 * A single part's movement history, reusing `describeMovement`
 * (src/lib/stock-movements.ts) so the phrasing matches the dashboard's
 * activity feed exactly (phase3.md §6). Unlike the dashboard's
 * `getRecentActivity`, the part is already known here, so there's no
 * separate part lookup - just movements + actor names.
 */
export async function getPartMovementHistory(
  partId: string,
  partLabel: { partNumber: string; name: string },
): Promise<PartMovementHistoryItem[]> {
  const supabase = await createClient();

  const { data: movements, error } = await supabase
    .from("stock_movements")
    .select("id, movement_type, quantity_change, created_at, created_by")
    .eq("inventory_part_id", partId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!movements || movements.length === 0) return [];

  const actorIds = [
    ...new Set(
      movements.map((m) => m.created_by).filter((id): id is string => id !== null),
    ),
  ];

  let actorNameById = new Map<string, string | null>();
  if (actorIds.length > 0) {
    const { data: actors, error: actorsError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", actorIds);
    if (actorsError) throw actorsError;
    actorNameById = new Map((actors ?? []).map((a) => [a.id, a.full_name]));
  }

  return movements.map((movement) => ({
    id: movement.id,
    description: describeMovement(
      movement.movement_type,
      movement.quantity_change,
      { part_number: partLabel.partNumber, name: partLabel.name },
    ),
    timestamp: movement.created_at,
    actorName:
      (movement.created_by && actorNameById.get(movement.created_by)) || null,
    direction: classifyMovement(movement.movement_type, movement.quantity_change),
  }));
}

export type SelectOption = { value: string; label: string };

/**
 * Every box, labeled with its full Warehouse/Rack/Shelf/Box chain
 * (CLAUDE.md §4 - a location must be unambiguous) for the part form's
 * box picker. Current warehouse footprint is small (racks/shelves/boxes
 * are physical, not a high-cardinality dimension), so one flat fetch +
 * client-side Combobox filtering (the existing Combobox pattern) is
 * enough - no search-as-you-type endpoint needed yet.
 */
export async function getBoxOptions(): Promise<SelectOption[]> {
  const supabase = await createClient();

  const [{ data: boxes, error: boxError }, { data: shelves, error: shelfError }, { data: racks, error: rackError }, { data: warehouses, error: warehouseError }] =
    await Promise.all([
      supabase.from("boxes").select("id, code, shelf_id").is("deleted_at", null),
      supabase.from("shelves").select("id, code, rack_id").is("deleted_at", null),
      supabase.from("racks").select("id, code, warehouse_id").is("deleted_at", null),
      supabase.from("warehouses").select("id, name").is("deleted_at", null),
    ]);

  if (boxError) throw boxError;
  if (shelfError) throw shelfError;
  if (rackError) throw rackError;
  if (warehouseError) throw warehouseError;

  const warehouseNameById = new Map((warehouses ?? []).map((w) => [w.id, w.name]));
  const rackById = new Map((racks ?? []).map((r) => [r.id, r]));
  const shelfById = new Map((shelves ?? []).map((s) => [s.id, s]));

  return (boxes ?? []).map((box) => {
    const shelf = shelfById.get(box.shelf_id);
    const rack = shelf ? rackById.get(shelf.rack_id) : undefined;
    const warehouseName = rack ? warehouseNameById.get(rack.warehouse_id) : undefined;
    const label = [warehouseName, rack?.code, shelf?.code, box.code]
      .filter(Boolean)
      .join(" / ");
    return { value: box.id, label: label || box.code };
  });
}

/**
 * Every catalogue part, for the create/edit form's optional catalogue
 * link (CLAUDE.md §3). 284 real rows today - within what one flat
 * fetch + client-side Combobox filtering handles comfortably; a
 * search-as-you-type endpoint isn't justified at this volume
 * (CLAUDE.md §6).
 */
export async function getCatalogueOptions(): Promise<SelectOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("catalogue_parts")
    .select("id, part_number, name")
    .is("deleted_at", null)
    .order("part_number");

  if (error) throw error;
  return (data ?? []).map((row) => ({
    value: row.id,
    label: `${row.part_number} — ${row.name}`,
  }));
}

export type DuplicatePartMatch = {
  id: string;
  name: string;
  quantity: number;
  status: InventoryStatus;
};

/**
 * Exact part_number match against non-deleted inventory_parts, per the
 * accepted §5 decision - non-blocking, no fuzzy matching.
 */
export async function findDuplicatePartNumber(
  partNumber: string,
  excludeId?: string,
): Promise<DuplicatePartMatch | null> {
  const trimmed = partNumber.trim();
  if (trimmed.length === 0) return null;

  const supabase = await createClient();
  let query = supabase
    .from("inventory_parts")
    .select("id, name, quantity, status")
    .eq("part_number", trimmed)
    .is("deleted_at", null)
    .limit(1);

  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}
