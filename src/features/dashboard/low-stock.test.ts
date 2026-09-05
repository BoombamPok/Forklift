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

import { getLowStockRows } from "@/features/dashboard/low-stock";

beforeEach(() => {
  mockFrom.mockClear();
  for (const key of Object.keys(tableResults)) delete tableResults[key];
  tableResults.catalogue_parts = { data: [], error: null };
  tableResults.brands = { data: [], error: null };
});

describe("getLowStockRows", () => {
  it("returns nothing when every part is healthily stocked", async () => {
    tableResults.inventory_parts = {
      data: [
        {
          id: "p1",
          part_number: "A",
          name: "A",
          quantity: 10,
          min_stock: 5,
          catalogue_part_id: null,
        },
      ],
      error: null,
    };

    expect(await getLowStockRows()).toEqual([]);
  });

  it("includes a zero-quantity part even with no min_stock configured", async () => {
    tableResults.inventory_parts = {
      data: [
        {
          id: "p1",
          part_number: "A",
          name: "A",
          quantity: 0,
          min_stock: null,
          catalogue_part_id: null,
        },
      ],
      error: null,
    };

    const rows = await getLowStockRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("out_of_stock");
  });

  it("excludes a nonzero-quantity part with no min_stock configured", async () => {
    tableResults.inventory_parts = {
      data: [
        {
          id: "p1",
          part_number: "A",
          name: "A",
          quantity: 3,
          min_stock: null,
          catalogue_part_id: null,
        },
      ],
      error: null,
    };

    expect(await getLowStockRows()).toEqual([]);
  });

  it("classifies at/below 50% of min_stock as critical, above that but at/below min_stock as low", async () => {
    tableResults.inventory_parts = {
      data: [
        {
          id: "p1",
          part_number: "A",
          name: "A",
          quantity: 5,
          min_stock: 10,
          catalogue_part_id: null,
        }, // 50% -> critical
        {
          id: "p2",
          part_number: "B",
          name: "B",
          quantity: 8,
          min_stock: 10,
          catalogue_part_id: null,
        }, // 80% -> low
        {
          id: "p3",
          part_number: "C",
          name: "C",
          quantity: 10,
          min_stock: 10,
          catalogue_part_id: null,
        }, // 100% -> low
      ],
      error: null,
    };

    const rows = await getLowStockRows();
    const byId = new Map(rows.map((r) => [r.id, r.status]));
    expect(byId.get("p1")).toBe("critical");
    expect(byId.get("p2")).toBe("low");
    expect(byId.get("p3")).toBe("low");
  });

  it("sorts ascending by quantity, worst first", async () => {
    tableResults.inventory_parts = {
      data: [
        {
          id: "p1",
          part_number: "A",
          name: "A",
          quantity: 2,
          min_stock: 10,
          catalogue_part_id: null,
        },
        {
          id: "p2",
          part_number: "B",
          name: "B",
          quantity: 0,
          min_stock: null,
          catalogue_part_id: null,
        },
        {
          id: "p3",
          part_number: "C",
          name: "C",
          quantity: 1,
          min_stock: 10,
          catalogue_part_id: null,
        },
      ],
      error: null,
    };

    const rows = await getLowStockRows();
    expect(rows.map((r) => r.id)).toEqual(["p2", "p3", "p1"]);
  });

  it("resolves brand name through catalogue_part_id -> catalogue_parts.brand_id -> brands.name", async () => {
    tableResults.inventory_parts = {
      data: [
        {
          id: "p1",
          part_number: "A",
          name: "A",
          quantity: 0,
          min_stock: null,
          catalogue_part_id: "cp1",
        },
      ],
      error: null,
    };
    tableResults.catalogue_parts = {
      data: [{ id: "cp1", brand_id: "b1" }],
      error: null,
    };
    tableResults.brands = {
      data: [{ id: "b1", name: "Godrej" }],
      error: null,
    };

    const [row] = await getLowStockRows();
    expect(row.brandName).toBe("Godrej");
  });

  it("shows no brand for an inventory-only part or one whose catalogue part has no brand", async () => {
    tableResults.inventory_parts = {
      data: [
        {
          id: "p1",
          part_number: "A",
          name: "A",
          quantity: 0,
          min_stock: null,
          catalogue_part_id: null,
        },
        {
          id: "p2",
          part_number: "B",
          name: "B",
          quantity: 0,
          min_stock: null,
          catalogue_part_id: "cp2",
        },
      ],
      error: null,
    };
    tableResults.catalogue_parts = {
      data: [{ id: "cp2", brand_id: null }],
      error: null,
    };

    const rows = await getLowStockRows();
    expect(rows.every((r) => r.brandName === null)).toBe(true);
  });

  it("propagates a query error instead of resolving to an empty list", async () => {
    const dbError = { code: "PGRST000", message: "network error" };
    tableResults.inventory_parts = { data: null, error: dbError };

    await expect(getLowStockRows()).rejects.toBe(dbError);
  });
});
