import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getRecentActivity: vi.fn(),
}));

vi.mock("@/features/dashboard/activity", () => mocks);

vi.spyOn(console, "error").mockImplementation(() => {});

import { RecentActivityWidget } from "@/app/(app)/dashboard/recent-activity-widget";

beforeEach(() => {
  mocks.getRecentActivity.mockReset();
});

describe("RecentActivityWidget", () => {
  it("renders each item's description and attributes it to the actor", async () => {
    mocks.getRecentActivity.mockResolvedValue([
      {
        id: "m1",
        description: "Received 10 × Sample Part (SAMPLE-0001)",
        timestamp: new Date().toISOString(),
        actorName: "Jane Warehouse",
        direction: "in",
      },
    ]);

    render(await RecentActivityWidget());

    // Description and actor are separate lines, not one joined string -
    // see ActivityList. Both still have to be present and readable.
    expect(
      screen.getByText("Received 10 × Sample Part (SAMPLE-0001)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Jane Warehouse")).toBeInTheDocument();
  });

  it("omits the actor segment entirely when it isn't known", async () => {
    mocks.getRecentActivity.mockResolvedValue([
      {
        id: "m1",
        description: "Received 10 × Sample Part (SAMPLE-0001)",
        timestamp: new Date().toISOString(),
        actorName: null,
        direction: "in",
      },
    ]);

    render(await RecentActivityWidget());

    expect(
      screen.getByText("Received 10 × Sample Part (SAMPLE-0001)"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Jane Warehouse")).not.toBeInTheDocument();
  });

  it("shows the genuine empty state when there's no activity yet", async () => {
    mocks.getRecentActivity.mockResolvedValue([]);

    render(await RecentActivityWidget());

    expect(screen.getByText("No activity yet")).toBeInTheDocument();
  });

  it("shows an error state when the query fails", async () => {
    mocks.getRecentActivity.mockRejectedValue(new Error("boom"));

    render(await RecentActivityWidget());

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
