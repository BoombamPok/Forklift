import { z } from "zod";

import type { VerificationStatus } from "@/types/database";

const VERIFICATION_STATUSES: [VerificationStatus, ...VerificationStatus[]] = [
  "unverified",
  "verified",
  "uncertain",
];
export { VERIFICATION_STATUSES };

/**
 * Same "empty string reads as not set" helpers as `features/inventory/
 * schema.ts` / `features/warehouse/schema.ts` - duplicated per-module by
 * existing convention rather than shared, since each is a few lines and
 * schema.ts files don't import from one another.
 */
const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((value) =>
      value && value.trim().length > 0 ? value.trim() : undefined,
    )
    .optional();

const optionalUuid = z
  .union([z.string().uuid(), z.literal("")])
  .optional()
  .transform((value) => (value ? value : undefined))
  .optional();

export const brandFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
});
export type BrandFormValues = { name: string };

export const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
});
export type CategoryFormValues = { name: string };

export const modelFamilyFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  brandId: z.string().uuid("Choose a brand"),
});
export type ModelFamilyFormValues = { name: string; brandId: string };

export const modelFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  brandId: z.string().uuid("Choose a brand"),
  modelFamilyId: optionalUuid,
  modelCode: optionalText(100),
  fuelType: optionalText(50),
});
export type ModelFormValues = {
  name: string;
  brandId: string;
  modelFamilyId?: string;
  modelCode?: string;
  fuelType?: string;
};

/**
 * Create/edit form for a catalogue part (phase5.md §4) - mirrors
 * `partFormSchema`'s shape (features/inventory/schema.ts): only
 * part_number/name are required, matching `catalogue_parts`' own NOT
 * NULL columns. `capacityRangeKg` stays a free-text field, never a
 * number - it's stored and shown verbatim per ADR 0008, not something
 * to validate as a numeric range.
 */
export const cataloguePartFormSchema = z.object({
  partNumber: z.string().min(1, "Part number is required").max(100),
  name: z.string().min(1, "Name is required").max(200),
  brandId: optionalUuid,
  categoryId: optionalUuid,
  subCategory: optionalText(200),
  assemblyGroup: optionalText(200),
  isFastener: z.boolean().default(false),
  capacityRangeKg: optionalText(100),
  oemReference: optionalText(200),
  description: optionalText(2000),
  verificationStatus: z.enum(VERIFICATION_STATUSES).default("unverified"),
});
export type CataloguePartFormValues = {
  partNumber: string;
  name: string;
  brandId?: string;
  categoryId?: string;
  subCategory?: string;
  assemblyGroup?: string;
  isFastener: boolean;
  capacityRangeKg?: string;
  oemReference?: string;
  description?: string;
  verificationStatus: VerificationStatus;
};

export const crossRefFormSchema = z.object({
  crossReferenceNumber: z
    .string()
    .min(1, "Reference number is required")
    .max(100),
  source: optionalText(100),
});
export type CrossRefFormValues = {
  crossReferenceNumber: string;
  source?: string;
};

export const compatibilityFormSchema = z.object({
  modelId: z.string().uuid("Choose a model"),
  verificationStatus: z.enum(VERIFICATION_STATUSES).default("unverified"),
  notes: optionalText(500),
});
export type CompatibilityFormValues = {
  modelId: string;
  verificationStatus: VerificationStatus;
  notes?: string;
};

export const compatibilityStatusSchema = compatibilityFormSchema.omit({
  modelId: true,
});
export type CompatibilityStatusValues = {
  verificationStatus: VerificationStatus;
  notes?: string;
};
