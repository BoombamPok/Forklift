import "server-only";

import { groupBy } from "@/lib/utils";
import {
  fetchFlatHierarchy,
  getBoxPartCounts,
} from "@/features/warehouse/queries";

export type OccupancyRollupRow = {
  warehouseId: string;
  warehouseName: string;
  rackId: string;
  rackCode: string;
  shelfCount: number;
  boxesTotal: number;
  boxesOccupied: number;
};

/**
 * Per-warehouse, per-rack occupancy across the whole hierarchy in one
 * pass (phase6.md §4/§6 - extends Phase 4's per-location badges to a
 * full cross-warehouse rollup, "one query rather than N+1 per-location
 * calls"). Built entirely from the same flat fetch/occupancy-counting
 * functions `getWarehouseDetail`/`getRackDetail` already use
 * (src/features/warehouse/queries.ts) - no new counting logic.
 */
export async function getOccupancyRollup(): Promise<OccupancyRollupRow[]> {
  const [{ warehouses, racks, shelves, boxes }, boxPartCounts] =
    await Promise.all([fetchFlatHierarchy(), getBoxPartCounts()]);

  const shelvesByRack = groupBy(shelves, (s) => s.rackId);
  const boxesByShelf = groupBy(boxes, (b) => b.shelfId);
  const warehouseById = new Map(warehouses.map((w) => [w.id, w]));

  return racks
    .map((rack) => {
      const warehouse = warehouseById.get(rack.warehouseId);
      if (!warehouse) return null;

      const rackShelves = shelvesByRack.get(rack.id) ?? [];
      const rackBoxes = rackShelves.flatMap(
        (s) => boxesByShelf.get(s.id) ?? [],
      );

      return {
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        rackId: rack.id,
        rackCode: rack.code,
        shelfCount: rackShelves.length,
        boxesTotal: rackBoxes.length,
        boxesOccupied: rackBoxes.filter((b) => boxPartCounts.has(b.id)).length,
      };
    })
    .filter((row): row is OccupancyRollupRow => row !== null)
    .sort((a, b) =>
      a.warehouseName === b.warehouseName
        ? a.rackCode.localeCompare(b.rackCode)
        : a.warehouseName.localeCompare(b.warehouseName),
    );
}
