"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import type { Permission } from "@/lib/permissions";
import { toSafeErrorMessage, type ActionResult } from "@/lib/errors";
import type { MovementType } from "@/types/database";
import {
  partFormSchema,
  stockMovementSchema,
  validateMovementQuantity,
  type PartFormValues,
  type StockMovementValues,
} from "@/features/inventory/schema";
import {
  findDuplicatePartNumber,
  type DuplicatePartMatch,
} from "@/features/inventory/queries";

const MOVEMENT_PERMISSION: Record<MovementType, Permission> = {
  in: "inventory.edit",
  out: "inventory.edit",
  damaged: "inventory.edit",
  returned: "inventory.edit",
  adjust: "inventory.adjust",
  transfer: "inventory.transfer",
};

function invalidFieldsResult(): ActionResult<never> {
  return {
    success: false,
    error: { message: "Check the highlighted fields." },
  };
}

/**
 * Client-callable wrapper around `findDuplicatePartNumber` (a
 * server-only query function) - `PartForm` is a Client Component, so it
 * needs a Server Action to reach it, not the function directly. Read-
 * only, no permission check needed beyond `inventory.view` (implicit:
 * only signed-in users reach this form at all).
 */
export async function checkDuplicatePartNumber(
  partNumber: string,
  excludeId?: string,
): Promise<ActionResult<DuplicatePartMatch | null>> {
  try {
    const match = await findDuplicatePartNumber(partNumber, excludeId);
    return { success: true, data: match };
  } catch (error) {
    return { success: false, error: { message: toSafeErrorMessage(error) } };
  }
}

export async function createPart(
  values: PartFormValues,
): Promise<ActionResult<{ id: string }>> {
  await requireRole("inventory.create");

  const parsed = partFormSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();
  const v = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_parts")
    .insert({
      part_number: v.partNumber,
      name: v.name,
      box_id: v.boxId ?? null,
      catalogue_part_id: v.catalogueId ?? null,
      purchase_cost: v.purchaseCost ?? null,
      selling_price: v.sellingPrice ?? null,
      status: v.status,
      notes: v.notes ?? null,
      min_stock: v.minStock ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: { message: toSafeErrorMessage(error) } };
  }

  revalidatePath("/inventory");
  return { success: true, data: { id: data.id } };
}

export async function updatePart(
  id: string,
  values: PartFormValues,
): Promise<ActionResult<null>> {
  await requireRole("inventory.edit");

  const parsed = partFormSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();
  const v = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("inventory_parts")
    .update({
      part_number: v.partNumber,
      name: v.name,
      box_id: v.boxId ?? null,
      catalogue_part_id: v.catalogueId ?? null,
      purchase_cost: v.purchaseCost ?? null,
      selling_price: v.sellingPrice ?? null,
      status: v.status,
      notes: v.notes ?? null,
      min_stock: v.minStock ?? null,
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: { message: toSafeErrorMessage(error) } };
  }

  revalidatePath(`/inventory/${id}`);
  revalidatePath("/inventory");
  return { success: true, data: null };
}

export async function softDeletePart(id: string): Promise<ActionResult<null>> {
  await requireRole("inventory.delete");

  const supabase = await createClient();
  const { error } = await supabase
    .from("inventory_parts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { success: false, error: { message: toSafeErrorMessage(error) } };
  }

  revalidatePath(`/inventory/${id}`);
  revalidatePath("/inventory");
  return { success: true, data: null };
}

/**
 * The one action for all six movement types (phase3.md's semantics,
 * resolved during planning - see plan/PROGRESS.md). Never writes
 * `inventory_parts.quantity` directly - only inserts a `stock_movements`
 * row and lets `apply_stock_movement()` apply it; a client attempting to
 * bypass that would fail loudly against the DB guard trigger, which is
 * confirmation the guard works, not a bug (docs/decisions/0002).
 */
export async function recordStockMovement(
  partId: string,
  input: StockMovementValues,
): Promise<ActionResult<null>> {
  const parsed = stockMovementSchema.safeParse(input);
  if (!parsed.success) return invalidFieldsResult();
  const v = parsed.data;

  await requireRole(MOVEMENT_PERMISSION[v.movementType]);

  const supabase = await createClient();
  const { data: part, error: partError } = await supabase
    .from("inventory_parts")
    .select("quantity, box_id")
    .eq("id", partId)
    .single();

  if (partError) {
    return {
      success: false,
      error: { message: toSafeErrorMessage(partError) },
    };
  }

  const quantityError = validateMovementQuantity(v, part.quantity);
  if (quantityError) {
    return { success: false, error: { message: quantityError } };
  }

  let quantityChange = 0;
  let fromBoxId: string | null = null;
  let toBoxId: string | null = null;
  let nextBoxId: string | null | undefined; // undefined = no box_id change

  switch (v.movementType) {
    case "in":
      quantityChange = v.quantity;
      toBoxId = v.boxId ?? part.box_id;
      if (toBoxId && toBoxId !== part.box_id) nextBoxId = toBoxId;
      break;
    case "out":
      quantityChange = -v.quantity;
      fromBoxId = part.box_id;
      break;
    case "transfer":
      quantityChange = 0;
      fromBoxId = part.box_id;
      toBoxId = v.toBoxId;
      nextBoxId = v.toBoxId;
      break;
    case "adjust":
      quantityChange = v.quantityChange;
      break;
    case "damaged":
      quantityChange = -v.quantity;
      fromBoxId = part.box_id;
      break;
    case "returned":
      quantityChange = v.quantity;
      toBoxId = part.box_id;
      break;
  }

  const { error: movementError } = await supabase
    .from("stock_movements")
    .insert({
      inventory_part_id: partId,
      movement_type: v.movementType,
      quantity_change: quantityChange,
      from_box_id: fromBoxId,
      to_box_id: toBoxId,
      reason: v.reason ?? null,
    });

  if (movementError) {
    return {
      success: false,
      error: { message: toSafeErrorMessage(movementError) },
    };
  }

  if (nextBoxId !== undefined) {
    const { error: boxError } = await supabase
      .from("inventory_parts")
      .update({ box_id: nextBoxId })
      .eq("id", partId);

    if (boxError) {
      console.error(
        `recordStockMovement: movement recorded but box_id update failed for part ${partId}`,
        boxError,
      );
      return {
        success: false,
        error: {
          message:
            "The movement was recorded, but the part's location couldn't be updated. Edit the part to fix its location.",
        },
      };
    }
  }

  revalidatePath(`/inventory/${partId}`);
  return { success: true, data: null };
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  const fromType = file.type.split("/").pop();
  return fromType ?? "bin";
}

export async function uploadPartImage(
  partId: string,
  formData: FormData,
): Promise<ActionResult<{ path: string }>> {
  await requireRole("inventory.edit");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: { message: "Choose an image to upload." } };
  }
  if (!file.type.startsWith("image/")) {
    return {
      success: false,
      error: { message: "Only image files are supported." },
    };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { success: false, error: { message: "Image must be under 8MB." } };
  }

  const path = `${partId}/${crypto.randomUUID()}.${extensionFor(file)}`;
  const supabase = await createClient();

  const { error: uploadError } = await supabase.storage
    .from("part-images")
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return {
      success: false,
      error: { message: toSafeErrorMessage(uploadError) },
    };
  }

  const { error: insertError } = await supabase.from("part_images").insert({
    inventory_part_id: partId,
    storage_path: path,
  });

  if (insertError) {
    // Roll back the orphaned storage object - the DB row is the source
    // of truth for what images "exist" (§11: never leave the two
    // inconsistent).
    await supabase.storage.from("part-images").remove([path]);
    return {
      success: false,
      error: { message: toSafeErrorMessage(insertError) },
    };
  }

  revalidatePath(`/inventory/${partId}`);
  return { success: true, data: { path } };
}

export async function deletePartImage(
  imageId: string,
  partId: string,
): Promise<ActionResult<null>> {
  await requireRole("inventory.edit");

  const supabase = await createClient();
  const { data: image, error: fetchError } = await supabase
    .from("part_images")
    .select("storage_path")
    .eq("id", imageId)
    .single();

  if (fetchError) {
    return {
      success: false,
      error: { message: toSafeErrorMessage(fetchError) },
    };
  }

  const { error: deleteRowError } = await supabase
    .from("part_images")
    .delete()
    .eq("id", imageId);

  if (deleteRowError) {
    return {
      success: false,
      error: { message: toSafeErrorMessage(deleteRowError) },
    };
  }

  const { error: storageError } = await supabase.storage
    .from("part-images")
    .remove([image.storage_path]);

  if (storageError) {
    // The gallery already reflects removal correctly (the DB row is
    // gone) - an orphaned storage object is a harmless cleanup task,
    // not a broken experience, but it's logged rather than silent.
    console.error(
      `deletePartImage: DB row removed but storage object ${image.storage_path} could not be deleted`,
      storageError,
    );
  }

  revalidatePath(`/inventory/${partId}`);
  return { success: true, data: null };
}
