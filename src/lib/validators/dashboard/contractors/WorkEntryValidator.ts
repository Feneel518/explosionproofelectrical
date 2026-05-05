import z from "zod";

export const WorkEntrySchema = z.object({
  id: z.uuid().optional(),

  date: z
    .union([z.string(), z.date()])
    .transform((v) => {
      if (v instanceof Date) return v;
      const trimmed = String(v).trim();
      const d = new Date(trimmed);
      return isNaN(d.getTime()) ? null : d;
    })
    .refine((d): d is Date => d !== null, { message: "A valid date is required." }),

  workerId: z.string().uuid("Worker is required."),

  contractorRateId: z.string().uuid("Rate row is required."),

  qty: z.coerce
    .number({ message: "Qty must be a number." })
    .int("Qty must be a whole number.")
    .min(1, "Qty must be at least 1.")
    .max(1000000, "Qty is unrealistically high."),

  notes: z
    .string()
    .trim()
    .max(500, "Notes cannot exceed 500 characters.")
    .optional()
    .nullable(),
});

export type WorkEntrySchemaRequest = z.infer<typeof WorkEntrySchema>;

export const WorkEntryBatchRowSchema = z.object({
  contractorRateId: z.string().uuid("Rate row is required."),
  qty: z.coerce
    .number({ message: "Qty must be a number." })
    .int("Qty must be a whole number.")
    .min(1, "Qty must be at least 1.")
    .max(1000000, "Qty is unrealistically high."),
  notes: z
    .string()
    .trim()
    .max(500, "Notes cannot exceed 500 characters.")
    .optional()
    .nullable(),
});

export const WorkEntryBatchSchema = z.object({
  workerId: z.string().uuid("Worker is required."),
  date: z
    .union([z.string(), z.date()])
    .transform((v) => {
      if (v instanceof Date) return v;
      const trimmed = String(v).trim();
      const d = new Date(trimmed);
      return isNaN(d.getTime()) ? null : d;
    })
    .refine((d): d is Date => d !== null, { message: "A valid date is required." }),
  rows: z
    .array(WorkEntryBatchRowSchema)
    .min(1, "At least one work row is required.")
    .max(100, "Too many rows in one batch."),
});

export type WorkEntryBatchSchemaRequest = z.infer<typeof WorkEntryBatchSchema>;
