import { z } from "zod";

import type { InventoryStatus, MovementType } from "@/types/database";

const INVENTORY_STATUSES: [InventoryStatus, ...InventoryStatus[]] = [
  "active",
  "discontinued",
  "damaged",
];

/**
 * Empty string from an optional text input reads as "not set", not "".
 * The trailing `.optional()` (after the transform, not just before it)
 * is what makes the object *key* itself optional in the inferred type -
 * a transform alone always produces a value (even `undefined`), which
 * would otherwise force every caller to write `reason: undefined`
 * explicitly instead of omitting the field.
 */
const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value.trim() : undefined))
    .optional();

const optionalUuid = z
  .union([z.string().uuid(), z.literal("")])
  .optional()
  .transform((value) => (value ? value : undefined))
  .optional();

/**
 * `z.coerce.number()` turns `""` into `0` (JS's own `Number("") === 0`),
 * not `NaN` - so a plain `union([coerce.number(), literal("")])` can
 * never actually reach the `""` branch, and an empty form field would
 * silently become 0 instead of "not set". Preprocessing the raw value
 * first (before any coercion runs) is what actually distinguishes them.
 */
function optionalNumber<T extends z.ZodTypeAny>(inner: T) {
  return z
    .preprocess((value) => {
      if (value === "" || value === undefined || value === null) return undefined;
      return value;
    }, inner.optional())
    .optional();
}

/**
 * Create/edit form (phase3.md §4) - part_number/name are the only
 * required fields, matching inventory_parts' own NOT NULL columns.
 * `min_stock` stays a plain nullable number (docs/decisions/0009) - an
 * empty field means "no threshold configured", never 0.
 */
export const partFormSchema = z.object({
  partNumber: z.string().min(1, "Part number is required").max(100),
  name: z.string().min(1, "Name is required").max(200),
  boxId: optionalUuid,
  catalogueId: optionalUuid,
  purchaseCost: optionalNumber(z.coerce.number().nonnegative()),
  sellingPrice: optionalNumber(z.coerce.number().nonnegative()),
  status: z.enum(INVENTORY_STATUSES).default("active"),
  notes: optionalText(2000),
  minStock: optionalNumber(z.coerce.number().int().nonnegative()),
});

export type PartFormValues = z.input<typeof partFormSchema>;
export type PartFormParsed = z.output<typeof partFormSchema>;

const MOVEMENT_TYPES: [MovementType, ...MovementType[]] = [
  "in",
  "out",
  "transfer",
  "adjust",
  "damaged",
  "returned",
];
export { MOVEMENT_TYPES };

const positiveQuantity = z.coerce
  .number()
  .int()
  .positive("Quantity must be greater than zero");

/**
 * One discriminated union for all six movement types (phase3.md's §4
 * scope, semantics resolved during planning): each variant is only the
 * fields that type genuinely needs, so a Stock Out submission can't
 * carry a stray `toBoxId` and an Adjust can't skip its required
 * `reason`. `quantity`/`quantityChange` ceilings against the part's
 * *current* quantity aren't expressible statically here (this schema
 * doesn't know the part) - see `validateMovementQuantity` below, which
 * both the form and the Server Action call with the real current value.
 */
export const stockMovementSchema = z.discriminatedUnion("movementType", [
  z.object({
    movementType: z.literal("in"),
    quantity: positiveQuantity,
    boxId: optionalUuid,
    reason: optionalText(500),
  }),
  z.object({
    movementType: z.literal("out"),
    quantity: positiveQuantity,
    reason: optionalText(500),
  }),
  z.object({
    movementType: z.literal("transfer"),
    toBoxId: z.string().uuid("Choose a destination box"),
    reason: optionalText(500),
  }),
  z.object({
    movementType: z.literal("adjust"),
    quantityChange: z.coerce
      .number()
      .int()
      .refine((value) => value !== 0, "Adjustment can't be zero"),
    reason: z.string().min(1, "A reason is required for adjustments").max(500),
  }),
  z.object({
    movementType: z.literal("damaged"),
    quantity: positiveQuantity,
    reason: optionalText(500),
  }),
  z.object({
    movementType: z.literal("returned"),
    quantity: positiveQuantity,
    reason: optionalText(500),
  }),
]);

export type StockMovementValues = z.infer<typeof stockMovementSchema>;

/**
 * The one non-negative-result / quantity-ceiling check every movement
 * type that can reduce stock needs (Stock Out, Damaged directly; Adjust
 * via its signed delta) - checked here so the form can show a clear
 * validation error before submit, and checked again identically inside
 * the Server Action, which is the real enforcement layer alongside the
 * DB's own `quantity >= 0` check constraint (defense in depth, not
 * either/or).
 */
export function validateMovementQuantity(
  input: StockMovementValues,
  currentQuantity: number,
): string | null {
  switch (input.movementType) {
    case "out":
    case "damaged":
      if (input.quantity > currentQuantity) {
        return `Only ${currentQuantity} in stock - can't remove ${input.quantity}.`;
      }
      return null;
    case "adjust":
      if (currentQuantity + input.quantityChange < 0) {
        return `That adjustment would take quantity below zero (currently ${currentQuantity}).`;
      }
      return null;
    case "in":
    case "returned":
    case "transfer":
      return null;
  }
}
