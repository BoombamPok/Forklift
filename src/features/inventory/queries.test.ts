import { beforeEach, describe, expect, it, vi } from "vitest";

type ChainResult = { data: unknown; error: unknown; count?: number | null };

function makeChain(result: ChainResult) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    is: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    not: vi.fn(() => chain),
    in: vi.fn(() => chain),
    order: vi.fn(() => chain),
    range: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
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
  findDuplicatePartNumber,
  getInventoryList,
  getPartMovementHistory,
} from "@/features/inventory/queries";

beforeEach(() => {
  mockFrom.mockClear();
  for (const key of Object.keys(tableResults)) delete tableResults[key];
  tableResults.catalogue_parts = { data: [], error: null };
  tableResults.brands = { data: [], error: null };
  tableResults.boxes = { data: [], error: null };
});

describe("findDuplicatePartNumber", () => {
  it("returns null when nothing matches", async () => {
    tableResults.inventory_parts = { data: null, error: null };
    expect(await findDuplicatePartNumber("NO-MATCH")).toBeNull();
  });

  it("returns the matching row", async () => {
    tableResults.inventory_parts = {
      data: { id: "p1", name: "Existing Part", quantity: 5, status: "active" },
      error: null,
    };
    const match = await findDuplicatePartNumber("SAMPLE-0001");
    expect(match).toEqual({
      id: "p1",
      name: "Existing Part",
      quantity: 5,
      status: "active",
    });
  });

  it("returns null for a blank part number without querying", async () => {
    expect(await findDuplicatePartNumber("   ")).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("propagates a query error", async () => {
    const dbError = { code: "PGRST000", message: "network error" };
    tableResults.inventory_parts = { data: null, error: dbError };
    await expect(findDuplicatePartNumber("X")).rejects.toBe(dbError);
  });
});

describe("getInventoryList", () => {
  it("uses real server-side pagination when no stock filter is set", async () => {
    tableResults.inventory_parts = {
      data: [
        {
          id: "p1",
          part_number: "A",
          name: "A",
          quantity: 5,
          min_stock: null,
          status: "active",
          catalogue_part_id: null,
          box_id: null,
        },
      ],
      error: null,
      count: 42,
    };

    const result = await getInventoryList({
      page: 2,
      pageSize: 20,
      sortBy: "name",
      sortDir: "asc",
    });

    expect(result.totalCount).toBe(42);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].id).toBe("p1");
  });

  it("filters/sorts/paginates in JS for a stock-level filter", async () => {
    tableResults.inventory_parts = {
      data: [
        {
          id: "p1",
          part_number: "A",
          name: "A",
          quantity: 0,
          min_stock: null,
          status: "active",
          catalogue_part_id: null,
          box_id: null,
        }, // out_of_stock
        {
          id: "p2",
          part_number: "B",
          name: "B",
          quantity: 5,
          min_stock: 10,
          status: "active",
          catalogue_part_id: null,
          box_id: null,
        }, // critical (50%)
        {
          id: "p3",
          part_number: "C",
          name: "C",
          quantity: 20,
          min_stock: null,
          status: "active",
          catalogue_part_id: null,
          box_id: null,
        }, // healthy - excluded
      ],
      error: null,
    };

    const result = await getInventoryList({
      page: 1,
      pageSize: 20,
      sortBy: "part_number",
      sortDir: "asc",
      stockFilter: "out_of_stock",
    });

    expect(result.totalCount).toBe(1);
    expect(result.rows.map((r) => r.id)).toEqual(["p1"]);
  });

  it("resolves brand name and box code through their flat lookups", async () => {
    tableResults.inventory_parts = {
      data: [
        {
          id: "p1",
          part_number: "A",
          name: "A",
          quantity: 5,
          min_stock: null,
          status: "active",
          catalogue_part_id: "cp1",
          box_id: "b1",
        },
      ],
      error: null,
      count: 1,
    };
    tableResults.catalogue_parts = {
      data: [{ id: "cp1", brand_id: "br1" }],
      error: null,
    };
    tableResults.brands = {
      data: [{ id: "br1", name: "Godrej" }],
      error: null,
    };
    tableResults.boxes = { data: [{ id: "b1", code: "B01" }], error: null };

    const result = await getInventoryList({
      page: 1,
      pageSize: 20,
      sortBy: "name",
      sortDir: "asc",
    });

    expect(result.rows[0].brandName).toBe("Godrej");
    expect(result.rows[0].boxCode).toBe("B01");
    expect(result.rows[0].linked).toBe(true);
  });

  it("propagates a query error", async () => {
    const dbError = { code: "PGRST000", message: "network error" };
    tableResults.inventory_parts = { data: null, error: dbError, count: null };
    await expect(
      getInventoryList({
        page: 1,
        pageSize: 20,
        sortBy: "name",
        sortDir: "asc",
      }),
    ).rejects.toBe(dbError);
  });
});

describe("getPartMovementHistory", () => {
  it("returns an empty list when there are no movements", async () => {
    tableResults.stock_movements = { data: [], error: null };
    expect(
      await getPartMovementHistory("p1", { partNumber: "A", name: "Part A" }),
    ).toEqual([]);
  });

  it("describes each movement using the already-known part label", async () => {
    tableResults.stock_movements = {
      data: [
        {
          id: "m1",
          movement_type: "in",
          quantity_change: 10,
          created_at: "2026-09-05T10:00:00Z",
          created_by: null,
        },
      ],
      error: null,
    };

    const [item] = await getPartMovementHistory("p1", {
      partNumber: "SAMPLE-0001",
      name: "Sample Oil Filter",
    });

    expect(item.description).toBe(
      "Received 10 × Sample Oil Filter (SAMPLE-0001)",
    );
    expect(item.direction).toBe("in");
    expect(item.actorName).toBeNull();
  });

  it("resolves the actor's name when visible", async () => {
    tableResults.stock_movements = {
      data: [
        {
          id: "m1",
          movement_type: "out",
          quantity_change: -3,
          created_at: "2026-09-05T10:00:00Z",
          created_by: "u1",
        },
      ],
      error: null,
    };
    tableResults.profiles = {
      data: [{ id: "u1", full_name: "Jane Warehouse" }],
      error: null,
    };

    const [item] = await getPartMovementHistory("p1", {
      partNumber: "A",
      name: "Part A",
    });

    expect(item.actorName).toBe("Jane Warehouse");
  });
});
