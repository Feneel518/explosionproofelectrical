import {
  gstinRegex,
  phoneRegex,
  pincodeRegex,
} from "@/lib/helpers/regexHelpers/regexHelpers";
import z from "zod";

export const CustomerStatusEnum = z.enum(["ACTIVE", "INACTIVE"]);

export const CustomerSchema = z.object({
  id: z.uuid().optional(),
  companyName: z.string().trim().min(2, "Company name is required"),

  // ✅ keep as string ("" allowed)
  companyEmail: z.email().trim().toLowerCase().optional().or(z.literal("")),

  companyPhone: z
    .string()
    .trim()
    .regex(phoneRegex, "Invalid phone number")
    .optional()
    .or(z.literal("")),

  addressLine1: z.string().trim().min(3, "Address Line 1 is required"),

  addressLine2: z
    .string()
    .trim()
    .max(200, "Address is too long")
    .optional()
    .or(z.literal("")),

  city: z
    .string()
    .trim()
    .min(2, "City is required")
    .max(80, "City is too long"),

  state: z
    .string()
    .trim()
    .min(2, "State is required")
    .max(80, "State is too long"),

  country: z
    .string()
    .trim()
    .min(2, "Country is required")
    .max(80, "Country is too long")
    .default("India"),

  pincode: z
    .string()
    .trim()
    .regex(pincodeRegex, "Invalid pincode (must be 6 digits)"),

  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(gstinRegex, "Invalid GSTIN")
    .optional()
    .or(z.literal("")),

  status: CustomerStatusEnum.default("ACTIVE"),
});

export type CustomerSchemaRequest = z.infer<typeof CustomerSchema>;
