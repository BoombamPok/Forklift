import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/inventory",
  useSearchParams: () => new URLSearchParams(),
}));

import { InventoryTable } from "@/app/(app)/inventory/inventory-table";
import type { InventoryListRow } from "@/features/inventory/queries";

const rows: InventoryListRow[] = [
  {
    id: "p1",
    partNumber: "SAMPLE-0001",
    name: "Sample Oil Filter",
    quantity: 5,
    minStock: null,
    status: "active",
    brandName: "Godrej",
    boxCode: "B-01",
    linked: true,
  },
  {
    id: "p2",
    partNumber: "SAMPLE-0002",
    name: "Sample Hydraulic Hose",
    quantity: 0,
    minStock: 10,
    status: "discontinued",
    brandName: null,
    boxCode: null,
    linked: false,
  },
];

describe("InventoryTable", () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it("renders each row's part, brand, quantity, location, and status", () => {
    render(
      <InventoryTable
        rows={rows}
        totalCount={2}
        page={1}
        pageSize={20}
        sortBy="name"
        sortDir="asc"
      />,
    );

    expect(screen.getByText("Sample Oil Filter")).toBeInTheDocument();
    expect(screen.getByText("SAMPLE-0001")).toBeInTheDocument();
    expect(screen.getByText("Godrej")).toBeInTheDocument();
    expect(screen.getByText("B-01")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Discontinued")).toBeInTheDocument();
    // Unlinked row's brand/location fall back to an em dash.
    const hyphens = screen.getAllByText("—");
    expect(hyphens.length).toBeGreaterThan(0);
  });

  it("shows the filters-aware empty state when there are no rows", () => {
    render(
      <InventoryTable
        rows={[]}
        totalCount={0}
        page={1}
        pageSize={20}
        sortBy="name"
        sortDir="asc"
      />,
    );

    expect(
      screen.getByText("No parts match these filters"),
    ).toBeInTheDocument();
  });

  it("pushes an updated page number when paginating", async () => {
    const user = userEvent.setup();
    render(
      <InventoryTable
        rows={rows}
        totalCount={45}
        page={1}
        pageSize={20}
        sortBy="name"
        sortDir="asc"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(mockPush).toHaveBeenCalledWith("/inventory?page=2");
  });

  it("pushes sort column/direction and resets to page 1 when sorting", async () => {
    const user = userEvent.setup();
    render(
      <InventoryTable
        rows={rows}
        totalCount={2}
        page={2}
        pageSize={20}
        sortBy="name"
        sortDir="asc"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Quantity" }));

    expect(mockPush).toHaveBeenCalledWith(
      "/inventory?sortBy=quantity&sortDir=desc&page=1",
    );
  });
});
