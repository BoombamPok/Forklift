import { beforeEach, describe, expect, it, vi } from "vitest";

type ChainResult = { data: unknown; error: unknown };

function makeChain(result: ChainResult) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    is: vi.fn(() => chain),
    in: vi.fn(() => chain),
    neq: vi.fn(() => chain),
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

import { getStockAgingRows } from "@/features/reports/aging";

beforeEach(() => {
  mockFrom.mockClear();
  for (const key of Object.keys(tableResults)) delete tableResults[key];
  tableResults.catalogue_parts = { data: [], error: null };
  tableResults.brands = { data: [], error: null };
  tableResults.stock_movements = { data: [], error: null };
});

describe("getStockAgingRows", () => {
  it("uses the most recent non-transfer movement as last activity", async () => {
    tableResults.inventory_parts = {
      data: [
        {
          id: "p1",
          part_number: "A",
          name: "Part A",
          quantity: 5,
          created_at: "2025-01-01T00:00:00.000Z",
        },
      ],
      error: null,
    };
    tableResults.stock_movements = {
      data: [
        { inventory_part_id: "p1", created_at: "2026-01-01T00:00:00.000Z" },
        { inventory_part_id: "p1", created_at: "2026-02-01T00:00:00.000Z" },
      ],
      error: null,
    };

    const [row] = await getStockAgingRows();
    expect(row.lastActivityAt).toBe("2026-02-01T00:00:00.000Z");
    expect(row.hasMovementHistory).toBe(true);
  });

  it("falls back to created_at when a part has never moved", async () => {
    tableResults.inventory_parts = {
      data: [
        {
          id: "p1",
          part_number: "A",
          name: "Part A",
          quantity: 5,
          created_at: "2025-01-01T00:00:00.000Z",
        },
      ],
      error: null,
    };
    tableResults.stock_movements = { data: [], error: null };

    const [row] = await getStockAgingRows();
    expect(row.lastActivityAt).toBe("2025-01-01T00:00:00.000Z");
    expect(row.hasMovementHistory).toBe(false);
  });

  it("filters out transfer movements at the query level", async () => {
    tableResults.inventory_parts = {
      data: [
        {
          id: "p1",
          part_number: "A",
          name: "Part A",
          quantity: 5,
          created_at: "2025-01-01T00:00:00.000Z",
        },
      ],
      error: null,
    };

    await getStockAgingRows();

    const stockMovementsChain = mockFrom.mock.results.find(
      (result, index) => mockFrom.mock.calls[index][0] === "stock_movements",
    )?.value;
    expect(stockMovementsChain.neq).toHaveBeenCalledWith(
      "movement_type",
      "transfer",
    );
  });

  it("sorts oldest activity first", async () => {
    tableResults.inventory_parts = {
      data: [
        {
          id: "p1",
          part_number: "A",
          name: "A",
          quantity: 1,
          created_at: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "p2",
          part_number: "B",
          name: "B",
          quantity: 1,
          created_at: "2024-01-01T00:00:00.000Z",
        },
      ],
      error: null,
    };

    const rows = await getStockAgingRows();
    expect(rows.map((r) => r.id)).toEqual(["p2", "p1"]);
  });

  it("returns an empty list for an empty table", async () => {
    tableResults.inventory_parts = { data: [], error: null };
    expect(await getStockAgingRows()).toEqual([]);
  });
});
