import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_DAYS,
  parseReportDateRange,
  rangeForDays,
  rangeToTimestamps,
} from "@/features/reports/schema";

describe("rangeForDays", () => {
  it("returns an inclusive range ending today", () => {
    vi.setSystemTime(new Date("2026-03-15T12:00:00.000Z"));
    expect(rangeForDays(7)).toEqual({ from: "2026-03-09", to: "2026-03-15" });
    vi.useRealTimers();
  });
});

describe("rangeToTimestamps", () => {
  it("expands to the full inclusive day at each end", () => {
    expect(rangeToTimestamps({ from: "2026-01-01", to: "2026-01-31" })).toEqual(
      {
        since: "2026-01-01T00:00:00.000Z",
        until: "2026-01-31T23:59:59.999Z",
      },
    );
  });
});

describe("parseReportDateRange", () => {
  it("defaults to the last 30 days with no params", () => {
    vi.setSystemTime(new Date("2026-03-15T12:00:00.000Z"));
    const result = parseReportDateRange({});
    expect(result).toEqual({ ...rangeForDays(DEFAULT_DAYS), preset: 30 });
    vi.useRealTimers();
  });

  it("honors a valid days preset", () => {
    vi.setSystemTime(new Date("2026-03-15T12:00:00.000Z"));
    const result = parseReportDateRange({ days: "90" });
    expect(result).toEqual({ ...rangeForDays(90), preset: 90 });
    vi.useRealTimers();
  });

  it("falls back to the default for an unsupported days value", () => {
    const result = parseReportDateRange({ days: "45" });
    expect(result.preset).toBe(DEFAULT_DAYS);
  });

  it("accepts a valid custom range", () => {
    vi.setSystemTime(new Date("2026-03-15T12:00:00.000Z"));
    const result = parseReportDateRange({
      from: "2026-01-01",
      to: "2026-01-31",
    });
    expect(result).toEqual({
      from: "2026-01-01",
      to: "2026-01-31",
      preset: "custom",
    });
    vi.useRealTimers();
  });

  it("falls back to the default when from is after to", () => {
    const result = parseReportDateRange({
      from: "2026-02-01",
      to: "2026-01-01",
    });
    expect(result.preset).toBe(DEFAULT_DAYS);
  });

  it("falls back to the default when the custom range's end is in the future", () => {
    vi.setSystemTime(new Date("2026-03-15T12:00:00.000Z"));
    const result = parseReportDateRange({
      from: "2026-03-01",
      to: "2026-04-01",
    });
    expect(result.preset).toBe(DEFAULT_DAYS);
    vi.useRealTimers();
  });

  it("falls back to the default when the custom range exceeds 366 days", () => {
    vi.setSystemTime(new Date("2027-03-15T12:00:00.000Z"));
    const result = parseReportDateRange({
      from: "2020-01-01",
      to: "2026-01-01",
    });
    expect(result.preset).toBe(DEFAULT_DAYS);
    vi.useRealTimers();
  });

  it("reads repeated query params as their first value", () => {
    const result = parseReportDateRange({ days: ["7", "30"] });
    expect(result.preset).toBe(7);
  });
});
