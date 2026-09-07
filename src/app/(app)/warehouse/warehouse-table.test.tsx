import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mockRefresh }),
}));

import { WarehouseTable } from "@/app/(app)/warehouse/warehouse-table";
import type { WarehouseListRow } from "@/features/warehouse/queries";

const rows: WarehouseListRow[] = [
  {
    id: "w1",
    name: "Main Warehouse",
    address: "123 Dock Rd",
    rackCount: 3,
    boxesTotal: 10,
    boxesOccupied: 4,
  },
];

function renderTable(canManage: boolean) {
  render(<WarehouseTable rows={rows} canManage={canManage} />);
}

describe("WarehouseTable", () => {
  it("shows create/edit/delete controls for a manager", () => {
    renderTable(true);
    expect(
      screen.getByRole("button", { name: /add warehouse/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /edit warehouse/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /delete warehouse/i }),
    ).toBeInTheDocument();
  });

  it("hides every management control for a read-only role, absent not disabled", () => {
    renderTable(false);
    expect(
      screen.queryByRole("button", { name: /add warehouse/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /edit warehouse/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /delete warehouse/i }),
    ).not.toBeInTheDocument();
  });

  it("still shows the real occupancy and rack count either way", () => {
    renderTable(false);
    expect(
      screen.getByRole("img", { name: "4 of 10 boxes occupied" }),
    ).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
