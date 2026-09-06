"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import {
  isUniqueViolation,
  toSafeErrorMessage,
  type ActionResult,
} from "@/lib/errors";
import {
  brandFormSchema,
  categoryFormSchema,
  cataloguePartFormSchema,
  compatibilityFormSchema,
  compatibilityStatusSchema,
  crossRefFormSchema,
  modelFamilyFormSchema,
  modelFormSchema,
  type BrandFormValues,
  type CategoryFormValues,
  type CataloguePartFormValues,
  type CompatibilityFormValues,
  type CompatibilityStatusValues,
  type CrossRefFormValues,
  type ModelFamilyFormValues,
  type ModelFormValues,
} from "@/features/catalogue/schema";

function invalidFieldsResult(): ActionResult<never> {
  return {
    success: false,
    error: { message: "Check the highlighted fields." },
  };
}

export async function createBrand(
  values: BrandFormValues,
): Promise<ActionResult<{ id: string }>> {
  await requireRole("catalogue.manage");
  const parsed = brandFormSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brands")
    .insert({ name: parsed.data.name })
    .select("id")
    .single();

  if (error) {
    return {
      success: false,
      error: {
        message: isUniqueViolation(error)
          ? "A brand with this name already exists."
          : toSafeErrorMessage(error),
      },
    };
  }

  revalidatePath("/catalogue");
  revalidatePath("/catalogue/brands");
  return { success: true, data: { id: data.id } };
}

export async function updateBrand(
  id: string,
  values: BrandFormValues,
): Promise<ActionResult<null>> {
  await requireRole("catalogue.manage");
  const parsed = brandFormSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();

  const supabase = await createClient();
  const { error } = await supabase
    .from("brands")
    .update({ name: parsed.data.name })
    .eq("id", id);

  if (error) {
    return {
      success: false,
      error: {
        message: isUniqueViolation(error)
          ? "A brand with this name already exists."
          : toSafeErrorMessage(error),
      },
    };
  }

  revalidatePath("/catalogue");
  revalidatePath("/catalogue/brands");
  return { success: true, data: null };
}

export async function softDeleteBrand(id: string): Promise<ActionResult<null>> {
  await requireRole("catalogue.manage");
  const supabase = await createClient();
  const { error } = await supabase
    .from("brands")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { success: false, error: { message: toSafeErrorMessage(error) } };
  }

  revalidatePath("/catalogue");
  revalidatePath("/catalogue/brands");
  return { success: true, data: null };
}

export async function createCategory(
  values: CategoryFormValues,
): Promise<ActionResult<{ id: string }>> {
  await requireRole("catalogue.manage");
  const parsed = categoryFormSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({ name: parsed.data.name })
    .select("id")
    .single();

  if (error) {
    return {
      success: false,
      error: {
        message: isUniqueViolation(error)
          ? "A category with this name already exists."
          : toSafeErrorMessage(error),
      },
    };
  }

  revalidatePath("/catalogue");
  return { success: true, data: { id: data.id } };
}

export async function updateCategory(
  id: string,
  values: CategoryFormValues,
): Promise<ActionResult<null>> {
  await requireRole("catalogue.manage");
  const parsed = categoryFormSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ name: parsed.data.name })
    .eq("id", id);

  if (error) {
    return {
      success: false,
      error: {
        message: isUniqueViolation(error)
          ? "A category with this name already exists."
          : toSafeErrorMessage(error),
      },
    };
  }

  revalidatePath("/catalogue");
  return { success: true, data: null };
}

export async function softDeleteCategory(
  id: string,
): Promise<ActionResult<null>> {
  await requireRole("catalogue.manage");
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { success: false, error: { message: toSafeErrorMessage(error) } };
  }

  revalidatePath("/catalogue");
  return { success: true, data: null };
}

export async function createModelFamily(
  values: ModelFamilyFormValues,
): Promise<ActionResult<{ id: string }>> {
  await requireRole("catalogue.manage");
  const parsed = modelFamilyFormSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("catalogue_model_families")
    .insert({ name: parsed.data.name, brand_id: parsed.data.brandId })
    .select("id")
    .single();

  if (error) {
    return {
      success: false,
      error: {
        message: isUniqueViolation(error)
          ? "This brand already has a model family with this name."
          : toSafeErrorMessage(error),
      },
    };
  }

  revalidatePath("/catalogue/models");
  return { success: true, data: { id: data.id } };
}

export async function updateModelFamily(
  id: string,
  values: ModelFamilyFormValues,
): Promise<ActionResult<null>> {
  await requireRole("catalogue.manage");
  const parsed = modelFamilyFormSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();

  const supabase = await createClient();
  const { error } = await supabase
    .from("catalogue_model_families")
    .update({ name: parsed.data.name, brand_id: parsed.data.brandId })
    .eq("id", id);

  if (error) {
    return {
      success: false,
      error: {
        message: isUniqueViolation(error)
          ? "This brand already has a model family with this name."
          : toSafeErrorMessage(error),
      },
    };
  }

  revalidatePath("/catalogue/models");
  return { success: true, data: null };
}

export async function softDeleteModelFamily(
  id: string,
): Promise<ActionResult<null>> {
  await requireRole("catalogue.manage");
  const supabase = await createClient();
  const { error } = await supabase
    .from("catalogue_model_families")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { success: false, error: { message: toSafeErrorMessage(error) } };
  }

  revalidatePath("/catalogue/models");
  return { success: true, data: null };
}

export async function createModel(
  values: ModelFormValues,
): Promise<ActionResult<{ id: string }>> {
  await requireRole("catalogue.manage");
  const parsed = modelFormSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();
  const v = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("catalogue_models")
    .insert({
      name: v.name,
      brand_id: v.brandId,
      model_family_id: v.modelFamilyId ?? null,
      model_code: v.modelCode ?? null,
      fuel_type: v.fuelType ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return {
      success: false,
      error: {
        message: isUniqueViolation(error)
          ? "This brand already has a model with this name."
          : toSafeErrorMessage(error),
      },
    };
  }

  revalidatePath("/catalogue/models");
  return { success: true, data: { id: data.id } };
}

export async function updateModel(
  id: string,
  values: ModelFormValues,
): Promise<ActionResult<null>> {
  await requireRole("catalogue.manage");
  const parsed = modelFormSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();
  const v = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("catalogue_models")
    .update({
      name: v.name,
      brand_id: v.brandId,
      model_family_id: v.modelFamilyId ?? null,
      model_code: v.modelCode ?? null,
      fuel_type: v.fuelType ?? null,
    })
    .eq("id", id);

  if (error) {
    return {
      success: false,
      error: {
        message: isUniqueViolation(error)
          ? "This brand already has a model with this name."
          : toSafeErrorMessage(error),
      },
    };
  }

  revalidatePath(`/catalogue/models/${id}`);
  revalidatePath("/catalogue/models");
  return { success: true, data: null };
}

export async function softDeleteModel(id: string): Promise<ActionResult<null>> {
  await requireRole("catalogue.manage");
  const supabase = await createClient();
  const { error } = await supabase
    .from("catalogue_models")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { success: false, error: { message: toSafeErrorMessage(error) } };
  }

  revalidatePath(`/catalogue/models/${id}`);
  revalidatePath("/catalogue/models");
  return { success: true, data: null };
}

export async function createCataloguePart(
  values: CataloguePartFormValues,
): Promise<ActionResult<{ id: string }>> {
  await requireRole("catalogue.manage");
  const parsed = cataloguePartFormSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();
  const v = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("catalogue_parts")
    .insert({
      part_number: v.partNumber,
      name: v.name,
      brand_id: v.brandId ?? null,
      category_id: v.categoryId ?? null,
      sub_category: v.subCategory ?? null,
      assembly_group: v.assemblyGroup ?? null,
      is_fastener: v.isFastener,
      capacity_range_kg: v.capacityRangeKg ?? null,
      oem_reference: v.oemReference ?? null,
      description: v.description ?? null,
      verification_status: v.verificationStatus,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: { message: toSafeErrorMessage(error) } };
  }

  revalidatePath("/catalogue/parts");
  return { success: true, data: { id: data.id } };
}

export async function updateCataloguePart(
  id: string,
  values: CataloguePartFormValues,
): Promise<ActionResult<null>> {
  await requireRole("catalogue.manage");
  const parsed = cataloguePartFormSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();
  const v = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("catalogue_parts")
    .update({
      part_number: v.partNumber,
      name: v.name,
      brand_id: v.brandId ?? null,
      category_id: v.categoryId ?? null,
      sub_category: v.subCategory ?? null,
      assembly_group: v.assemblyGroup ?? null,
      is_fastener: v.isFastener,
      capacity_range_kg: v.capacityRangeKg ?? null,
      oem_reference: v.oemReference ?? null,
      description: v.description ?? null,
      verification_status: v.verificationStatus,
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: { message: toSafeErrorMessage(error) } };
  }

  revalidatePath(`/catalogue/parts/${id}`);
  revalidatePath("/catalogue/parts");
  return { success: true, data: null };
}

export async function softDeleteCataloguePart(
  id: string,
): Promise<ActionResult<null>> {
  await requireRole("catalogue.manage");
  const supabase = await createClient();
  const { error } = await supabase
    .from("catalogue_parts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { success: false, error: { message: toSafeErrorMessage(error) } };
  }

  revalidatePath(`/catalogue/parts/${id}`);
  revalidatePath("/catalogue/parts");
  return { success: true, data: null };
}

export async function addCrossRef(
  cataloguePartId: string,
  values: CrossRefFormValues,
): Promise<ActionResult<{ id: string }>> {
  await requireRole("catalogue.manage");
  const parsed = crossRefFormSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cross_refs")
    .insert({
      catalogue_part_id: cataloguePartId,
      cross_reference_number: parsed.data.crossReferenceNumber,
      source: parsed.data.source ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: { message: toSafeErrorMessage(error) } };
  }

  revalidatePath(`/catalogue/parts/${cataloguePartId}`);
  return { success: true, data: { id: data.id } };
}

export async function deleteCrossRef(
  id: string,
  cataloguePartId: string,
): Promise<ActionResult<null>> {
  await requireRole("catalogue.manage");
  const supabase = await createClient();
  const { error } = await supabase.from("cross_refs").delete().eq("id", id);

  if (error) {
    return { success: false, error: { message: toSafeErrorMessage(error) } };
  }

  revalidatePath(`/catalogue/parts/${cataloguePartId}`);
  return { success: true, data: null };
}

/**
 * The part detail page is the primary compatibility editor (phase5.md
 * §5's accepted recommendation) - the model detail page only reads this
 * same data.
 */
export async function addCompatibility(
  cataloguePartId: string,
  values: CompatibilityFormValues,
): Promise<ActionResult<{ id: string }>> {
  await requireRole("catalogue.manage");
  const parsed = compatibilityFormSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();
  const v = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compatibility")
    .insert({
      catalogue_part_id: cataloguePartId,
      catalogue_model_id: v.modelId,
      verification_status: v.verificationStatus,
      notes: v.notes ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return {
      success: false,
      error: {
        message: isUniqueViolation(error)
          ? "This part is already linked to this model."
          : toSafeErrorMessage(error),
      },
    };
  }

  revalidatePath(`/catalogue/parts/${cataloguePartId}`);
  revalidatePath(`/catalogue/models/${v.modelId}`);
  return { success: true, data: { id: data.id } };
}

export async function updateCompatibility(
  id: string,
  cataloguePartId: string,
  modelId: string,
  values: CompatibilityStatusValues,
): Promise<ActionResult<null>> {
  await requireRole("catalogue.manage");
  const parsed = compatibilityStatusSchema.safeParse(values);
  if (!parsed.success) return invalidFieldsResult();

  const supabase = await createClient();
  const { error } = await supabase
    .from("compatibility")
    .update({
      verification_status: parsed.data.verificationStatus,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: { message: toSafeErrorMessage(error) } };
  }

  revalidatePath(`/catalogue/parts/${cataloguePartId}`);
  revalidatePath(`/catalogue/models/${modelId}`);
  return { success: true, data: null };
}

export async function removeCompatibility(
  id: string,
  cataloguePartId: string,
  modelId: string,
): Promise<ActionResult<null>> {
  await requireRole("catalogue.manage");
  const supabase = await createClient();
  const { error } = await supabase.from("compatibility").delete().eq("id", id);

  if (error) {
    return { success: false, error: { message: toSafeErrorMessage(error) } };
  }

  revalidatePath(`/catalogue/parts/${cataloguePartId}`);
  revalidatePath(`/catalogue/models/${modelId}`);
  return { success: true, data: null };
}
