import z from "zod";
import { ContractorCatalogStatusEnum } from "./ContractorProductValidator";

export const ContractorOperationSchema = z.object({
  id: z.uuid().optional(),
  name: z
    .string()
    .trim()
    .min(2, "Operation name must be at least 2 characters.")
    .max(120, "Operation name cannot exceed 120 characters."),
  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters.")
    .optional()
    .nullable(),
  status: ContractorCatalogStatusEnum.optional().default("ACTIVE"),
});

export type ContractorOperationSchemaRequest = z.infer<
  typeof ContractorOperationSchema
>;
