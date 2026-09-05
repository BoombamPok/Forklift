import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;
type ChainResult = { data: Row[] | null; error: unknown };

/** Keyed by table -> column ("__in__" for a `.in()` call) -> rows. */
const tableColumnResults: Record<string, Record<string, Row[]>> = {};

function makeChain(table: string) {
  let column: string | null = null;
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    is: vi.fn(() => chain),
    ilike: vi.fn((col: string) => {
      column = col;
      return chain;
    }),
    in: vi.fn(() => {
      column = "__in__";
      return chain;
    }),
    limit: vi.fn(() => chain),
    then: (
      resolve: (value: ChainResult) => void,
      reject: (reason: unknown) => void,
    ) => {
      const rows =
        (column !== null ? tableColumnResults[table]?.[column] : undefined) ??
        [];
      const configuredError = tableColumnResults[table]?.__error__?.[0];
      const result: ChainResult = configuredError
        ? { data: null, error: configuredError }
        : { data: rows, error: null };
      return Promise.resolve(result).then(resolve, reject);
    },
  };
  return chain;
}

const mockFrom = vi.fn((table: string) => makeChain(table));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mockFrom })),
}));

import { searchGlobal } from "@/features/search/actions";

function reset() {
  for (const key of Object.keys(tableColumnResults)) {
    delete tableColumnResults[key];
  }
}

beforeEach(() => {
  mockFrom.mockClear();
  reset();
});

describe("searchGlobal", () => {
  it("returns nothing for a query shorter than the minimum length", async () => {
    expect(await searchGlobal("a")).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns nothing for a blank/whitespace query", async () => {
    expect(await searchGlobal("   ")).toEqual([]);
  });

  it("tags an inventory_parts match as In Stock, linking to /inventory/:id", async () => {
    tableColumnResults.inventory_parts = {
      part_number: [
        {
          id: "ip1",
          part_number: "SAMPLE-0001",
          name: "Sample Oil Filter",
          catalogue_part_id: null,
        },
      ],
      name: [],
    };

    const [result] = await searchGlobal("sample");

    expect(result).toEqual({
      id: "ip1",
      kind: "part",
      title: "Sample Oil Filter",
      subtitle: "SAMPLE-0001",
      href: "/inventory/ip1",
      badge: { label: "In Stock", tone: "success" },
    });
  });

  it("tags a catalogue-only match as Catalogue Only, linking to the catalogue parts list", async () => {
    tableColumnResults.inventory_parts = { part_number: [], name: [] };
    tableColumnResults.catalogue_parts = {
      part_number: [
        { id: "cp1", part_number: "CAT-0001", name: "Catalogue Widget" },
      ],
      name: [],
      oem_reference: [],
    };
    tableColumnResults.cross_refs = { cross_reference_number: [] };

    const [result] = await searchGlobal("cat");

    expect(result).toEqual({
      id: "cp1",
      kind: "part",
      title: "Catalogue Widget",
      subtitle: "CAT-0001",
      href: "/catalogue/parts",
      badge: { label: "Catalogue Only", tone: "secondary" },
    });
  });

  it("suppresses a catalogue-only result for a part already shown as In Stock", async () => {
    tableColumnResults.inventory_parts = {
      part_number: [
        {
          id: "ip1",
          part_number: "DUP-0001",
          name: "Dup Part",
          catalogue_part_id: "cp1",
        },
      ],
      name: [],
    };
    tableColumnResults.catalogue_parts = {
      part_number: [{ id: "cp1", part_number: "DUP-0001", name: "Dup Part" }],
      name: [],
      oem_reference: [],
    };
    tableColumnResults.cross_refs = { cross_reference_number: [] };

    const results = await searchGlobal("dup");

    expect(results).toHaveLength(1);
    expect(results[0].badge?.label).toBe("In Stock");
  });

  it("finds a catalogue part only via its cross-reference number", async () => {
    tableColumnResults.inventory_parts = { part_number: [], name: [] };
    tableColumnResults.catalogue_parts = {
      part_number: [],
      name: [],
      oem_reference: [],
      __in__: [
        { id: "cp2", part_number: "CAT-0002", name: "Cross-Ref Widget" },
      ],
    };
    tableColumnResults.cross_refs = {
      cross_reference_number: [
        { catalogue_part_id: "cp2", cross_reference_number: "XREF-999" },
      ],
    };

    const results = await searchGlobal("xref");

    expect(results).toEqual([
      {
        id: "cp2",
        kind: "part",
        title: "Cross-Ref Widget",
        subtitle: "CAT-0002",
        href: "/catalogue/parts",
        badge: { label: "Catalogue Only", tone: "secondary" },
      },
    ]);
  });

  it("returns a brand match linking to the catalogue", async () => {
    tableColumnResults.inventory_parts = { part_number: [], name: [] };
    tableColumnResults.catalogue_parts = {
      part_number: [],
      name: [],
      oem_reference: [],
    };
    tableColumnResults.cross_refs = { cross_reference_number: [] };
    tableColumnResults.brands = { name: [{ id: "b1", name: "Godrej" }] };

    const [result] = await searchGlobal("godrej");

    expect(result).toEqual({
      id: "b1",
      kind: "brand",
      title: "Godrej",
      subtitle: null,
      href: "/catalogue",
      badge: { label: "Brand", tone: "outline" },
    });
  });

  it("returns a model match with its brand as the subtitle", async () => {
    tableColumnResults.inventory_parts = { part_number: [], name: [] };
    tableColumnResults.catalogue_parts = {
      part_number: [],
      name: [],
      oem_reference: [],
    };
    tableColumnResults.cross_refs = { cross_reference_number: [] };
    tableColumnResults.catalogue_models = {
      name: [{ id: "m1", name: "2T Diesel", brand_id: "b1" }],
    };
    tableColumnResults.brands = {
      name: [],
      __in__: [{ id: "b1", name: "Godrej" }],
    };

    const [result] = await searchGlobal("diesel");

    expect(result).toEqual({
      id: "m1",
      kind: "model",
      title: "2T Diesel",
      subtitle: "Godrej",
      href: "/catalogue/models/m1",
      badge: { label: "Model", tone: "outline" },
    });
  });

  it("caps the combined results at 8", async () => {
    tableColumnResults.inventory_parts = {
      part_number: Array.from({ length: 5 }, (_, i) => ({
        id: `ip${i}`,
        part_number: `P${i}`,
        name: `Part ${i}`,
        catalogue_part_id: null,
      })),
      name: [],
    };
    tableColumnResults.catalogue_parts = {
      part_number: [],
      name: [],
      oem_reference: [],
    };
    tableColumnResults.cross_refs = { cross_reference_number: [] };
    tableColumnResults.brands = {
      name: Array.from({ length: 5 }, (_, i) => ({
        id: `b${i}`,
        name: `Brand ${i}`,
      })),
    };

    const results = await searchGlobal("pa");

    expect(results).toHaveLength(8);
  });

  it("propagates a query error instead of resolving to an empty list", async () => {
    const dbError = { code: "PGRST000", message: "network error" };
    tableColumnResults.inventory_parts = { __error__: [dbError] };

    await expect(searchGlobal("sample")).rejects.toBe(dbError);
  });
});
