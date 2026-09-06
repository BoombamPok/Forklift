"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { ComboboxOption } from "@/components/shared/combobox";
import { softDeleteModel } from "@/features/catalogue/actions";
import type { ModelFormValues } from "@/features/catalogue/schema";
import { ModelFormDialog } from "../model-form-dialog";

type ModelDetailActionsProps = {
  modelId: string;
  defaultValues: ModelFormValues;
  brandOptions: ComboboxOption[];
  modelFamilyOptionsByBrand: Record<string, ComboboxOption[]>;
};

function ModelDetailActions({
  modelId,
  defaultValues,
  brandOptions,
  modelFamilyOptionsByBrand,
}: ModelDetailActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  async function handleConfirmDelete() {
    setDeleteLoading(true);
    const result = await softDeleteModel(modelId);
    setDeleteLoading(false);
    setDeleteOpen(false);

    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Model deleted");
    router.push("/catalogue/models");
  }

  return (
    <div className="flex gap-2">
      <Button type="button" variant="outline" onClick={() => setEditOpen(true)}>
        <PencilIcon /> Edit
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2Icon /> Delete
      </Button>

      <ModelFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        brandOptions={brandOptions}
        modelFamilyOptionsByBrand={modelFamilyOptionsByBrand}
        modelId={modelId}
        defaultValues={defaultValues}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this model?"
        description="Compatibility links already recorded for this model keep their existing data - this only removes the model from future selection lists."
        confirmLabel="Delete"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export { ModelDetailActions };
