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

  certificationMarking: z.string().trim().max(200).optional().nullable(),
  certificationReference: z.string().trim().max(500).optional().nullable(),
  certificationVerified: z.boolean().optional(),
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
}).superRefine((data, ctx) => {
  if (!data.certificationVerified) return;
  if (!data.certificationMarking) ctx.addIssue({ code: "custom", path: ["certificationMarking"], message: "Enter the exact approved marking before verifying it." });
  if (!data.certificationReference) ctx.addIssue({ code: "custom", path: ["certificationReference"], message: "Enter the certificate number and revision." });
  if (!data.zones.length) ctx.addIssue({ code: "custom", path: ["zones"], message: "Select only the zones supported by the certificate." });
});

export type ProductSchemaRequest = z.infer<typeof ProductSchema>;
