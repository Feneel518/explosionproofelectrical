import z from "zod";

export const CastingMasterStatusEnum = z.enum(["ACTIVE", "INACTIVE"]);

const optionalTrimmedString = z.string().trim().optional().or(z.literal(""));

const optionalNonNegativeInteger = z.preprocess(
  (value) => {
    if (value === "" || value == null) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  },
  z
    .number()
    .int("Must be a whole number.")
    .min(0, "Cannot be negative.")
    .optional(),
);

const optionalNonNegativeDecimal = z.preprocess(
  (value) => {
    if (value === "" || value == null) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  },
  z.number().min(0, "Cannot be negative.").optional(),
);

export const CastingMasterSchema = z.object({
  id: z.string().uuid().optional(),
  castingItemName: z.string().trim().min(2, "Casting name is required."),
  castingCode: optionalTrimmedString,
  drawingNumber: optionalTrimmedString,
  hsnCode: optionalTrimmedString,
  unit: z.string().trim().min(1, "Unit is required."),
  standardWeightKg: optionalNonNegativeDecimal,
  reorderLevel: optionalNonNegativeInteger,
  description: optionalTrimmedString,
  status: CastingMasterStatusEnum.default("ACTIVE"),
});

export type CastingMasterSchemaRequest = z.infer<typeof CastingMasterSchema>;
