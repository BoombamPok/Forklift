import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mocks = vi.hoisted(() => ({
  searchGlobal: vi.fn(),
}));
vi.mock("@/features/search/actions", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/search/actions")>();
  return { ...actual, searchGlobal: mocks.searchGlobal };
});

import { GlobalSearch } from "@/components/layout/global-search";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { SearchResult } from "@/features/search/actions";

const DEBOUNCE_MS = 250;

const partResult: SearchResult = {
  id: "ip1",
  kind: "part",
  title: "Sample Oil Filter",
  subtitle: "SAMPLE-0001",
  href: "/inventory/ip1",
  badge: { label: "In Stock", tone: "success" },
};

const catalogueResult: SearchResult = {
  id: "cp1",
  kind: "part",
  title: "Catalogue Widget",
  subtitle: "CAT-0001",
  href: "/catalogue/parts",
  badge: { label: "Catalogue Only", tone: "secondary" },
};

async function typeAndSettle(input: HTMLElement, text: string) {
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: text } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 10);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  mocks.searchGlobal.mockReset();
  mockPush.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

function setup() {
  render(
    <TooltipProvider>
      <GlobalSearch />
    </TooltipProvider>,
  );
  const input = screen.getByPlaceholderText("Search parts, brands, models…");
  return { input };
}

describe("GlobalSearch", () => {
  it("shows no dropdown for an empty query", () => {
    setup();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("searches (debounced) and shows both inventory and catalogue-only results distinctly", async () => {
    mocks.searchGlobal.mockResolvedValue([partResult, catalogueResult]);
    const { input } = setup();

    await typeAndSettle(input, "sample");

    expect(mocks.searchGlobal).toHaveBeenCalledWith("sample");
    expect(screen.getByText("Sample Oil Filter")).toBeInTheDocument();
    expect(screen.getByText("In Stock")).toBeInTheDocument();
    expect(screen.getByText("Catalogue Widget")).toBeInTheDocument();
    expect(screen.getByText("Catalogue Only")).toBeInTheDocument();
  });

  it("shows a distinct no-results state", async () => {
    mocks.searchGlobal.mockResolvedValue([]);
    const { input } = setup();

    await typeAndSettle(input, "zzz");

    expect(screen.getByText("No results for “zzz”.")).toBeInTheDocument();
  });

  it("shows a distinct error state when the search fails", async () => {
    mocks.searchGlobal.mockRejectedValue(new Error("boom"));
    const { input } = setup();

    await typeAndSettle(input, "sample");

    expect(
      screen.getByText("Something went wrong. Try again."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/No results/)).not.toBeInTheDocument();
  });

  it("navigates to a result's href on click and clears the query", async () => {
    mocks.searchGlobal.mockResolvedValue([partResult]);
    const { input } = setup();

    await typeAndSettle(input, "sample");
    fireEvent.click(screen.getByText("Sample Oil Filter"));

    expect(mockPush).toHaveBeenCalledWith("/inventory/ip1");
    expect(input).toHaveValue("");
  });

  it("supports arrow-key navigation and Enter to select", async () => {
    mocks.searchGlobal.mockResolvedValue([partResult, catalogueResult]);
    const { input } = setup();

    await typeAndSettle(input, "sample");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockPush).toHaveBeenCalledWith("/catalogue/parts");
  });
});
