import { normalizeSlug } from "@/lib/helpers/globalHelpers/normalizeSlug";
import z from "zod";

export const CategoryStatusEnum = z.enum(["ACTIVE", "INACTIVE"]);

export const CategorySchema = z.object({
  id: z.uuid().optional(),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name cannot exceed 100 characters.")
    .trim(),

  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters.")
    .max(120)
    .transform((val) => normalizeSlug(val)),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters.")
    .optional()
    .nullable(),

  status: CategoryStatusEnum.optional().default("ACTIVE"),
});

export type CategorySchemaRequest = z.infer<typeof CategorySchema>;
