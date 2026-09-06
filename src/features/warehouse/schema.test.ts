import { describe, expect, it } from "vitest";

import {
  boxFormSchema,
  rackFormSchema,
  shelfFormSchema,
  warehouseFormSchema,
} from "@/features/warehouse/schema";

describe("warehouseFormSchema", () => {
  it("requires a name", () => {
    expect(warehouseFormSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("treats a blank address as unset, not an empty string", () => {
    const result = warehouseFormSchema.parse({
      name: "Main Warehouse",
      address: "   ",
    });
    expect(result.address).toBeUndefined();
  });

  it("trims a real address", () => {
    const result = warehouseFormSchema.parse({
      name: "Main Warehouse",
      address: "  123 Dock Rd  ",
    });
    expect(result.address).toBe("123 Dock Rd");
  });
});

describe("rackFormSchema / shelfFormSchema / boxFormSchema", () => {
  for (const [label, schema] of [
    ["rackFormSchema", rackFormSchema],
    ["shelfFormSchema", shelfFormSchema],
    ["boxFormSchema", boxFormSchema],
  ] as const) {
    it(`${label} requires a code`, () => {
      expect(schema.safeParse({ code: "" }).success).toBe(false);
    });

    it(`${label} accepts a short code`, () => {
      expect(schema.safeParse({ code: "A1" }).success).toBe(true);
    });
  }
});
