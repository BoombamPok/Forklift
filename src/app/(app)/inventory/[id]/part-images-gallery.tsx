"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
    <div className="space-y-3">
      {images.length === 0 ? (
        <EmptyState
          icon={ImagePlusIcon}
          title="No images yet"
          description="Photos help staff confirm they've picked the right part."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-square overflow-hidden rounded-lg ring-1 ring-foreground/10"
            >
              <Image
                src={image.url}
                alt="Part photo"
                fill
                className="object-cover"
                sizes="200px"
                unoptimized
              />
              {canEdit ? (
                <IconButton
                  label="Remove image"
                  variant="destructive"
                  size="icon-sm"
                  className="absolute top-1.5 right-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => setPendingDeleteId(image.id)}
                >
                  <XIcon />
                </IconButton>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {canEdit ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlusIcon />
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
    </div>
  );
}

export { PartImagesGallery };
