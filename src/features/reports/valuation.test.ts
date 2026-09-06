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
  getInventoryValuationByBrand,
  getInventoryValuationByCategory,
} from "@/features/reports/valuation";

beforeEach(() => {
  mockFrom.mockClear();
  for (const key of Object.keys(tableResults)) delete tableResults[key];
  tableResults.catalogue_parts = { data: [], error: null };
  tableResults.categories = { data: [], error: null };
  tableResults.brands = { data: [], error: null };
});

describe("getInventoryValuationByCategory", () => {
  it("sums cost basis per category, bucketing unlinked/uncategorized parts as Unlinked", async () => {
    tableResults.inventory_parts = {
      data: [
        { quantity: 10, purchase_cost: 2, catalogue_part_id: "cp1" }, // Bearings: 20
        { quantity: 3, purchase_cost: 4, catalogue_part_id: "cp1" }, // Bearings: 12
        { quantity: 5, purchase_cost: 3, catalogue_part_id: "cp2" }, // no category -> Unlinked: 15
        { quantity: 1, purchase_cost: 100, catalogue_part_id: null }, // Unlinked: 100
        { quantity: 2, purchase_cost: null, catalogue_part_id: "cp1" }, // excluded
      ],
      error: null,
    };
    tableResults.catalogue_parts = {
      data: [
        { id: "cp1", category_id: "cat1" },
        { id: "cp2", category_id: null },
      ],
      error: null,
    };
    tableResults.categories = {
      data: [{ id: "cat1", name: "Bearings" }],
      error: null,
    };

    const rows = await getInventoryValuationByCategory();
    const byLabel = new Map(rows.map((r) => [r.label, r]));

    expect(byLabel.get("Bearings")).toEqual({
      label: "Bearings",
      itemCount: 3,
      value: 32,
      excludedCount: 1,
    });
    expect(byLabel.get("Unlinked")).toEqual({
      label: "Unlinked",
      itemCount: 2,
      value: 115,
      excludedCount: 0,
    });
  });

  it("sorts buckets by value descending", async () => {
    tableResults.inventory_parts = {
      data: [
        { quantity: 1, purchase_cost: 5, catalogue_part_id: "cp1" },
        { quantity: 1, purchase_cost: 500, catalogue_part_id: "cp2" },
      ],
      error: null,
    };
    tableResults.catalogue_parts = {
      data: [
        { id: "cp1", category_id: "cat1" },
        { id: "cp2", category_id: "cat2" },
      ],
      error: null,
    };
    tableResults.categories = {
      data: [
        { id: "cat1", name: "Small" },
        { id: "cat2", name: "Big" },
      ],
      error: null,
    };

    const rows = await getInventoryValuationByCategory();
    expect(rows.map((r) => r.label)).toEqual(["Big", "Small"]);
  });

  it("returns an empty list for an empty table", async () => {
    tableResults.inventory_parts = { data: [], error: null };
    expect(await getInventoryValuationByCategory()).toEqual([]);
  });
});

describe("getInventoryValuationByBrand", () => {
  it("sums cost basis per brand, bucketing unlinked/unbranded parts as Unlinked", async () => {
    tableResults.inventory_parts = {
      data: [
        { quantity: 10, purchase_cost: 2, catalogue_part_id: "cp1" }, // Godrej: 20
        { quantity: 5, purchase_cost: 3, catalogue_part_id: "cp2" }, // no brand -> Unlinked: 15
        { quantity: 1, purchase_cost: 100, catalogue_part_id: null }, // Unlinked: 100
      ],
      error: null,
    };
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

    const rows = await getInventoryValuationByBrand();
    const byLabel = new Map(rows.map((r) => [r.label, r]));

    expect(byLabel.get("Godrej")).toEqual({
      label: "Godrej",
      itemCount: 1,
      value: 20,
      excludedCount: 0,
    });
    expect(byLabel.get("Unlinked")).toEqual({
      label: "Unlinked",
      itemCount: 2,
      value: 115,
      excludedCount: 0,
    });
  });

  it("propagates a query error", async () => {
    const dbError = { code: "PGRST000", message: "network error" };
    tableResults.inventory_parts = { data: null, error: dbError };
    await expect(getInventoryValuationByBrand()).rejects.toBe(dbError);
  });
});
