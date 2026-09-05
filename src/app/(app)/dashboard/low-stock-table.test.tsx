import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { LowStockTable } from "@/app/(app)/dashboard/low-stock-table";
import type { LowStockRow } from "@/features/dashboard/low-stock";

const rows: LowStockRow[] = [
  {
    id: "p1",
    partNumber: "SAMPLE-0001",
    name: "Sample Oil Filter",
    brandName: "Godrej",
    quantity: 0,
    minStock: null,
    status: "out_of_stock",
  },
  {
    id: "p2",
    partNumber: "SAMPLE-0002",
    name: "Sample Hydraulic Hose",
    brandName: null,
    quantity: 2,
    minStock: 10,
    status: "critical",
  },
  {
    id: "p3",
    partNumber: "SAMPLE-0003",
    name: "Sample Fork Pin",
    brandName: "Voltas",
    quantity: 8,
    minStock: 10,
    status: "low",
  },
];

describe("LowStockTable", () => {
  it("shows the genuine empty state when nothing needs attention", () => {
    render(<LowStockTable rows={[]} />);

    expect(
      screen.getByText("Nothing needs attention right now"),
    ).toBeInTheDocument();
  });

  it("renders every row with its part, brand, quantity, and status badge", () => {
    render(<LowStockTable rows={rows} />);

    expect(screen.getByText("Sample Oil Filter")).toBeInTheDocument();
    expect(screen.getByText("SAMPLE-0001")).toBeInTheDocument();
    expect(screen.getByText("Godrej")).toBeInTheDocument();
    expect(screen.getByText("Out of Stock")).toBeInTheDocument();
    expect(screen.getByText("Critical")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
    // Inventory-only row has no catalogue link, so no brand.
    const hyphens = screen.getAllByText("—");
    expect(hyphens.length).toBeGreaterThan(0);
  });

  it("filters to just the selected status via the tabs", async () => {
    const user = userEvent.setup();
    render(<LowStockTable rows={rows} />);

    await user.click(screen.getByRole("tab", { name: /Critical/ }));

    expect(screen.getByText("Sample Hydraulic Hose")).toBeInTheDocument();
    expect(screen.queryByText("Sample Oil Filter")).not.toBeInTheDocument();
    expect(screen.queryByText("Sample Fork Pin")).not.toBeInTheDocument();
  });

  it("shows a filter-specific empty state, not the generic one, when a status has no rows", async () => {
    const user = userEvent.setup();
    const onlyOutOfStock = rows.filter((r) => r.status === "out_of_stock");
    render(<LowStockTable rows={onlyOutOfStock} />);

    await user.click(screen.getByRole("tab", { name: /^Low/ }));

    expect(screen.getByText("No parts match this filter")).toBeInTheDocument();
    expect(
      screen.queryByText("Nothing needs attention right now"),
    ).not.toBeInTheDocument();
  });

  it("shows a count per status in the tab labels", () => {
    render(<LowStockTable rows={rows} />);

    const tabs = screen.getByRole("tablist");
    expect(within(tabs).getByText("All (3)")).toBeInTheDocument();
  });
});
