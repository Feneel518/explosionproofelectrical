import z from "zod";

export const BomComponentTypeEnum = z.enum(["RAW_MATERIAL", "CASTING"]);

const optionalTrimmedString = z.string().trim().optional().or(z.literal(""));

export const VariantBomItemSchema = z
  .object({
    componentType: BomComponentTypeEnum,
    rawMaterialId: z.string().uuid().optional().or(z.literal("")),
    castingMasterId: z.string().uuid().optional().or(z.literal("")),
    qtyPerUnit: z.coerce
      .number()
      .int("Qty per unit must be a whole number.")
      .min(1, "Qty per unit must be at least 1."),
    remarks: optionalTrimmedString,
    sortOrder: z.coerce.number().int().min(0).default(0),
  })
  .superRefine((value, ctx) => {
    if (value.componentType === "RAW_MATERIAL" && !value.rawMaterialId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Raw material is required.",
        path: ["rawMaterialId"],
      });
    }

    if (value.componentType === "CASTING" && !value.castingMasterId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Casting is required.",
        path: ["castingMasterId"],
      });
    }
  });

export const VariantBomSchema = z.object({
  id: z.string().uuid().optional(),
  variantId: z.string().uuid("Variant is required."),
  isActive: z.boolean().default(true),
  notes: optionalTrimmedString,
  items: z.array(VariantBomItemSchema).min(1, "Add at least one BOM line."),
});

export type VariantBomSchemaRequest = z.infer<typeof VariantBomSchema>;
