import { describe, expect, it } from "vitest";

import { parseCsv, toCsv } from "@/lib/csv";

describe("parseCsv", () => {
  it("parses a simple header + rows", () => {
    const result = parseCsv("a,b\n1,2\n3,4\n");
    expect(result).toEqual([
      { a: "1", b: "2" },
      { a: "3", b: "4" },
    ]);
  });

  it("handles quoted fields with embedded commas and escaped quotes", () => {
    const result = parseCsv('name,note\n"Godrej, Ltd","Says ""hello"""\n');
    expect(result).toEqual([{ name: "Godrej, Ltd", note: 'Says "hello"' }]);
  });

  it("returns an empty array for an empty string", () => {
    expect(parseCsv("")).toEqual([]);
  });

  it("returns no rows for header-only input", () => {
    expect(parseCsv("a,b\n")).toEqual([]);
  });
});

describe("toCsv", () => {
  it("round-trips through parseCsv", () => {
    const rows = [
      { a: "1", b: "hello, world" },
      { a: "2", b: 'has "quotes"' },
    ];
    const csv = toCsv(rows, ["a", "b"]);
    expect(parseCsv(csv)).toEqual(rows);
  });

  it("fills missing fields with an empty string", () => {
    const csv = toCsv([{ a: "1" }], ["a", "b"]);
    expect(parseCsv(csv)).toEqual([{ a: "1", b: "" }]);
  });
});
