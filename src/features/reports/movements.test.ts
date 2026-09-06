import { beforeEach, describe, expect, it, vi } from "vitest";

type ChainResult = { data: unknown; error: unknown };

function makeChain(result: ChainResult) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    in: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
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

vi.mock("@/features/reports/shared", () => ({
  getPartLabelsById: vi.fn(async (ids: string[]) => {
    const labels: Record<
      string,
      { partNumber: string; name: string; brandName: string | null }
    > = {
      p1: { partNumber: "A", name: "Part A", brandName: "Godrej" },
      p2: { partNumber: "B", name: "Part B", brandName: null },
    };
    return new Map(
      ids.filter((id) => labels[id]).map((id) => [id, labels[id]]),
    );
  }),
}));

const mockGetStockAgingRows = vi.fn();
vi.mock("@/features/reports/aging", () => ({
  getStockAgingRows: () => mockGetStockAgingRows(),
}));

import {
  getFastMovers,
  getMovementTypeSeries,
  getMovementTypeSummary,
  getSlowMovers,
} from "@/features/reports/movements";

const RANGE = { from: "2026-03-01", to: "2026-03-03" };

beforeEach(() => {
  mockFrom.mockClear();
  mockGetStockAgingRows.mockReset();
  for (const key of Object.keys(tableResults)) delete tableResults[key];
});

describe("getMovementTypeSeries", () => {
  it("buckets every movement type per day, filling quiet days with zeros", async () => {
    tableResults.stock_movements = {
      data: [
        {
          inventory_part_id: "p1",
          movement_type: "in",
          quantity_change: 5,
          created_at: "2026-03-01T10:00:00.000Z",
        },
        {
          inventory_part_id: "p1",
          movement_type: "damaged",
          quantity_change: -2,
          created_at: "2026-03-01T11:00:00.000Z",
        },
      ],
      error: null,
    };

    const series = await getMovementTypeSeries(RANGE);
    expect(series).toHaveLength(3);
    expect(series[0]).toEqual({
      date: "2026-03-01",
      in: 5,
      out: 0,
      transfer: 0,
      adjust: 0,
      damaged: 2,
      returned: 0,
    });
    expect(series[1].date).toBe("2026-03-02");
    expect(series[2].date).toBe("2026-03-03");
  });
});

describe("getMovementTypeSummary", () => {
  it("returns one row per movement type with real totals, zero for untouched types", async () => {
    tableResults.stock_movements = {
      data: [
        {
          inventory_part_id: "p1",
          movement_type: "in",
          quantity_change: 5,
          created_at: "2026-03-01T00:00:00.000Z",
        },
        {
          inventory_part_id: "p2",
          movement_type: "in",
          quantity_change: 3,
          created_at: "2026-03-02T00:00:00.000Z",
        },
      ],
      error: null,
    };

    const summary = await getMovementTypeSummary(RANGE);
    const byType = new Map(summary.map((row) => [row.type, row]));
    expect(byType.get("in")).toEqual({
      type: "in",
      totalQuantity: 8,
      movementCount: 2,
    });
    expect(byType.get("out")).toEqual({
      type: "out",
      totalQuantity: 0,
      movementCount: 0,
    });
  });
});

describe("getFastMovers", () => {
  it("ranks parts by total absolute quantity moved, excluding transfer", async () => {
    tableResults.stock_movements = {
      data: [
        {
          inventory_part_id: "p1",
          movement_type: "out",
          quantity_change: -10,
          created_at: "2026-03-01T00:00:00.000Z",
        },
        {
          inventory_part_id: "p1",
          movement_type: "transfer",
          quantity_change: 999,
          created_at: "2026-03-01T00:00:00.000Z",
        },
        {
          inventory_part_id: "p2",
          movement_type: "in",
          quantity_change: 4,
          created_at: "2026-03-02T00:00:00.000Z",
        },
      ],
      error: null,
    };

    const rows = await getFastMovers(RANGE);
    expect(rows).toEqual([
      {
        id: "p1",
        partNumber: "A",
        name: "Part A",
        brandName: "Godrej",
        quantityMoved: 10,
        movementCount: 1,
      },
      {
        id: "p2",
        partNumber: "B",
        name: "Part B",
        brandName: null,
        quantityMoved: 4,
        movementCount: 1,
      },
    ]);
  });

  it("returns an empty list when nothing moved in range", async () => {
    tableResults.stock_movements = { data: [], error: null };
    expect(await getFastMovers(RANGE)).toEqual([]);
  });
});

describe("getSlowMovers", () => {
  it("excludes parts that had qualifying movement in range, keeps aging order", async () => {
    tableResults.stock_movements = {
      data: [
        {
          inventory_part_id: "p1",
          movement_type: "out",
          quantity_change: -5,
          created_at: "2026-03-01T00:00:00.000Z",
        },
      ],
      error: null,
    };
    mockGetStockAgingRows.mockResolvedValue([
      {
        id: "p2",
        partNumber: "B",
        name: "Part B",
        brandName: null,
        quantity: 1,
        lastActivityAt: "2024-01-01T00:00:00.000Z",
        hasMovementHistory: true,
      },
      {
        id: "p1",
        partNumber: "A",
        name: "Part A",
        brandName: "Godrej",
        quantity: 2,
        lastActivityAt: "2026-03-01T00:00:00.000Z",
        hasMovementHistory: true,
      },
    ]);

    const rows = await getSlowMovers(RANGE);
    expect(rows).toEqual([
      {
        id: "p2",
        partNumber: "B",
        name: "Part B",
        brandName: null,
        lastActivityAt: "2024-01-01T00:00:00.000Z",
        hasMovementHistory: true,
      },
    ]);
  });

  it("a transfer-only movement doesn't count as qualifying activity", async () => {
    tableResults.stock_movements = {
      data: [
        {
          inventory_part_id: "p1",
          movement_type: "transfer",
          quantity_change: 5,
          created_at: "2026-03-01T00:00:00.000Z",
        },
      ],
      error: null,
    };
    mockGetStockAgingRows.mockResolvedValue([
      {
        id: "p1",
        partNumber: "A",
        name: "Part A",
        brandName: "Godrej",
        quantity: 2,
        lastActivityAt: "2020-01-01T00:00:00.000Z",
        hasMovementHistory: false,
      },
    ]);

    const rows = await getSlowMovers(RANGE);
    expect(rows.map((r) => r.id)).toEqual(["p1"]);
  });
});
