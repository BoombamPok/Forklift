"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { toSafeErrorMessage, type ActionResult } from "@/lib/errors";
import {
  boxFormSchema,
  rackFormSchema,
  shelfFormSchema,
  warehouseFormSchema,
  type BoxFormValues,
  type RackFormValues,
  type ShelfFormValues,
  type WarehouseFormValues,
} from "@/features/warehouse/schema";

function invalidFieldsResult(): ActionResult<never> {
  return {
    success: false,
    error: { message: "Check the highlighted fields." },
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

export async function createWarehouse(
  values: WarehouseFormValues,
): Promise<ActionResult<{ id: string }>> {
  await requireRole("warehouse.manage");

  const parsed = warehouseFormSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("warehouses")
    .insert({ name: parsed.data.name, address: parsed.data.address ?? null })
    .select("id")
    .single();

  if (error) {
    return {
      success: false,
      error: {
        message: isUniqueViolation(error)
          ? "A warehouse with this name already exists."
          : toSafeErrorMessage(error),
      },
    };
  }

  revalidatePath("/warehouse");
  return { success: true, data: { id: data.id } };
}

export async function updateWarehouse(
  id: string,
  values: WarehouseFormValues,
): Promise<ActionResult<null>> {
  await requireRole("warehouse.manage");

  const parsed = warehouseFormSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();

  const supabase = await createClient();
  const { error } = await supabase
    .from("warehouses")
    .update({ name: parsed.data.name, address: parsed.data.address ?? null })
    .eq("id", id);

  if (error) {
    return {
      success: false,
      error: {
        message: isUniqueViolation(error)
          ? "A warehouse with this name already exists."
          : toSafeErrorMessage(error),
      },
    };
  }

  revalidatePath(`/warehouse/${id}`);
  revalidatePath("/warehouse");
  return { success: true, data: null };
}

export async function createRack(
  warehouseId: string,
  values: RackFormValues,
): Promise<ActionResult<{ id: string }>> {
  await requireRole("warehouse.manage");

  const parsed = rackFormSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("racks")
    .insert({ warehouse_id: warehouseId, code: parsed.data.code })
    .select("id")
    .single();

  if (error) {
    return {
      success: false,
      error: {
        message: isUniqueViolation(error)
          ? "A rack with this code already exists in this warehouse."
          : toSafeErrorMessage(error),
      },
    };
  }

  revalidatePath(`/warehouse/${warehouseId}`);
  return { success: true, data: { id: data.id } };
}

export async function updateRack(
  id: string,
  warehouseId: string,
  values: RackFormValues,
): Promise<ActionResult<null>> {
  await requireRole("warehouse.manage");

  const parsed = rackFormSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();

  const supabase = await createClient();
  const { error } = await supabase
    .from("racks")
    .update({ code: parsed.data.code })
    .eq("id", id);

  if (error) {
    return {
      success: false,
      error: {
        message: isUniqueViolation(error)
          ? "A rack with this code already exists in this warehouse."
          : toSafeErrorMessage(error),
      },
    };
  }

  revalidatePath(`/warehouse/racks/${id}`);
  revalidatePath(`/warehouse/${warehouseId}`);
  return { success: true, data: null };
}

export async function createShelf(
  rackId: string,
  values: ShelfFormValues,
): Promise<ActionResult<{ id: string }>> {
  await requireRole("warehouse.manage");

  const parsed = shelfFormSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shelves")
    .insert({ rack_id: rackId, code: parsed.data.code })
    .select("id")
    .single();

  if (error) {
    return {
      success: false,
      error: {
        message: isUniqueViolation(error)
          ? "A shelf with this code already exists on this rack."
          : toSafeErrorMessage(error),
      },
    };
  }

  revalidatePath(`/warehouse/racks/${rackId}`);
  return { success: true, data: { id: data.id } };
}

export async function updateShelf(
  id: string,
  rackId: string,
  values: ShelfFormValues,
): Promise<ActionResult<null>> {
  await requireRole("warehouse.manage");

  const parsed = shelfFormSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();

  const supabase = await createClient();
  const { error } = await supabase
    .from("shelves")
    .update({ code: parsed.data.code })
    .eq("id", id);

  if (error) {
    return {
      success: false,
      error: {
        message: isUniqueViolation(error)
          ? "A shelf with this code already exists on this rack."
          : toSafeErrorMessage(error),
      },
    };
  }

  revalidatePath(`/warehouse/shelves/${id}`);
  revalidatePath(`/warehouse/racks/${rackId}`);
  return { success: true, data: null };
}

export async function createBox(
  shelfId: string,
  values: BoxFormValues,
): Promise<ActionResult<{ id: string }>> {
  await requireRole("warehouse.manage");

  const parsed = boxFormSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boxes")
    .insert({ shelf_id: shelfId, code: parsed.data.code })
    .select("id")
    .single();

  if (error) {
    return {
      success: false,
      error: {
        message: isUniqueViolation(error)
          ? "A box with this code already exists on this shelf."
          : toSafeErrorMessage(error),
      },
    };
  }

  revalidatePath(`/warehouse/shelves/${shelfId}`);
  return { success: true, data: { id: data.id } };
}

export async function updateBox(
  id: string,
  shelfId: string,
  values: BoxFormValues,
): Promise<ActionResult<null>> {
  await requireRole("warehouse.manage");

  const parsed = boxFormSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();

  const supabase = await createClient();
  const { error } = await supabase
    .from("boxes")
    .update({ code: parsed.data.code })
    .eq("id", id);

  if (error) {
    return {
      success: false,
      error: {
        message: isUniqueViolation(error)
          ? "A box with this code already exists on this shelf."
          : toSafeErrorMessage(error),
      },
    };
  }

  revalidatePath(`/warehouse/boxes/${id}`);
  revalidatePath(`/warehouse/shelves/${shelfId}`);
  return { success: true, data: null };
}

export type DeleteBlockingPart = {
  id: string;
  partNumber: string;
  name: string;
};

export type DeleteOutcome = {
  deleted: boolean;
  blockedBy: DeleteBlockingPart[];
};

function toDeleteOutcome(
  rows: { part_id: string; part_number: string; name: string }[] | null,
): DeleteOutcome {
  const blockedBy = (rows ?? []).map((r) => ({
    id: r.part_id,
    partNumber: r.part_number,
    name: r.name,
  }));
  return { deleted: blockedBy.length === 0, blockedBy };
}

/**
 * The four cascade soft-deletes (phase4.md §5's resolved decision):
 * deleting a warehouse/rack/shelf also soft-deletes everything beneath it,
 * atomically, via a Postgres function (`supabase/migrations/
 * 20260905120000_warehouse_soft_delete_cascade.sql`) - never done as
 * several separate client-side updates, which couldn't guarantee the "all
 * or nothing" behavior the spec requires. Each function returns the
 * inventory_parts still assigned anywhere in the subtree; a non-empty
 * result means nothing was deleted and the caller shows exactly which
 * parts are blocking removal, per §5's "surface exactly which parts are
 * affected" requirement - it never silently orphans a part's `box_id`.
 */
export async function deleteWarehouse(
  id: string,
): Promise<ActionResult<DeleteOutcome>> {
  await requireRole("warehouse.manage");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("soft_delete_warehouse", {
    p_warehouse_id: id,
  });

  if (error) {
    return { success: false, error: { message: toSafeErrorMessage(error) } };
  }

  const outcome = toDeleteOutcome(data);
  if (outcome.deleted) revalidatePath("/warehouse");
  return { success: true, data: outcome };
}

export async function deleteRack(
  id: string,
  warehouseId: string,
): Promise<ActionResult<DeleteOutcome>> {
  await requireRole("warehouse.manage");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("soft_delete_rack", {
    p_rack_id: id,
  });

  if (error) {
    return { success: false, error: { message: toSafeErrorMessage(error) } };
  }

  const outcome = toDeleteOutcome(data);
  if (outcome.deleted) revalidatePath(`/warehouse/${warehouseId}`);
  return { success: true, data: outcome };
}

export async function deleteShelf(
  id: string,
  rackId: string,
): Promise<ActionResult<DeleteOutcome>> {
  await requireRole("warehouse.manage");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("soft_delete_shelf", {
    p_shelf_id: id,
  });

  if (error) {
    return { success: false, error: { message: toSafeErrorMessage(error) } };
  }

  const outcome = toDeleteOutcome(data);
  if (outcome.deleted) revalidatePath(`/warehouse/racks/${rackId}`);
  return { success: true, data: outcome };
}

export async function deleteBox(
  id: string,
  shelfId: string,
): Promise<ActionResult<DeleteOutcome>> {
  await requireRole("warehouse.manage");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("soft_delete_box", {
    p_box_id: id,
  });

  if (error) {
    return { success: false, error: { message: toSafeErrorMessage(error) } };
  }

  const outcome = toDeleteOutcome(data);
  if (outcome.deleted) revalidatePath(`/warehouse/shelves/${shelfId}`);
  return { success: true, data: outcome };
}
