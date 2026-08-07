import z from "zod";

export const WorkerRoleEnum = z.enum([
  "TURNER",
  "ASSEMBLY",
  "POLISHING",
  "PAINTING",
  "HELPER",
  "OTHER",
]);

export const WorkerStatusEnum = z.enum(["ACTIVE", "INACTIVE"]);
export const WorkerKindEnum = z.enum(["MACHINING", "CASTING"]);

export const WorkerSchema = z.object({
  id: z.uuid().optional(),

  code: z
    .string()
    .trim()
    .min(2, "Code must be at least 2 characters.")
    .max(20, "Code cannot exceed 20 characters.")
    .toUpperCase(),

  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(120, "Name cannot exceed 120 characters."),

  role: WorkerRoleEnum.optional().default("TURNER"),

  phone: z
    .string()
    .trim()
    .max(20, "Phone cannot exceed 20 characters.")
    .optional()
    .nullable(),

  email: z
    .string()
    .trim()
    .max(120)
    .optional()
    .nullable()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: "Invalid email address.",
    }),

  address: z
    .string()
    .trim()
    .max(300, "Address cannot exceed 300 characters.")
    .optional()
    .nullable(),

  joinedAt: z
    .union([z.string(), z.date()])
    .optional()
    .nullable()
    .transform((v) => {
      if (!v) return null;
      if (v instanceof Date) return v;
      const trimmed = String(v).trim();
      if (!trimmed) return null;
      const d = new Date(trimmed);
      return isNaN(d.getTime()) ? null : d;
    }),

  notes: z
    .string()
    .trim()
    .max(1000, "Notes cannot exceed 1000 characters.")
    .optional()
    .nullable(),

  status: WorkerStatusEnum.optional().default("ACTIVE"),
  kind: WorkerKindEnum.optional().default("MACHINING"),
});

export type WorkerSchemaRequest = z.infer<typeof WorkerSchema>;
