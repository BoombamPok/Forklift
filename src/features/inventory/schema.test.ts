import { describe, expect, it } from "vitest";

import {
  partFormSchema,
  stockMovementSchema,
  validateMovementQuantity,
} from "@/features/inventory/schema";

describe("partFormSchema", () => {
  it("requires partNumber and name", () => {
    const result = partFormSchema.safeParse({ partNumber: "", name: "" });
    expect(result.success).toBe(false);
  });

  it("treats an empty optional numeric field as unset, not 0", () => {
    const result = partFormSchema.parse({
      partNumber: "P1",
      name: "Part",
      minStock: "",
      purchaseCost: "",
    });
    expect(result.minStock).toBeUndefined();
    expect(result.purchaseCost).toBeUndefined();
  });

  it("coerces numeric fields from string form input", () => {
    const result = partFormSchema.parse({
      partNumber: "P1",
      name: "Part",
      minStock: "10",
      purchaseCost: "12.5",
    });
    expect(result.minStock).toBe(10);
    expect(result.purchaseCost).toBe(12.5);
  });

  it("defaults status to active", () => {
    const result = partFormSchema.parse({ partNumber: "P1", name: "Part" });
    expect(result.status).toBe("active");
  });
});

describe("stockMovementSchema", () => {
  it("rejects Stock In with a non-positive quantity", () => {
    expect(
      stockMovementSchema.safeParse({ movementType: "in", quantity: 0 })
        .success,
    ).toBe(false);
  });

  it("requires a reason for Adjust", () => {
    const result = stockMovementSchema.safeParse({
      movementType: "adjust",
      quantityChange: 5,
      reason: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a zero Adjust delta", () => {
    const result = stockMovementSchema.safeParse({
      movementType: "adjust",
      quantityChange: 0,
      reason: "Recount",
    });
    expect(result.success).toBe(false);
  });

  it("requires a destination box for Transfer", () => {
    expect(
      stockMovementSchema.safeParse({ movementType: "transfer" }).success,
    ).toBe(false);
  });

  it("accepts a valid Transfer", () => {
    const result = stockMovementSchema.safeParse({
      movementType: "transfer",
      toBoxId: "11111111-1111-1111-8111-111111111111",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid Stock Out with no reason (optional)", () => {
    const result = stockMovementSchema.safeParse({
      movementType: "out",
      quantity: 5,
    });
    expect(result.success).toBe(true);
  });
});

describe("validateMovementQuantity", () => {
  it("rejects Stock Out that would exceed current quantity", () => {
    const error = validateMovementQuantity(
      { movementType: "out", quantity: 10 },
      5,
    );
    expect(error).toMatch(/Only 5 in stock/);
  });

  it("allows Stock Out exactly equal to current quantity", () => {
    expect(
      validateMovementQuantity({ movementType: "out", quantity: 5 }, 5),
    ).toBeNull();
  });

  it("rejects Damaged that would exceed current quantity", () => {
    const error = validateMovementQuantity(
      { movementType: "damaged", quantity: 3, reason: undefined },
      2,
    );
    expect(error).toMatch(/Only 2 in stock/);
  });

  it("rejects an Adjust that would take quantity below zero", () => {
    const error = validateMovementQuantity(
      { movementType: "adjust", quantityChange: -10, reason: "Recount" },
      5,
    );
    expect(error).toMatch(/below zero/);
  });

  it("allows an Adjust that takes quantity to exactly zero", () => {
    expect(
      validateMovementQuantity(
        { movementType: "adjust", quantityChange: -5, reason: "Recount" },
        5,
      ),
    ).toBeNull();
  });

  it("never rejects Stock In, Returned, or Transfer on quantity grounds", () => {
    expect(
      validateMovementQuantity({ movementType: "in", quantity: 999 }, 0),
    ).toBeNull();
    expect(
      validateMovementQuantity({ movementType: "returned", quantity: 999 }, 0),
    ).toBeNull();
    expect(
      validateMovementQuantity(
        { movementType: "transfer", toBoxId: "b1" },
        0,
      ),
    ).toBeNull();
  });
});
