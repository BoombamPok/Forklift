import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchFlatHierarchy = vi.fn();
const mockGetBoxPartCounts = vi.fn();

vi.mock("@/features/warehouse/queries", () => ({
  fetchFlatHierarchy: () => mockFetchFlatHierarchy(),
  getBoxPartCounts: () => mockGetBoxPartCounts(),
}));

import { getOccupancyRollup } from "@/features/reports/occupancy";

beforeEach(() => {
  mockFetchFlatHierarchy.mockReset();
  mockGetBoxPartCounts.mockReset();
});

describe("getOccupancyRollup", () => {
  it("rolls up box counts per rack across every warehouse", async () => {
    mockFetchFlatHierarchy.mockResolvedValue({
      warehouses: [
        { id: "w1", name: "Main" },
        { id: "w2", name: "Annex" },
      ],
      racks: [
        { id: "r1", code: "R1", warehouseId: "w1" },
        { id: "r2", code: "R2", warehouseId: "w2" },
      ],
      shelves: [
        { id: "s1", code: "S1", rackId: "r1" },
        { id: "s2", code: "S2", rackId: "r2" },
      ],
      boxes: [
        { id: "b1", code: "B1", shelfId: "s1" },
        { id: "b2", code: "B2", shelfId: "s1" },
        { id: "b3", code: "B3", shelfId: "s2" },
      ],
    });
    mockGetBoxPartCounts.mockResolvedValue(new Map([["b1", 3]]));

    const rows = await getOccupancyRollup();

    expect(rows).toEqual([
      {
        warehouseId: "w2",
        warehouseName: "Annex",
        rackId: "r2",
        rackCode: "R2",
        shelfCount: 1,
        boxesTotal: 1,
        boxesOccupied: 0,
      },
      {
        warehouseId: "w1",
        warehouseName: "Main",
        rackId: "r1",
        rackCode: "R1",
        shelfCount: 1,
        boxesTotal: 2,
        boxesOccupied: 1,
      },
    ]);
  });

  it("returns an empty list when there is no warehouse hierarchy yet", async () => {
    mockFetchFlatHierarchy.mockResolvedValue({
      warehouses: [],
      racks: [],
      shelves: [],
      boxes: [],
    });
    mockGetBoxPartCounts.mockResolvedValue(new Map());

    expect(await getOccupancyRollup()).toEqual([]);
  });
});
