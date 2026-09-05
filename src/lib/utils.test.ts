import { describe, expect, it } from "vitest";

import { formatCurrency, formatRelativeTime } from "@/lib/utils";

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

describe("formatRelativeTime", () => {
  const now = new Date("2026-09-05T12:00:00.000Z");

  it("describes a moment seconds ago", () => {
    expect(formatRelativeTime("2026-09-05T11:59:50.000Z", now)).toBe(
      "10 seconds ago",
    );
  });

  it("describes a few hours ago", () => {
    expect(formatRelativeTime("2026-09-05T09:00:00.000Z", now)).toBe(
      "3 hours ago",
    );
  });

  it("describes a few days ago", () => {
    expect(formatRelativeTime("2026-09-02T12:00:00.000Z", now)).toBe(
      "3 days ago",
    );
  });

  it("describes the future distinctly from the past", () => {
    expect(formatRelativeTime("2026-09-06T12:00:00.000Z", now)).toBe(
      "tomorrow",
    );
  });
});
