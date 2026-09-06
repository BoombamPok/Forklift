import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/reports/movements",
  useSearchParams: () => mockSearchParams,
}));

import { DateRangePicker } from "@/components/shared/date-range-picker";

beforeEach(() => {
  mockPush.mockReset();
  mockSearchParams = new URLSearchParams();
});

describe("DateRangePicker", () => {
  it("reflects the current preset", () => {
    render(<DateRangePicker preset={30} from="2026-02-14" to="2026-03-15" />);
    expect(screen.getByText("Last 30 days")).toBeInTheDocument();
  });

  it("pushes a days param and clears from/to when a preset is chosen", async () => {
    mockSearchParams = new URLSearchParams("from=2026-01-01&to=2026-01-31");
    render(
      <DateRangePicker preset="custom" from="2026-01-01" to="2026-01-31" />,
    );

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(await screen.findByText("Last 7 days"));

    expect(mockPush).toHaveBeenCalledWith("/reports/movements?days=7");
  });

  it("shows the custom date inputs when the current preset is custom", () => {
    render(
      <DateRangePicker preset="custom" from="2026-01-01" to="2026-01-31" />,
    );
    expect(screen.getByLabelText("Start date")).toHaveValue("2026-01-01");
    expect(screen.getByLabelText("End date")).toHaveValue("2026-01-31");
  });

  it("switching to Custom prefills both dates from the current range, editable from there", async () => {
    render(<DateRangePicker preset={30} from="2026-02-14" to="2026-03-15" />);

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(await screen.findByText("Custom range"));

    expect(screen.getByLabelText("Start date")).toHaveValue("2026-02-14");
    expect(screen.getByLabelText("End date")).toHaveValue("2026-03-15");
    expect(mockPush).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { value: "2026-01-01" },
    });
    expect(mockPush).toHaveBeenLastCalledWith(
      "/reports/movements?from=2026-01-01&to=2026-03-15",
    );
  });

  it("clears from/to once both custom inputs are emptied, still previewing them", () => {
    render(<DateRangePicker preset="custom" from="" to="" />);

    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { value: "2026-01-01" },
    });
    expect(mockPush).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("End date"), {
      target: { value: "2026-01-31" },
    });
    expect(mockPush).toHaveBeenLastCalledWith(
      "/reports/movements?from=2026-01-01&to=2026-01-31",
    );
  });
});
