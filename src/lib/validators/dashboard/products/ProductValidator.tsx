import { slugRegex } from "@/lib/helpers/regexHelpers/regexHelpers";
import z from "zod";

export const ProductStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const ProductSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2, "Name is required").max(180),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(slugRegex, "Slug must be lowercase and hyphen-separated")
    .min(2)
    .max(200),

  flpType: z.string().trim().max(120).optional().nullable(),
  protection: z.string().trim().max(120).optional().nullable(),
  gasGroup: z.string().trim().max(120).optional().nullable(),
  material: z.string().trim().max(120).optional().nullable(),
  finish: z.string().trim().max(120).optional().nullable(),
  hardware: z.string().trim().max(120).optional().nullable(),
  hsnCode: z.string().trim().max(20).optional().nullable(),

  zones: z
    .array(z.string().trim().min(1))
    .min(1, "Select at least one zone")
    .max(10)
    .refine(
      (arr) => new Set(arr.map((s) => s.toLowerCase())).size === arr.length,
      {
        message: "Zones must be unique",
      },
    ),

  shortDesc: z.string().trim().max(300).optional().nullable(),
  longDesc: z.string().trim().max(10000).optional().nullable(),

  categoryId: z.string().uuid("Invalid categoryId"),

  status: ProductStatusSchema.optional(),
});

export type ProductSchemaRequest = z.infer<typeof ProductSchema>;
