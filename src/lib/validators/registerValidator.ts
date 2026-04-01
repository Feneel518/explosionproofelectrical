import { z } from "zod";

export const registerValidator = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Full name is required")
      .max(100, "Full name is too long"),

    email: z.string().trim().email("Please enter a valid email address"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(72, "Password must be at most 72 characters"),

    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // error will show on confirm field
  });

export type RegisterValidatorSchema = z.infer<typeof registerValidator>;
