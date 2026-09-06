import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

import { TooltipProvider } from "@/components/ui/tooltip";
import { LocationDeleteAction } from "@/app/(app)/warehouse/location-delete-action";

function renderAction(
  props: Partial<React.ComponentProps<typeof LocationDeleteAction>> = {},
) {
  const onDeleted = props.onDeleted ?? vi.fn();
  const onDelete = props.onDelete ?? vi.fn();
  render(
    <TooltipProvider>
      <LocationDeleteAction
        entityLabel="Rack"
        warningDescription="This also removes every shelf and box on this rack."
        onDelete={onDelete}
        onDeleted={onDeleted}
        {...props}
      />
    </TooltipProvider>,
  );
  return { onDeleted, onDelete };
}

describe("LocationDeleteAction", () => {
  beforeEach(() => {
    mocks.toastSuccess.mockReset();
    mocks.toastError.mockReset();
  });

  it("calls onDeleted and toasts success when nothing blocks the delete", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue({
      success: true,
      data: { deleted: true, blockedBy: [] },
    });
    const { onDeleted } = renderAction({ onDelete });

    await user.click(screen.getByRole("button", { name: /delete rack/i }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDeleted).toHaveBeenCalledTimes(1);
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Rack deleted");
  });

  it("shows exactly which parts are blocking removal instead of deleting", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue({
      success: true,
      data: {
        deleted: false,
        blockedBy: [
          { id: "p1", partNumber: "PN-001", name: "Forklift Fork" },
          { id: "p2", partNumber: "PN-002", name: "Hydraulic Hose" },
        ],
      },
    });
    const { onDeleted } = renderAction({ onDelete });

    await user.click(screen.getByRole("button", { name: /delete rack/i }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onDeleted).not.toHaveBeenCalled();
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    expect(screen.getByText(/can't delete this rack yet/i)).toBeInTheDocument();

    const forkLink = screen.getByRole("link", { name: /forklift fork/i });
    expect(forkLink).toHaveAttribute("href", "/inventory/p1");
    const hoseLink = screen.getByRole("link", { name: /hydraulic hose/i });
    expect(hoseLink).toHaveAttribute("href", "/inventory/p2");
  });

  it("toasts the error message and leaves the record intact on an unexpected failure", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue({
      success: false,
      error: { message: "You don't have permission to do that." },
    });
    const { onDeleted } = renderAction({ onDelete });

    await user.click(screen.getByRole("button", { name: /delete rack/i }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onDeleted).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledWith(
      "You don't have permission to do that.",
    );
  });
});
