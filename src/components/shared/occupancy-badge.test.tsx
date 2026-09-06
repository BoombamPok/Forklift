import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OccupancyBadge } from "@/components/shared/occupancy-badge";

describe("OccupancyBadge", () => {
  it("shows a plain ratio, never a fabricated capacity figure", () => {
    render(<OccupancyBadge boxesOccupied={8} boxesTotal={12} />);
    expect(screen.getByText("8/12")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "8 of 12 boxes occupied" }),
    ).toBeInTheDocument();
  });

  it("has a distinct message when there are no boxes yet", () => {
    render(<OccupancyBadge boxesOccupied={0} boxesTotal={0} />);
    expect(screen.getByText("No boxes yet")).toBeInTheDocument();
  });

  it("still renders a ratio when every box is empty", () => {
    render(<OccupancyBadge boxesOccupied={0} boxesTotal={5} />);
    expect(screen.getByText("0/5")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "0 of 5 boxes occupied" }),
    ).toBeInTheDocument();
  });
});
