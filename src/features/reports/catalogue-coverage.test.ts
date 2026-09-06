import { beforeEach, describe, expect, it, vi } from "vitest";

type ChainResult = { data: unknown; error: unknown };

function makeChain(result: ChainResult) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    is: vi.fn(() => chain),
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

const mockGetLinkedCataloguePartIds = vi.fn();
vi.mock("@/features/catalogue/queries", () => ({
  getLinkedCataloguePartIds: (ids: string[]) =>
    mockGetLinkedCataloguePartIds(ids),
}));

import { getCatalogueCoverageSummary } from "@/features/reports/catalogue-coverage";

beforeEach(() => {
  mockFrom.mockClear();
  mockGetLinkedCataloguePartIds.mockReset();
  for (const key of Object.keys(tableResults)) delete tableResults[key];
});

describe("getCatalogueCoverageSummary", () => {
  it("breaks down verification status and linkage across the live catalogue", async () => {
    tableResults.catalogue_parts = {
      data: [
        { id: "p1", verification_status: "verified" },
        { id: "p2", verification_status: "unverified" },
        { id: "p3", verification_status: "verified" },
        { id: "p4", verification_status: "uncertain" },
      ],
      error: null,
    };
    tableResults.compatibility = {
      data: [
        { verification_status: "verified" },
        { verification_status: "verified" },
        { verification_status: "unverified" },
      ],
      error: null,
    };
    mockGetLinkedCataloguePartIds.mockResolvedValue(new Set(["p1", "p3"]));

    const summary = await getCatalogueCoverageSummary();

    expect(summary).toEqual({
      totalParts: 4,
      linkedParts: 2,
      unlinkedParts: 2,
      partVerification: { verified: 2, unverified: 1, uncertain: 1 },
      compatibilityVerification: { verified: 2, unverified: 1, uncertain: 0 },
    });
    expect(mockGetLinkedCataloguePartIds).toHaveBeenCalledWith([
      "p1",
      "p2",
      "p3",
      "p4",
    ]);
  });

  it("reports all zeros for an empty catalogue", async () => {
    tableResults.catalogue_parts = { data: [], error: null };
    tableResults.compatibility = { data: [], error: null };
    mockGetLinkedCataloguePartIds.mockResolvedValue(new Set());

    expect(await getCatalogueCoverageSummary()).toEqual({
      totalParts: 0,
      linkedParts: 0,
      unlinkedParts: 0,
      partVerification: { verified: 0, unverified: 0, uncertain: 0 },
      compatibilityVerification: { verified: 0, unverified: 0, uncertain: 0 },
    });
  });

  it("propagates a query error", async () => {
    const dbError = { code: "PGRST000", message: "network error" };
    tableResults.catalogue_parts = { data: null, error: dbError };
    tableResults.compatibility = { data: [], error: null };
    await expect(getCatalogueCoverageSummary()).rejects.toBe(dbError);
  });
});
