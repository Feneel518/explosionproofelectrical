import z from "zod";

export const ContractorCatalogStatusEnum = z.enum(["ACTIVE", "INACTIVE"]);

export const ContractorProductSchema = z.object({
  id: z.uuid().optional(),
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters.")
    .max(120, "Product name cannot exceed 120 characters."),
  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters.")
    .optional()
    .nullable(),
  status: ContractorCatalogStatusEnum.optional().default("ACTIVE"),
});

export type ContractorProductSchemaRequest = z.infer<typeof ContractorProductSchema>;
