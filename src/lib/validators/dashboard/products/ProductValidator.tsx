import { slugRegex } from "@/lib/helpers/regexHelpers/regexHelpers";
import z from "zod";
import { isNonHazardousProduct, isZoneZero, supportsZoneZero } from "@/lib/products/technical-data";

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
}).superRefine((product, context) => {
  if (isNonHazardousProduct(product) && (product.zones.length || product.gasGroup)) {
    context.addIssue({ code: "custom", path: ["zones"], message: "Non-FLP products must have no hazardous-zone or gas-group declarations." });
  }
  if (product.zones.some(isZoneZero) && !supportsZoneZero(product)) {
    context.addIssue({ code: "custom", path: ["zones"], message: "Zone 0 requires a certificate-supported Ga / Ex da marking in the protection type. Verify the certificate or select the supported zones." });
  }
});

export type ProductSchemaRequest = z.infer<typeof ProductSchema>;
