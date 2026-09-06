import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mockRefresh }),
}));

const mocks = vi.hoisted(() => ({ toastSuccess: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: mocks.toastSuccess } }));

import { CodeFormDialog } from "@/app/(app)/warehouse/code-form-dialog";

describe("CodeFormDialog", () => {
  it("rejects an empty code without calling onSubmit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <CodeFormDialog
        entityLabel="Rack"
        open
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText("Code is required")).toBeInTheDocument();
  });

  it("submits the trimmed code and closes on success", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue({
      success: true,
      data: { id: "r1" },
    });

    render(
      <CodeFormDialog
        entityLabel="Rack"
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText("Code"), "R1");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onSubmit).toHaveBeenCalledWith({ code: "R1" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Rack added");
  });

  it("surfaces a duplicate-code error from the Server Action inline", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue({
      success: false,
      error: {
        message: "A rack with this code already exists in this warehouse.",
      },
    });

    render(
      <CodeFormDialog
        entityLabel="Rack"
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText("Code"), "R1");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(
      await screen.findByText(
        "A rack with this code already exists in this warehouse.",
      ),
    ).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("uses the existing code as the edit form's starting value", () => {
    render(
      <CodeFormDialog
        entityLabel="Shelf"
        open
        onOpenChange={vi.fn()}
        defaultCode="S1"
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /edit shelf/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Code")).toHaveValue("S1");
  });
});
