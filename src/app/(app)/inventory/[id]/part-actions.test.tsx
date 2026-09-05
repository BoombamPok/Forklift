import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
let mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => mockSearchParams,
}));

const mocks = vi.hoisted(() => ({
  softDeletePart: vi.fn(),
}));
vi.mock("@/features/inventory/actions", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/inventory/actions")>();
  return { ...actual, softDeletePart: mocks.softDeletePart };
});

import { PartActions } from "@/app/(app)/inventory/[id]/part-actions";

const baseProps = {
  partId: "p1",
  currentQuantity: 5,
  currentBoxId: "b1",
  boxOptions: [{ value: "b1", label: "Box 1" }],
  isDeleted: false,
};

describe("PartActions", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockRefresh.mockReset();
    mocks.softDeletePart.mockReset();
    mockSearchParams = new URLSearchParams();
  });

  it("shows only the actions this role is permitted", () => {
    render(
      <PartActions
        {...baseProps}
        canEdit={false}
        canDelete={false}
        canRecordMovement={true}
      />,
    );

    expect(
      screen.getByRole("button", { name: /record movement/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /edit/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  it("shows every action for a role permitted to do everything", () => {
    render(
      <PartActions
        {...baseProps}
        canEdit={true}
        canDelete={true}
        canRecordMovement={true}
      />,
    );

    expect(
      screen.getByRole("button", { name: /record movement/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("renders nothing for an already-deleted part", () => {
    const { container } = render(
      <PartActions
        {...baseProps}
        canEdit={true}
        canDelete={true}
        canRecordMovement={true}
        isDeleted={true}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("confirms before deleting, then navigates to the inventory list on success", async () => {
    mocks.softDeletePart.mockResolvedValue({ success: true, data: null });
    const user = userEvent.setup();
    render(
      <PartActions
        {...baseProps}
        canEdit={true}
        canDelete={true}
        canRecordMovement={true}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("Delete this part?")).toBeInTheDocument();
    expect(mocks.softDeletePart).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(mocks.softDeletePart).toHaveBeenCalledWith("p1");
    expect(mockPush).toHaveBeenCalledWith("/inventory");
  });

  it("shows the error toast and stays put when the delete action fails", async () => {
    mocks.softDeletePart.mockResolvedValue({
      success: false,
      error: { message: "You can't delete this part." },
    });
    const user = userEvent.setup();
    render(
      <PartActions
        {...baseProps}
        canEdit={true}
        canDelete={true}
        canRecordMovement={true}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(mockPush).not.toHaveBeenCalled();
  });
});
