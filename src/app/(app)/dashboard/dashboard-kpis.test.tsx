import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";

const mocks = vi.hoisted(() => ({
  getInventoryItemCount: vi.fn(),
  getInventoryValue: vi.fn(),
  getLowStockCount: vi.fn(),
  getOutOfStockCount: vi.fn(),
}));

vi.mock("@/features/dashboard/queries", () => mocks);

import { DashboardKpis } from "@/app/(app)/dashboard/dashboard-kpis";

function resolveDefaults() {
  mocks.getInventoryItemCount.mockResolvedValue(42);
  mocks.getInventoryValue.mockResolvedValue({ value: 1000, excludedCount: 0 });
  mocks.getLowStockCount.mockResolvedValue(2);
  mocks.getOutOfStockCount.mockResolvedValue(1);
}

beforeEach(() => {
  vi.resetAllMocks();
  resolveDefaults();
  // toErrorKind logs the raw error server-side by design - silence in
  // test output rather than asserting on it. Set after resetAllMocks(),
  // which would otherwise strip this mock implementation back off.
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

/** DashboardKpis' value card renders a Tooltip, which requires the
 * TooltipProvider that app/layout.tsx normally mounts at the root. */
async function renderKpis(showValue: boolean) {
  return render(
    <TooltipProvider>{await DashboardKpis({ showValue })}</TooltipProvider>,
  );
}

describe("DashboardKpis", () => {
  it("renders all four cards with real values for a role that can see value", async () => {
    await renderKpis(true);

    expect(screen.getByText("Inventory items")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Inventory value")).toBeInTheDocument();
    expect(screen.getByText("₹1,000")).toBeInTheDocument();
    expect(screen.getByText("Low stock")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("omits the inventory value card entirely for a role that can't see it", async () => {
    await renderKpis(false);

    expect(screen.queryByText("Inventory value")).not.toBeInTheDocument();
    expect(mocks.getInventoryValue).not.toHaveBeenCalled();
  });

  it("shows a qualifier when some rows are excluded from the value sum", async () => {
    mocks.getInventoryValue.mockResolvedValue({
      value: 1000,
      excludedCount: 3,
    });

    await renderKpis(true);

    expect(
      screen.getByLabelText(
        "3 item(s) missing cost data, not included in this total",
      ),
    ).toBeInTheDocument();
  });

  it("does not show the qualifier when nothing was excluded", async () => {
    await renderKpis(true);

    expect(
      screen.queryByLabelText(/missing cost data/),
    ).not.toBeInTheDocument();
  });

  it("shows the empty-state alert only when the item count is genuinely zero", async () => {
    mocks.getInventoryItemCount.mockResolvedValue(0);

    await renderKpis(true);

    expect(screen.getByText("No data yet")).toBeInTheDocument();
  });

  it("hides the empty-state alert once real inventory exists", async () => {
    await renderKpis(true);

    expect(screen.queryByText("No data yet")).not.toBeInTheDocument();
  });

  it("shows an error state for just the card whose query failed", async () => {
    mocks.getLowStockCount.mockRejectedValue(new Error("network failure"));

    await renderKpis(true);

    expect(screen.queryByText("Low stock")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Inventory items")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });
});
