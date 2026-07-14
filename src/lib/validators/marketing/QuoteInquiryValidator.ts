import z from "zod";

export const fallbackProductInterestOptions = [
  "Flameproof Lighting",
  "Control Panels",
  "LED Floodlights",
  "Junction Boxes",
  "Instrumentation",
  "Custom Build / Other",
] as const;

export const QuoteInquirySchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  company: z.string().trim().max(120, "Company name is too long").optional().or(z.literal("")),
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  phone: z.string().trim().max(40, "Phone number is too long").optional().or(z.literal("")),
  productInterest: z.string().trim().min(1, "Select a product").max(160, "Product name is too long"),
  quantity: z.string().trim().max(40, "Quantity is too long").optional().or(z.literal("")),
  requirement: z.string().trim().min(10, "Please describe your requirement"),
});

export type QuoteInquiryRequest = z.infer<typeof QuoteInquirySchema>;
