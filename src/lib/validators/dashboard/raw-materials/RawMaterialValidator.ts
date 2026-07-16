import z from "zod";

export const RawMaterialStatusEnum = z.enum(["ACTIVE", "INACTIVE"]);

const optionalTrimmedString = z.string().trim().optional().or(z.literal(""));

const optionalNonNegativeNumber = z.preprocess(
  (value) => {
    if (value === "" || value == null) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  },
  z
    .number()
    .min(0, "Cannot be negative.")
    .optional(),
);

export const RawMaterialSchema = z.object({
  id: z.string().uuid().optional(),
  companyItemName: z
    .string()
    .trim()
    .min(2, "Our company item name is required."),
  supplierItemName: optionalTrimmedString,
  itemCode: optionalTrimmedString,
  hsnCode: optionalTrimmedString,
  unit: z.string().trim().min(1, "Unit is required."),
  description: optionalTrimmedString,
  reorderLevel: optionalNonNegativeNumber,
  maximumStockLevel: optionalNonNegativeNumber,
  storageLocation: optionalTrimmedString,
  binNumber: optionalTrimmedString,
  preferredSupplierId: z.string().uuid().optional().or(z.literal("")),
  status: RawMaterialStatusEnum.default("ACTIVE"),
});

export type RawMaterialSchemaRequest = z.infer<typeof RawMaterialSchema>;
