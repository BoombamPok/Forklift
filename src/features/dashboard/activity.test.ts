import { beforeEach, describe, expect, it, vi } from "vitest";

type ChainResult = { data: unknown; error: unknown };

function makeChain(result: ChainResult) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
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
  classifyMovement,
  getRecentActivity,
  getStockMovementSeries,
} from "@/features/dashboard/activity";

beforeEach(() => {
  mockFrom.mockClear();
  for (const key of Object.keys(tableResults)) delete tableResults[key];
});

describe("classifyMovement", () => {
  it("treats in and returned as inbound", () => {
    expect(classifyMovement("in", 5)).toBe("in");
    expect(classifyMovement("returned", 2)).toBe("in");
  });

  it("treats out and damaged as outbound", () => {
    expect(classifyMovement("out", -5)).toBe("out");
    expect(classifyMovement("damaged", -1)).toBe("out");
  });

  it("excludes transfer - no net quantity change", () => {
    expect(classifyMovement("transfer", 5)).toBe("none");
    expect(classifyMovement("transfer", -5)).toBe("none");
  });

  it("classifies adjust by the sign of its own quantity_change", () => {
    expect(classifyMovement("adjust", 3)).toBe("in");
    expect(classifyMovement("adjust", -3)).toBe("out");
    expect(classifyMovement("adjust", 0)).toBe("none");
  });
});

describe("getStockMovementSeries", () => {
  it("returns exactly 30 continuous days, zero-filled by default", async () => {
    tableResults.stock_movements = { data: [], error: null };

    const series = await getStockMovementSeries();

    expect(series).toHaveLength(30);
    expect(series.every((day) => day.inbound === 0 && day.outbound === 0)).toBe(
      true,
    );
    // Continuous, ascending, one day apart.
    for (let i = 1; i < series.length; i++) {
      const prev = new Date(series[i - 1].date);
      const curr = new Date(series[i].date);
      expect(curr.getTime() - prev.getTime()).toBe(24 * 60 * 60 * 1000);
    }
  });

  it("buckets in/out rows onto their day and excludes transfers", async () => {
    const today = new Date().toISOString().slice(0, 10);
    tableResults.stock_movements = {
      data: [
        {
          movement_type: "in",
          quantity_change: 10,
          created_at: `${today}T01:00:00Z`,
        },
        {
          movement_type: "out",
          quantity_change: -4,
          created_at: `${today}T02:00:00Z`,
        },
        {
          movement_type: "transfer",
          quantity_change: 6,
          created_at: `${today}T03:00:00Z`,
        },
        {
          movement_type: "adjust",
          quantity_change: 2,
          created_at: `${today}T04:00:00Z`,
        },
        {
          movement_type: "adjust",
          quantity_change: -1,
          created_at: `${today}T05:00:00Z`,
        },
      ],
      error: null,
    };

    const series = await getStockMovementSeries();
    const todayBucket = series.find((day) => day.date === today);

    expect(todayBucket).toEqual({ date: today, inbound: 12, outbound: 5 });
  });

  it("propagates a query error instead of resolving to an empty series", async () => {
    const dbError = { code: "PGRST000", message: "network error" };
    tableResults.stock_movements = { data: null, error: dbError };

    await expect(getStockMovementSeries()).rejects.toBe(dbError);
  });
});

describe("getRecentActivity", () => {
  it("returns an empty list when there are no movements", async () => {
    tableResults.stock_movements = { data: [], error: null };

    expect(await getRecentActivity()).toEqual([]);
  });

  it("describes each movement and joins the part name/number", async () => {
    tableResults.stock_movements = {
      data: [
        {
          id: "m1",
          movement_type: "in",
          quantity_change: 10,
          created_at: "2026-09-05T10:00:00Z",
          inventory_part_id: "p1",
          created_by: null,
        },
      ],
      error: null,
    };
    tableResults.inventory_parts = {
      data: [{ id: "p1", part_number: "SAMPLE-0001", name: "Sample Part" }],
      error: null,
    };

    const [item] = await getRecentActivity();

    expect(item.description).toBe("Received 10 × Sample Part (SAMPLE-0001)");
    expect(item.actorName).toBeNull();
    expect(item.direction).toBe("in");
  });

  it("attributes the actor when their profile is visible to this viewer", async () => {
    tableResults.stock_movements = {
      data: [
        {
          id: "m1",
          movement_type: "out",
          quantity_change: -3,
          created_at: "2026-09-05T10:00:00Z",
          inventory_part_id: "p1",
          created_by: "u1",
        },
      ],
      error: null,
    };
    tableResults.inventory_parts = {
      data: [{ id: "p1", part_number: "SAMPLE-0001", name: "Sample Part" }],
      error: null,
    };
    tableResults.profiles = {
      data: [{ id: "u1", full_name: "Jane Warehouse" }],
      error: null,
    };

    const [item] = await getRecentActivity();

    expect(item.actorName).toBe("Jane Warehouse");
  });

  it("omits the actor - not 'Unknown' - when RLS hides their profile", async () => {
    tableResults.stock_movements = {
      data: [
        {
          id: "m1",
          movement_type: "out",
          quantity_change: -3,
          created_at: "2026-09-05T10:00:00Z",
          inventory_part_id: "p1",
          created_by: "u1",
        },
      ],
      error: null,
    };
    tableResults.inventory_parts = {
      data: [{ id: "p1", part_number: "SAMPLE-0001", name: "Sample Part" }],
      error: null,
    };
    // Row-level security silently drops u1's profile for this viewer.
    tableResults.profiles = { data: [], error: null };

    const [item] = await getRecentActivity();

    expect(item.actorName).toBeNull();
  });

  it("still describes the movement gracefully if the part lookup comes back empty", async () => {
    tableResults.stock_movements = {
      data: [
        {
          id: "m1",
          movement_type: "in",
          quantity_change: 5,
          created_at: "2026-09-05T10:00:00Z",
          inventory_part_id: "p1",
          created_by: null,
        },
      ],
      error: null,
    };
    tableResults.inventory_parts = { data: [], error: null };

    const [item] = await getRecentActivity();

    expect(item.description).toBe("Received 5 × a part");
  });

  it("propagates a query error instead of resolving to an empty list", async () => {
    const dbError = { code: "PGRST000", message: "network error" };
    tableResults.stock_movements = { data: null, error: dbError };

    await expect(getRecentActivity()).rejects.toBe(dbError);
  });
});
