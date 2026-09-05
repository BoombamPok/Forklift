import { describe, expect, it } from "vitest";

import { formatCurrency } from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats a whole rupee amount with the currency symbol", () => {
    expect(formatCurrency(56)).toBe("₹56");
  });

  it("rounds to whole rupees rather than showing paise", () => {
    expect(formatCurrency(56.789)).toBe("₹57");
  });

  it("formats zero as a real zero, not a blank string", () => {
    expect(formatCurrency(0)).toBe("₹0");
  });

  it("groups large amounts using Indian digit grouping", () => {
    expect(formatCurrency(1234567)).toBe("₹12,34,567");
  });
});
