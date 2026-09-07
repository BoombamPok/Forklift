"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

import { IconButton } from "@/components/shared/icon-button";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deletePartImage, uploadPartImage } from "@/features/inventory/actions";
import type { PartImage } from "@/features/inventory/queries";

type PartImagesGalleryProps = {
  partId: string;
  images: PartImage[];
  canEdit: boolean;
};

function PartImagesGallery({
  partId,
  images,
  canEdit,
}: PartImagesGalleryProps) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(
    null,
  );
  const [deleting, setDeleting] = React.useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadPartImage(partId, formData);
    setUploading(false);

    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Image uploaded");
    router.refresh();
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    setDeleting(true);
    const result = await deletePartImage(pendingDeleteId, partId);
    setDeleting(false);
    setPendingDeleteId(null);

    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Image removed");
    router.refresh();
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {images.length === 0 ? (
        <EmptyState
          icon={ImagePlusIcon}
          title="No images yet"
          description="Photos help staff confirm they've picked the right part."
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(4, 1fr)",
            },
          }}
        >
          {images.map((image) => (
            <Box
              key={image.id}
              className="group"
              sx={{
                position: "relative",
                aspectRatio: "1 / 1",
                overflow: "hidden",
                borderRadius: 2,
                border: "1px solid var(--mui-palette-divider)",
              }}
            >
              <Image
                src={image.url}
                alt="Part photo"
                fill
                style={{ objectFit: "cover" }}
                sizes="200px"
                unoptimized
              />
              {canEdit ? (
                <IconButton
                  label="Remove image"
                  variant="destructive"
                  size="icon-sm"
                  sx={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    opacity: 0,
                    transition: "opacity 150ms",
                    bgcolor: "background.paper",
                    ".group:hover &": { opacity: 1 },
                  }}
                  onClick={() => setPendingDeleteId(image.id)}
                >
                  <XIcon size={16} />
                </IconButton>
              ) : null}
            </Box>
          ))}
        </Box>
      )}

      {canEdit ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outlined"
            size="small"
            startIcon={<ImagePlusIcon size={16} />}
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            sx={{ alignSelf: "flex-start" }}
          >
            {uploading ? "Uploading…" : "Upload image"}
          </Button>
        </>
      ) : null}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        title="Remove this image?"
        description="This permanently deletes the photo. This can't be undone."
        confirmLabel="Remove"
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}

export { PartImagesGallery };
