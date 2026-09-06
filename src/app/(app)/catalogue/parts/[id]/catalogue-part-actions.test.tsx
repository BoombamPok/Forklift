import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/features/catalogue/actions", () => ({
  softDeleteCataloguePart: vi.fn(),
}));

import { CataloguePartActions } from "./catalogue-part-actions";

describe("CataloguePartActions", () => {
  it("links Promote to inventory to /inventory/new with the catalogue link and known fields pre-filled", () => {
    render(
      <CataloguePartActions
        partId="cp-1"
        partNumber="PN-1"
        name="Hydraulic Widget"
        canManage={false}
        canPromote={true}
        isDeleted={false}
      />,
    );

    const link = screen.getByRole("link", { name: /promote to inventory/i });
    expect(link).toHaveAttribute(
      "href",
      "/inventory/new?catalogueId=cp-1&partNumber=PN-1&name=Hydraulic%20Widget",
    );
  });

  it("hides Promote to inventory once the part is already linked (canPromote false)", () => {
    render(
      <CataloguePartActions
        partId="cp-1"
        partNumber="PN-1"
        name="Hydraulic Widget"
        canManage={false}
        canPromote={false}
        isDeleted={false}
      />,
    );

    expect(
      screen.queryByRole("link", { name: /promote to inventory/i }),
    ).not.toBeInTheDocument();
  });

  it("shows Edit/Delete only when catalogue.manage is granted", () => {
    const { rerender } = render(
      <CataloguePartActions
        partId="cp-1"
        partNumber="PN-1"
        name="Widget"
        canManage={false}
        canPromote={false}
        isDeleted={false}
      />,
    );
    expect(
      screen.queryByRole("link", { name: /edit/i }),
    ).not.toBeInTheDocument();

    rerender(
      <CataloguePartActions
        partId="cp-1"
        partNumber="PN-1"
        name="Widget"
        canManage={true}
        canPromote={false}
        isDeleted={false}
      />,
    );
    expect(screen.getByRole("link", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("hides Delete once the part is already soft-deleted", () => {
    render(
      <CataloguePartActions
        partId="cp-1"
        partNumber="PN-1"
        name="Widget"
        canManage={true}
        canPromote={false}
        isDeleted={true}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /delete/i }),
    ).not.toBeInTheDocument();
  });
});
