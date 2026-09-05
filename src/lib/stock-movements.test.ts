import { describe, expect, it } from "vitest";

import { classifyMovement, describeMovement } from "@/lib/stock-movements";

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

describe("describeMovement", () => {
  it("describes a positive movement with the part label", () => {
    expect(
      describeMovement("in", 10, { part_number: "SAMPLE-0001", name: "Sample Oil Filter" }),
    ).toBe("Received 10 × Sample Oil Filter (SAMPLE-0001)");
  });

  it("uses the absolute value of a negative quantity_change", () => {
    expect(
      describeMovement("out", -4, { part_number: "SAMPLE-0001", name: "Sample Oil Filter" }),
    ).toBe("Shipped 4 × Sample Oil Filter (SAMPLE-0001)");
  });

  it("falls back to 'a part' when no part is given", () => {
    expect(describeMovement("adjust", -1, null)).toBe("Adjusted 1 × a part");
  });

  it("covers every movement type's verb", () => {
    const part = { part_number: "P", name: "Part" };
    expect(describeMovement("transfer", 0, part)).toBe("Transferred 0 × Part (P)");
    expect(describeMovement("damaged", 2, part)).toBe("Marked damaged 2 × Part (P)");
    expect(describeMovement("returned", 3, part)).toBe("Returned 3 × Part (P)");
  });
});
