import z from "zod";

export const WorkerLedgerKindEnum = z.enum([
  "ADVANCE",
  "DEDUCTION",
  "BONUS",
  "PAYOUT",
  "ADJUSTMENT",
]);

export const WorkerLedgerSchema = z.object({
  id: z.uuid().optional(),

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

  kind: WorkerLedgerKindEnum,

  amount: z.coerce
    .number({ message: "Amount must be a number." })
    .min(0, "Amount cannot be negative.")
    .max(10_000_000, "Amount is unrealistically high."),

  notes: z
    .string()
    .trim()
    .max(500, "Notes cannot exceed 500 characters.")
    .optional()
    .nullable(),
});

export type WorkerLedgerSchemaRequest = z.infer<typeof WorkerLedgerSchema>;

// Settle a month payout
export const SettlePayoutSchema = z.object({
  workerId: z.string().uuid(),
  monthYear: z.string().regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM."),
  applyAdvances: z.boolean().optional().default(true),
  amountPaid: z.coerce.number().min(0).max(100_000_000).optional().default(0),
  notes: z.string().trim().max(500).optional().nullable(),
});

export type SettlePayoutSchemaRequest = z.infer<typeof SettlePayoutSchema>;
