import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HierarchyBreadcrumb } from "@/components/shared/hierarchy-breadcrumb";

describe("HierarchyBreadcrumb", () => {
  it("renders every earlier segment as a real link", () => {
    render(
      <HierarchyBreadcrumb
        items={[
          { label: "Warehouse", href: "/warehouse" },
          { label: "Main", href: "/warehouse/w1" },
          { label: "Rack R1", href: "/warehouse/racks/r1" },
          { label: "Shelf S1" },
        ]}
      />,
    );

    const warehouseLink = screen.getByRole("link", { name: "Warehouse" });
    expect(warehouseLink).toHaveAttribute("href", "/warehouse");

    const mainLink = screen.getByRole("link", { name: "Main" });
    expect(mainLink).toHaveAttribute("href", "/warehouse/w1");

    const rackLink = screen.getByRole("link", { name: "Rack R1" });
    expect(rackLink).toHaveAttribute("href", "/warehouse/racks/r1");
  });

  it("renders the last segment as the current page, not a link", () => {
    render(
      <HierarchyBreadcrumb
        items={[
          { label: "Warehouse", href: "/warehouse" },
          { label: "Shelf S1" },
        ]}
      />,
    );

    const current = screen.getByText("Shelf S1");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).not.toHaveAttribute("href");
  });
});
