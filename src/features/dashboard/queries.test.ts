import { beforeEach, describe, expect, it, vi } from "vitest";

const mockIs = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({ is: mockIs })),
    })),
  })),
}));

import {
  getInventoryItemCount,
  getInventoryValue,
  getLowStockCount,
  getOutOfStockCount,
} from "@/features/dashboard/queries";

type Row = {
  quantity: number;
  min_stock: number | null;
  purchase_cost: number | null;
};

function mockRows(rows: Row[]) {
  mockIs.mockResolvedValue({ data: rows, error: null });
}

beforeEach(() => {
  mockIs.mockReset();
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
    expect(mockIs).toHaveBeenCalledWith("deleted_at", null);
  });

  it("throws a distinguishable error on query failure instead of returning zero", async () => {
    const dbError = { code: "PGRST000", message: "network error", details: "" };
    mockIs.mockResolvedValue({ data: null, error: dbError });
    await expect(getInventoryItemCount()).rejects.toBe(dbError);
  });
});
