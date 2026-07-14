import z from "zod";
import { ContractorCatalogStatusEnum } from "./ContractorProductValidator";
import { WorkerRoleEnum } from "./WorkerValidator";

export const ContractorRateSchema = z.object({
  id: z.uuid().optional(),
  contractorProductId: z.string().uuid("Product is required."),
  contractorOperationId: z.string().uuid("Operation is required."),
  sideLabel: z
    .string()
    .trim()
    .max(120, "Side / part cannot exceed 120 characters.")
    .optional()
    .nullable(),
  unit: z
    .string()
    .trim()
    .min(1, "Unit is required.")
    .max(20, "Unit cannot exceed 20 characters.")
    .optional()
    .default("Nos"),
  defaultRate: z.coerce
    .number({ message: "Rate must be a number." })
    .min(0, "Rate cannot be negative.")
    .max(100000, "Rate is unrealistically high."),
  role: WorkerRoleEnum.optional().nullable(),
  status: ContractorCatalogStatusEnum.optional().default("ACTIVE"),
  notes: z
    .string()
    .trim()
    .max(500, "Notes cannot exceed 500 characters.")
    .optional()
    .nullable(),
});

export type ContractorRateSchemaRequest = z.infer<typeof ContractorRateSchema>;
