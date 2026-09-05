import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const mocks = vi.hoisted(() => ({
  recordStockMovement: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));
vi.mock("@/features/inventory/actions", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/inventory/actions")>();
  return { ...actual, recordStockMovement: mocks.recordStockMovement };
});
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

import { StockMovementDialog } from "@/app/(app)/inventory/[id]/stock-movement-dialog";

// `toBoxId` is validated as `z.string().uuid()`, so the fixture values
// need to actually parse as UUIDs (a truncated placeholder like "b1"
// doesn't).
const BOX_1_ID = "11111111-1111-1111-8111-111111111111";
const BOX_2_ID = "22222222-2222-2222-8222-222222222222";
const boxOptions = [
  { value: BOX_1_ID, label: "Box 1" },
  { value: BOX_2_ID, label: "Box 2" },
];

function setup(
  props: Partial<React.ComponentProps<typeof StockMovementDialog>> = {},
) {
  const onOpenChange = vi.fn();
  render(
    <StockMovementDialog
      partId="p1"
      currentQuantity={10}
      currentBoxId={BOX_1_ID}
      boxOptions={boxOptions}
      open={true}
      onOpenChange={onOpenChange}
      {...props}
    />,
  );
  return { onOpenChange };
}

// The movement-type Select and the (Stock In-only) box Combobox both
// render role="combobox" - the Select is always first in DOM order.
function movementTypeCombobox() {
  return screen.getAllByRole("combobox")[0];
}

async function selectMovementType(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
) {
  await user.click(movementTypeCombobox());
  await user.click(await screen.findByRole("option", { name: label }));
}

async function reviewAndConfirm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Review" }));
  const confirmDialog = screen.getByRole("alertdialog");
  await user.click(
    within(confirmDialog).getByRole("button", { name: "Record movement" }),
  );
}

describe("StockMovementDialog", () => {
  beforeEach(() => {
    mockRefresh.mockReset();
    mocks.recordStockMovement.mockReset();
    mocks.toastSuccess.mockReset();
    mocks.toastError.mockReset();
  });

  it("Stock In: requires a positive quantity, then submits quantity/box/reason", async () => {
    mocks.recordStockMovement.mockResolvedValue({ success: true, data: null });
    const user = userEvent.setup();
    const { onOpenChange } = setup();

    await user.click(screen.getByRole("button", { name: "Review" }));
    expect(
      screen.getByText("Quantity must be greater than zero"),
    ).toBeInTheDocument();
    expect(mocks.recordStockMovement).not.toHaveBeenCalled();

    await user.type(screen.getByRole("spinbutton"), "5");
    await reviewAndConfirm(user);

    expect(mocks.recordStockMovement).toHaveBeenCalledWith("p1", {
      movementType: "in",
      quantity: 5,
      boxId: undefined,
      reason: undefined,
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Stock In recorded");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("Stock Out: rejects a quantity greater than what's in stock", async () => {
    const user = userEvent.setup();
    setup({ currentQuantity: 3 });

    await selectMovementType(user, "Stock Out");
    await user.type(screen.getByRole("spinbutton"), "9");
    await user.click(screen.getByRole("button", { name: "Review" }));

    expect(
      screen.getByText("Only 3 in stock - can't remove 9."),
    ).toBeInTheDocument();
    expect(mocks.recordStockMovement).not.toHaveBeenCalled();
  });

  it("Stock Out: succeeds for a valid quantity", async () => {
    mocks.recordStockMovement.mockResolvedValue({ success: true, data: null });
    const user = userEvent.setup();
    setup({ currentQuantity: 10 });

    await selectMovementType(user, "Stock Out");
    await user.type(screen.getByRole("spinbutton"), "4");
    await reviewAndConfirm(user);

    expect(mocks.recordStockMovement).toHaveBeenCalledWith("p1", {
      movementType: "out",
      quantity: 4,
      reason: undefined,
    });
  });

  it("Transfer: requires a destination box different from the current one, and submits with no quantity field", async () => {
    mocks.recordStockMovement.mockResolvedValue({ success: true, data: null });
    const user = userEvent.setup();
    setup({ currentBoxId: BOX_1_ID });

    await selectMovementType(user, "Transfer");

    // Radix's combobox role doesn't expose an accessible name from its
    // visible text content, so distinguish by DOM order instead: the
    // movement-type Select is always first, the destination-box
    // Combobox second.
    const destinationCombobox = screen.getAllByRole("combobox")[1];
    await user.click(destinationCombobox);
    // The current box isn't offered as a destination.
    expect(
      screen.queryByRole("option", { name: "Box 1" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "Box 2" }));

    await reviewAndConfirm(user);

    expect(mocks.recordStockMovement).toHaveBeenCalledWith("p1", {
      movementType: "transfer",
      toBoxId: BOX_2_ID,
      reason: undefined,
    });
  });

  it("Adjust: requires a non-zero change and a reason", async () => {
    const user = userEvent.setup();
    setup({ currentQuantity: 10 });

    await selectMovementType(user, "Adjust");
    await user.type(screen.getByRole("spinbutton"), "0");
    await user.click(screen.getByRole("button", { name: "Review" }));

    expect(screen.getByText("Adjustment can't be zero")).toBeInTheDocument();
    expect(mocks.recordStockMovement).not.toHaveBeenCalled();
  });

  it("Adjust: rejects an adjustment that would take quantity below zero", async () => {
    const user = userEvent.setup();
    setup({ currentQuantity: 4 });

    await selectMovementType(user, "Adjust");
    await user.type(screen.getByRole("spinbutton"), "-9");
    await user.type(screen.getByRole("textbox"), "Count correction");
    await user.click(screen.getByRole("button", { name: "Review" }));

    expect(
      screen.getByText(
        "That adjustment would take quantity below zero (currently 4).",
      ),
    ).toBeInTheDocument();
    expect(mocks.recordStockMovement).not.toHaveBeenCalled();
  });

  it("Adjust: succeeds with a valid signed change and required reason", async () => {
    mocks.recordStockMovement.mockResolvedValue({ success: true, data: null });
    const user = userEvent.setup();
    setup({ currentQuantity: 10 });

    await selectMovementType(user, "Adjust");
    await user.type(screen.getByRole("spinbutton"), "-3");
    await user.type(screen.getByRole("textbox"), "Cycle count correction");
    await reviewAndConfirm(user);

    expect(mocks.recordStockMovement).toHaveBeenCalledWith("p1", {
      movementType: "adjust",
      quantityChange: -3,
      reason: "Cycle count correction",
    });
  });

  it("Damaged: rejects a quantity greater than what's in stock", async () => {
    const user = userEvent.setup();
    setup({ currentQuantity: 2 });

    await selectMovementType(user, "Damaged");
    await user.type(screen.getByRole("spinbutton"), "5");
    await user.click(screen.getByRole("button", { name: "Review" }));

    expect(
      screen.getByText("Only 2 in stock - can't remove 5."),
    ).toBeInTheDocument();
    expect(mocks.recordStockMovement).not.toHaveBeenCalled();
  });

  it("Returned: submits a positive quantity back into stock", async () => {
    mocks.recordStockMovement.mockResolvedValue({ success: true, data: null });
    const user = userEvent.setup();
    setup({ currentQuantity: 10 });

    await selectMovementType(user, "Returned");
    await user.type(screen.getByRole("spinbutton"), "2");
    await reviewAndConfirm(user);

    expect(mocks.recordStockMovement).toHaveBeenCalledWith("p1", {
      movementType: "returned",
      quantity: 2,
      reason: undefined,
    });
  });

  it("shows a toast and keeps the dialog open when the server action fails", async () => {
    mocks.recordStockMovement.mockResolvedValue({
      success: false,
      error: { message: "Something went wrong." },
    });
    const user = userEvent.setup();
    const { onOpenChange } = setup();

    await user.type(screen.getByRole("spinbutton"), "5");
    await reviewAndConfirm(user);

    expect(mocks.toastError).toHaveBeenCalledWith("Something went wrong.");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
