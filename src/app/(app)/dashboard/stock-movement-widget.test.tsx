import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getStockMovementSeries: vi.fn(),
}));

vi.mock("@/features/dashboard/activity", () => mocks);

// StockMovementBarChart's Recharts internals aren't the concern of this
// test (jsdom also can't give ResponsiveContainer real dimensions) -
// this widget test only cares which branch it picks.
vi.mock("@/components/shared/stock-movement-bar-chart", () => ({
  StockMovementBarChart: () => <div data-testid="chart-stub" />,
}));

vi.spyOn(console, "error").mockImplementation(() => {});

import { StockMovementWidget } from "@/app/(app)/dashboard/stock-movement-widget";

function zeroDays(overrides: { inbound?: number; outbound?: number } = {}) {
  return Array.from({ length: 30 }, (_, i) => ({
    date: `2026-08-${String(i + 1).padStart(2, "0")}`,
    inbound: overrides.inbound ?? 0,
    outbound: overrides.outbound ?? 0,
  }));
}

beforeEach(() => {
  mocks.getStockMovementSeries.mockReset();
});

describe("StockMovementWidget", () => {
  it("renders the chart when the 30-day window has any movement", async () => {
    const days = zeroDays();
    days[days.length - 1].inbound = 10;
    mocks.getStockMovementSeries.mockResolvedValue(days);

    render(await StockMovementWidget());

    expect(screen.getByText("Stock movement")).toBeInTheDocument();
    expect(screen.getByTestId("chart-stub")).toBeInTheDocument();
    expect(screen.queryByText("No movement yet")).not.toBeInTheDocument();
  });

  it("shows a genuine empty state when nothing moved in 30 days", async () => {
    mocks.getStockMovementSeries.mockResolvedValue(zeroDays());

    render(await StockMovementWidget());

    expect(screen.getByText("No movement yet")).toBeInTheDocument();
    expect(screen.queryByTestId("chart-stub")).not.toBeInTheDocument();
  });

  it("shows an error state when the query fails", async () => {
    mocks.getStockMovementSeries.mockRejectedValue(new Error("boom"));

    render(await StockMovementWidget());

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByTestId("chart-stub")).not.toBeInTheDocument();
  });
});
