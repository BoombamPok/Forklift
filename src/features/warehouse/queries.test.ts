import { beforeEach, describe, expect, it } from "vitest";
import { vi } from "vitest";

type ChainResult = { data: unknown; error: unknown };

function makeChain(result: ChainResult) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    is: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    not: vi.fn(() => chain),
    order: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(result)),
    then: (
      resolve: (value: ChainResult) => void,
      reject: (reason: unknown) => void,
    ) => Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}

const tableResults: Record<string, ChainResult> = {};
const mockFrom = vi.fn((table: string) => makeChain(tableResults[table]));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mockFrom })),
}));

import {
  fetchFlatHierarchy,
  getWarehouseList,
} from "@/features/warehouse/queries";

beforeEach(() => {
  mockFrom.mockClear();
  for (const key of Object.keys(tableResults)) delete tableResults[key];
  tableResults.warehouses = {
    data: [{ id: "w1", name: "Main", address: "123 Dock Rd" }],
    error: null,
  };
  tableResults.racks = {
    data: [{ id: "r1", code: "R1", warehouse_id: "w1" }],
    error: null,
  };
  tableResults.shelves = {
    data: [
      { id: "s1", code: "S1", rack_id: "r1" },
      { id: "s2", code: "S2", rack_id: "r1" },
    ],
    error: null,
  };
  tableResults.boxes = {
    data: [
      { id: "b1", code: "B1", shelf_id: "s1" },
      { id: "b2", code: "B2", shelf_id: "s1" },
      { id: "b3", code: "B3", shelf_id: "s2" },
    ],
    error: null,
  };
  tableResults.inventory_parts = { data: [], error: null };
});

describe("fetchFlatHierarchy", () => {
  it("flattens every level into camelCase-keyed rows", async () => {
    const result = await fetchFlatHierarchy();
    expect(result.warehouses).toEqual([{ id: "w1", name: "Main" }]);
    expect(result.racks).toEqual([{ id: "r1", code: "R1", warehouseId: "w1" }]);
    expect(result.shelves).toEqual([
      { id: "s1", code: "S1", rackId: "r1" },
      { id: "s2", code: "S2", rackId: "r1" },
    ]);
    expect(result.boxes).toEqual([
      { id: "b1", code: "B1", shelfId: "s1" },
      { id: "b2", code: "B2", shelfId: "s1" },
      { id: "b3", code: "B3", shelfId: "s2" },
    ]);
  });

  it("propagates a query error from any level", async () => {
    const dbError = { code: "PGRST000", message: "network error" };
    tableResults.boxes = { data: null, error: dbError };
    await expect(fetchFlatHierarchy()).rejects.toBe(dbError);
  });
});

describe("getWarehouseList", () => {
  it("computes rack count and occupancy from real box_id assignments, not a fabricated figure", async () => {
    tableResults.inventory_parts = {
      data: [{ box_id: "b1" }, { box_id: "b1" }, { box_id: "b3" }],
      error: null,
    };

    const [warehouse] = await getWarehouseList();
    expect(warehouse.rackCount).toBe(1);
    // 3 boxes total under this warehouse (b1, b2, b3); b1 and b3 are
    // occupied (b1 by two parts, still counts once), b2 is empty.
    expect(warehouse.boxesTotal).toBe(3);
    expect(warehouse.boxesOccupied).toBe(2);
  });

  it("reports zero occupancy when no part is assigned to any box", async () => {
    const [warehouse] = await getWarehouseList();
    expect(warehouse.boxesTotal).toBe(3);
    expect(warehouse.boxesOccupied).toBe(0);
  });

  it("returns an empty list for a warehouse-free hierarchy", async () => {
    tableResults.warehouses = { data: [], error: null };
    tableResults.racks = { data: [], error: null };
    tableResults.shelves = { data: [], error: null };
    tableResults.boxes = { data: [], error: null };
    expect(await getWarehouseList()).toEqual([]);
  });
});
