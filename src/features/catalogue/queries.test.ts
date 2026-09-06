import { beforeEach, describe, expect, it, vi } from "vitest";

type ChainResult = { data: unknown; error: unknown; count?: number };

function makeChain(result: ChainResult) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    is: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    not: vi.fn(() => chain),
    order: vi.fn(() => chain),
    range: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(result)),
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

import { getBrandList, getModelDetail } from "@/features/catalogue/queries";

beforeEach(() => {
  mockFrom.mockClear();
  for (const key of Object.keys(tableResults)) delete tableResults[key];
});

describe("getBrandList", () => {
  it("computes real model/part counts per brand, not a fabricated figure", async () => {
    tableResults.brands = {
      data: [
        { id: "godrej", name: "Godrej" },
        { id: "voltas", name: "Voltas/OM" },
      ],
      error: null,
    };
    tableResults.catalogue_models = {
      data: [{ brand_id: "godrej" }, { brand_id: "godrej" }],
      error: null,
    };
    tableResults.catalogue_parts = {
      data: [
        { brand_id: "godrej" },
        { brand_id: "godrej" },
        { brand_id: "godrej" },
        { brand_id: "voltas" },
      ],
      error: null,
    };

    const rows = await getBrandList();

    expect(rows).toEqual([
      { id: "godrej", name: "Godrej", modelCount: 2, partCount: 3 },
      { id: "voltas", name: "Voltas/OM", modelCount: 0, partCount: 1 },
    ]);
  });

  it("returns zero counts for a brand with no models or parts yet", async () => {
    tableResults.brands = {
      data: [{ id: "new-brand", name: "New Brand" }],
      error: null,
    };
    tableResults.catalogue_models = { data: [], error: null };
    tableResults.catalogue_parts = { data: [], error: null };

    const [row] = await getBrandList();
    expect(row).toEqual({
      id: "new-brand",
      name: "New Brand",
      modelCount: 0,
      partCount: 0,
    });
  });
});

describe("getModelDetail", () => {
  it("keeps each compatible part's own capacity_range_kg verbatim, never averaged (ADR 0008)", async () => {
    tableResults.catalogue_models = {
      data: {
        id: "m1",
        name: "G20",
        model_code: "G20",
        fuel_type: "Diesel",
        brand_id: "godrej",
        model_family_id: null,
        deleted_at: null,
      },
      error: null,
    };
    tableResults.brands = {
      data: { id: "godrej", name: "Godrej" },
      error: null,
    };
    tableResults.compatibility = {
      data: [
        { id: "c1", catalogue_part_id: "p1", verification_status: "verified" },
        { id: "c2", catalogue_part_id: "p2", verification_status: "uncertain" },
      ],
      error: null,
    };
    tableResults.catalogue_parts = {
      data: [
        {
          id: "p1",
          part_number: "PN-1",
          name: "Widget A",
          capacity_range_kg: "2000-2500",
        },
        {
          id: "p2",
          part_number: "PN-2",
          name: "Widget B",
          capacity_range_kg: "3000-3500",
        },
      ],
      error: null,
    };

    const detail = await getModelDetail("m1");

    expect(detail.compatibleParts).toEqual([
      {
        compatibilityId: "c1",
        partId: "p1",
        partNumber: "PN-1",
        partName: "Widget A",
        capacityRangeKg: "2000-2500",
        verificationStatus: "verified",
      },
      {
        compatibilityId: "c2",
        partId: "p2",
        partNumber: "PN-2",
        partName: "Widget B",
        capacityRangeKg: "3000-3500",
        verificationStatus: "uncertain",
      },
    ]);
  });

  it("returns no model family when the model isn't in one", async () => {
    tableResults.catalogue_models = {
      data: {
        id: "m1",
        name: "G20",
        model_code: null,
        fuel_type: null,
        brand_id: "godrej",
        model_family_id: null,
        deleted_at: null,
      },
      error: null,
    };
    tableResults.brands = {
      data: { id: "godrej", name: "Godrej" },
      error: null,
    };
    tableResults.compatibility = { data: [], error: null };

    const detail = await getModelDetail("m1");
    expect(detail.modelFamily).toBeNull();
    expect(detail.compatibleParts).toEqual([]);
  });
});
