"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/require-role";
import { getSiteUrl } from "@/lib/site-url";
import { parseCsv } from "@/lib/csv";
import { toSafeErrorMessage, type ActionResult } from "@/lib/errors";
import {
  inviteUserSchema,
  updateRoleSchema,
  type InviteUserValues,
  type UpdateRoleValues,
} from "@/features/admin/schema";

function invalidFieldsResult(): ActionResult<never> {
  return {
    success: false,
    error: { message: "Check the highlighted fields." },
  };
}

/**
 * True if `role` is the only admin `profiles` row left - the guard both
 * `updateUserRole` and `setUserActive` use before demoting/deactivating an
 * admin, so the app is never left with zero admins able to fix it.
 */
async function isLastAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin");
  if (error) throw error;
  const admins = data ?? [];
  return admins.length === 1 && admins[0]!.id === userId;
}

export async function inviteUser(
  values: InviteUserValues,
): Promise<ActionResult<{ id: string }>> {
  await requireRole("users.manage");
  const parsed = inviteUserSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();
  const v = parsed.data;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(v.email, {
    data: { full_name: v.fullName },
    redirectTo: `${getSiteUrl()}/accept-invite`,
  });

  if (error) {
    console.error(error);
    const message = /already.*registered|already.*exists/i.test(error.message)
      ? "A user with this email already exists."
      : "Couldn't send the invite. Please try again.";
    return { success: false, error: { message } };
  }

  const rlsClient = await createClient();
  const { error: updateError } = await rlsClient
    .from("profiles")
    .update({ role: v.role })
    .eq("id", data.user.id);
  if (updateError) {
    return {
      success: false,
      error: { message: toSafeErrorMessage(updateError) },
    };
  }

  revalidatePath("/admin/users");
  return { success: true, data: { id: data.user.id } };
}

export async function updateUserRole(
  userId: string,
  values: UpdateRoleValues,
): Promise<ActionResult<null>> {
  const caller = await requireRole("users.manage");
  const parsed = updateRoleSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();

  if (userId === caller.id) {
    return {
      success: false,
      error: { message: "You can't change your own role." },
    };
  }
  if (parsed.data.role !== "admin" && (await isLastAdmin(userId))) {
    return {
      success: false,
      error: {
        message: "This is the last admin - promote another user first.",
      },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", userId);
  if (error) {
    return { success: false, error: { message: toSafeErrorMessage(error) } };
  }

  revalidatePath("/admin/users");
  return { success: true, data: null };
}

export async function setUserActive(
  userId: string,
  active: boolean,
): Promise<ActionResult<null>> {
  const caller = await requireRole("users.manage");

  if (userId === caller.id) {
    return {
      success: false,
      error: { message: "You can't deactivate your own account." },
    };
  }
  if (!active && (await isLastAdmin(userId))) {
    return {
      success: false,
      error: {
        message: "This is the last admin - promote another user first.",
      },
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: active ? "none" : "876000h",
  });
  if (error) {
    return { success: false, error: { message: toSafeErrorMessage(error) } };
  }

  revalidatePath("/admin/users");
  return { success: true, data: null };
}

export type ImportRowError = { row: number; message: string };
export type ImportReport = {
  inserted: number;
  skipped: number;
  errors: ImportRowError[];
};

const EXPECTED_HEADERS = [
  "part_number",
  "name",
  "brand",
  "category",
  "sub_category",
  "assembly_group",
  "is_fastener",
  "capacity_range_kg",
  "oem_reference",
  "description",
  "verification_status",
] as const;

async function upsertByName(
  table: "brands" | "categories",
  names: string[],
): Promise<Map<string, string>> {
  const supabase = await createClient();
  const unique = [...new Set(names.filter((n) => n.length > 0))];
  if (unique.length === 0) return new Map();

  const { data, error } = await supabase
    .from(table)
    .upsert(
      unique.map((name) => ({ name })),
      { onConflict: "name" },
    )
    .select("id, name");
  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.name, row.id]));
}

/**
 * Bulk-creates catalogue parts from a CSV export/edit round trip.
 * `catalogue_parts.part_number` is deliberately not unique at the DB level
 * (duplicate detection is an app workflow, not a constraint - see
 * supabase/migrations/20260905060100_catalogue_schema.sql) so this never
 * upserts/overwrites: rows matching an existing (brand, part_number) pair
 * are reported as skipped, never silently modified.
 */
export async function importCatalogueParts(
  csvText: string,
): Promise<ActionResult<ImportReport>> {
  await requireRole("users.manage");

  const records = parseCsv(csvText);
  if (records.length === 0) {
    return {
      success: false,
      error: { message: "That file has no data rows." },
    };
  }
  const missingHeaders = EXPECTED_HEADERS.filter((h) => !(h in records[0]!));
  if (missingHeaders.length > 0) {
    return {
      success: false,
      error: {
        message: `Missing column(s): ${missingHeaders.join(", ")}.`,
      },
    };
  }

  const errors: ImportRowError[] = [];
  const validRows: {
    rowNumber: number;
    partNumber: string;
    name: string;
    brand: string;
    category: string;
    subCategory: string | null;
    assemblyGroup: string | null;
    isFastener: boolean;
    capacityRangeKg: string | null;
    oemReference: string | null;
    description: string | null;
    verificationStatus: string;
  }[] = [];

  records.forEach((record, index) => {
    const rowNumber = index + 2; // 1-indexed + header row
    const partNumber = record.part_number?.trim() ?? "";
    const name = record.name?.trim() ?? "";
    if (!partNumber || !name) {
      errors.push({
        row: rowNumber,
        message: "part_number and name are required.",
      });
      return;
    }
    const verificationStatus =
      record.verification_status?.trim() || "unverified";
    if (!["unverified", "verified", "uncertain"].includes(verificationStatus)) {
      errors.push({
        row: rowNumber,
        message: `Unrecognized verification_status "${verificationStatus}".`,
      });
      return;
    }
    validRows.push({
      rowNumber,
      partNumber,
      name,
      brand: record.brand?.trim() ?? "",
      category: record.category?.trim() ?? "",
      subCategory: record.sub_category?.trim() || null,
      assemblyGroup: record.assembly_group?.trim() || null,
      isFastener:
        record.is_fastener?.trim() === "1" ||
        record.is_fastener?.trim().toLowerCase() === "true",
      capacityRangeKg: record.capacity_range_kg?.trim() || null,
      oemReference: record.oem_reference?.trim() || null,
      description: record.description?.trim() || null,
      verificationStatus,
    });
  });

  if (validRows.length === 0) {
    return { success: true, data: { inserted: 0, skipped: 0, errors } };
  }

  const brandIdByName = await upsertByName(
    "brands",
    validRows.map((r) => r.brand),
  );
  const categoryIdByName = await upsertByName(
    "categories",
    validRows.map((r) => r.category),
  );

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("catalogue_parts")
    .select("brand_id, part_number")
    .is("deleted_at", null);
  if (existingError) {
    return {
      success: false,
      error: { message: toSafeErrorMessage(existingError) },
    };
  }
  const existingKeys = new Set(
    (existing ?? []).map((p) => `${p.brand_id}::${p.part_number}`),
  );

  let skipped = 0;
  const toInsert: {
    part_number: string;
    name: string;
    brand_id: string | null;
    category_id: string | null;
    sub_category: string | null;
    assembly_group: string | null;
    is_fastener: boolean;
    capacity_range_kg: string | null;
    oem_reference: string | null;
    description: string | null;
    verification_status: "unverified" | "verified" | "uncertain";
  }[] = [];

  for (const row of validRows) {
    const brandId = row.brand ? (brandIdByName.get(row.brand) ?? null) : null;
    const key = `${brandId}::${row.partNumber}`;
    if (existingKeys.has(key)) {
      skipped++;
      continue;
    }
    existingKeys.add(key);
    toInsert.push({
      part_number: row.partNumber,
      name: row.name,
      brand_id: brandId,
      category_id: row.category
        ? (categoryIdByName.get(row.category) ?? null)
        : null,
      sub_category: row.subCategory,
      assembly_group: row.assemblyGroup,
      is_fastener: row.isFastener,
      capacity_range_kg: row.capacityRangeKg,
      oem_reference: row.oemReference,
      description: row.description,
      verification_status: row.verificationStatus as
        "unverified" | "verified" | "uncertain",
    });
  }

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("catalogue_parts")
      .insert(toInsert);
    if (insertError) {
      return {
        success: false,
        error: { message: toSafeErrorMessage(insertError) },
      };
    }
  }

  revalidatePath("/catalogue/parts");
  return {
    success: true,
    data: { inserted: toInsert.length, skipped, errors },
  };
}
