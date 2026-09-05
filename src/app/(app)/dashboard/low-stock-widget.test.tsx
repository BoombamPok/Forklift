import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getLowStockRows: vi.fn(),
}));

vi.mock("@/features/dashboard/low-stock", () => mocks);

vi.spyOn(console, "error").mockImplementation(() => {});

import { LowStockWidget } from "@/app/(app)/dashboard/low-stock-widget";

beforeEach(() => {
  mocks.getLowStockRows.mockReset();
});

describe("LowStockWidget", () => {
  it("renders the table with real rows", async () => {
    mocks.getLowStockRows.mockResolvedValue([
      {
        id: "p1",
        partNumber: "SAMPLE-0001",
        name: "Sample Oil Filter",
        brandName: "Godrej",
        quantity: 0,
        minStock: null,
        status: "out_of_stock",
      },
    ]);

    render(await LowStockWidget());

    expect(screen.getByText("Needs attention")).toBeInTheDocument();
    expect(screen.getByText("Sample Oil Filter")).toBeInTheDocument();
  });

  it("shows the genuine empty state when nothing qualifies", async () => {
    mocks.getLowStockRows.mockResolvedValue([]);

    render(await LowStockWidget());

    expect(
      screen.getByText("Nothing needs attention right now"),
    ).toBeInTheDocument();
  });

  it("shows an error state when the query fails", async () => {
    mocks.getLowStockRows.mockRejectedValue(new Error("boom"));

    render(await LowStockWidget());

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
