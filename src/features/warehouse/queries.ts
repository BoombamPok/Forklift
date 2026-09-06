import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { InventoryStatus } from "@/types/database";

export type HierarchyWarehouse = { id: string; name: string };
export type HierarchyRack = { id: string; code: string; warehouseId: string };
export type HierarchyShelf = { id: string; code: string; rackId: string };
export type HierarchyBox = { id: string; code: string; shelfId: string };

export type FlatHierarchy = {
  warehouses: HierarchyWarehouse[];
  racks: HierarchyRack[];
  shelves: HierarchyShelf[];
  boxes: HierarchyBox[];
};

/**
 * The one place the full warehouse/rack/shelf/box tree gets fetched flat
 * (phase4.md §6 - reuse, don't reimplement `getBoxOptions()`'s pattern). Only
 * non-deleted rows at every level, matching the rest of the app's list
 * convention; a specific detail page still resolves a soft-deleted record's
 * own row and its ancestor chain separately (see the `get*Ancestors`
 * functions below), the same "still viewable, just marked Deleted" precedent
 * as `getInventoryPartDetail`. Current footprint is small (racks/shelves/
 * boxes are physical, not a high-cardinality dimension - CLAUDE.md §6), so
 * one flat fetch + join in JS is enough; no per-level SQL queries needed.
 */
export async function fetchFlatHierarchy(): Promise<FlatHierarchy> {
  const supabase = await createClient();

  const [warehouseRes, rackRes, shelfRes, boxRes] = await Promise.all([
    supabase.from("warehouses").select("id, name").is("deleted_at", null),
    supabase
      .from("racks")
      .select("id, code, warehouse_id")
      .is("deleted_at", null),
    supabase.from("shelves").select("id, code, rack_id").is("deleted_at", null),
    supabase.from("boxes").select("id, code, shelf_id").is("deleted_at", null),
  ]);

  if (warehouseRes.error) throw warehouseRes.error;
  if (rackRes.error) throw rackRes.error;
  if (shelfRes.error) throw shelfRes.error;
  if (boxRes.error) throw boxRes.error;

  return {
    warehouses: (warehouseRes.data ?? []).map((w) => ({
      id: w.id,
      name: w.name,
    })),
    racks: (rackRes.data ?? []).map((r) => ({
      id: r.id,
      code: r.code,
      warehouseId: r.warehouse_id,
    })),
    shelves: (shelfRes.data ?? []).map((s) => ({
      id: s.id,
      code: s.code,
      rackId: s.rack_id,
    })),
    boxes: (boxRes.data ?? []).map((b) => ({
      id: b.id,
      code: b.code,
      shelfId: b.shelf_id,
    })),
  };
}

/**
 * Every box currently holding at least one non-deleted inventory_part,
 * mapped to how many. This is the one real source of "occupancy" - no
 * fabricated capacity concept exists in the schema (CLAUDE.md §13/
 * phase4.md §3), so occupancy is always this count compared against how
 * many boxes actually exist.
 */
async function getBoxPartCounts(): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_parts")
    .select("box_id")
    .not("box_id", "is", null)
    .is("deleted_at", null);

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.box_id) continue;
    counts.set(row.box_id, (counts.get(row.box_id) ?? 0) + 1);
  }
  return counts;
}

function groupBy<T, K>(items: T[], keyOf: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  return map;
}

export type OccupancySummary = { boxesTotal: number; boxesOccupied: number };

function summarizeOccupancy(
  boxes: HierarchyBox[],
  boxPartCounts: Map<string, number>,
): OccupancySummary {
  return {
    boxesTotal: boxes.length,
    boxesOccupied: boxes.filter((b) => boxPartCounts.has(b.id)).length,
  };
}

export type WarehouseListRow = {
  id: string;
  name: string;
  address: string | null;
  rackCount: number;
} & OccupancySummary;

/**
 * `/warehouse`'s list (phase4.md §4) - one warehouse row per warehouse,
 * with a real rack count and real occupancy summary computed from the
 * flat hierarchy, not a fabricated figure.
 */
export async function getWarehouseList(): Promise<WarehouseListRow[]> {
  const supabase = await createClient();
  const [
    { data: warehouses, error },
    { racks, shelves, boxes },
    boxPartCounts,
  ] = await Promise.all([
    supabase
      .from("warehouses")
      .select("id, name, address")
      .is("deleted_at", null),
    fetchFlatHierarchy(),
    getBoxPartCounts(),
  ]);

  if (error) throw error;

  const racksByWarehouse = groupBy(racks, (r) => r.warehouseId);
  const shelvesByRack = groupBy(shelves, (s) => s.rackId);
  const boxesByShelf = groupBy(boxes, (b) => b.shelfId);

  return (warehouses ?? []).map((w) => {
    const whRacks = racksByWarehouse.get(w.id) ?? [];
    const whShelves = whRacks.flatMap((r) => shelvesByRack.get(r.id) ?? []);
    const whBoxes = whShelves.flatMap((s) => boxesByShelf.get(s.id) ?? []);

    return {
      id: w.id,
      name: w.name,
      address: w.address,
      rackCount: whRacks.length,
      ...summarizeOccupancy(whBoxes, boxPartCounts),
    };
  });
}

export type RackSummary = {
  id: string;
  code: string;
  shelfCount: number;
} & OccupancySummary;

export type WarehouseDetail = {
  id: string;
  name: string;
  address: string | null;
  deletedAt: string | null;
  racks: RackSummary[];
};

/**
 * `/warehouse/[id]` (phase4.md §4, new route) - the warehouse itself is
 * fetched by id regardless of `deleted_at` (still viewable once deleted,
 * same as `getInventoryPartDetail`); its racks come from the flat, already
 * non-deleted hierarchy.
 */
export async function getWarehouseDetail(id: string): Promise<WarehouseDetail> {
  const supabase = await createClient();
  const { data: warehouse, error } = await supabase
    .from("warehouses")
    .select("id, name, address, deleted_at")
    .eq("id", id)
    .single();

  if (error) throw error;

  const [{ racks, shelves, boxes }, boxPartCounts] = await Promise.all([
    fetchFlatHierarchy(),
    getBoxPartCounts(),
  ]);

  const shelvesByRack = groupBy(shelves, (s) => s.rackId);
  const boxesByShelf = groupBy(boxes, (b) => b.shelfId);

  const rackSummaries: RackSummary[] = racks
    .filter((r) => r.warehouseId === id)
    .map((r) => {
      const rackShelves = shelvesByRack.get(r.id) ?? [];
      const rackBoxes = rackShelves.flatMap(
        (s) => boxesByShelf.get(s.id) ?? [],
      );
      return {
        id: r.id,
        code: r.code,
        shelfCount: rackShelves.length,
        ...summarizeOccupancy(rackBoxes, boxPartCounts),
      };
    });

  return {
    id: warehouse.id,
    name: warehouse.name,
    address: warehouse.address,
    deletedAt: warehouse.deleted_at,
    racks: rackSummaries,
  };
}

export type ShelfSummary = { id: string; code: string } & OccupancySummary;

export type RackDetail = {
  id: string;
  code: string;
  deletedAt: string | null;
  warehouse: HierarchyWarehouse;
  shelves: ShelfSummary[];
};

/**
 * `/warehouse/racks/[id]` (phase4.md §4, real implementation) - the
 * warehouse ancestor is resolved by a direct point lookup rather than the
 * flat (non-deleted-only) hierarchy, so the breadcrumb still resolves
 * correctly even if the warehouse itself has since been soft-deleted.
 */
export async function getRackDetail(id: string): Promise<RackDetail> {
  const supabase = await createClient();
  const { data: rack, error } = await supabase
    .from("racks")
    .select("id, code, warehouse_id, deleted_at")
    .eq("id", id)
    .single();

  if (error) throw error;

  const { data: warehouse, error: warehouseError } = await supabase
    .from("warehouses")
    .select("id, name")
    .eq("id", rack.warehouse_id)
    .single();

  if (warehouseError) throw warehouseError;

  const [{ shelves, boxes }, boxPartCounts] = await Promise.all([
    fetchFlatHierarchy(),
    getBoxPartCounts(),
  ]);

  const boxesByShelf = groupBy(boxes, (b) => b.shelfId);

  const shelfSummaries: ShelfSummary[] = shelves
    .filter((s) => s.rackId === id)
    .map((s) => ({
      id: s.id,
      code: s.code,
      ...summarizeOccupancy(boxesByShelf.get(s.id) ?? [], boxPartCounts),
    }));

  return {
    id: rack.id,
    code: rack.code,
    deletedAt: rack.deleted_at,
    warehouse,
    shelves: shelfSummaries,
  };
}

export type BoxSummary = { id: string; code: string; partCount: number };

export type ShelfDetail = {
  id: string;
  code: string;
  deletedAt: string | null;
  warehouse: HierarchyWarehouse;
  rack: HierarchyRack;
  boxes: BoxSummary[];
};

/**
 * `/warehouse/shelves/[id]` (phase4.md §4, new route - not stubbed in
 * Phase 1).
 */
export async function getShelfDetail(id: string): Promise<ShelfDetail> {
  const supabase = await createClient();
  const { data: shelf, error } = await supabase
    .from("shelves")
    .select("id, code, rack_id, deleted_at")
    .eq("id", id)
    .single();

  if (error) throw error;

  const { data: rack, error: rackError } = await supabase
    .from("racks")
    .select("id, code, warehouse_id")
    .eq("id", shelf.rack_id)
    .single();

  if (rackError) throw rackError;

  const { data: warehouse, error: warehouseError } = await supabase
    .from("warehouses")
    .select("id, name")
    .eq("id", rack.warehouse_id)
    .single();

  if (warehouseError) throw warehouseError;

  const [{ boxes }, boxPartCounts] = await Promise.all([
    fetchFlatHierarchy(),
    getBoxPartCounts(),
  ]);

  const boxSummaries: BoxSummary[] = boxes
    .filter((b) => b.shelfId === id)
    .map((b) => ({
      id: b.id,
      code: b.code,
      partCount: boxPartCounts.get(b.id) ?? 0,
    }));

  return {
    id: shelf.id,
    code: shelf.code,
    deletedAt: shelf.deleted_at,
    warehouse,
    rack: { id: rack.id, code: rack.code, warehouseId: rack.warehouse_id },
    boxes: boxSummaries,
  };
}

export type BoxPartRow = {
  id: string;
  partNumber: string;
  name: string;
  quantity: number;
  status: InventoryStatus;
};

export type BoxDetail = {
  id: string;
  code: string;
  deletedAt: string | null;
  warehouse: HierarchyWarehouse;
  rack: HierarchyRack;
  shelf: HierarchyShelf;
  parts: BoxPartRow[];
};

/**
 * `/warehouse/boxes/[id]` (phase4.md §4, real implementation) - the parts
 * currently assigned here, linking back to each part's Phase 3 detail
 * page (phase4.md goal #4).
 */
export async function getBoxDetail(id: string): Promise<BoxDetail> {
  const supabase = await createClient();
  const { data: box, error } = await supabase
    .from("boxes")
    .select("id, code, shelf_id, deleted_at")
    .eq("id", id)
    .single();

  if (error) throw error;

  const { data: shelf, error: shelfError } = await supabase
    .from("shelves")
    .select("id, code, rack_id")
    .eq("id", box.shelf_id)
    .single();

  if (shelfError) throw shelfError;

  const { data: rack, error: rackError } = await supabase
    .from("racks")
    .select("id, code, warehouse_id")
    .eq("id", shelf.rack_id)
    .single();

  if (rackError) throw rackError;

  const { data: warehouse, error: warehouseError } = await supabase
    .from("warehouses")
    .select("id, name")
    .eq("id", rack.warehouse_id)
    .single();

  if (warehouseError) throw warehouseError;

  const { data: parts, error: partsError } = await supabase
    .from("inventory_parts")
    .select("id, part_number, name, quantity, status")
    .eq("box_id", id)
    .is("deleted_at", null)
    .order("part_number");

  if (partsError) throw partsError;

  return {
    id: box.id,
    code: box.code,
    deletedAt: box.deleted_at,
    warehouse,
    rack: { id: rack.id, code: rack.code, warehouseId: rack.warehouse_id },
    shelf: { id: shelf.id, code: shelf.code, rackId: shelf.rack_id },
    parts: (parts ?? []).map((p) => ({
      id: p.id,
      partNumber: p.part_number,
      name: p.name,
      quantity: p.quantity,
      status: p.status,
    })),
  };
}
