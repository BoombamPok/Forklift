import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const mocks = vi.hoisted(() => ({
  uploadPartImage: vi.fn(),
  deletePartImage: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));
vi.mock("@/features/inventory/actions", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/inventory/actions")>();
  return {
    ...actual,
    uploadPartImage: mocks.uploadPartImage,
    deletePartImage: mocks.deletePartImage,
  };
});
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

import { PartImagesGallery } from "@/app/(app)/inventory/[id]/part-images-gallery";
import type { PartImage } from "@/features/inventory/queries";

function renderGallery(props: React.ComponentProps<typeof PartImagesGallery>) {
  return render(<PartImagesGallery {...props} />);
}

const images: PartImage[] = [
  { id: "img1", url: "https://example.com/img1.jpg" },
  { id: "img2", url: "https://example.com/img2.jpg" },
];

describe("PartImagesGallery", () => {
  beforeEach(() => {
    mockRefresh.mockReset();
    mocks.uploadPartImage.mockReset();
    mocks.deletePartImage.mockReset();
    mocks.toastSuccess.mockReset();
    mocks.toastError.mockReset();
  });

  it("shows the empty state and no upload control for a read-only role", () => {
    renderGallery({ partId: "p1", images: [], canEdit: false });

    expect(screen.getByText("No images yet")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /upload image/i }),
    ).not.toBeInTheDocument();
  });

  it("renders every image and offers an upload control when editable", () => {
    renderGallery({ partId: "p1", images, canEdit: true });

    expect(screen.getAllByAltText("Part photo")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: /upload image/i }),
    ).toBeInTheDocument();
  });

  it("hides the remove control for a read-only role", () => {
    renderGallery({ partId: "p1", images, canEdit: false });

    expect(
      screen.queryByRole("button", { name: /remove image/i }),
    ).not.toBeInTheDocument();
  });

  it("uploads a chosen file and refreshes on success", async () => {
    mocks.uploadPartImage.mockResolvedValue({
      success: true,
      data: { path: "p1/new.jpg" },
    });
    const user = userEvent.setup();
    const { container } = renderGallery({
      partId: "p1",
      images: [],
      canEdit: true,
    });

    const file = new File(["fake"], "photo.jpg", { type: "image/jpeg" });
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user.upload(input, file);

    expect(mocks.uploadPartImage).toHaveBeenCalledWith(
      "p1",
      expect.any(FormData),
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Image uploaded");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("shows an error toast and doesn't refresh when the upload fails", async () => {
    // The client hands off whatever file is chosen; type/size validation
    // happens server-side in the action, so a mocked failure response is
    // what exercises this path (the input's own accept="image/*" would
    // otherwise stop user-event from selecting a non-image file at all).
    mocks.uploadPartImage.mockResolvedValue({
      success: false,
      error: { message: "Image must be under 8MB." },
    });
    const user = userEvent.setup();
    const { container } = renderGallery({
      partId: "p1",
      images: [],
      canEdit: true,
    });

    const file = new File(["fake"], "photo.jpg", { type: "image/jpeg" });
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user.upload(input, file);

    expect(mocks.toastError).toHaveBeenCalledWith("Image must be under 8MB.");
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("confirms before removing an image, then refreshes on success", async () => {
    mocks.deletePartImage.mockResolvedValue({ success: true, data: null });
    const user = userEvent.setup();
    renderGallery({ partId: "p1", images, canEdit: true });

    const removeButtons = screen.getAllByRole("button", {
      name: /remove image/i,
    });
    await user.click(removeButtons[0]);

    const confirmDialog = screen.getByRole("alertdialog");
    expect(
      within(confirmDialog).getByText("Remove this image?"),
    ).toBeInTheDocument();
    expect(mocks.deletePartImage).not.toHaveBeenCalled();

    await user.click(
      within(confirmDialog).getByRole("button", { name: "Remove" }),
    );

    expect(mocks.deletePartImage).toHaveBeenCalledWith("img1", "p1");
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Image removed");
    expect(mockRefresh).toHaveBeenCalled();
  });
});
