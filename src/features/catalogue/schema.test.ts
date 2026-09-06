import { describe, expect, it } from "vitest";

import {
  brandFormSchema,
  cataloguePartFormSchema,
  compatibilityFormSchema,
  compatibilityStatusSchema,
  crossRefFormSchema,
  modelFamilyFormSchema,
  modelFormSchema,
} from "@/features/catalogue/schema";

describe("brandFormSchema", () => {
  it("requires a non-empty name", () => {
    expect(brandFormSchema.safeParse({ name: "" }).success).toBe(false);
    expect(brandFormSchema.safeParse({ name: "Godrej" }).success).toBe(true);
  });
});

describe("modelFamilyFormSchema", () => {
  it("requires a valid brand id", () => {
    expect(
      modelFamilyFormSchema.safeParse({ name: "3-Wheel", brandId: "" }).success,
    ).toBe(false);
    expect(
      modelFamilyFormSchema.safeParse({
        name: "3-Wheel",
        brandId: "11111111-1111-4111-8111-111111111111",
      }).success,
    ).toBe(true);
  });
});

describe("modelFormSchema", () => {
  const brandId = "11111111-1111-4111-8111-111111111111";

  it("only requires name and brand", () => {
    const result = modelFormSchema.safeParse({ name: "G20", brandId });
    expect(result.success).toBe(true);
  });

  it("treats an empty optional field as not set, not empty string", () => {
    const result = modelFormSchema.parse({
      name: "G20",
      brandId,
      modelCode: "",
      fuelType: "",
    });
    expect(result.modelCode).toBeUndefined();
    expect(result.fuelType).toBeUndefined();
  });
});

describe("cataloguePartFormSchema", () => {
  it("only requires part number and name, defaulting the rest", () => {
    const result = cataloguePartFormSchema.parse({
      partNumber: "PN-1",
      name: "Widget",
    });
    expect(result.isFastener).toBe(false);
    expect(result.verificationStatus).toBe("unverified");
  });

  it("keeps capacityRangeKg as free text, never coerced to a number", () => {
    const result = cataloguePartFormSchema.parse({
      partNumber: "PN-1",
      name: "Widget",
      capacityRangeKg: "2000-3000",
    });
    expect(result.capacityRangeKg).toBe("2000-3000");
  });

  it("rejects a missing part number", () => {
    expect(
      cataloguePartFormSchema.safeParse({ partNumber: "", name: "Widget" })
        .success,
    ).toBe(false);
  });
});

describe("crossRefFormSchema", () => {
  it("requires a reference number but not a source", () => {
    expect(
      crossRefFormSchema.safeParse({ crossReferenceNumber: "" }).success,
    ).toBe(false);
    expect(
      crossRefFormSchema.safeParse({ crossReferenceNumber: "XREF-1" }).success,
    ).toBe(true);
  });
});

describe("compatibilityFormSchema", () => {
  const modelId = "11111111-1111-4111-8111-111111111111";

  it("defaults verification status to unverified", () => {
    const result = compatibilityFormSchema.parse({ modelId });
    expect(result.verificationStatus).toBe("unverified");
  });

  it("rejects a non-uuid model id", () => {
    expect(
      compatibilityFormSchema.safeParse({ modelId: "not-a-uuid" }).success,
    ).toBe(false);
  });
});

describe("compatibilityStatusSchema", () => {
  it("omits modelId - status/notes only", () => {
    const result = compatibilityStatusSchema.parse({
      verificationStatus: "verified",
    });
    expect(result).toEqual({ verificationStatus: "verified" });
    expect("modelId" in result).toBe(false);
  });
});
