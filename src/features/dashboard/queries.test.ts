import { beforeEach, describe, expect, it, vi } from "vitest";

type ChainResult = { data: unknown; error: unknown };

function makeChain(result: ChainResult) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    is: vi.fn(() => chain),
    in: vi.fn(() => chain),
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
  getInventoryCountByBrand,
  getInventoryItemCount,
  getInventoryValue,
  getLowStockCount,
  getOutOfStockCount,
} from "@/features/dashboard/queries";

type Row = {
  quantity: number;
  min_stock: number | null;
  purchase_cost: number | null;
  catalogue_part_id?: string | null;
};

function mockRows(rows: Row[]) {
  tableResults.inventory_parts = { data: rows, error: null };
}

beforeEach(() => {
  mockFrom.mockClear();
  for (const key of Object.keys(tableResults)) delete tableResults[key];
  tableResults.catalogue_parts = { data: [], error: null };
  tableResults.brands = { data: [], error: null };
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

// Not a low-stock part (10 > min_stock 5), a low-stock part (3 <= 5), an
// out-of-stock part, a part with no threshold configured (never low
// regardless of quantity), a part with no purchase_cost, and a part with
// a negative (data-quality-bad) purchase_cost.
const rows: Row[] = [
  { quantity: 10, min_stock: 5, purchase_cost: 2 },
  { quantity: 3, min_stock: 5, purchase_cost: 4 },
  { quantity: 0, min_stock: 2, purchase_cost: 1 },
  { quantity: 8, min_stock: null, purchase_cost: 3 },
  { quantity: 6, min_stock: 10, purchase_cost: null },
  { quantity: 4, min_stock: 1, purchase_cost: -5 },
];

describe("getInventoryItemCount", () => {
  it("counts every fetched row", async () => {
    mockRows(rows);
    expect(await getInventoryItemCount()).toBe(rows.length);
  });

  it("returns 0 for an empty table", async () => {
    mockRows([]);
    expect(await getInventoryItemCount()).toBe(0);
  });
});

describe("getInventoryValue", () => {
  it("sums quantity * purchase_cost, excluding null/negative cost rows", async () => {
    mockRows(rows);
    // 10*2 + 3*4 + 0*1 + 8*3 = 20 + 12 + 0 + 24 = 56
    expect(await getInventoryValue()).toEqual({ value: 56, excludedCount: 2 });
  });

  it("returns a zero value with no exclusions for an empty table", async () => {
    mockRows([]);
    expect(await getInventoryValue()).toEqual({ value: 0, excludedCount: 0 });
  });
});

describe("getLowStockCount", () => {
  it("counts only in-stock rows at or below their configured min_stock", async () => {
    mockRows(rows);
    // Rows 2 (3<=5) and 5 (6<=10) qualify; row 1 (10<=5) doesn't, row 3 is
    // out of stock (quantity 0), row 4 has no threshold, row 6 (4<=1)
    // doesn't.
    expect(await getLowStockCount()).toBe(2);
  });

  it("never counts a part with zero quantity, even with a threshold set", async () => {
    mockRows([{ quantity: 0, min_stock: 5, purchase_cost: 1 }]);
    expect(await getLowStockCount()).toBe(0);
  });

  it("returns 0 for an empty table", async () => {
    mockRows([]);
    expect(await getLowStockCount()).toBe(0);
  });
});

describe("getOutOfStockCount", () => {
  it("counts rows with zero quantity", async () => {
    mockRows(rows);
    expect(await getOutOfStockCount()).toBe(1);
  });

  it("returns 0 for an empty table", async () => {
    mockRows([]);
    expect(await getOutOfStockCount()).toBe(0);
  });
});

describe("soft-delete and error handling", () => {
  it("queries only deleted_at is null rows", async () => {
    mockRows(rows);
    await getInventoryItemCount();
    const inventoryChain = mockFrom.mock.results.find(
      (result, index) => mockFrom.mock.calls[index][0] === "inventory_parts",
    )?.value as { is: ReturnType<typeof vi.fn> };
    expect(inventoryChain.is).toHaveBeenCalledWith("deleted_at", null);
  });

  it("throws a distinguishable error on query failure instead of returning zero", async () => {
    const dbError = { code: "PGRST000", message: "network error", details: "" };
    tableResults.inventory_parts = { data: null, error: dbError };
    await expect(getInventoryItemCount()).rejects.toBe(dbError);
  });
});

describe("getInventoryCountByBrand", () => {
  it("counts in-stock parts per brand, bucketing unlinked/unbranded parts as Unlinked", async () => {
    mockRows([
      {
        quantity: 10,
        min_stock: null,
        purchase_cost: 2,
        catalogue_part_id: "cp1",
      },
      {
        quantity: 3,
        min_stock: null,
        purchase_cost: 4,
        catalogue_part_id: "cp1",
      },
      {
        quantity: 5,
        min_stock: null,
        purchase_cost: 3,
        catalogue_part_id: "cp2",
      },
      {
        quantity: 1,
        min_stock: null,
        purchase_cost: 1,
        catalogue_part_id: null,
      },
    ]);
    tableResults.catalogue_parts = {
      data: [
        { id: "cp1", brand_id: "b1" },
        { id: "cp2", brand_id: null },
      ],
      error: null,
    };
    tableResults.brands = {
      data: [{ id: "b1", name: "Godrej" }],
      error: null,
    };

    const rows = await getInventoryCountByBrand();
    const byLabel = new Map(rows.map((r) => [r.label, r.itemCount]));

    expect(byLabel.get("Godrej")).toBe(2);
    expect(byLabel.get("Unlinked")).toBe(2);
  });

  it("sorts brands by item count descending", async () => {
    mockRows([
      {
        quantity: 1,
        min_stock: null,
        purchase_cost: 1,
        catalogue_part_id: "cp1",
      },
      {
        quantity: 1,
        min_stock: null,
        purchase_cost: 1,
        catalogue_part_id: "cp2",
      },
      {
        quantity: 1,
        min_stock: null,
        purchase_cost: 1,
        catalogue_part_id: "cp2",
      },
    ]);
    tableResults.catalogue_parts = {
      data: [
        { id: "cp1", brand_id: "b1" },
        { id: "cp2", brand_id: "b2" },
      ],
      error: null,
    };
    tableResults.brands = {
      data: [
        { id: "b1", name: "Small" },
        { id: "b2", name: "Big" },
      ],
      error: null,
    };

    const rows = await getInventoryCountByBrand();
    expect(rows[0]).toEqual({ label: "Big", itemCount: 2 });
    expect(rows[1]).toEqual({ label: "Small", itemCount: 1 });
  });

  it("returns an empty array for an empty table", async () => {
    mockRows([]);
    expect(await getInventoryCountByBrand()).toEqual([]);
  });
});
