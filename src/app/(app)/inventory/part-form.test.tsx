import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

const mocks = vi.hoisted(() => ({
  checkDuplicatePartNumber: vi.fn(),
  createPart: vi.fn(),
  updatePart: vi.fn(),
  toastSuccess: vi.fn(),
}));
vi.mock("@/features/inventory/actions", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/inventory/actions")>();
  return {
    ...actual,
    checkDuplicatePartNumber: mocks.checkDuplicatePartNumber,
    createPart: mocks.createPart,
    updatePart: mocks.updatePart,
  };
});
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: vi.fn() },
}));

import { PartForm } from "@/app/(app)/inventory/part-form";

describe("PartForm", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockBack.mockReset();
    mocks.checkDuplicatePartNumber.mockReset();
    mocks.createPart.mockReset();
    mocks.updatePart.mockReset();
    mocks.toastSuccess.mockReset();
  });

  it("shows a validation error and never calls createPart when required fields are empty", async () => {
    const user = userEvent.setup();
    render(<PartForm mode="create" boxOptions={[]} catalogueOptions={[]} />);

    await user.click(screen.getByRole("button", { name: "Create part" }));

    expect(screen.getByText("Part number is required")).toBeInTheDocument();
    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(mocks.createPart).not.toHaveBeenCalled();
  });

  it("shows a non-blocking duplicate warning after leaving the part number field, but still allows saving", async () => {
    mocks.checkDuplicatePartNumber.mockResolvedValue({
      success: true,
      data: {
        id: "existing-1",
        name: "Existing Widget",
        quantity: 4,
        status: "active",
      },
    });
    mocks.createPart.mockResolvedValue({
      success: true,
      data: { id: "new-1" },
    });
    const user = userEvent.setup();
    render(<PartForm mode="create" boxOptions={[]} catalogueOptions={[]} />);

    await user.type(screen.getByLabelText("Part number"), "SAMPLE-0001");
    await user.click(screen.getByLabelText("Name"));

    expect(
      await screen.findByText("A part with this number already exists"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Existing Widget/)).toBeInTheDocument();
    expect(mocks.checkDuplicatePartNumber).toHaveBeenCalledWith(
      "SAMPLE-0001",
      undefined,
    );

    await user.type(screen.getByLabelText("Name"), "New Widget");
    await user.click(screen.getByRole("button", { name: "Create part" }));

    expect(mocks.createPart).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/inventory/new-1?openMovement=in");
  });

  it("creates a part and redirects to its detail page with the opening Stock In dialog", async () => {
    mocks.checkDuplicatePartNumber.mockResolvedValue({
      success: true,
      data: null,
    });
    mocks.createPart.mockResolvedValue({ success: true, data: { id: "p1" } });
    const user = userEvent.setup();
    render(<PartForm mode="create" boxOptions={[]} catalogueOptions={[]} />);

    await user.type(screen.getByLabelText("Part number"), "NEW-0001");
    await user.type(screen.getByLabelText("Name"), "New Part");
    await user.click(screen.getByRole("button", { name: "Create part" }));

    expect(mocks.createPart).toHaveBeenCalledWith(
      expect.objectContaining({ partNumber: "NEW-0001", name: "New Part" }),
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Part created");
    expect(mockPush).toHaveBeenCalledWith("/inventory/p1?openMovement=in");
  });

  it("shows the server error and stays on the page when create fails", async () => {
    mocks.checkDuplicatePartNumber.mockResolvedValue({
      success: true,
      data: null,
    });
    mocks.createPart.mockResolvedValue({
      success: false,
      error: { message: "A part with this number already exists." },
    });
    const user = userEvent.setup();
    render(<PartForm mode="create" boxOptions={[]} catalogueOptions={[]} />);

    await user.type(screen.getByLabelText("Part number"), "DUP-0001");
    await user.type(screen.getByLabelText("Name"), "Duplicate Part");
    await user.click(screen.getByRole("button", { name: "Create part" }));

    expect(
      await screen.findByText("A part with this number already exists."),
    ).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("edit mode pre-fills fields, excludes itself from the duplicate check, and redirects to the detail page on save", async () => {
    mocks.checkDuplicatePartNumber.mockResolvedValue({
      success: true,
      data: null,
    });
    mocks.updatePart.mockResolvedValue({ success: true, data: null });
    const user = userEvent.setup();
    render(
      <PartForm
        mode="edit"
        partId="p1"
        defaultValues={{
          partNumber: "EXIST-0001",
          name: "Existing Part",
          status: "active",
        }}
        boxOptions={[]}
        catalogueOptions={[]}
      />,
    );

    expect(screen.getByDisplayValue("EXIST-0001")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Existing Part")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Part number"));
    await user.click(screen.getByLabelText("Name"));

    await vi.waitFor(() =>
      expect(mocks.checkDuplicatePartNumber).toHaveBeenCalledWith(
        "EXIST-0001",
        "p1",
      ),
    );

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(mocks.updatePart).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({ partNumber: "EXIST-0001" }),
    );
    expect(mockPush).toHaveBeenCalledWith("/inventory/p1");
  });
});
