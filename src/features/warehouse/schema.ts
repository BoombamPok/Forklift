import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((value) =>
      value && value.trim().length > 0 ? value.trim() : undefined,
    )
    .optional();

export const warehouseFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  address: optionalText(500),
});
export type WarehouseFormValues = {
  name: string;
  address?: string;
};

export const rackFormSchema = z.object({
  code: z.string().min(1, "Code is required").max(50),
});
export type RackFormValues = { code: string };

export const shelfFormSchema = z.object({
  code: z.string().min(1, "Code is required").max(50),
});
export type ShelfFormValues = { code: string };

export const boxFormSchema = z.object({
  code: z.string().min(1, "Code is required").max(50),
});
export type BoxFormValues = { code: string };
